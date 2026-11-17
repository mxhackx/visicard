import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FEEXPAY_NETWORKS, FeexpayService, type FeexpayNetwork } from './payments/feexpay.service';
import { PREMIUM_PRICE } from './pricing';
import { sendPremiumInvoice } from '../account/notify';

const YEAR_MS = 365 * 24 * 3600 * 1000;
/** Pages digitales incluses dans chaque paiement Premium ; au-delà, un nouveau paiement en ajoute autant. */
export const PAGES_PER_PREMIUM = 5;

/**
 * Premium : 100 FCFA payés par Mobile Money (FeexPay), valables un an. Sans Premium actif, un compte ne peut
 * rien créer. Les administrateurs sont toujours Premium. Le renouvellement s'ajoute à la date de fin.
 */
@Injectable()
export class PremiumService {
  private readonly logger = new Logger(PremiumService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly feexpay: FeexpayService,
  ) {}

  async isActive(user: { id: string; role?: string }): Promise<boolean> {
    if (user.role === 'admin') return true;
    const row = await this.prisma.adminUser.findUnique({ where: { id: user.id }, select: { premiumUntil: true } });
    return Boolean(row?.premiumUntil && row.premiumUntil.getTime() > Date.now());
  }

  /** Pages digitales utilisées et autorisées : 5 par paiement Premium (les administrateurs n'ont pas de limite). */
  async pageQuota(user: { id: string; role?: string }): Promise<{ used: number; limit: number | null }> {
    if (user.role === 'admin') return { used: 0, limit: null };
    const [paid, used] = await Promise.all([
      this.prisma.premiumPurchase.count({ where: { userId: user.id, status: 'paid' } }),
      this.prisma.card.count({ where: { ownerId: user.id, serviceType: 'page', status: { in: ['active', 'draft'] } } }),
    ]);
    // Un Premium accordé sans paiement (geste de l'équipe) compte pour un paiement.
    return { used, limit: Math.max(paid, 1) * PAGES_PER_PREMIUM };
  }

  /** État du compte ; relit au passage un paiement en attente (le client valide sur son téléphone). */
  async status(user: { id: string; role?: string }) {
    if (user.role === 'admin') return { active: true, until: null, price: PREMIUM_PRICE, admin: true, payment: null, sandbox: this.feexpay.sandbox, pages: { used: 0, limit: null } };
    const pending = await this.prisma.premiumPurchase.findFirst({
      where: { userId: user.id, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    if (pending) await this.verify(pending.id);
    const row = await this.prisma.adminUser.findUnique({ where: { id: user.id }, select: { premiumUntil: true } });
    const active = Boolean(row?.premiumUntil && row.premiumUntil.getTime() > Date.now());
    // État du dernier paiement récent : le formulaire affiche « en attente » ou « refusé ».
    const last = await this.prisma.premiumPurchase.findFirst({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 30 * 60_000) } },
      orderBy: { createdAt: 'desc' },
      select: { status: true },
    });
    return { active, until: row?.premiumUntil ?? null, price: PREMIUM_PRICE, admin: false, payment: last?.status ?? null, sandbox: this.feexpay.sandbox, pages: await this.pageQuota(user) };
  }

