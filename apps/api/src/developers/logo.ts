import { BadRequestException } from '@nestjs/common';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import sharp from 'sharp';

const MAX_BYTES = 2 * 1024 * 1024;

/** Adresse privée, locale ou réservée : jamais appelée depuis le serveur (anti-SSRF). */
function isPrivate(ip: string): boolean {
  if (ip.includes(':')) {
    const v = ip.toLowerCase();
    return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('::ffff:');
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

/** Charge le logo d'un QR code : data URL (base64) ou adresse https publique ; 2 Mo au plus, PNG/JPEG/WebP/SVG. */
export async function loadLogo(source: unknown): Promise<Buffer> {
  if (typeof source !== 'string' || !source.trim()) throw new BadRequestException('« logo » : adresse https ou data URL attendue.');
  const value = source.trim();
  let raw: Buffer;
  const data = value.match(/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/i);
  if (data) {
    raw = Buffer.from(data[2], 'base64');
  } else if (/^https:\/\//i.test(value)) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new BadRequestException('« logo » : adresse invalide.');
    }
    const host = url.hostname.replace(/^\[|\]$/g, '');
    const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
    if (!addresses.length || addresses.some(isPrivate)) throw new BadRequestException('« logo » : adresse non autorisée.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, { signal: controller.signal, redirect: 'error' });
      if (!res.ok) throw new Error(String(res.status));
      const declared = Number(res.headers.get('content-length') ?? 0);
      if (declared > MAX_BYTES) throw new Error('trop lourd');
      raw = Buffer.from(await res.arrayBuffer());
    } catch {
      throw new BadRequestException('« logo » : impossible de télécharger l’image (https public, 2 Mo maximum, sans redirection).');
    } finally {
      clearTimeout(timer);
    }
  } else {
    throw new BadRequestException('« logo » : adresse https ou data URL (png, jpeg, webp) attendue.');
  }
  if (raw.length > MAX_BYTES) throw new BadRequestException('« logo » : 2 Mo au maximum.');
  try {
    return await sharp(raw).rotate().resize(400, 400, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  } catch {
    throw new BadRequestException('« logo » : image illisible (png, jpeg ou webp).');
  }
}

/** Pose le logo au centre d'un QR code PNG, sur une pastille blanche. */
export async function overlayLogo(qrPng: Buffer, logo: Buffer, size: number): Promise<Buffer> {
  const box = Math.round(size * 0.24);
  const inner = Math.round(box * 0.78);
  const mark = await sharp(logo).resize(inner, inner, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer();
  const badge = await sharp({ create: { width: box, height: box, channels: 4, background: '#ffffff' } })
    .composite([{ input: Buffer.from(`<svg width="${box}" height="${box}"><rect width="${box}" height="${box}" rx="${Math.round(box * 0.2)}" fill="#fff"/></svg>`), blend: 'dest-in' }, { input: mark, gravity: 'center' }])
    .png()
    .toBuffer();
  return sharp(qrPng).composite([{ input: badge, gravity: 'center' }]).png().toBuffer();
}

/** Insère le logo au centre d'un QR code SVG. */
export function overlayLogoSvg(svg: string, logo: Buffer): string {
  const vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const n = vb ? Number(vb[1]) : 0;
  if (!n) return svg;
  const box = n * 0.24;
  const x = (n - box) / 2;
  const pad = box * 0.11;
  const image = `<rect x="${x}" y="${x}" width="${box}" height="${box}" rx="${box * 0.2}" fill="#fff"/><image href="data:image/png;base64,${logo.toString('base64')}" x="${x + pad}" y="${x + pad}" width="${box - 2 * pad}" height="${box - 2 * pad}" preserveAspectRatio="xMidYMid meet"/>`;
  return svg.replace('</svg>', `${image}</svg>`);
}
