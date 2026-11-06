import { BadRequestException, Body, Controller, Get, HttpCode, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import * as QRCode from 'qrcode';
import { ApiKeyGuard, type ApiRequest } from './api-key.guard';
import { buildPayload } from './payloads';

const HEX = /^#[0-9a-f]{6}$/i;

/** API publique v1 : génération de QR codes statiques, authentifiée par clé. */
@Controller('v1')
@UseGuards(ApiKeyGuard)
@SkipThrottle({ short: true, default: true })
export class V1Controller {
  /** Informations sur la clé utilisée et son quota du mois. */
  @Get('usage')
  usage(@Req() req: ApiRequest) {
    const k = req.apiKey!;
    return {
      key: k.name,
      unlimited: k.admin,
      perMinute: k.admin ? null : k.perMinute,
      perMonth: k.admin ? null : k.perMonth,
      usedThisMonth: k.used,
      remainingThisMonth: k.admin ? null : Math.max(0, k.perMonth - k.used),
    };
  }

  @Get('qr')
  qrGet(@Query() query: Record<string, string>, @Res() res: Response) {
    return this.render(query, res);
  }

  @Post('qr')
  @HttpCode(200)
  qrPost(@Body() body: Record<string, unknown>, @Res() res: Response) {
    return this.render(body ?? {}, res);
  }

  private async render(input: Record<string, unknown>, res: Response) {
    const type = typeof input.type === 'string' && input.type ? input.type : 'text';
    const payload = buildPayload(type, input);
    const format = input.format === 'svg' ? 'svg' : 'png';
    const size = Math.min(2000, Math.max(100, Number(input.size) || 512));
    const margin = Math.min(10, Math.max(0, input.margin === undefined ? 2 : Number(input.margin) || 0));
    const fg = typeof input.fg === 'string' && HEX.test(input.fg) ? input.fg : '#111827';
    const bg = typeof input.bg === 'string' && HEX.test(input.bg) ? input.bg : '#ffffff';
    const ecc = ['L', 'M', 'Q', 'H'].includes(String(input.ecc)) ? (String(input.ecc) as 'L' | 'M' | 'Q' | 'H') : 'M';
    const options = { width: size, margin, errorCorrectionLevel: ecc, color: { dark: fg, light: bg } } as const;

    try {
      if (format === 'svg') {
        res.type('image/svg+xml').send(await QRCode.toString(payload, { ...options, type: 'svg' }));
      } else if (input.encoding === 'base64' || input.encoding === 'json') {
        res.json({ type, payload, format: 'png', dataUrl: await QRCode.toDataURL(payload, options) });
      } else {
        res.type('image/png').send(await QRCode.toBuffer(payload, { ...options, type: 'png' }));
      }
    } catch {
      throw new BadRequestException('Contenu trop long pour un QR code.');
    }
  }
}
