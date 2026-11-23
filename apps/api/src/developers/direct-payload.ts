import { BadRequestException } from '@nestjs/common';

/**
 * Contenu des QR codes directs, au même format que le site (apps/web/lib/qr-payloads.ts) :
 * un JSON `{ "type": "wifi", "data": { "ssid": "…", "password": "…" } }` produit ici le même QR code que le formulaire.
 */

export const DIRECT_TYPES = ['url', 'text', 'vcard', 'tel', 'sms', 'email', 'wifi', 'event', 'geo'] as const;
export type DirectType = (typeof DIRECT_TYPES)[number];
export const isDirectType = (v: unknown): v is DirectType => (DIRECT_TYPES as readonly string[]).includes(String(v));

type Src = Record<string, unknown>;
const s = (v: unknown, max = 1500) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '').slice(0, max);
const escText = (v: string) => v.trim().replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const escWifi = (v: string) => v.replace(/([\;,:"])/g, '\\$1');
const cleanPhone = (v: string) => (v.trim().startsWith('+') ? '+' : '') + v.trim().replace(/\D/g, '');
const line = (k: string, v: string) => (v ? `${k}:${v}` : null);
const fail = (msg: string): never => {
  throw new BadRequestException(msg);
};

function normalizeUrl(v: string): string {
  const t = v.trim();
  return !t ? '' : /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`;
}

/** `2026-11-05T14:30` → `20261105T143000`. */
function icsDate(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? `${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}00` : '';
}

export function encodeDirect(type: DirectType, d: Src): string {
  switch (type) {
    case 'url': {
      const href = normalizeUrl(s(d.url ?? d.data));
      if (!href) fail('« data.url » est requis.');
      if (!/^https?:\/\/\S+$/i.test(href)) fail('Une URL doit commencer par http:// ou https://.');
      return href;
    }
    case 'text': {
      const text = s(d.text ?? d.data);
      if (!text.trim()) fail('« data.text » est requis.');
      return text;
    }
    case 'vcard': {
      const first = s(d.firstName, 80), last = s(d.lastName, 80), org = s(d.org, 120);
      if (!first.trim() && !last.trim() && !org.trim()) fail('vCard : « firstName », « lastName » ou « org » est requis.');
      const full = [first.trim(), last.trim()].filter(Boolean).join(' ') || org.trim();
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${escText(last)};${escText(first)};;;`,
        `FN:${escText(full)}`,
        line('ORG', escText(org)),
        line('TITLE', escText(s(d.title, 120))),
        line('TEL;TYPE=CELL', cleanPhone(s(d.mobile, 30))),
        line('TEL;TYPE=WORK,VOICE', cleanPhone(s(d.work, 30))),
        line('EMAIL;TYPE=INTERNET', s(d.email, 200).trim()),
        line('URL', normalizeUrl(s(d.website, 300))),
        s(d.address, 300).trim() ? `ADR;TYPE=WORK:;;${escText(s(d.address, 300))};;;;` : null,
        'END:VCARD',
      ].filter(Boolean).join('\n');
    }
    case 'tel': {
      const phone = cleanPhone(s(d.phone, 30));
      if (phone.replace('+', '').length < 4) fail('« data.phone » invalide.');
      return `tel:${phone}`;
    }
    case 'sms': {
      const phone = cleanPhone(s(d.phone, 30));
      if (phone.replace('+', '').length < 4) fail('« data.phone » invalide.');
      return `SMSTO:${phone}:${s(d.message, 500)}`;
    }
    case 'email': {
      const to = s(d.to, 200).trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) fail('« data.to » : adresse e-mail invalide.');
      const params = [
        s(d.subject, 200).trim() && `subject=${encodeURIComponent(s(d.subject, 200).trim())}`,
        s(d.body, 1000).trim() && `body=${encodeURIComponent(s(d.body, 1000))}`,
      ].filter(Boolean);
      return `mailto:${to}${params.length ? `?${params.join('&')}` : ''}`;
    }
    case 'wifi': {
      const ssid = s(d.ssid, 64);
      if (!ssid) fail('« data.ssid » est requis.');
      const security = ['WPA', 'WEP', 'nopass'].includes(s(d.security)) ? s(d.security) : 'WPA';
      const password = s(d.password, 64);
      if (security !== 'nopass' && !password) fail('« data.password » est requis (ou security: "nopass").');
      if (security === 'WPA' && password.length < 8) fail('Un mot de passe WPA compte au moins 8 caractères.');
      const parts = [`T:${security}`, `S:${escWifi(ssid)}`];
      if (security !== 'nopass') parts.push(`P:${escWifi(password)}`);
      if (d.hidden === true) parts.push('H:true');
      return `WIFI:${parts.join(';')};;`;
    }
    case 'event': {
      const title = s(d.title, 200);
      if (!title.trim()) fail('« data.title » est requis.');
      const start = icsDate(s(d.start, 40));
      if (!start) fail('« data.start » est requis : AAAA-MM-JJTHH:MM.');
      const end = icsDate(s(d.end, 40));
      if (end && end < start) fail('« data.end » est avant « data.start ».');
      return [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
        `SUMMARY:${escText(title)}`, `DTSTART:${start}`, line('DTEND', end),
        line('LOCATION', escText(s(d.location, 200))), line('DESCRIPTION', escText(s(d.description, 600))),
        'END:VEVENT', 'END:VCALENDAR',
      ].filter(Boolean).join('\n');
    }
    case 'geo': {
      const lat = Number(s(d.lat).replace(',', '.'));
      const lng = Number(s(d.lng).replace(',', '.'));
      if (!s(d.lat).trim() || !s(d.lng).trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        fail('« data.lat » et « data.lng » invalides.');
      }
      const pair = `${+lat.toFixed(6)},${+lng.toFixed(6)}`;
      return d.format === 'geo' ? `geo:${pair}` : `https://www.google.com/maps?q=${pair}`;
    }
  }
}
