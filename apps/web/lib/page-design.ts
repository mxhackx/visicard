/**
 * Palettes de la page digitale (design repris du site Exoticas).
 *
 * Le modèle `Card` de l'API ne possède qu'une colonne texte `themeId` : la
 * palette y est donc encodée, sans migration de base.
 *   - `"exoticas-vert"` … → une palette prête, identifiante ;
 *   - `"custom#466931#6EA03F#F7F6F1#22331B"` → palette personnalisée (marque,
 *     accent, fond, texte). Les deux couleurs suivantes sont dérivées.
 * Toute valeur inconnue (y compris les anciens `theme-1`…`theme-10`) retombe
 * sur la première palette : la page reste lisible, jamais cassée.
 */

export interface Palette {
  id: string;
  name: string;
  /** Fond des bandes pleines (hero, footer, boutons primaires). */
  brand: string;
  /** Filet, puces, survols. */
  accent: string;
  /** Fond clair de la page. */
  surface: string;
  /** Texte principal. */
  text: string;
}

export const PAGE_PALETTES: Palette[] = [
  { id: "exoticas-vert", name: "Vert Exoticas", brand: "#466931", accent: "#6EA03F", surface: "#F7F6F1", text: "#22331B" },
  { id: "moncode-rouge", name: "Rouge Moncode", brand: "#17171A", accent: "#FB0520", surface: "#FFFFFF", text: "#1A1A1D" },
  { id: "nuit", name: "Bleu nuit", brand: "#16243A", accent: "#3F72AF", surface: "#F5F7FA", text: "#14202F" },
  { id: "terre", name: "Terre cuite", brand: "#7A3B2E", accent: "#C8703A", surface: "#FBF6F1", text: "#33201A" },
  { id: "ardoise", name: "Ardoise", brand: "#2E3440", accent: "#7C8AA0", surface: "#F4F5F7", text: "#22262E" },
  { id: "olive", name: "Olive", brand: "#55603A", accent: "#8FA84F", surface: "#F7F7F1", text: "#282D1C" },
];

export const DEFAULT_PALETTE = PAGE_PALETTES[0];

const HEX = /^#([0-9a-f]{6})$/i;

/** #466931 → 0.27… (luminance relative, pour choisir blanc ou noir dessus) */
function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function isLight(hex: string): boolean {
  return HEX.test(hex) && luminance(hex) > 0.45;
}

/** Assombrit (`factor` < 1) ou éclaire (`factor` > 1) un hex. */
export function shade(hex: string, factor: number): string {
  if (!HEX.test(hex)) return hex;
  const c = hex.replace("#", "");
  const out = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16))
    .map((v) => Math.max(0, Math.min(255, Math.round(factor < 1 ? v * factor : v + (255 - v) * (factor - 1)))))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
  return `#${out}`;
}

/** Mélange un hex avec du blanc ou du noir pour obtenir un fond pâle ou liseré. */
export function mix(hex: string, withWhite: boolean, amount: number): string {
  if (!HEX.test(hex)) return hex;
  const c = hex.replace("#", "");
  const target = withWhite ? 255 : 0;
  const out = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16))
    .map((v) => Math.round(v + (target - v) * amount))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
  return `#${out}`;
}

export interface ResolvedPalette extends Palette {
  brandDark: string;
  brandNight: string;
  muted: string;
  line: string;
  /** Blanc ou texte foncé : ce qui reste lisible posé sur `brand`. */
  onBrand: string;
  onSurface: string;
}

export function resolve(p: Palette): ResolvedPalette {
  return {
    ...p,
    brandDark: shade(p.brand, 0.86),
    brandNight: shade(p.brand, 0.72),
    muted: mix(p.text, true, 0.42),
    line: mix(p.brand, true, 0.74),
    onBrand: isLight(p.brand) ? p.text : "#ffffff",
    onSurface: p.text,
  };
}

/** `themeId` → palette. Préséance à l'encodage `custom#…`. */
export function paletteFromThemeId(themeId?: string | null): ResolvedPalette {
  const p = decodeThemeId(themeId);
  return resolve(p);
}

