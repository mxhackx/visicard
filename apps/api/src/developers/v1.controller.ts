import { BadRequestException, Body, Controller, Get, HttpCode, HttpException, HttpStatus, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import * as QRCode from 'qrcode';
import { primaryAppUrl } from '../app-url';
import { ApiKeyGuard, type ApiRequest } from './api-key.guard';
import { buildPayload } from './payloads';
import { encodeDirect, isDirectType } from './direct-payload';
import { parseCsv } from './csv';
import { loadLogo, overlayLogo, overlayLogoSvg } from './logo';
import { CardsService } from '../cards/cards.service';
import { normalizeQrStyle } from '../cards/qr-style';
import { DevelopersService } from './developers.service';

const HEX = /^#[0-9a-f]{6}$/i;

/** API publique v1 : génération de QR codes statiques, authentifiée par clé. */
@Controller('v1')
@UseGuards(ApiKeyGuard)
@SkipThrottle({ short: true, default: true })
export class V1Controller {
  constructor(
    private readonly developers: DevelopersService,
    private readonly cards: CardsService,
  ) {}

  /** Informations sur la clé utilisée et son quota du mois. */
  @Get('usage')
  usage(@Req() req: ApiRequest) {
    const k = req.apiKey!;
    return {
      key: k.name,
      admin: k.admin,
      premium: k.premium,
      perMinute: k.admin ? null : k.perMinute,
      perMonth: k.admin ? null : k.perMonth,
      usedThisMonth: k.used,
      remainingThisMonth: k.admin ? null : Math.max(0, k.perMonth - k.used),
    };
  }

  @Get('qr')
  qrGet(@Query() query: Record<string, string>, @Req() req: ApiRequest, @Res() res: Response) {
    return this.render(query, req, res);
  }

  @Post('qr')
  @HttpCode(200)
  qrPost(@Body() body: Record<string, unknown>, @Req() req: ApiRequest, @Res() res: Response) {
    return this.render(body ?? {}, req, res);
  }

  /** Contenu du QR code : écriture JSON du site (`type` + `data`), ou champs à plat (ancienne écriture). */
  private resolve(input: Record<string, unknown>): { type: string; payload: string } {
    const type = typeof input.type === 'string' && input.type ? input.type : 'url';
    const nested = typeof input.data === 'object' && input.data !== null && !Array.isArray(input.data);
    if (isDirectType(type) && (nested || type === 'vcard' || type === 'event')) {
      return { type, payload: encodeDirect(type, (nested ? input.data : input) as Record<string, unknown>) };
    }
    if (type === 'vcard' || type === 'event') throw new BadRequestException('Champ « data » attendu.');
    return { type, payload: buildPayload(type, input) };
  }

  private async gate(req: ApiRequest, type: string) {
    if (!(await this.developers.canGenerate(req.apiKey!, type))) {
      throw new HttpException(
        {
          statusCode: 402,
          error: 'Payment Required',
          message: 'Les liens (type=url) sont gratuits ; les autres contenus (wifi, tel, sms, email, geo, vcard, event, text…) exigent un compte Premium.',
          /** Où activer Premium (5 000 FCFA, Mobile Money) : le compte, pas la clé, porte l'offre. */
          upgradeUrl: `${primaryAppUrl()}/paiement?suite=%2Fdeveloppeurs`,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  /** Couleurs : `style.fg` / `style.bg` (écriture du site) ou `fg` / `bg` à plat. */
  private colors(input: Record<string, unknown>) {
    const style = typeof input.style === 'object' && input.style !== null ? (input.style as Record<string, unknown>) : {};
    const pick = (a: unknown, b: unknown, d: string) => (typeof a === 'string' && HEX.test(a) ? a : typeof b === 'string' && HEX.test(b) ? b : d);
    return { fg: pick(style.fg, input.fg, '#111827'), bg: pick(style.bg, input.bg, '#ffffff'), style };
  }

  /** Dessine le QR code (couleurs et logo). Les formes des points et des coins sont réservées aux téléchargements du site. */
  private async draw(payload: string, input: Record<string, unknown>, format: 'png' | 'svg', logo: Buffer | null) {
    const size = Math.min(2000, Math.max(100, Number(input.size) || 512));
    const margin = Math.min(10, Math.max(0, input.margin === undefined ? 2 : Number(input.margin) || 0));
    const { fg, bg } = this.colors(input);
    const wanted = ['L', 'M', 'Q', 'H'].includes(String(input.ecc)) ? (String(input.ecc) as 'L' | 'M' | 'Q' | 'H') : 'M';
    const ecc = logo ? 'H' : wanted; // un logo masque le centre : correction maximale
    const options = { width: size, margin, errorCorrectionLevel: ecc, color: { dark: fg, light: bg } } as const;
    try {
      if (format === 'svg') {
        const svg = await QRCode.toString(payload, { ...options, type: 'svg' });
        return logo ? overlayLogoSvg(svg, logo) : svg;
      }
      const png = await QRCode.toBuffer(payload, { ...options, type: 'png' });
      return logo ? await overlayLogo(png, logo, size) : png;
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new BadRequestException('Contenu trop long pour un QR code.');
    }
  }

  private async render(input: Record<string, unknown>, req: ApiRequest, res: Response) {
    const type = typeof input.type === 'string' && input.type ? input.type : 'url';
    await this.gate(req, type);
    const { payload } = this.resolve(input);
    const logo = input.logo ? await loadLogo(input.logo) : null;
    const format = input.format === 'svg' ? 'svg' : 'png';
    const out = await this.draw(payload, input, format, logo);
    if (format === 'svg') res.type('image/svg+xml').send(out as string);
    else if (input.encoding === 'base64' || input.encoding === 'json') {
      res.json({ type, payload, format: 'png', dataUrl: `data:image/png;base64,${(out as Buffer).toString('base64')}` });
    } else res.type('image/png').send(out as Buffer);
  }

  private urls(slug: string) {
    const app = primaryAppUrl();
    return { linkUrl: `${app}/c/${slug}`, editUrl: `${app}/compte/qr/${slug}/modifier` };
  }

  /**
   * Crée un QR code enregistré dans le compte de la clé : un QR code « lien » (`linkUrl`) qui ne change jamais,
   * et le contenu qu'il ouvre, modifiable ensuite par `PATCH /v1/codes/{slug}` avec le même JSON.
   */
  @Post('codes')
  @HttpCode(200)
  async createCode(@Body() body: Record<string, unknown>, @Req() req: ApiRequest) {
    const input = body ?? {};
    const type = typeof input.type === 'string' && input.type ? input.type : 'url';
    await this.gate(req, type);
    const { payload } = this.resolve(input);
    const { fg, bg, style } = this.colors(input);
    const qrStyle = normalizeQrStyle(JSON.stringify({ ...style, fg, bg }));
    const logo = input.logo ? await loadLogo(input.logo) : null;
    const k = req.apiKey!;
    const title = typeof input.title === 'string' ? input.title : undefined;
    const saved = await this.cards.createDirect({ id: k.userId, role: k.admin ? 'admin' : 'user' }, { payload, qrStyle, title });
    const { linkUrl, editUrl } = this.urls(saved.slug);
    const png = async (data: string) => `data:image/png;base64,${((await this.draw(data, input, 'png', logo)) as Buffer).toString('base64')}`;
    return { slug: saved.slug, created: saved.saved, type, payload, linkUrl, editUrl, qr: { link: await png(linkUrl), content: await png(payload) } };
  }

  /**
   * Création en masse : `{ "type": "url", "items": [ { "url": "…", "title": "…" } ] }` ou `{ "type": "url", "csv": "titre,url\\nA,https://…" }`.
   * Jusqu'à 100 QR codes par appel, chacun avec son résultat (une ligne refusée n'arrête pas les autres).
   */
  @Post('codes/bulk')
  @HttpCode(200)
  async bulkCodes(@Body() body: Record<string, unknown>, @Req() req: ApiRequest) {
    const input = body ?? {};
    const type = typeof input.type === 'string' ? input.type : 'url';
    if (!isDirectType(type)) throw new BadRequestException(`« type » : ${['url', 'text', 'vcard', 'tel', 'sms', 'email', 'wifi', 'event', 'geo'].join(', ')}.`);
    await this.gate(req, type);

    let items: Record<string, unknown>[];
    if (typeof input.csv === 'string') {
      const { headers, rows } = parseCsv(input.csv);
      if (!headers.length) throw new BadRequestException('« csv » est vide : la première ligne donne les colonnes.');
      items = rows.map((cells) => Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? '').trim()])));
    } else if (Array.isArray(input.items)) {
      items = input.items.filter((i): i is Record<string, unknown> => typeof i === 'object' && i !== null && !Array.isArray(i));
    } else throw new BadRequestException('Envoyez « items » (liste) ou « csv » (texte).');
    if (!items.length) throw new BadRequestException('Aucun QR code à créer.');
    if (items.length > 100) throw new BadRequestException('100 QR codes au maximum par appel.');

    const { fg, bg, style } = this.colors(input);
    const qrStyle = normalizeQrStyle(JSON.stringify({ ...style, fg, bg }));
    const prepared = items.map((item) => {
      const source = typeof item.data === 'object' && item.data !== null ? (item.data as Record<string, unknown>) : item;
      const normalized = { ...source, hidden: source.hidden === true || /^(true|1|oui|yes)$/i.test(String(source.hidden ?? '')) };
      const title = [item.title, item.titre, item.nom, item.name].find((t) => typeof t === 'string' && t.trim()) as string | undefined;
      try {
        return { payload: encodeDirect(type, normalized), title };
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Ligne invalide.' };
      }
    });
    const valid = prepared.flatMap((p, index) => ('payload' in p && p.payload ? [{ index, payload: p.payload, title: p.title }] : []));
    const k = req.apiKey!;
    const created = valid.length
      ? await this.cards.createDirectBatch({ id: k.userId, role: k.admin ? 'admin' : 'user' }, valid.map(({ payload, title }) => ({ payload, title })), qrStyle)
      : [];
    const results = prepared.map((p, index) => {
      if ('error' in p) return { index, error: p.error };
      const at = valid.findIndex((v) => v.index === index);
      const r = created[at];
      return r?.slug ? { index, slug: r.slug, created: r.created, payload: p.payload, ...this.urls(r.slug) } : { index, error: r?.error ?? 'Création impossible.' };
    });
    return { type, total: results.length, created: results.filter((r) => 'slug' in r).length, failed: results.filter((r) => 'error' in r).length, results };
  }

  /** Lit un QR code du compte de la clé. */
  @Get('codes/:slug')
  async readCode(@Param('slug') slug: string, @Req() req: ApiRequest) {
    const k = req.apiKey!;
    const card = await this.cards.findOwnedBy(slug, k.userId, k.admin);
    return { slug, title: card.title, payload: card.contentUrl, status: card.status, ...this.urls(slug) };
  }

  /** Modifie le contenu (et le nom) d'un QR code : son `linkUrl` ne change pas. Même JSON que pour la création. */
  @Patch('codes/:slug')
  async updateCode(@Param('slug') slug: string, @Body() body: Record<string, unknown>, @Req() req: ApiRequest) {
    const input = body ?? {};
    const k = req.apiKey!;
    const hasContent = input.data !== undefined || input.type !== undefined;
    let payload: string | undefined;
    if (hasContent) {
      const { type, payload: p } = this.resolve(input);
      await this.gate(req, type);
      payload = p;
    }
    const saved = await this.cards.updateDirect({ id: k.userId, role: k.admin ? 'admin' : 'user' }, slug, {
      payload,
      title: typeof input.title === 'string' ? input.title : undefined,
    });
    return { ...saved, ...this.urls(slug) };
  }
}
