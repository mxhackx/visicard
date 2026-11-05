import { Controller, Get, Headers, Req, UnauthorizedException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from '../auth/auth.service';

const DAY = 24 * 60 * 60 * 1000;

/** Chiffres du tableau de bord admin, calculés en base à chaque appel. */
@Controller('admin/stats')
@SkipThrottle({ short: true })
export class AdminStatsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  async stats(@Req() req: Request, @Headers('authorization') authHeader?: string) {
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) token = (req as Request & { cookies?: Record<string, string> }).cookies?.['access_token'] ?? null;
    if (!token || !(await this.auth.validateAdminToken(token))) {
      throw new UnauthorizedException('Accès réservé aux administrateurs.');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const since30 = new Date(now.getTime() - 29 * DAY);
    since30.setHours(0, 0, 0, 0);
    const since7 = new Date(now.getTime() - 7 * DAY);

    const [
      cardsByStatus,
      cardsByType,
      cardsThisMonth,
      paidOrders,
      openOrders,
      scansTotal,
      scans7,
      scansRecent,
      scansByDevice,
      topScans,
      recentOrders,
      recentCards,
    ] = await Promise.all([
      this.prisma.card.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.card.groupBy({ by: ['serviceType'], _count: { _all: true } }),
      this.prisma.card.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.order.findMany({
        where: { status: 'paid', paidAt: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
        select: { amount: true, paidAt: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { status: { in: ['quote', 'pending'] } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.cardScan.count(),
      this.prisma.cardScan.count({ where: { createdAt: { gte: since7 } } }),
      this.prisma.cardScan.findMany({ where: { createdAt: { gte: since30 } }, select: { createdAt: true } }),
      this.prisma.cardScan.groupBy({ by: ['device'], _count: { _all: true } }),
      this.prisma.cardScan.groupBy({
        by: ['cardId'],
        where: { createdAt: { gte: since30 } },
        _count: { _all: true },
        orderBy: { _count: { cardId: 'desc' } },
        take: 5,
      }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true, reference: true, kind: true, serviceType: true, status: true, amount: true,
          customerName: true, createdAt: true, paidAt: true,
        },
      }),
      this.prisma.card.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { slug: true, title: true, restaurantName: true, serviceType: true, status: true, createdAt: true },
      }),
    ]);

    // Revenus des 6 derniers mois (mois courant inclus).
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, amount: 0, count: 0 };
    });
    for (const order of paidOrders) {
      if (!order.paidAt) continue;
      const key = `${order.paidAt.getFullYear()}-${String(order.paidAt.getMonth() + 1).padStart(2, '0')}`;
      const month = months.find((m) => m.key === key);
      if (month) {
        month.amount += order.amount;
        month.count += 1;
      }
    }
    const revenueTotal = await this.prisma.order.aggregate({ where: { status: 'paid' }, _sum: { amount: true } });
    const revenueMonth = months[5].amount;
    const revenuePrevMonth = paidOrders
      .filter((o) => o.paidAt && o.paidAt >= startOfPrevMonth && o.paidAt < startOfMonth)
      .reduce((sum, o) => sum + o.amount, 0);

    // Scans par jour sur 30 jours.
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(since30.getTime() + i * DAY);
      return { date: d.toISOString().slice(0, 10), count: 0 };
    });
    for (const scan of scansRecent) {
      const key = new Date(scan.createdAt.getTime() - scan.createdAt.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
      const day = days.find((d) => d.date === key);
      if (day) day.count += 1;
    }

    const topCards = topScans.length
      ? await this.prisma.card.findMany({
          where: { id: { in: topScans.map((t) => t.cardId) } },
          select: { id: true, slug: true, title: true, restaurantName: true, serviceType: true },
        })
      : [];

    const count = <T extends string>(rows: { _count: { _all: number } }[], key: (r: never) => T) =>
      Object.fromEntries(rows.map((r) => [key(r as never) ?? 'page', r._count._all])) as Record<string, number>;

    return {
      cards: {
        total: cardsByStatus.reduce((s, r) => s + r._count._all, 0),
        thisMonth: cardsThisMonth,
        byStatus: count(cardsByStatus, (r: { status: string }) => r.status),
        byType: count(cardsByType, (r: { serviceType: string }) => r.serviceType),
      },
      revenue: {
        total: revenueTotal._sum.amount ?? 0,
        month: revenueMonth,
        prevMonth: revenuePrevMonth,
        months,
      },
      orders: {
        open: openOrders.reduce((s, r) => s + r._count._all, 0),
        openAmount: openOrders.reduce((s, r) => s + (r._sum.amount ?? 0), 0),
        byStatus: Object.fromEntries(openOrders.map((r) => [r.status, r._count._all])),
        recent: recentOrders.map((o) => ({ ...o, id: o.id.toString() })),
      },
      scans: {
        total: scansTotal,
        last7: scans7,
        days,
        byDevice: count(scansByDevice, (r: { device: string }) => r.device),
        top: topScans.map((t) => {
          const card = topCards.find((c) => c.id === t.cardId);
          return {
            slug: card?.slug ?? '',
            name: card?.title ?? card?.restaurantName ?? card?.slug ?? '—',
            serviceType: card?.serviceType ?? 'page',
            count: t._count._all,
          };
        }),
      },
      recentCards,
    };
  }
}