  /**
   * Lance le paiement Mobile Money : FeexPay envoie une invite de validation au téléphone du client.
   * Le statut est ensuite relu par `status()` (interrogation) ou par le webhook.
   */
  async pay(
    user: { id: string; role?: string },
    input: { network?: string; phone?: string },
  ) {
    if (user.role === 'admin') throw new ConflictException('Les administrateurs n’ont pas besoin de Premium.');
    const account = await this.prisma.adminUser.findUnique({ where: { id: user.id } });
    if (!account) throw new NotFoundException('Compte introuvable.');
    if (!account.emailVerified) {
      throw new ForbiddenException(`Confirmez votre adresse e-mail (${account.email}) avant de payer : le lien vous a été envoyé à l'inscription.`);
    }
    const network = String(input.network ?? '').toLowerCase() as FeexpayNetwork;
    if (!FEEXPAY_NETWORKS.includes(network)) throw new BadRequestException('Choisissez MTN, Moov ou Celtiis.');
    // Nom, prénom, e-mail et téléphone viennent du compte (demandés à son ouverture) ; le numéro peut être remplacé au paiement.
    const [first, ...rest] = (account.name ?? '').trim().split(/\s+/).filter(Boolean);
    const firstName = first || account.email.split('@')[0];
    const lastName = rest.join(' ') || firstName;
    const email = account.email;
    const phone = (input.phone ?? '').trim() || account.phone || '';
    if (!phone) throw new BadRequestException('Ajoutez votre numéro de téléphone Mobile Money.');

    // Une nouvelle demande abandonne les précédentes encore en attente.
    await this.prisma.premiumPurchase.updateMany({ where: { userId: account.id, status: 'pending' }, data: { status: 'failed' } });
    const payment = await this.feexpay.requestPayment({
      network,
      phone,
      amount: PREMIUM_PRICE,
      description: 'Moncode Premium 1 an',
      callbackInfo: account.id,
      firstName,
      lastName,
      email,
    });
    await this.prisma.premiumPurchase.create({
      data: { userId: account.id, amount: PREMIUM_PRICE, providerRef: payment.reference },
    });
    return { reference: payment.reference, status: payment.status.toLowerCase() };
  }

  /** Historique des paiements Premium du compte (pour la rubrique « Factures » de l'espace client). */
  async history(userId: string) {
    const rows = await this.prisma.premiumPurchase.findMany({
      where: { userId, status: 'paid' },
      orderBy: { paidAt: 'desc' },
      take: 50,
      select: { id: true, amount: true, paidAt: true, expiresAt: true, providerRef: true, invoiceNumber: true },
    });
    const out = [];
    for (const r of rows) {
      const invoiceNumber = r.invoiceNumber ?? (await this.assignInvoice(r.id));
      out.push({ id: r.id, amount: r.amount, paidAt: r.paidAt, expiresAt: r.expiresAt, reference: r.providerRef.slice(0, 8).toUpperCase(), invoiceNumber });
    }
    return out;
  }

  /** Webhook FeexPay : relit la transaction ; sans effet si ce n'est pas un paiement Premium. */
  async handleEvent(transactionId: string | number | undefined): Promise<boolean> {
    if (!transactionId) return false;
    const purchase = await this.prisma.premiumPurchase.findUnique({ where: { providerRef: String(transactionId) } });
    if (!purchase) return false;
    if (purchase.status === 'pending') await this.verify(purchase.id);
    return true;
  }

  private async verify(purchaseId: string) {
    const purchase = await this.prisma.premiumPurchase.findUnique({ where: { id: purchaseId } });
    if (!purchase || purchase.status !== 'pending') return;
    try {
      const { status, amount } = await this.feexpay.getStatus(purchase.providerRef);
      if (status === 'SUCCESSFUL') {
        // La référence est la nôtre et son montant a été fixé par le serveur : un écart n'est que consigné.
        if (amount !== undefined && amount !== purchase.amount) {
          this.logger.warn(`Montant FeexPay différent pour ${purchase.id} : ${amount} ≠ ${purchase.amount}`);
        }
        await this.activate(purchase.id, purchase.userId);
      } else if (status === 'FAILED') {
        await this.prisma.premiumPurchase.updateMany({ where: { id: purchase.id, status: 'pending' }, data: { status: 'failed' } });
      }
    } catch (error) {
      this.logger.warn(`Vérification Premium ${purchase.providerRef} impossible : ${error}`);
    }
  }

