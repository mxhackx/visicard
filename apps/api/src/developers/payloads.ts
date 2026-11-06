import { BadRequestException } from '@nestjs/common';

type Input = Record<string, unknown>;
const str = (v: unknown, max = 1000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const wifiEsc = (v: string) => v.replace(/([\;,":])/g, '\\$1');

/** Construit le contenu d'un QR code selon son type (mêmes formats que le site). */
export function buildPayload(type: string, input: Input): string {
  switch (type) {
    case 'text':
    case 'url': {
      const data = str(input.data, 2000);
      if (!data) throw new BadRequestException('Le champ « data » est requis.');
      if (type === 'url' && !/^https?:\/\//i.test(data)) throw new BadRequestException('Une URL doit commencer par http:// ou https://.');
      return data;
    }
    case 'wifi': {
      const ssid = str(input.ssid, 64);
      if (!ssid) throw new BadRequestException('Le champ « ssid » est requis.');
      const sec = ['WPA', 'WEP', 'nopass'].includes(str(input.security)) ? str(input.security) : 'WPA';
      return `WIFI:T:${sec};S:${wifiEsc(ssid)};${sec === 'nopass' ? '' : `P:${wifiEsc(str(input.password, 64))};`}${input.hidden ? 'H:true;' : ''};`;
    }
    case 'tel': {
      const phone = str(input.phone, 30).replace(/[^\d+]/g, '');
      if (phone.replace(/\D/g, '').length < 6) throw new BadRequestException('Numéro « phone » invalide.');
      return `tel:${phone}`;
    }
    case 'sms': {
      const phone = str(input.phone, 30).replace(/[^\d+]/g, '');
      if (phone.replace(/\D/g, '').length < 6) throw new BadRequestException('Numéro « phone » invalide.');
      return `SMSTO:${phone}:${str(input.message, 500)}`;
    }
    case 'email': {
      const to = str(input.to, 200);
      if (!/^\S+@\S+\.\S+$/.test(to)) throw new BadRequestException('Adresse « to » invalide.');
      const q = new URLSearchParams();
      if (str(input.subject, 200)) q.set('subject', str(input.subject, 200));
      if (str(input.body, 1000)) q.set('body', str(input.body, 1000));
      const qs = q.toString().replace(/\+/g, '%20');
      return `mailto:${to}${qs ? `?${qs}` : ''}`;
    }
    case 'geo': {
      const lat = Number(input.lat);
      const lng = Number(input.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        throw new BadRequestException('Champs « lat » et « lng » invalides.');
      }
      return `geo:${lat},${lng}`;
    }
    default:
      throw new BadRequestException('Type inconnu. Types : text, url, wifi, tel, sms, email, geo.');
  }
}
