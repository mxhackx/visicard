import { Injectable, Logger, ServiceUnavailableException, BadGatewayException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * FedaPay (https://docs.fedapay.com) : paiement par MTN MoMo, Moov Money ou carte
 * sur la page de paiement hébergée par FedaPay.
 *
 * Variables d'environnement :
 *   FEDAPAY_SECRET_KEY      clé secrète (sk_sandbox_… ou sk_live_…)
 *   FEDAPAY_ENV             `sandbox` (défaut) ou `live`
 *   FEDAPAY_WEBHOOK_SECRET  secret de signature du webhook (tableau de bord FedaPay)
 */
export interface FedapayCheckout {
  transactionId: string;
  paymentUrl: string;
}

export type FedapayStatus = 'pending' | 'approved' | 'declined' | 'canceled' | 'refunded' | 'transferred' | string;

@Injectable()
export class FedapayService {
  private readonly logger = new Logger(FedapayService.name);

  get configured(): boolean {
    return Boolean(process.env.FEDAPAY_SECRET_KEY);
  }

  private get baseUrl(): string {
    return process.env.FEDAPAY_ENV === 'live'
      ? 'https://api.fedapay.com/v1'
      : 'https://sandbox-api.fedapay.com/v1';
  }

  private async call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    if (!this.configured) {
      throw new ServiceUnavailableException('Paiement FedaPay non configuré (FEDAPAY_SECRET_KEY).');
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      this.logger.warn(`FedaPay ${method} ${path} → ${res.status} ${JSON.stringify(data).slice(0, 300)}`);
      throw new BadGatewayException('Le service de paiement FedaPay a refusé la demande.');
    }
    return data as T;
  }

  /** Crée la transaction puis le lien de paiement hébergé. */
  async createCheckout(input: {
    amount: number;
    description: string;
    callbackUrl: string;
    customer: { name: string; phone: string; email?: string | null };
  }): Promise<FedapayCheckout> {
    const [firstname, ...rest] = input.customer.name.trim().split(/\s+/);
    const phone = input.customer.phone.replace(/\D/g, '').replace(/^229/, '');

    const created = await this.call<Record<string, { id: number }>>('POST', '/transactions', {
      description: input.description,
      amount: input.amount,
      currency: { iso: 'XOF' },
      callback_url: input.callbackUrl,
      // FedaPay exige un e-mail pour créer un client : sans e-mail, la page de
      // paiement hébergée demande elle-même les coordonnées.
      ...(input.customer.email
        ? {
            customer: {
              firstname: firstname || 'Client',
              lastname: rest.join(' ') || 'Moncode',
              email: input.customer.email,
              phone_number: { number: phone, country: 'bj' },
            },
          }
        : {}),
    });
    const transaction = created['v1/transaction'];
    if (!transaction?.id) throw new BadGatewayException('Réponse FedaPay inattendue.');

    const token = await this.call<{ token: string; url: string }>(
      'POST',
      `/transactions/${transaction.id}/token`,
    );
    return { transactionId: String(transaction.id), paymentUrl: token.url };
  }

  /** Statut faisant foi, lu directement chez FedaPay (jamais depuis le navigateur). */
  async getStatus(transactionId: string): Promise<{ status: FedapayStatus; amount?: number; raw: unknown }> {
    const data = await this.call<Record<string, { status: string; amount: number }>>(
      'GET',
      `/transactions/${encodeURIComponent(transactionId)}`,
    );
    const transaction = data['v1/transaction'];
    return { status: transaction?.status ?? 'pending', amount: transaction?.amount, raw: transaction };
  }

  /**
   * Vérifie l'en-tête `X-FEDAPAY-SIGNATURE` (`t=<timestamp>,s=<hmac>`) :
   * HMAC-SHA256 de `${t}.${corps brut}` avec le secret du webhook.
   */
  verifyWebhookSignature(rawBody: Buffer | undefined, header: string | undefined): boolean {
    const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
    if (!secret || !rawBody || !header) return false;

    const parts = Object.fromEntries(
      header.split(',').map((part) => {
        const [key, ...value] = part.trim().split('=');
        return [key, value.join('=')];
      }),
    );
    const timestamp = parts.t;
    const signature = parts.s;
    if (!timestamp || !signature) return false;

    // Rejette les signatures de plus de 5 minutes (rejeu).
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

    const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