  /** Attribue le numéro de facture d'un paiement réglé (PRM-AAAA-0001), une seule fois ; renvoie le numéro. */
  async assignInvoice(purchaseId: string): Promise<string | null> {
    const row = await this.prisma.premiumPurchase.findUnique({ where: { id: purchaseId } });
    if (!row || row.status !== 'paid') return null;
    if (row.invoiceNumber) return row.invoiceNumber;
    const year = (row.paidAt ?? new Date()).getFullYear();
    for (let attempt = 0; attempt < 5; attempt++) {
      const n = (await this.prisma.premiumPurchase.count({ where: { invoiceNumber: { startsWith: `PRM-${year}-` } } })) + 1 + attempt;
      const number = `PRM-${year}-${String(n).padStart(4, '0')}`;
      // Pas de contrainte d'unicité en base (elle ferait échouer le déploiement) : on vérifie ici que le numéro est libre.
      if (await this.prisma.premiumPurchase.findFirst({ where: { invoiceNumber: number }, select: { id: true } })) continue;
      await this.prisma.premiumPurchase.update({ where: { id: purchaseId }, data: { invoiceNumber: number } });
      return number;
    }
    return null;
  }

  /** Envoie la facture d'un paiement réglé à l'adresse du compte. Renvoie `false` si le service d'e-mail refuse ou n'est pas configuré. */
  async emailInvoice(purchaseId: string): Promise<boolean> {
    const row = await this.prisma.premiumPurchase.findUnique({ where: { id: purchaseId }, include: { user: { select: { email: true, name: true } } } });
    if (!row || row.status !== 'paid') return false;
    const invoiceNumber = row.invoiceNumber ?? (await this.assignInvoice(row.id));
    if (!invoiceNumber) return false;
    return sendPremiumInvoice(row.user.email, {
      name: row.user.name,
      invoiceNumber,
      paidAt: row.paidAt,
      validUntil: row.expiresAt,
      amount: row.amount,
      reference: row.providerRef,
      invoiceId: row.id,
    });
  }

  /** « Recevoir ma facture par e-mail » : pour son propriétaire ou un administrateur. */
  async resendInvoice(purchaseId: string, requester: { id: string; role?: string }) {
    const row = await this.prisma.premiumPurchase.findUnique({ where: { id: purchaseId }, include: { user: { select: { email: true } } } });
    if (!row || row.status !== 'paid' || (requester.role !== 'admin' && row.userId !== requester.id)) throw new NotFoundException('Facture introuvable.');
    const sent = await this.emailInvoice(purchaseId);
    if (!sent) throw new ServiceUnavailableException("L'e-mail n'a pas pu être envoyé pour le moment. Réessayez dans un instant.");
    return { sent: true, to: row.user.email };
  }

  /** Données d'une facture Premium, pour son propriétaire ou un administrateur. */
  async invoice(purchaseId: string, requester: { id: string; role?: string }) {
    const row = await this.prisma.premiumPurchase.findUnique({ where: { id: purchaseId }, include: { user: { select: { id: true, email: true, name: true, phone: true } } } });
    if (!row || row.status !== 'paid' || (requester.role !== 'admin' && row.userId !== requester.id)) throw new NotFoundException('Facture introuvable.');
    const invoiceNumber = row.invoiceNumber ?? (await this.assignInvoice(row.id));
    return {
      invoiceNumber,
      issuedAt: row.paidAt,
      validUntil: row.expiresAt,
      amount: row.amount,
      currency: 'XOF',
      reference: row.providerRef,
      description: 'Moncode Premium · 1 an (tous contenus, styles, logo, fichiers jusqu’à 200 Mo, 5 pages digitales)',
      buyer: { name: row.user.name, email: row.user.email, phone: row.user.phone },
    };
  }

