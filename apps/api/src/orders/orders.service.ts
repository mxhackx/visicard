import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Order, Payment, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CardsService, CardMetadata, UploadedCardFiles } from '../cards/cards.service';
import { FedapayService } from './payments/fedapay.service';
import { assertOrderContent } from './content-rules';
import { OrderItem, ServiceType, isServiceType, itemsFor, totalOf, SERVICE_LABELS } from './pricing';

/** Preuve d'accès à une commande : le lien privé (jeton) ou le compte propriétaire. */
export interface OrderAccess {
  token?: string;
  userId?: string;
}

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
    private readonly fedapay: FedapayService,
  ) {}

  /* ------------------------------------------------------------------ */
  /* Création : contenu en aperçu + devis                               */
  /* ------------------------------------------------------------------ */

  async createOrder(
    serviceType: unknown,
    customer: CustomerInput,
    files: UploadedCardFiles,
    metadata: CardMetadata,
    userId?: string | null,
  ) {
    if (!isServiceType(serviceType)) throw new BadRequestException('Service inconnu.');
    const buyer = this.validateCustomer(customer);
    assertOrderContent(serviceType, metadata, files);

    // Un contenu mis en ligne exige un compte : c'est lui qui retrouve ensuite ses QR codes.
    if (serviceType !== 'direct' && !userId) {
      throw new UnauthorizedException('Connectez-vous ou créez un compte pour mettre votre QR code en ligne.');
    }
    const created = await this.cards.createCard(files, { ...metadata, serviceType, clientName: buyer.name }, userId ?? null, {
      status: 'draft',
    });
    try {
      const card = await this.prisma.card.findUniqueOrThrow({ where: { slug: created.slug } });
      return await this.insertOrder({
        kind: 'creation',
        serviceType,
        cardId: card.id,
        buyer,
        userId: userId ?? null,
        items: itemsFor('creation', serviceType),
      });
    } catch (err) {
      // Pas de carte brouillon orpheline (ni ses fichiers) si le devis n'a pas pu être créé.
      await this.cards.deleteCardBySlug(created.slug, { id: 'system', role: 'admin' }).catch(() => undefined);
      throw err;
    }
  }

  /** Une modification = un nouveau devis ; elle n'est appliquée qu'une fois payée. */
  async createModification(reference: string, access: OrderAccess, files: UploadedCardFiles, metadata: CardMetadata) {
    const parent = await this.authorize(reference, access);
    if (parent.serviceType === 'direct') {
      throw new ConflictException('Un QR code direct ne se modifie pas : commandez-en un nouveau.');
    }
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
      userId: parent.userId,
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
    userId?: string | null;
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
        userId: input.userId ?? null,
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

  async getForCustomer(reference: string, access: OrderAccess) {
    const order = await this.authorize(reference, access);
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
      /** Le paiement en ligne n'est proposé que si FedaPay est configuré. */
      payment: { online: this.fedapay.configured },
    };
  }

  /* ------------------------------------------------------------------ */
  /* Paiement en ligne (FedaPay) ; repli : WhatsApp + « Encaisser » admin */
  /* ------------------------------------------------------------------ */

  /** Crée la transaction FedaPay et renvoie l'adresse de la page de paiement. */
  async startPayment(reference: string, access: OrderAccess) {
    const order = await this.authorize(reference, access);
    if (order.status === 'paid') throw new ConflictException('Cette commande est déjà payée.');
    if (order.status === 'cancelled') throw new ConflictException('Cette commande a été annulée.');
    const card = await this.prisma.card.findUnique({ where: { id: order.cardId } });
    if (card?.status === 'rejected') {
      throw new ConflictException('Ce contenu a été refusé : contactez-nous avant de payer.');
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const checkout = await this.fedapay.createCheckout({
      amount: order.amount,
      description: `Moncode ${order.reference} · ${order.quoteNumber}`,
      // Le lien secret n'est pas transmis à FedaPay : le navigateur le garde de son côté.
      callbackUrl: `${appUrl}/commande/${order.reference}?paiement=fedapay`,
      customer: { name: order.customerName, phone: order.customerPhone, email: order.customerEmail },
    });
    await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          orderId: order.id,
          provider: 'fedapay',
          providerRef: checkout.transactionId,
          amount: order.amount,
          currency: order.currency,
          phone: order.customerPhone,
        },
      }),
      this.prisma.order.update({ where: { id: order.id }, data: { status: 'pending' } }),
    ]);
    return { paymentUrl: checkout.paymentUrl };
  }

  /** Interroge FedaPay pour le dernier paiement en attente, puis renvoie la commande. */
  async refreshPayment(reference: string, access: OrderAccess) {
    const order = await this.authorize(reference, access);
    if (order.status !== 'paid') {
      const pending = await this.prisma.payment.findFirst({
        where: { orderId: order.id, status: 'pending', provider: 'fedapay' },
        orderBy: { createdAt: 'desc' },
      });
      if (pending) await this.verifyWithProvider(pending);
    }
    const fresh = await this.prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    return this.present(fresh);
  }

  /** Le statut ne vient jamais du navigateur : il est relu chez FedaPay. */
  private async verifyWithProvider(payment: Payment) {
    try {
      const { status, amount, raw } = await this.fedapay.getStatus(payment.providerRef);
      if (status === 'approved' || status === 'transferred') {
        if (amount !== undefined && amount !== payment.amount) {
          this.logger.error(`Montant FedaPay inattendu pour ${payment.id} : ${amount} ≠ ${payment.amount}`);
          return;
        }
        await this.settle(payment, 'succeeded', raw);
      } else if (['declined', 'canceled', 'refunded'].includes(status)) {
        await this.settle(payment, 'failed', raw);
      }
    } catch (error) {
      this.logger.warn(`Vérification FedaPay ${payment.providerRef} impossible : ${error}`);
    }
  }

  private async settle(payment: Payment, status: 'succeeded' | 'failed', raw: unknown) {
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status, raw: (raw ?? Prisma.JsonNull) as Prisma.InputJsonValue },
    });
    if (status === 'succeeded') {
      await this.markPaid(payment.orderId, payment.id);
    } else {
      await this.prisma.order.updateMany({ where: { id: payment.orderId, status: 'pending' }, data: { status: 'quote' } });
    }
  }

  /** Webhook FedaPay : on ne se fie pas au corps reçu, on relit la transaction. */
  async handleFedapayEvent(transactionId: string | number | undefined) {
    if (!transactionId) return;
    const payment = await this.prisma.payment.findUnique({
      where: { provider_providerRef: { provider: 'fedapay', providerRef: String(transactionId) } },
    });
    if (payment && payment.status === 'pending') await this.verifyWithProvider(payment);
  }

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
    if (order.status === 'paid') return this.adminSummary(order);
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
    return this.adminSummary(await this.markPaid(orderId, payment.id));
  }

  /**
   * Réponse des actions d'administration : sans les champs internes, et surtout sans `BigInt`
   * (`cardId`), que JSON ne sait pas écrire — l'action réussissait en base mais l'API répondait 500.
   */
  private adminSummary(order: Order) {
    return {
      id: order.id,
      reference: order.reference,
      status: order.status,
      amount: order.amount,
      invoiceNumber: order.invoiceNumber,
      paidAt: order.paidAt,
      cardId: order.cardId.toString(),
    };
  }

  async cancel(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.status === 'paid') throw new ConflictException('Une commande payée ne peut pas être annulée.');
    return this.adminSummary(await this.prisma.order.update({ where: { id: orderId }, data: { status: 'cancelled' } }));
  }

  /* ------------------------------------------------------------------ */
  /* Outils                                                              */
  /* ------------------------------------------------------------------ */

  private async authorize(reference: string, access: OrderAccess): Promise<Order> {
    const order = await this.prisma.order.findUnique({ where: { reference: reference.toUpperCase() } });
    // Le compte propriétaire retrouve sa commande sans lien privé.
    if (order && access.userId && order.userId === access.userId) return order;
    const expected = order ? Buffer.from(order.accessTokenHash, 'hex') : Buffer.alloc(32);
    const given = Buffer.from(hashToken(access.token || ''), 'hex');
    // Comparaison à temps constant, y compris quand la référence n'existe pas.
    if (!order || !timingSafeEqual(expected, given)) {
      throw new NotFoundException('Commande introuvable ou lien invalide.');
    }
    return order;
  }

  /** Commandes d'un compte client, de la plus récente à la plus ancienne. */
  async listForUser(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId, kind: 'creation' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const cards = await this.prisma.card.findMany({
      where: { id: { in: orders.map((o) => o.cardId) } },
      select: { id: true, slug: true, title: true, restaurantName: true, status: true },
    });
    const byId = new Map(cards.map((c) => [String(c.id), c]));
    // Ouvertures des pages publiques (page, image, vidéo, PDF) : total et 7 derniers jours.
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const cardIds = cards.map((c) => c.id);
    const [totals, recents] = cardIds.length
      ? await Promise.all([
          this.prisma.cardScan.groupBy({ by: ['cardId'], where: { cardId: { in: cardIds } }, _count: { _all: true } }),
          this.prisma.cardScan.groupBy({ by: ['cardId'], where: { cardId: { in: cardIds }, createdAt: { gte: since7 } }, _count: { _all: true } }),
        ])
      : [[], []];
    const totalBy = new Map(totals.map((t) => [String(t.cardId), t._count._all]));
    const recentBy = new Map(recents.map((t) => [String(t.cardId), t._count._all]));
    return orders.map((o) => {
      const card = byId.get(String(o.cardId));
      return {
        scans: o.serviceType === 'direct' ? null : { total: totalBy.get(String(o.cardId)) ?? 0, last7: recentBy.get(String(o.cardId)) ?? 0 },
        reference: o.reference,
        slug: card?.slug ?? null,
        serviceType: o.serviceType,
        serviceLabel: SERVICE_LABELS[o.serviceType as ServiceType] ?? 'QR code',
        status: o.status,
        amount: o.amount,
        currency: o.currency,
        createdAt: o.createdAt,
        paidAt: o.paidAt,
        title: card?.title || card?.restaurantName || SERVICE_LABELS[o.serviceType as ServiceType] || 'QR code',
        cardStatus: card?.status ?? null,
      };
    });
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
