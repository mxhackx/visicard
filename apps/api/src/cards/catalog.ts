import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

export interface Product {
  id: string;
  name: string;
  price: number | null;
  description: string;
  image: string | null;
}
export interface Promo {
  title: string;
  text: string;
  until: string | null;
}
export interface Catalog {
  promo: Promo | null;
  products: Product[];
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** Valide le catalogue envoyé par le propriétaire (limites strictes : c'est affiché publiquement). */
export function parseCatalog(input: unknown): Catalog {
  const raw = (input && typeof input === 'object' ? input : {}) as { promo?: unknown; products?: unknown };
  let promo: Promo | null = null;
  if (raw.promo && typeof raw.promo === 'object') {
    const p = raw.promo as Record<string, unknown>;
    const title = str(p.title, 80);
    const text = str(p.text, 300);
    const until = str(p.until, 10);
    if (title || text) {
      if (until && !isDate(until)) throw new BadRequestException('Date de fin de promotion invalide.');
      promo = { title, text, until: until || null };
    }
  }
  const products: Product[] = [];
  if (Array.isArray(raw.products)) {
    if (raw.products.length > 60) throw new BadRequestException('60 produits maximum.');
    for (const item of raw.products) {
      const p = (item ?? {}) as Record<string, unknown>;
      const name = str(p.name, 80);
      if (!name) continue;
      const priceRaw = p.price === '' || p.price == null ? null : Number(p.price);
      if (priceRaw !== null && (!Number.isFinite(priceRaw) || priceRaw < 0 || priceRaw > 100_000_000)) {
        throw new BadRequestException(`Prix invalide pour « ${name} ».`);
      }
      const image = str(p.image, 500);
      if (image && !/^https?:\/\//i.test(image)) throw new BadRequestException('Image de produit : adresse http(s) attendue.');
      products.push({
        id: str(p.id, 24) || randomBytes(6).toString('hex'),
        name,
        price: priceRaw === null ? null : Math.round(priceRaw),
        description: str(p.description, 200),
        image: image || null,
      });
    }
  }
  return { promo, products };
}

/** Ce que voit le public : une promotion échue disparaît toute seule. */
export function publicCatalog(raw: unknown): Catalog {
  let catalog: Catalog;
  try {
    catalog = parseCatalog(raw);
  } catch {
    return { promo: null, products: [] };
  }
  if (catalog.promo?.until && Date.parse(`${catalog.promo.until}T23:59:59`) < Date.now()) catalog.promo = null;
  return catalog;
}
