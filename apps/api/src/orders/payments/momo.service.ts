import { Injectable, Logger, ServiceUnavailableException, BadGatewayException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

/**
 * MTN Mobile Money, API Collection (https://momodeveloper.mtn.com) :
 * une demande « request to pay » s'affiche sur le téléphone du client, qui
 * valide avec son code MoMo. Le statut est ensuite interrogé côté serveur.
 *
 * Variables d'environnement :
 *   MOMO_BASE_URL          https://sandbox.momodeveloper.mtn.com (défaut) ou l'URL de production
 *   MOMO_SUBSCRIPTION_KEY  clé d'abonnement du produit Collection (Ocp-Apim-Subscription-Key)
 *   MOMO_API_USER          identifiant API user (UUID)
 *   MOMO_API_KEY           clé API associée
 *   MOMO_TARGET_ENV        `sandbox` (défaut) ou l'environnement fourni par MTN (ex. `mtnbenin`)
 *   MOMO_CURRENCY          devise envoyée à MTN : `EUR` imposé en sandbox, `XOF` en production
 */
export type MomoStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED';

@Injectable()
export class MomoService {
  private readonly logger = new Logger(MomoService.name);
  private token: { value: string; expiresAt: number } | null = null;

  get configured(): boolean {
    return Boolean(process.env.MOMO_SUBSCRIPTION_KEY && process.env.MOMO_API_USER && process.env.MOMO_API_KEY);
  }

  private get baseUrl() {
    return (process.env.MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com').replace(/\/$/, '');
  }

  private get targetEnv() {
    return process.env.MOMO_TARGET_ENV || 'sandbox';
  }

  get currency() {
    return process.env.MOMO_CURRENCY || (this.targetEnv === 'sandbox' ? 'EUR' : 'XOF');
  }

  private ensureConfigured() {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Paiement MTN MoMo non configuré (MOMO_SUBSCRIPTION_KEY, MOMO_API_USER, MOMO_API_KEY).',
      );
    }
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) return this.token.value;

    const basic = Buffer.from(`${process.env.MOMO_API_USER}:${process.env.MOMO_API_KEY}`).toString('base64');
    const res = await fetch(`${this.baseUrl}/collection/token/`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY!,
      },
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
    if (!res.ok || !data.access_token) {
      this.logger.warn(`MoMo token → ${res.status}`);
      throw new BadGatewayException("Impossible d'ouvrir une session MTN MoMo.");
    }
    this.token = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
    return this.token.value;
  }

  /** Numéro au format international sans « + » (ex. 2290197000000). */
  static normalizeMsisdn(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) throw new BadRequestException('Numéro MoMo invalide.');
    return digits.startsWith('229') ? digits : `229${digits}`;
  }

  /** Envoie la demande de paiement ; renvoie la référence à interroger ensuite. */
  async requestToPay(input: { amount: number; phone: string; externalId: string; note: string }): Promise<string> {
    this.ensureConfigured();
    const referenceId = randomUUID();
    const res = await fetch(`${this.baseUrl}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await this.accessToken()}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': this.targetEnv,
        'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: String(input.amount),
        currency: this.currency,
        externalId: input.externalId,
        payer: { partyIdType: 'MSISDN', partyId: MomoService.normalizeMsisdn(input.phone) },
        payerMessage: input.note.slice(0, 160),
        payeeNote: input.note.slice(0, 160),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status !== 202) {
      const text = await res.text().catch(() => '');
      this.logger.warn(`MoMo requesttopay → ${res.status} ${text.slice(0, 300)}`);
      throw new BadGatewayException('MTN MoMo a refusé la demande de paiement.');
    }
    return referenceId;
  }

  async getStatus(referenceId: string): Promise<{ status: MomoStatus; raw: unknown }> {
    this.ensureConfigured();
    const res = await fetch(`${this.baseUrl}/collection/v1_0/requesttopay/${encodeURIComponent(referenceId)}`, {
      headers: {
        Authorization: `Bearer ${await this.accessToken()}`,
        'X-Target-Environment': this.targetEnv,
        'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY!,
      },
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as { status?: MomoStatus };
    if (!res.ok) throw new BadGatewayException('Statut MTN MoMo indisponible.');
    return { status: data.status ?? 'PENDING', raw: data };
  }
}
