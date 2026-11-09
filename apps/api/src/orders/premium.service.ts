import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FedapayService } from './payments/fedapay.service';
import { PREMIUM_PRICE } from './pricing';

const YEAR_MS = 365 * 24 * 3600 * 1000;

/**
 * Premium : 5 000 FCFA payés par FedaPay, valables un an. Sans Premium actif, un compte ne peut
 * rien créer. Les administrateurs sont toujours Premium. Le renouvellement s'ajoute à la date de fin.
 */
@Injectable()
export class PremiumService {
  private readonly logger = new Logger(PremiumService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fedapay: FedapayService,
  ) {}

  async isActive(user: { id: string; role?: string }): Promise<boolean> {
    if (user.role === 'admin') return true;
    const row = await this.prisma.adminUser.findUnique({ where: { id: user.id }, select: { premiumUntil: true } });
    return Boolean(row?.premiumUntil && row.premiumUntil.getTime() > Date.now());
  }

  /** État du compte ; relit au passage un paiement en attente (retour de FedaPay avant le webhook). */
  async status(user: { id: string; role?: string }) {
    if (user.role === 'admin') return { active: true, until: null, price: PREMIUM_PRICE, admin: true };
    const pending = await this.prisma.premiumPurchase.findFirst({
      where: { userId: user.id, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    if (pending) await this.verify(pending.id);
    const row = await this.prisma.adminUser.findUnique({ where: { id: user.id }, select: { premiumUntil: true } });
    const active = Boolean(row?.premiumUntil && row.premiumUntil.getTime() > Date.now());
    return { active, until: row?.premiumUntil ?? null, price: PREMIUM_PRICE, admin: false };
  }

  /** Crée la transaction FedaPay et renvoie la page de paiement. */
  async checkout(user: { id: string; role?: string }) {
    if (user.role === 'admin') throw new ConflictException('Les administrateurs n’ont pas besoin de Premium.');
    const account = await this.prisma.adminUser.findUnique({ where: { id: user.id } });
    if (!account) throw new NotFoundException('Compte introuvable.');

    const appUrl = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const checkout = await this.fedapay.createCheckout({
      amount: PREMIUM_PRICE,
      description: 'Moncode Premium · 1 an',
      callbackUrl: `${appUrl}/creer?premium=retour`,
      customer: { name: account.name || account.email.split('@')[0], email: account.email },
    });
    await this.prisma.premiumPurchase.create({
      data: { userId: account.id, amount: PREMIUM_PRICE, providerRef: checkout.transactionId },
    });
    return { paymentUrl: checkout.paymentUrl };
  }

  /** Webhook FedaPay : relit la transaction ; sans effet si ce n'est pas un paiement Premium. */
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
      const { status, amount } = await this.fedapay.getStatus(purchase.providerRef);
      if (status === 'approved' || status === 'transferred') {
        if (amount !== undefined && amount !== purchase.amount) {
          this.logger.error(`Montant Premium inattendu pour ${purchase.id} : ${amount} ≠ ${purchase.amount}`);
          return;
        }
        await this.activate(purchase.id, purchase.userId);
      } else if (['declined', 'canceled', 'refunded'].includes(status)) {
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
