import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { countryName } from '../cards/geo';
import { parseCatalog } from '../cards/catalog';
import { notifyOwner } from './notify';

const DAY = 24 * 60 * 60 * 1000;
/** Les heures sont lues à l'heure du Bénin (UTC+1, sans heure d'été). */
const OFFSET_H = 1;
const MODES = ['none', 'contact', 'booking', 'order'];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const top = (counts: Record<string, number>, n = 8) =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }));

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  private async ownedCard(userId: string, slug: string) {
    const card = await this.prisma.card.findUnique({ where: { slug } });
    if (!card || card.ownerId !== userId) throw new NotFoundException('QR code introuvable.');
    return card;
  }

  /** Tous les QR codes en ligne du compte, avec leurs performances (pour les comparer). */
  async listCards(userId: string) {
    const cards = await this.prisma.card.findMany({
      where: { ownerId: userId, serviceType: { not: 'direct' } },
      orderBy: { createdAt: 'desc' },
      include: { establishment: { select: { id: true, name: true } }, orders: { where: { kind: 'creation' }, select: { reference: true, status: true }, take: 1 } },
    });
    const ids = cards.map((c) => c.id);
    const since7 = new Date(Date.now() - 7 * DAY);
    const since30 = new Date(Date.now() - 30 * DAY);
    const [all, d7, d30, newReq] = ids.length
      ? await Promise.all([
          this.prisma.cardScan.groupBy({ by: ['cardId'], where: { cardId: { in: ids } }, _count: { _all: true } }),
          this.prisma.cardScan.groupBy({ by: ['cardId'], where: { cardId: { in: ids }, createdAt: { gte: since7 } }, _count: { _all: true } }),
          this.prisma.cardScan.groupBy({ by: ['cardId'], where: { cardId: { in: ids }, createdAt: { gte: since30 } }, _count: { _all: true } }),
          this.prisma.cardRequest.groupBy({ by: ['cardId'], where: { cardId: { in: ids }, status: 'new' }, _count: { _all: true } }),
        ])
      : [[], [], [], []];
    const m = (rows: { cardId: bigint; _count: { _all: number } }[]) => new Map(rows.map((r) => [String(r.cardId), r._count._all]));
    const [tAll, t7, t30, tNew] = [m(all), m(d7), m(d30), m(newReq)];
    return cards.map((c) => ({
      slug: c.slug,
      title: c.title || c.restaurantName || 'QR code',
      serviceType: c.serviceType,
      status: c.status,
      requestMode: c.requestMode,
      establishment: c.establishment,
      orderReference: c.orders[0]?.reference ?? null,
      scans: { total: tAll.get(String(c.id)) ?? 0, last7: t7.get(String(c.id)) ?? 0, last30: t30.get(String(c.id)) ?? 0 },
      newRequests: tNew.get(String(c.id)) ?? 0,
      createdAt: c.createdAt,
    }));
  }

  /** Statistiques détaillées d'un QR code : jours, heures, appareils, localisation approximative. */
  async analytics(userId: string, slug: string, days = 30) {
    const card = await this.ownedCard(userId, slug);
    const span = Math.min(90, Math.max(7, Math.round(days) || 30));
    const since = new Date(Date.now() - span * DAY);
    since.setUTCHours(0, 0, 0, 0);
    const [scans, total, requests] = await Promise.all([
      this.prisma.cardScan.findMany({ where: { cardId: card.id, createdAt: { gte: since } }, select: { createdAt: true, device: true, country: true, city: true } }),
      this.prisma.cardScan.count({ where: { cardId: card.id } }),
      this.prisma.cardRequest.groupBy({ by: ['kind'], where: { cardId: card.id, createdAt: { gte: since } }, _count: { _all: true } }),
    ]);
    const byDay = Array.from({ length: span }, (_, i) => ({ date: new Date(since.getTime() + (i + 1) * DAY - DAY + 0).toISOString().slice(0, 10), count: 0 }));
    const idx = new Map(byDay.map((d, i) => [d.date, i]));
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    const devices: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const cities: Record<string, number> = {};
    for (const s of scans) {
      const i = idx.get(s.createdAt.toISOString().slice(0, 10));
      if (i !== undefined) byDay[i].count += 1;
      hours[(s.createdAt.getUTCHours() + OFFSET_H) % 24].count += 1;
      devices[s.device] = (devices[s.device] ?? 0) + 1;
      countries[s.country ? countryName(s.country) : 'Inconnu'] = (countries[s.country ? countryName(s.country) : 'Inconnu'] ?? 0) + 1;
      if (s.city) cities[s.city] = (cities[s.city] ?? 0) + 1;
    }
    const peak = hours.reduce((a, b) => (b.count > a.count ? b : a), hours[0]);
    const reqCount = Object.fromEntries(requests.map((r) => [r.kind, r._count._all]));
    const requestsTotal = requests.reduce((n, r) => n + r._count._all, 0);
    return {
      slug,
      title: card.title || card.restaurantName || 'QR code',
      periodDays: span,
      total,
      inPeriod: scans.length,
      days: byDay,
      hours,
      peakHour: peak.count > 0 ? peak.hour : null,
      devices: top(devices),
      countries: top(countries),
      cities: top(cities),
      requests: { total: requestsTotal, ...reqCount },
      conversion: scans.length > 0 ? Math.round((requestsTotal / scans.length) * 1000) / 10 : 0,
    };
  }

  /** Modifications sans devis : catalogue, promotion, mode de demande, horaires, établissement. */
  async updateLive(userId: string, slug: string, body: { catalog?: unknown; requestMode?: string; schedule?: unknown; establishmentId?: string | null }) {
    const card = await this.ownedCard(userId, slug);
    if (card.serviceType === 'media' || card.serviceType === 'document') {
      if (body.catalog || body.requestMode || body.schedule) throw new BadRequestException('Disponible pour les pages digitales.');
    }
    const data: Prisma.CardUncheckedUpdateInput = {};
    if (body.catalog !== undefined) data.catalog = parseCatalog(body.catalog) as unknown as Prisma.InputJsonValue;
    if (body.requestMode !== undefined) {
      if (!MODES.includes(body.requestMode)) throw new BadRequestException('Mode inconnu.');
      data.requestMode = body.requestMode;
    }
    if (body.schedule !== undefined) {
      const sched: Record<string, { isOpen: boolean; open: string; close: string }> = {};
      const raw = (body.schedule && typeof body.schedule === 'object' ? body.schedule : {}) as Record<string, { isOpen?: boolean; open?: string; close?: string }>;
      for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
        const d = raw[day];
        if (!d) continue;
        if (!HHMM.test(d.open ?? '') || !HHMM.test(d.close ?? '')) throw new BadRequestException('Horaires invalides (format HH:MM).');
        sched[day] = { isOpen: Boolean(d.isOpen), open: d.open!, close: d.close! };
      }
      data.schedule = sched as unknown as Prisma.InputJsonValue;
    }
    if (body.establishmentId !== undefined) {
      if (body.establishmentId) {
        const est = await this.prisma.establishment.findFirst({ where: { id: body.establishmentId, userId } });
        if (!est) throw new BadRequestException('Établissement introuvable.');
      }
      data.establishmentId = body.establishmentId || null;
    }
    data.updatedAt = new Date();
    await this.prisma.card.update({ where: { id: card.id }, data });
    return this.liveState(userId, slug);
  }

  async liveState(userId: string, slug: string) {
    const card = await this.ownedCard(userId, slug);
    const catalog = (() => {
      try {
        return parseCatalog(card.catalog);
      } catch {
        return { promo: null, products: [] };
      }
    })();
    return {
      slug,
      title: card.title || card.restaurantName || 'QR code',
      serviceType: card.serviceType,
      requestMode: card.requestMode,
      establishmentId: card.establishmentId,
      schedule: card.schedule ?? null,
      catalog,
      phoneNumber: card.phoneNumber,
      orderReference: (await this.prisma.order.findFirst({ where: { cardId: card.id, kind: 'creation' }, select: { reference: true } }))?.reference ?? null,
    };
  }

  /** Vue d'ensemble pour l'accueil de l'espace client et le badge « demandes à traiter ». */
  async summary(userId: string) {
    const cards = await this.prisma.card.findMany({ where: { ownerId: userId, serviceType: { not: 'direct' } }, select: { id: true } });
    const ids = cards.map((c) => c.id);
    const since7 = new Date(Date.now() - 7 * DAY);
    const [scans7, scansTotal, newRequests, establishments] = await Promise.all([
      ids.length ? this.prisma.cardScan.count({ where: { cardId: { in: ids }, createdAt: { gte: since7 } } }) : 0,
      ids.length ? this.prisma.cardScan.count({ where: { cardId: { in: ids } } }) : 0,
      this.prisma.cardRequest.count({ where: { card: { ownerId: userId }, status: 'new' } }),
      this.prisma.establishment.count({ where: { userId } }),
    ]);
    return { cards: ids.length, scans7, scansTotal, newRequests, establishments };
  }

  /* ----------------------------- Demandes des visiteurs ----------------------------- */

  async listRequests(userId: string, filter: { slug?: string; status?: string }) {
    const where: Prisma.CardRequestWhereInput = { card: { ownerId: userId } };
    if (filter.slug) where.card = { ownerId: userId, slug: filter.slug };
    if (filter.status && ['new', 'done', 'cancelled'].includes(filter.status)) where.status = filter.status;
    const rows = await this.prisma.cardRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { card: { select: { slug: true, title: true, restaurantName: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      name: r.name,
      phone: r.phone,
      message: r.message,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt,
      card: { slug: r.card.slug, title: r.card.title || r.card.restaurantName || 'QR code' },
    }));
  }

  async setRequestStatus(userId: string, id: string, status: string) {
    if (!['new', 'done', 'cancelled'].includes(status)) throw new BadRequestException('Statut inconnu.');
    const row = await this.prisma.cardRequest.findFirst({ where: { id, card: { ownerId: userId } } });
    if (!row) throw new NotFoundException('Demande introuvable.');
    await this.prisma.cardRequest.update({ where: { id }, data: { status } });
    return { id, status };
  }

  /* -------------------------------- Établissements -------------------------------- */

  listEstablishments(userId: string) {
    return this.prisma.establishment
      .findMany({ where: { userId }, orderBy: { createdAt: 'asc' }, include: { _count: { select: { cards: true } } } })
      .then((rows) => rows.map((e) => ({ id: e.id, name: e.name, city: e.city, cardsCount: e._count.cards })));
  }

  async createEstablishment(userId: string, name: string, city?: string) {
    const n = (name || '').trim().slice(0, 80);
    if (n.length < 2) throw new BadRequestException('Donnez un nom à l’établissement.');
    if ((await this.prisma.establishment.count({ where: { userId } })) >= 50) throw new BadRequestException('50 établissements maximum.');
    const e = await this.prisma.establishment.create({ data: { userId, name: n, city: (city || '').trim().slice(0, 60) || null } });
    return { id: e.id, name: e.name, city: e.city, cardsCount: 0 };
  }

  async updateEstablishment(userId: string, id: string, body: { name?: string; city?: string }) {
    const e = await this.prisma.establishment.findFirst({ where: { id, userId } });
    if (!e) throw new NotFoundException('Établissement introuvable.');
    const data: { name?: string; city?: string | null } = {};
    if (body.name !== undefined) {
      const n = body.name.trim().slice(0, 80);
      if (n.length < 2) throw new BadRequestException('Nom trop court.');
      data.name = n;
    }
    if (body.city !== undefined) data.city = body.city.trim().slice(0, 60) || null;
    await this.prisma.establishment.update({ where: { id }, data });
    return { success: true };
  }

  async deleteEstablishment(userId: string, id: string) {
    const e = await this.prisma.establishment.findFirst({ where: { id, userId } });
    if (!e) throw new NotFoundException('Établissement introuvable.');
    await this.prisma.establishment.delete({ where: { id } }); // les QR codes sont conservés, simplement détachés
    return { success: true };
  }

  /* ------------------------------ Côté visiteur (public) ------------------------------ */

  async submitRequest(slug: string, input: { kind?: string; name?: string; phone?: string; message?: string; details?: Record<string, unknown> }) {
    // Champ piège invisible pour les humains : un robot qui le remplit est ignoré sans bruit.
    if (typeof (input as { website?: unknown }).website === 'string' && (input as { website?: string }).website) return { id: 'ignored', success: true };
    const card = await this.prisma.card.findUnique({ where: { slug }, include: { owner: { select: { email: true } } } });
    if (!card || card.status !== 'active') throw new NotFoundException('QR code introuvable.');
    const recent = await this.prisma.cardRequest.count({ where: { cardId: card.id, createdAt: { gte: new Date(Date.now() - DAY) } } });
    if (recent >= 100) throw new BadRequestException('Cet établissement a reçu beaucoup de demandes aujourd’hui : réessayez plus tard.');
    const mode = card.requestMode;
    const kind = input.kind || 'contact';
    const allowed = mode === 'order' ? ['order', 'contact'] : mode === 'booking' ? ['booking', 'contact'] : mode === 'contact' ? ['contact'] : [];
    if (!allowed.includes(kind)) throw new ForbiddenException('Cet établissement n’accepte pas ce type de demande.');

    const name = (input.name || '').trim().slice(0, 80);
    const phone = (input.phone || '').trim().slice(0, 30);
    if (name.length < 2) throw new BadRequestException('Indiquez votre nom.');
    const digits = phone.replace(/\D/g, '').length;
    if (digits < 8 || digits > 15) throw new BadRequestException('Numéro de téléphone invalide.');
    const message = (input.message || '').trim().slice(0, 500) || null;

    let details: Prisma.InputJsonValue | undefined;
    if (kind === 'booking') {
      const d = input.details ?? {};
      const date = String(d.date ?? '');
      const time = String(d.time ?? '');
      const people = Math.round(Number(d.people));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Date.parse(`${date}T23:59:59`) < Date.now()) throw new BadRequestException('Choisissez une date à venir.');
      if (!HHMM.test(time)) throw new BadRequestException('Choisissez une heure.');
      if (!(people >= 1 && people <= 50)) throw new BadRequestException('Nombre de personnes invalide (1 à 50).');
      details = { date, time, people };
    } else if (kind === 'order') {
      const catalog = parseCatalog(card.catalog);
      const byId = new Map(catalog.products.map((p) => [p.id, p]));
      const raw = Array.isArray(input.details?.items) ? (input.details!.items as { id?: string; qty?: number }[]) : [];
      const items = raw
        .slice(0, 30)
        .map((it) => ({ p: byId.get(String(it.id)), qty: Math.round(Number(it.qty)) }))
        .filter((it) => it.p && it.qty >= 1 && it.qty <= 99)
        .map((it) => ({ id: it.p!.id, name: it.p!.name, qty: it.qty, price: it.p!.price }));
      if (items.length === 0) throw new BadRequestException('Choisissez au moins un produit.');
      const total = items.reduce((n, it) => n + (it.price ?? 0) * it.qty, 0);
      details = { items, total };
    }

    const row = await this.prisma.cardRequest.create({ data: { cardId: card.id, kind, name, phone, message, details } });
    // Prévenir le propriétaire par e-mail si le service est configuré ; l'échec n'annule jamais la demande.
    void notifyOwner(card.owner?.email, { kind, name, phone, message, details, title: card.title || card.restaurantName || 'votre QR code' });
    return { id: row.id, success: true };
  }
}
