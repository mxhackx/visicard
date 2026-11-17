import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { sendPremiumReminder } from '../account/notify';

const DAY = 24 * 3600 * 1000;
/** Le rappel part quand il reste au plus ce nombre de jours. */
const REMIND_WITHIN_DAYS = 14;

/**
 * Prévient par e-mail les comptes dont le Premium se termine bientôt (un seul rappel par échéance).
 * Vérifie une fois toutes les 6 heures, et peu après le démarrage.
 */
@Injectable()
export class PremiumReminderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PremiumReminderService.name);
  private timer?: NodeJS.Timeout;
  private first?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.first = setTimeout(() => void this.run(), 60_000);
    this.timer = setInterval(() => void this.run(), 6 * 3600 * 1000);
  }

  onModuleDestroy() {
    if (this.first) clearTimeout(this.first);
    if (this.timer) clearInterval(this.timer);
  }

  async run(): Promise<number> {
    const now = new Date();
    try {
      const due = await this.prisma.adminUser.findMany({
        where: { premiumUntil: { gt: now, lte: new Date(now.getTime() + REMIND_WITHIN_DAYS * DAY) } },
        select: { id: true, email: true, name: true, premiumUntil: true, premiumReminderFor: true },
      });
      let sent = 0;
      for (const u of due) {
        const until = u.premiumUntil!;
        if (u.premiumReminderFor && u.premiumReminderFor.getTime() === until.getTime()) continue;
        const daysLeft = Math.max(1, Math.ceil((until.getTime() - now.getTime()) / DAY));
        if (await sendPremiumReminder(u.email, u.name, until, daysLeft)) {
          await this.prisma.adminUser.update({ where: { id: u.id }, data: { premiumReminderFor: until } });
          sent++;
        }
      }
      if (sent) this.logger.log(`${sent} rappel(s) d'expiration Premium envoyé(s).`);
      return sent;
    } catch (error) {
      this.logger.warn(`Rappels Premium impossibles : ${(error as Error).message}`);
      return 0;
    }
  }
}