  /**
   * Vue d'ensemble pour l'administration : chiffres, comptes Premium (actifs et échus) et tous les paiements
   * Premium, avec leur facture. Les paiements réglés sans numéro de facture en reçoivent un au passage.
   */
  async adminOverview() {
    const [purchases, users] = await Promise.all([
      this.prisma.premiumPurchase.findMany({ orderBy: { createdAt: 'desc' }, take: 300, include: { user: { select: { id: true, email: true, name: true, phone: true } } } }),
      this.prisma.adminUser.findMany({ where: { premiumUntil: { not: null } }, orderBy: { premiumUntil: 'desc' }, select: { id: true, email: true, name: true, phone: true, premiumUntil: true, createdAt: true } }),
    ]);
    const payments = [];
    for (const p of purchases) {
      const invoiceNumber = p.status === 'paid' ? (p.invoiceNumber ?? (await this.assignInvoice(p.id))) : null;
      payments.push({ id: p.id, status: p.status, amount: p.amount, reference: p.providerRef, invoiceNumber, paidAt: p.paidAt, expiresAt: p.expiresAt, createdAt: p.createdAt, user: p.user });
    }
    const now = Date.now();
    const paid = payments.filter((p) => p.status === 'paid');
    const paidBy = new Map<string, number>();
    for (const p of paid) paidBy.set(p.user.id, (paidBy.get(p.user.id) ?? 0) + 1);
    return {
      summary: {
        activeUsers: users.filter((u) => u.premiumUntil && u.premiumUntil.getTime() > now).length,
        expiringSoon: users.filter((u) => u.premiumUntil && u.premiumUntil.getTime() > now && u.premiumUntil.getTime() < now + 30 * 86_400_000).length,
        expiredUsers: users.filter((u) => u.premiumUntil && u.premiumUntil.getTime() <= now).length,
        revenue: paid.reduce((s, p) => s + p.amount, 0),
        paidCount: paid.length,
        pendingCount: payments.filter((p) => p.status === 'pending').length,
      },
      users: users.map((u) => ({ ...u, active: Boolean(u.premiumUntil && u.premiumUntil.getTime() > now), payments: paidBy.get(u.id) ?? 0 })),
      payments,
    };
  }

  /** Relit chez FeexPay un paiement en attente (si le webhook n'est pas arrivé) et renvoie son statut. */
  async adminVerify(purchaseId: string) {
    const row = await this.prisma.premiumPurchase.findUnique({ where: { id: purchaseId } });
    if (!row) throw new NotFoundException('Paiement introuvable.');
    if (row.status === 'pending') await this.verify(row.id);
    const after = await this.prisma.premiumPurchase.findUnique({ where: { id: purchaseId } });
    return { status: after?.status ?? row.status };
  }

  private async activate(purchaseId: string, userId: string) {
    // Un seul appel gagne (webhook et retour navigateur en même temps).
    const claimed = await this.prisma.premiumPurchase.updateMany({
      where: { id: purchaseId, status: 'pending' },
      data: { status: 'paid', paidAt: new Date() },
    });
    if (claimed.count === 0) return;
    const account = await this.prisma.adminUser.findUniqueOrThrow({ where: { id: userId } });
    const start = account.premiumUntil && account.premiumUntil.getTime() > Date.now() ? account.premiumUntil.getTime() : Date.now();
    const until = new Date(start + YEAR_MS);
    await this.prisma.$transaction([
      this.prisma.adminUser.update({ where: { id: userId }, data: { premiumUntil: until } }),
      this.prisma.premiumPurchase.update({ where: { id: purchaseId }, data: { expiresAt: until } }),
      // Les QR codes enregistrés avant le paiement (brouillons directs) sont débloqués.
      this.prisma.card.updateMany({ where: { ownerId: userId, serviceType: 'direct', status: 'draft' }, data: { status: 'active' } }),
    ]);
    await this.assignInvoice(purchaseId);
    // La facture part par e-mail dès que le paiement est confirmé.
    void this.emailInvoice(purchaseId).catch(() => undefined);
    this.logger.log(`Premium activé pour ${userId} jusqu'au ${until.toISOString()}`);
  }
}
