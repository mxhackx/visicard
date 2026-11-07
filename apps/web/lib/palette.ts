/**
 * Palettes de couleurs des pages digitales.
 *
 * Une palette = 4 couleurs libres (principale, accent, fond, texte). Elle est
 * enregistrée dans la colonne `themeId` sous la forme
 * `custom#466931#6ea03f#f7f6f1#22331b` : aucune migration de base.
 * Les teintes secondaires (cartes, liserés, texte atténué, texte posé sur la
 * couleur principale…) sont dérivées, pour que la page reste lisible.
 *
 * Valeurs historiques : `theme-1`…`theme-10` sont converties en palettes
 * équivalentes ; une valeur vide ou inconnue prend la palette par défaut de
 * la disposition.
 */

export interface Palette {
  /** Bandeaux, boutons principaux. */
  brand: string;
  /** Filets, puces, liens, détails. */
  accent: string;
  /** Fond de page. */
  surface: string;
  /** Texte principal. */
  text: string;
}

export type LayoutId =
  | "classic" | "maps" | "minimal" | "premium" | "saas" | "exoticas"
  | "maquis" | "beaute" | "boutique" | "hotel" | "clinique" | "chantier" | "carte";

const HEX = /^#[0-9a-f]{6}$/i;

export const isHex = (value: string) => HEX.test(value);

/* ---------- Couleur ---------- */

function rgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex([r, g, b]: number[]): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}

/** Mélange `a` vers `b` (t = 0 → a, t = 1 → b). */
export function blend(a: string, b: string, t: number): string {
  if (!HEX.test(a) || !HEX.test(b)) return a;
  const [x, y] = [rgb(a), rgb(b)];
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
}

export function luminance(hex: string): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = rgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function isLight(hex: string): boolean {
  return HEX.test(hex) && luminance(hex) > 0.45;
}

