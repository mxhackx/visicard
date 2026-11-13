import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FEEXPAY_NETWORKS, FeexpayService, type FeexpayNetwork } from './payments/feexpay.service';
import { PREMIUM_PRICE } from './pricing';

const YEAR_MS = 365 * 24 * 3600 * 1000;

/**
 * Premium : 5 000 FCFA payés par Mobile Money (FeexPay), valables un an. Sans Premium actif, un compte ne peut
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

  /** État du compte ; relit au passage un paiement en attente (le client valide sur son téléphone). */
  async status(user: { id: string; role?: string }) {
    if (user.role === 'admin') return { active: true, until: null, price: PREMIUM_PRICE, admin: true, payment: null, sandbox: this.feexpay.sandbox };
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
    return { active, until: row?.premiumUntil ?? null, price: PREMIUM_PRICE, admin: false, payment: last?.status ?? null, sandbox: this.feexpay.sandbox };
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
      select: { id: true, amount: true, paidAt: true, expiresAt: true, providerRef: true },
    });
    return rows.map((r) => ({ id: r.id, amount: r.amount, paidAt: r.paidAt, expiresAt: r.expiresAt, reference: r.providerRef.slice(0, 8).toUpperCase() }));
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
    ]);
    this.logger.log(`Premium activé pour ${userId} jusqu'au ${until.toISOString()}`);
  }
}
