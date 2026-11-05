import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Order, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CardsService, CardMetadata, UploadedCardFiles } from '../cards/cards.service';
import { assertOrderContent } from './content-rules';
import { OrderItem, ServiceType, isServiceType, itemsFor, totalOf, SERVICE_LABELS } from './pricing';

export interface CustomerInput {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cards: CardsService,
  ) {}

  /* ------------------------------------------------------------------ */
  /* Création : contenu en aperçu + devis                               */
  /* ------------------------------------------------------------------ */

  async createOrder(serviceType: unknown, customer: CustomerInput, files: UploadedCardFiles, metadata: CardMetadata) {
    if (!isServiceType(serviceType)) throw new BadRequestException('Service inconnu.');
    const buyer = this.validateCustomer(customer);
    assertOrderContent(serviceType, metadata, files);

    const created = await this.cards.createCard(files, { ...metadata, serviceType, clientName: buyer.name }, null, {
      status: 'draft',
    });
    try {
      const card = await this.prisma.card.findUniqueOrThrow({ where: { slug: created.slug } });
      return await this.insertOrder({
        kind: 'creation',
        serviceType,
        cardId: card.id,
        buyer,
        items: itemsFor('creation', serviceType),
      });
    } catch (err) {
      // Pas de carte brouillon orpheline (ni ses fichiers) si le devis n'a pas pu être créé.
      await this.cards.deleteCardBySlug(created.slug, { id: 'system', role: 'admin' }).catch(() => undefined);
      throw err;
    }
  }

  /** Une modification = un nouveau devis ; elle n'est appliquée qu'une fois payée. */
  async createModification(reference: string, token: string, files: UploadedCardFiles, metadata: CardMetadata) {
    const parent = await this.authorize(reference, token);
    if (parent.status !== 'paid') {
      throw new ConflictException('Le QR code doit être payé avant de pouvoir être modifié.');
    }
    const card = await this.prisma.card.findUniqueOrThrow({ where: { id: parent.cardId } });
    const service = (isServiceType(card.serviceType) ? card.serviceType : 'page') as ServiceType;
    const changes = await this.cards.prepareChanges(card, files, metadata);

    return this.insertOrder({
      kind: 'modification',
      serviceType: service,
      cardId: card.id,
      parentId: parent.id,
      buyer: { name: parent.customerName, phone: parent.customerPhone, email: parent.customerEmail },
      items: itemsFor('modification', service),
      pendingChanges: toJson(changes),
    });
  }

  private async insertOrder(input: {
    kind: 'creation' | 'modification';
    serviceType: ServiceType;
    cardId: bigint;
    parentId?: string;
    buyer: { name: string; phone: string; email?: string | null };
    items: OrderItem[];
    pendingChanges?: Prisma.InputJsonValue;
  }) {
    const accessToken = randomBytes(24).toString('base64url');
    const year = new Date().getFullYear();
    const quoteNumber = `DEV-${year}-${String(await this.nextNumber(`devis-${year}`)).padStart(4, '0')}`;

    const order = await this.prisma.order.create({
      data: {
        reference: await this.uniqueReference(),
        kind: input.kind,
        serviceType: input.serviceType,
        items: input.items as unknown as Prisma.InputJsonValue,
        amount: totalOf(input.items),
        customerName: input.buyer.name,
        customerPhone: input.buyer.phone,
        customerEmail: input.buyer.email ?? null,
        accessTokenHash: hashToken(accessToken),
        quoteNumber,
        cardId: input.cardId,
        parentId: input.parentId ?? null,
        pendingChanges: input.pendingChanges ?? Prisma.JsonNull,
      },
    });
    return { reference: order.reference, accessToken, amount: order.amount, quoteNumber };
  }

  /* ------------------------------------------------------------------ */
  /* Lecture par le client (lien privé)                                  */
  /* ------------------------------------------------------------------ */

  async getForCustomer(reference: string, token: string) {
    const order = await this.authorize(reference, token);
    return this.present(order);
  }

  private async present(order: Order) {
    const card = await this.prisma.card.findUniqueOrThrow({ where: { id: order.cardId } });
    const payments = await this.prisma.payment.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const children = await this.prisma.order.findMany({
      where: { parentId: order.id },
      orderBy: { createdAt: 'desc' },
      select: { reference: true, status: true, amount: true, quoteNumber: true, createdAt: true },
    });

    const preview = await this.cards.getCardBySlug(card.slug, { includeDraft: true });
    const live = card.status === 'active';
    const qr = live ? await this.cards.getQrCode(card.slug) : null;

    return {
      id: order.id,
      reference: order.reference,
      kind: order.kind,
      serviceType: order.serviceType,
      serviceLabel: SERVICE_LABELS[order.serviceType as ServiceType] ?? 'QR code',
      status: order.status,
      items: order.items as unknown as OrderItem[],
      amount: order.amount,
      currency: order.currency,
      quoteNumber: order.quoteNumber,
      invoiceNumber: order.invoiceNumber,
      customer: { name: order.customerName, phone: order.customerPhone, email: order.customerEmail },
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      card: { slug: card.slug, status: card.status, moderationNote: card.moderationNote, preview },
      qrCode: qr?.qrCode ?? null,
      cardUrl: qr?.cardUrl ?? null,
      lastPayment: payments[0]
        ? { provider: payments[0].provider, status: payments[0].status, createdAt: payments[0].createdAt }
        : null,
      modifications: children,
      pendingChanges: order.kind === 'modification' ? order.pendingChanges : null,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Paiement : réglé sur WhatsApp, confirmé par un administrateur       */
  /* ------------------------------------------------------------------ */

  /**
   * Passe la commande en payée (idempotent) : numéro de facture, puis activation
   * de la carte (création) ou application des changements (modification).
   */
  private async markPaid(orderId: string, paymentId?: string) {
    // Verrou : un seul appel fait passer la commande à `paid` (double clic, deux admins).
    const claimed = await this.prisma.order.updateMany({
      where: { id: orderId, status: { notIn: ['paid', 'cancelled'] } },
      data: { status: 'paid', paidAt: new Date() },
    });
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    if (claimed.count === 0) return order;

    const year = new Date().getFullYear();
    const invoiceNumber = `FAC-${year}-${String(await this.nextNumber(`facture-${year}`)).padStart(4, '0')}`;
    const updated = await this.prisma.order.update({ where: { id: orderId }, data: { invoiceNumber } });

    if (order.kind === 'creation') {
      await this.prisma.card.update({ where: { id: order.cardId }, data: { status: 'active' } });
    } else if (order.pendingChanges) {
      await this.cards.applyChanges(order.cardId, fromJson(order.pendingChanges));
    }
    this.logger.log(`Commande ${order.reference} payée (${invoiceNumber})${paymentId ? ` via ${paymentId}` : ''}`);
    return updated;
  }

  /* ------------------------------------------------------------------ */
  /* Administration                                                      */
  /* ------------------------------------------------------------------ */

  /** Même vue que le client, pour l'administration (sans le lien privé). */
  async getForAdmin(reference: string) {
    const order = await this.prisma.order.findUnique({ where: { reference: reference.toUpperCase() } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return this.present(order);
  }

  async listForAdmin() {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        card: { select: { slug: true, title: true, restaurantName: true, status: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      take: 500,
    });
    return orders.map(({ accessTokenHash: _hidden, pendingChanges: _changes, ...order }) => ({
      ...order,
      cardId: order.cardId.toString(),
      lastPayment: order.payments[0] ?? null,
      payments: undefined,
    }));
  }

  /** Paiement reçu (réglé avec l'équipe sur WhatsApp), constaté par un administrateur. */
  async markPaidManually(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.status === 'cancelled') throw new ConflictException('Commande annulée.');
    if (order.status === 'paid') return order;
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        provider: 'manuel',
        providerRef: `man-${randomBytes(6).toString('hex')}`,
        amount: order.amount,
        currency: order.currency,
        status: 'succeeded',
      },
    });
    return this.markPaid(orderId, payment.id);
  }

  async cancel(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.status === 'paid') throw new ConflictException('Une commande payée ne peut pas être annulée.');
    return this.prisma.order.update({ where: { id: orderId }, data: { status: 'cancelled' } });
  }

  /* ------------------------------------------------------------------ */
  /* Outils                                                              */
  /* ------------------------------------------------------------------ */

  private async authorize(reference: string, token: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({ where: { reference: reference.toUpperCase() } });
    const expected = order ? Buffer.from(order.accessTokenHash, 'hex') : Buffer.alloc(32);
    const given = Buffer.from(hashToken(token || ''), 'hex');
    // Comparaison à temps constant, y compris quand la référence n'existe pas.
    if (!order || !timingSafeEqual(expected, given)) {
      throw new NotFoundException('Commande introuvable ou lien invalide.');
    }
    return order;
  }

  private validateCustomer(input: CustomerInput) {
    const name = input.customerName?.trim() ?? '';
    const phone = input.customerPhone?.trim() ?? '';
    const email = input.customerEmail?.trim() || null;
    if (name.length < 2) throw new BadRequestException('Indiquez votre nom.');
    const digits = phone.replace(/\D/g, '').length;
    if (digits < 8 || digits > 15) throw new BadRequestException('Numéro de téléphone invalide.');
    if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new BadRequestException('Adresse e-mail invalide.');
    return { name: name.slice(0, 120), phone: phone.slice(0, 30), email };
  }

  private async uniqueReference(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const bytes = randomBytes(6);
      const code = Array.from(bytes, (b) => REFERENCE_ALPHABET[b % REFERENCE_ALPHABET.length]).join('');
      const reference = `MC-${code}`;
      const exists = await this.prisma.order.findUnique({ where: { reference } });
      if (!exists) return reference;
    }
    throw new ConflictException('Référence indisponible, réessayez.');
  }

  /** Numérotation continue (devis, factures) : incrément atomique en base. */
  private async nextNumber(key: string): Promise<number> {
    const counter = await this.prisma.counter.upsert({
      where: { key },
      create: { key, value: 1 },
      update: { value: { increment: 1 } },
    });
    return counter.value;
  }
}

/** Les changements préparés passent par une colonne JSON. */
function toJson(changes: Prisma.CardUpdateInput): Prisma.InputJsonValue {
  const plain: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(changes)) {
    plain[key] = value === Prisma.JsonNull || value === Prisma.DbNull ? null : value;
  }
  return plain as Prisma.InputJsonValue;
}

function fromJson(value: Prisma.JsonValue): Prisma.CardUpdateInput {
  const data = { ...(value as Record<string, unknown>) };
  if ('schedule' in data && data.schedule === null) data.schedule = Prisma.JsonNull;
  return data as Prisma.CardUpdateInput;
}
