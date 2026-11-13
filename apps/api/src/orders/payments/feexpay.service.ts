import { BadGatewayException, BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

/**
 * FeexPay (https://docs.feexpay.me) : paiement Mobile Money par numéro de téléphone (le client valide sur son téléphone).
 *
 * Variables d'environnement :
 *   FEEXPAY_API_KEY         clé privée de la boutique : `test_key_…` en sandbox, `fp_…` en production
 *   FEEXPAY_SHOP_ID         identifiant public de la boutique (menu Développeurs), envoyé dans le champ `shop`
 *   FEEXPAY_ENV             `sandbox` (défaut) ou `live`
 *   FEEXPAY_WEBHOOK_SECRET  valeur d'en-tête `Authorization` configurée dans le tableau de bord FeexPay (Webhooks)
 *   FEEXPAY_WEBHOOK_SCHEME  `Bearer` (défaut) ou `Basic`
 *
 * Endpoints (voir docs.feexpay.me, API REST) :
 *   POST /api/transactions/public/requesttopay/{réseau}        lance la demande de paiement
 *   GET  /api/transactions/public/single/status/{référence}   lit le statut (PENDING, SUCCESSFUL, FAILED)
 */
export type FeexpayNetwork = 'mtn' | 'moov' | 'celtiis_bj';
export const FEEXPAY_NETWORKS: readonly FeexpayNetwork[] = ['mtn', 'moov', 'celtiis_bj'];

export type FeexpayStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED';

export interface FeexpayRequest {
  network: FeexpayNetwork;
  phone: string;
  amount: number;
  description: string;
  callbackInfo?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

const LIMITS = {
  live: { min: 100, max: 2_000_000 },
  sandbox: { min: 10, max: 1_000_000 },
} as const;

@Injectable()
export class FeexpayService {
  private readonly logger = new Logger(FeexpayService.name);

  get configured(): boolean {
    return Boolean(process.env.FEEXPAY_API_KEY && process.env.FEEXPAY_SHOP_ID);
  }

  /** Mode test : seuls les numéros de test (…00 à …06) sont acceptés, aucun argent ne circule. */
  get sandbox(): boolean {
    return !this.live;
  }

  get live(): boolean {
    return process.env.FEEXPAY_ENV === 'live';
  }

  private get baseUrl(): string {
    return this.live ? 'https://api-v2.feexpay.me' : 'https://sandbox-api.feexpay.me';
  }

  /**
   * Chiffres seuls, indicatif 229 compris (le `+` et le `00` de tête sont retirés).
   * Moov et Celtiis attendent `22901` + 8 chiffres : un ancien numéro de 8 chiffres reçoit donc le « 01 » manquant.
   */
  normalizePhone(raw: string, network?: FeexpayNetwork): string {
    const digits = String(raw ?? '').replace(/[^\d+]/g, '').replace(/^\+/, '').replace(/^00/, '');
    let local = digits.startsWith('229') ? digits.slice(3) : digits;
    if ((network === 'moov' || network === 'celtiis_bj') && local.length === 8) local = `01${local}`;
    if (!/^\d{8}$|^\d{10}$/.test(local)) {
      throw new BadRequestException('Numéro Mobile Money invalide : indiquez le numéro béninois du compte à débiter.');
    }
    return `229${local}`;
  }

  private async call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    if (!this.configured) {
      throw new ServiceUnavailableException('Paiement FeexPay non configuré (FEEXPAY_API_KEY et FEEXPAY_SHOP_ID).');
    }
    const key = process.env.FEEXPAY_API_KEY as string;
    // Une clé de test ne fonctionne qu'en sandbox, une clé de production qu'en live : on le dit clairement.
    if (this.live && key.startsWith('test_')) throw new ServiceUnavailableException('FEEXPAY_ENV=live mais la clé est une clé de test (test_key_…).');
    if (!this.live && key.startsWith('fp_')) throw new ServiceUnavailableException('FEEXPAY_ENV=sandbox mais la clé est une clé de production (fp_…).');

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new BadGatewayException('FeexPay ne répond pas : réessayez dans un instant.');
    }
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      this.logger.warn(`FeexPay ${method} ${path} → ${res.status} ${JSON.stringify(data).slice(0, 300)}`);
      if (res.status === 400) {
        const code = typeof data.code === 'string' ? data.code : '';
        // Messages de FeexPay (en anglais) traduits et expliqués ; le mode test n'accepte que des numéros de test.
        if (code === 'INVALID_SANDBOX_TEST_NUMBER') {
          throw new BadRequestException(
            'Mode test FeexPay : ce numéro n’est pas un numéro de test. Utilisez un numéro finissant par 00 à 06 (par exemple 97000000 : paiement réussi ; 97000001 : paiement refusé), ou passez en mode production avec une clé fp_….',
          );
        }
        if (code === 'INVALID_PHONE_NUMBER') {
          throw new BadRequestException('Numéro refusé par FeexPay : vérifiez qu’il correspond bien au réseau choisi (MTN, Moov ou Celtiis).');
        }
        const message = typeof data.message === 'string' ? data.message : typeof data.error === 'string' ? data.error : '';
        throw new BadRequestException(message || 'FeexPay a refusé la demande : vérifiez le numéro et le réseau.');
      }
      throw new BadGatewayException('Le service de paiement FeexPay a refusé la demande.');
    }
    return data as T;
  }

  /** Lance la demande de paiement : le client reçoit une invite à valider sur son téléphone. */
  async requestPayment(input: FeexpayRequest): Promise<{ reference: string; status: FeexpayStatus }> {
    const limits = this.live ? LIMITS.live : LIMITS.sandbox;
    if (!Number.isInteger(input.amount) || input.amount < limits.min || input.amount > limits.max) {
      throw new BadRequestException(`Montant invalide (${limits.min} à ${limits.max} FCFA).`);
    }
    const body = {
      shop: process.env.FEEXPAY_SHOP_ID,
      amount: input.amount,
      phoneNumber: this.normalizePhone(input.phone, input.network),
      description: input.description.slice(0, 40),
      ...(input.callbackInfo ? { callback_info: input.callbackInfo.slice(0, 2000) } : {}),
      ...(input.firstName ? { first_name: input.firstName.slice(0, 60) } : {}),
      ...(input.lastName ? { last_name: input.lastName.slice(0, 60) } : {}),
      ...(input.email ? { email: input.email } : {}),
    };
    const out = await this.call<{ reference?: string; status?: string }>('POST', `/api/transactions/public/requesttopay/${input.network}`, body);
    if (!out.reference) throw new BadGatewayException('Réponse FeexPay inattendue (référence absente).');
    return { reference: String(out.reference), status: this.normalize(out.status) };
  }

  /** Statut faisant foi, lu chez FeexPay (jamais depuis le navigateur ni le corps d'un webhook). */
  async getStatus(reference: string): Promise<{ status: FeexpayStatus; amount?: number; reason?: string; raw: unknown }> {
    const data = await this.call<Record<string, unknown>>('GET', `/api/transactions/public/single/status/${encodeURIComponent(reference)}`);
    const amount = typeof data.amount === 'number' ? data.amount : Number(data.amount);
    return {
      status: this.normalize(data.status),
      amount: Number.isFinite(amount) ? amount : undefined,
      reason: typeof data.reason === 'string' ? data.reason : undefined,
      raw: data,
    };
  }

  /** `PENDING`, `IN PENDING STATE` et toute valeur inconnue valent « en attente ». */
  private normalize(value: unknown): FeexpayStatus {
    const v = String(value ?? '').toUpperCase();
    return v === 'SUCCESSFUL' || v === 'FAILED' ? v : 'PENDING';
  }

  /** Le webhook n'est pas signé : FeexPay renvoie l'en-tête `Authorization` configuré dans le tableau de bord. */
  verifyWebhookAuthorization(header: string | undefined): boolean {
    const secret = process.env.FEEXPAY_WEBHOOK_SECRET;
    if (!secret || !header) return false;
    const scheme = process.env.FEEXPAY_WEBHOOK_SCHEME === 'Basic' ? 'Basic' : 'Bearer';
    const a = Buffer.from(header.trim());
    const b = Buffer.from(`${scheme} ${secret}`);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
