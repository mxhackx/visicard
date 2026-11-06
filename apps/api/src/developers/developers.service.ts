import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { API_LIMITS, KEY_PREFIX } from './limits';

export const hashKey = (key: string) => createHash('sha256').update(key).digest('hex');
const period = (d = new Date()) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

export interface ApiKeyContext {
  id: string;
  userId: string;
  name: string;
  admin: boolean;
  perMinute: number;
  perMonth: number;
  used: number;
}

@Injectable()
export class DevelopersService {
  /** Fenêtre glissante d'une minute, en mémoire (une instance d'API). */
  private readonly windows = new Map<string, number[]>();

  constructor(private readonly prisma: PrismaService) {}

  async listKeys(userId: string, admin: boolean) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { usage: { where: { period: period() } } },
    });
    return {
      limits: admin
        ? { unlimited: true, maxKeys: API_LIMITS.admin.maxKeys }
        : { unlimited: false, ...API_LIMITS.user },
      keys: keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        createdAt: k.createdAt,
        lastUsedAt: k.lastUsedAt,
        revokedAt: k.revokedAt,
        perMinute: admin ? null : k.perMinute,
        perMonth: admin ? null : k.perMonth,
        usedThisMonth: k.usage[0]?.count ?? 0,
      })),
    };
  }

  async createKey(userId: string, admin: boolean, rawName: string) {
    const name = (rawName || '').trim().slice(0, 60);
    if (name.length < 2) throw new BadRequestException('Donnez un nom à la clé (2 caractères minimum).');
    const max = admin ? API_LIMITS.admin.maxKeys : API_LIMITS.user.maxKeys;
    const active = await this.prisma.apiKey.count({ where: { userId, revokedAt: null } });
    if (active >= max) {
      throw new BadRequestException(`Limite atteinte : ${max} clés actives maximum. Révoquez-en une pour en créer une autre.`);
    }
    const secret = `${KEY_PREFIX}${randomBytes(24).toString('base64url')}`;
    const row = await this.prisma.apiKey.create({
      data: {
        userId,
        name,
        prefix: secret.slice(0, KEY_PREFIX.length + 4),
        keyHash: hashKey(secret),
        perMinute: API_LIMITS.user.perMinute,
        perMonth: API_LIMITS.user.perMonth,
      },
    });
    // La clé n'est montrée qu'une seule fois.
    return { id: row.id, name: row.name, prefix: row.prefix, key: secret, createdAt: row.createdAt };
  }

  async revokeKey(userId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, userId } });
    if (!key) throw new NotFoundException('Clé introuvable.');
    if (!key.revokedAt) await this.prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  /**
   * Authentifie une clé et applique les limites. Renvoie le contexte, ou une erreur typée.
   * Un administrateur n'est soumis à aucune limite.
   */
  async authenticate(secret: string): Promise<{ ok: true; ctx: ApiKeyContext } | { ok: false; status: number; message: string; retryAfter?: number }> {
    if (!secret.startsWith(KEY_PREFIX)) return { ok: false, status: 401, message: 'Clé d’API invalide.' };
    const key = await this.prisma.apiKey.findUnique({ where: { keyHash: hashKey(secret) }, include: { user: { select: { role: true } } } });
    if (!key || key.revokedAt) return { ok: false, status: 401, message: 'Clé d’API invalide ou révoquée.' };

    const admin = key.user.role === 'admin';
    const perMinute = admin ? Infinity : key.perMinute;
    const perMonth = admin ? Infinity : key.perMonth;

    if (!admin) {
      const now = Date.now();
      const recent = (this.windows.get(key.id) ?? []).filter((t) => now - t < 60_000);
      if (recent.length >= perMinute) {
        const retryAfter = Math.max(1, Math.ceil((60_000 - (now - recent[0])) / 1000));
        return { ok: false, status: 429, message: `Trop de requêtes : ${perMinute} par minute maximum.`, retryAfter };
      }
      recent.push(now);
      this.windows.set(key.id, recent);
    }

    const row = await this.prisma.apiUsage.upsert({
      where: { keyId_period: { keyId: key.id, period: period() } },
      create: { keyId: key.id, period: period(), count: 1 },
      update: { count: { increment: 1 } },
    });
    if (!admin && row.count > perMonth) {
      await this.prisma.apiUsage.update({ where: { id: row.id }, data: { count: { decrement: 1 } } });
      return { ok: false, status: 429, message: `Quota mensuel atteint (${perMonth} requêtes). Il se renouvelle le 1er du mois.` };
    }
    void this.prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);

    return { ok: true, ctx: { id: key.id, userId: key.userId, name: key.name, admin, perMinute, perMonth, used: row.count } };
  }
}