/** Rapport de contraste WCAG (1 à 21). */
export function contrast(a: string, b: string): number {
  if (!HEX.test(a) || !HEX.test(b)) return 21;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/* ---------- Palettes de départ ---------- */

/** Points de départ : on en choisit une, puis chaque couleur reste modifiable. */
export const PALETTE_PRESETS: Palette[] = [
  { brand: "#1d4ed8", accent: "#60a5fa", surface: "#ffffff", text: "#0f172a" },
  { brand: "#466931", accent: "#6ea03f", surface: "#f7f6f1", text: "#22331b" },
  { brand: "#7a1f2b", accent: "#e0a030", surface: "#fff8f0", text: "#2a1a12" },
  { brand: "#111111", accent: "#d4af37", surface: "#0d0b09", text: "#f5efdc" },
  { brand: "#c2410c", accent: "#fb923c", surface: "#fffaf5", text: "#2b1a10" },
  { brand: "#0f766e", accent: "#2dd4bf", surface: "#f4fbfa", text: "#0b2b28" },
  { brand: "#4c1d95", accent: "#a78bfa", surface: "#faf7ff", text: "#1e1336" },
  { brand: "#18181b", accent: "#f43f5e", surface: "#fafafa", text: "#18181b" },
];

/** Palette par défaut de chaque disposition. */
export const LAYOUT_DEFAULTS: Record<LayoutId, Palette> = {
  classic: { brand: "#1d4ed8", accent: "#60a5fa", surface: "#f8fafc", text: "#0f172a" },
  maps: { brand: "#c2410c", accent: "#fb923c", surface: "#fffaf5", text: "#2b1a10" },
  minimal: { brand: "#18181b", accent: "#a1a1aa", surface: "#ffffff", text: "#18181b" },
  premium: { brand: "#d4af37", accent: "#d4af37", surface: "#0d0b09", text: "#f5efdc" },
  saas: { brand: "#4f46e5", accent: "#818cf8", surface: "#ffffff", text: "#0f172a" },
  exoticas: { brand: "#466931", accent: "#6ea03f", surface: "#f7f6f1", text: "#22331b" },
  // Styles « métier » : ils partent chacun d'une palette propre à leur univers.
  maquis: { brand: "#c81d25", accent: "#f6c200", surface: "#ffffff", text: "#1f3b2d" },
  beaute: { brand: "#3b2620", accent: "#b88a4a", surface: "#f3e3dd", text: "#3b2620" },
  boutique: { brand: "#000000", accent: "#f05a28", surface: "#ffffff", text: "#000000" },
  hotel: { brand: "#23403a", accent: "#a88a5a", surface: "#e7ebe6", text: "#1e2422" },
  clinique: { brand: "#00796b", accent: "#2dd4bf", surface: "#ffffff", text: "#102a2a" },
  chantier: { brand: "#ff6b00", accent: "#ff6b00", surface: "#e4e4df", text: "#2c3036" },
  carte: { brand: "#c81d25", accent: "#17171a", surface: "#ffffff", text: "#17171a" },
};

/** Anciens thèmes nommés → palettes équivalentes (cartes déjà publiées). */
const LEGACY: Record<string, Palette> = {
  "theme-1": { brand: "#d4af37", accent: "#d4af37", surface: "#0d0b09", text: "#fdf8e2" },
  "theme-2": { brand: "#c85a32", accent: "#c85a32", surface: "#fcf8f2", text: "#321d14" },
  "theme-3": { brand: "#2d2a28", accent: "#827a72", surface: "#ffffff", text: "#2d2a28" },
  "theme-4": { brand: "#2c5f43", accent: "#2c5f43", surface: "#f2f7f4", text: "#193626" },
  "theme-5": { brand: "#ef6a22", accent: "#ef6a22", surface: "#13100e", text: "#fff5ec" },
  "theme-6": { brand: "#00ffcc", accent: "#00ffcc", surface: "#000000", text: "#ffffff" },
  "theme-7": { brand: "#0066cc", accent: "#0066cc", surface: "#f0f8ff", text: "#003366" },
  "theme-8": { brand: "#b5835a", accent: "#d4a373", surface: "#fff5f5", text: "#4a3030" },
  "theme-9": { brand: "#ffb300", accent: "#ffb300", surface: "#3e2723", text: "#efebe9" },
  "theme-10": { brand: "#bd93f9", accent: "#bd93f9", surface: "#282a36", text: "#f8f8f2" },
};

/* ---------- Encodage dans `themeId` ---------- */

export function encodePalette(p: Palette): string {
  return `custom#${[p.brand, p.accent, p.surface, p.text].map((h) => h.replace("#", "").toLowerCase()).join("#")}`;
}

export function decodeCustom(themeId?: string | null): Palette | null {
  if (!themeId?.startsWith("custom#")) return null;
  const parts = themeId.split("#").slice(1).map((x) => `#${x}`.toLowerCase());
  if (parts.length < 4 || !parts.slice(0, 4).every((c) => HEX.test(c))) return null;
  const [brand, accent, surface, text] = parts;
  return { brand, accent, surface, text };
}

export function isCustomThemeId(themeId?: string | null): boolean {
  return decodeCustom(themeId) !== null;
}

/** Palette effective d'une carte. */
export function paletteFor(themeId: string | null | undefined, layout: string | null | undefined): Palette {
  const custom = decodeCustom(themeId);
  if (custom) return custom;
  const id = (layout as LayoutId) in LAYOUT_DEFAULTS ? (layout as LayoutId) : "classic";
  if (id !== "exoticas" && themeId && LEGACY[themeId]) return LEGACY[themeId];
  return LAYOUT_DEFAULTS[id];
}

export function samePalette(a: Palette, b: Palette): boolean {
  return encodePalette(a) === encodePalette(b);
}

/* ---------- Teintes dérivées ---------- */

export interface Tones extends Palette {
  /** Texte lisible posé sur `brand`. */
  onBrand: string;
  /** Couleur principale plus profonde (survol, dégradés). */
  brandDeep: string;
  /** Fond des cartes posées sur la page. */
  card: string;
  /** Fond atténué (bandes, champs). */
  soft: string;
  /** Texte secondaire. */
  muted: string;
  /** Liserés. */
  line: string;
  dark: boolean;
}

export function tones(p: Palette): Tones {
  const dark = !isLight(p.surface) && luminance(p.surface) < 0.2;
  const onBrand = isLight(p.brand) ? blend(p.brand, "#000000", 0.82) : "#ffffff";
  return {
    ...p,
    onBrand,
    brandDeep: blend(p.brand, "#000000", 0.18),
    card: dark ? blend(p.surface, "#ffffff", 0.06) : blend(p.surface, "#ffffff", 0.7),
    soft: blend(p.surface, p.brand, dark ? 0.1 : 0.06),
    muted: blend(p.text, p.surface, 0.38),
    line: blend(p.surface, p.text, dark ? 0.16 : 0.11),
    dark,
  };
}

/** Variables CSS communes aux dispositions (`--pg-*`). */
export function paletteVars(p: Palette): Record<string, string> {
  const t = tones(p);
  return {
    "--pg-brand": t.brand,
    "--pg-brand-deep": t.brandDeep,
    "--pg-on-brand": t.onBrand,
    "--pg-accent": t.accent,
    "--pg-surface": t.surface,
    "--pg-card": t.card,
    "--pg-soft": t.soft,
    "--pg-text": t.text,
    "--pg-muted": t.muted,
    "--pg-line": t.line,
  };
}

/** Variables du thème Exoticas (noms d'origine du site). */
export function exoticasVars(p: Palette): Record<string, string> {
  const t = tones(p);
  return {
    "--vert": t.brand,
    "--vert-fonce": blend(t.brand, "#000000", 0.14),
    "--vert-nuit": blend(t.brand, "#000000", 0.28),
    "--vert-accent": t.accent,
    "--creme": t.surface,
    "--texte": t.text,
    "--muted": t.muted,
    "--line": blend(t.surface, t.brand, 0.16),
    "--line-fort": blend(t.surface, t.brand, 0.32),
    "--sur-vert": t.onBrand,
    "--ombre": blend(t.brand, "#000000", 0.7),
  };
}

/** Couleur la plus présente et la plus saturée d'une image (ni blanc, ni noir, ni gris). */
export async function dominantColor(src: string): Promise<string | null> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map<string, { n: number; r: number; g: number; b: number; sat: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 200) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat < 0.25 || max < 40 || min > 225) continue;
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0, sat: 0 };
    bucket.n += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.sat += sat;
    buckets.set(key, bucket);
  }
  let best: { score: number; hex: string } | null = null;
  for (const bucket of buckets.values()) {
    if (bucket.n < 6) continue;
    const score = bucket.n * (0.5 + bucket.sat / bucket.n);
    if (!best || score > best.score) {
      best = { score, hex: toHex([bucket.r / bucket.n, bucket.g / bucket.n, bucket.b / bucket.n]) };
    }
  }
  if (!best) return null;
  return isLight(best.hex) ? blend(best.hex, "#000000", 0.4) : best.hex;
}

/** Palette complète construite autour d'une couleur (logo, marque). */
export function paletteFromColor(brand: string): Palette {
  return {
    brand,
    accent: blend(brand, "#ffffff", 0.35),
    surface: blend(brand, "#ffffff", 0.96),
    text: blend(brand, "#000000", 0.75),
  };
}