export function decodeThemeId(themeId?: string | null): Palette {
  if (!themeId) return DEFAULT_PALETTE;
  const preset = PAGE_PALETTES.find((x) => x.id === themeId);
  if (preset) return preset;
  if (themeId.startsWith("custom#")) {
    const parts = themeId.split("#").slice(1);
    const clean = parts.map((x) => `#${x}`.toLowerCase());
    if (clean.length >= 4 && clean.every((c) => HEX.test(c))) {
      return { id: themeId, name: "Personnalisée", brand: clean[0], accent: clean[1], surface: clean[2], text: clean[3] };
    }
  }
  return DEFAULT_PALETTE;
}

export function encodeThemeId(p: Palette): string {
  if (PAGE_PALETTES.some((x) => x.id === p.id)) return p.id;
  return `custom#${[p.brand, p.accent, p.surface, p.text].map((hex) => hex.replace("#", "").toLowerCase()).join("#")}`;
}

/** Rapport de contraste WCAG entre deux hex (1 à 21). */
export function contrast(a: string, b: string): number {
  if (!HEX.test(a) || !HEX.test(b)) return 21;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function isCustomThemeId(themeId?: string | null): boolean {
  return Boolean(themeId?.startsWith("custom#")) && decodeThemeId(themeId).id === themeId;
}

/**
 * Variables CSS du thème Exoticas pour une palette personnalisée.
 * `undefined` hors palette personnalisée : le thème garde ses couleurs d'origine.
 */
export function exoticasVars(themeId?: string | null): Record<string, string> | undefined {
  if (!isCustomThemeId(themeId)) return undefined;
  const p = resolve(decodeThemeId(themeId));
  return {
    "--vert": p.brand,
    "--vert-fonce": p.brandDark,
    "--vert-nuit": p.brandNight,
    "--vert-accent": p.accent,
    "--creme": p.surface,
    "--texte": p.text,
    "--muted": p.muted,
    "--line": p.line,
    "--line-fort": mix(p.brand, true, 0.55),
    "--sur-vert": p.onBrand,
    "--ombre": shade(p.brand, 0.3),
  };
}

/* ------------------------------------------------------------------
   Les textes et visuels éditables de la page digitale.
------------------------------------------------------------------ */

export interface PageContent {
  /** Nom affiché (mot-cadre + pied de page). */
  brandName: string;
  /** Signature sous le nom, en petites capitales. */
  signature: string;
  /** Titre du hero. */
  headline: string;
  /** Paragraphe sous le titre. */
  lede: string;
  adresseCourte: string;
  adresseLongue: string;
  tel: string;
  whatsapp: string;
  email: string;
  horaires: string;
  messageWa: string;
  titreGalerie: string;
  ledeGalerie: string;
  titreContact: string;
  ledeContact: string;
  ctaPrimaire: string;
  ctaSecondaire: string;
  logoUrl: string;
  heroImageUrl: string;
  /** Galerie : une image + sa légende. */
  gallery: { src: string; caption: string }[];
  reseaux: { label: string; url: string }[];
  lat: number | null;
  lng: number | null;
}

export const PAGE_DEFAULTS: Pick<
  PageContent,
  "signature" | "titreGalerie" | "ledeGalerie" | "titreContact" | "ledeContact" | "ctaPrimaire" | "ctaSecondaire" | "messageWa"
> = {
  signature: "Moncode",
  titreGalerie: "Galerie",
  ledeGalerie: "",
  titreContact: "Contact",
  ledeContact: "Écrivez-nous : votre message s'ouvre dans WhatsApp, on vous répond rapidement.",
  ctaPrimaire: "Nous écrire",
  ctaSecondaire: "Voir la galerie",
  messageWa: "Bonjour, j'aimerais avoir des informations.",
};

/** Récupère `lat`,lng` depuis un lien Google Maps (ou `@lat,lng`). */
export function coordsFromUrl(url?: string | null): { lat: number; lng: number } | null {
  if (!url) return null;
  const m = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ?? url.match(/[?&](?:q|destination)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

/** `0153300000` → `01 53 30 00 00` ; laisse tel quel si la forme surprend. */
export function formatTel(v: string): string {
  const d = v.replace(/\D/g, "");
  if (d.length !== 10) return v.trim();
  return d.replace(/(\d{2})(?=(?:\d{2})+$)/g, "$1 ").trim();
}
