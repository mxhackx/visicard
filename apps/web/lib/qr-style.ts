/**
 * Style d'un QR code : une seule source de vérité, stockée telle quelle dans
 * la colonne `qrStyle` de la carte (JSON). Utilisée par l'aperçu, le
 * téléchargement et l'image générée par l'API (même format, voir
 * apps/api/src/cards/qr-style.ts).
 */

export type QrDots = "square" | "rounded" | "dots" | "classy" | "classy-rounded" | "extra-rounded";
export type QrCorners = "square" | "extra-rounded" | "dot";
export type QrCornerDots = "square" | "dot";

export interface QrStyle {
  v: 1;
  dots: QrDots;
  corners: QrCorners;
  cornerDots: QrCornerDots;
  /** Couleur des modules. */
  fg: string;
  /** Couleur du fond. */
  bg: string;
  /** Logo de l'établissement au centre (pages digitales avec logo). */
  logo: boolean;
}

export const DEFAULT_QR_STYLE: QrStyle = {
  v: 1,
  dots: "rounded",
  corners: "extra-rounded",
  cornerDots: "dot",
  fg: "#111827",
  bg: "#ffffff",
  logo: true,
};

export const QR_DOTS: { id: QrDots; label: string }[] = [
  { id: "square", label: "Carrés" },
  { id: "rounded", label: "Arrondis" },
  { id: "extra-rounded", label: "Très arrondis" },
  { id: "dots", label: "Points" },
  { id: "classy", label: "Élégant" },
  { id: "classy-rounded", label: "Élégant arrondi" },
];

export const QR_CORNERS: { id: QrCorners; label: string }[] = [
  { id: "square", label: "Carrés" },
  { id: "extra-rounded", label: "Arrondis" },
  { id: "dot", label: "Ronds" },
];

export const QR_CORNER_DOTS: { id: QrCornerDots; label: string }[] = [
  { id: "square", label: "Carré" },
  { id: "dot", label: "Rond" },
];

/** Paires de couleurs de départ, toutes lisibles par les lecteurs de QR. */
export const QR_PALETTES: { fg: string; bg: string }[] = [
  { fg: "#111827", bg: "#ffffff" },
  { fg: "#1d4ed8", bg: "#ffffff" },
  { fg: "#0f5132", bg: "#f3faf5" },
  { fg: "#7a1f2b", bg: "#fff8f0" },
  { fg: "#4c1d95", bg: "#faf7ff" },
  { fg: "#0f172a", bg: "#fde68a" },
];

const HEX = /^#[0-9a-f]{6}$/i;

/** Anciennes valeurs (`style-1`…`style-5`) → couleurs équivalentes. */
const LEGACY: Record<string, { fg: string; bg: string }> = {
  "style-1": { fg: "#181411", bg: "#ffffff" },
  "style-2": { fg: "#ef6a22", bg: "#ffffff" },
  "style-3": { fg: "#d4af37", bg: "#0f0d0c" },
  "style-4": { fg: "#2d3748", bg: "#f8fafc" },
  "style-5": { fg: "#065f46", bg: "#f0fdf4" },
};

const pick = <T extends string>(value: unknown, allowed: readonly { id: T }[], fallback: T): T =>
  allowed.some((a) => a.id === value) ? (value as T) : fallback;

/** Lit n'importe quelle valeur enregistrée (JSON actuel, ancien studio, `style-N`) sans jamais échouer. */
export function parseQrStyle(raw?: string | null): QrStyle {
  if (!raw) return DEFAULT_QR_STYLE;
  if (LEGACY[raw]) return { ...DEFAULT_QR_STYLE, dots: "square", corners: "square", cornerDots: "square", ...LEGACY[raw] };
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return DEFAULT_QR_STYLE;
  }
  if (!data || typeof data !== "object") return DEFAULT_QR_STYLE;
  // Ancien studio : { color, dotsType, cornersType }
  const fg = typeof data.fg === "string" ? data.fg : typeof data.color === "string" ? data.color : "";
  const bg = typeof data.bg === "string" ? data.bg : "";
  return {
    v: 1,
    dots: pick(data.dots ?? data.dotsType, QR_DOTS, DEFAULT_QR_STYLE.dots),
    corners: pick(data.corners ?? data.cornersType, QR_CORNERS, DEFAULT_QR_STYLE.corners),
    cornerDots: pick(data.cornerDots, QR_CORNER_DOTS, DEFAULT_QR_STYLE.cornerDots),
    fg: HEX.test(fg) ? fg.toLowerCase() : DEFAULT_QR_STYLE.fg,
    bg: HEX.test(bg) ? bg.toLowerCase() : DEFAULT_QR_STYLE.bg,
    logo: typeof data.logo === "boolean" ? data.logo : DEFAULT_QR_STYLE.logo,
  };
}

export function serializeQrStyle(style: QrStyle): string {
  const { v, dots, corners, cornerDots, fg, bg, logo } = style;
  return JSON.stringify({ v, dots, corners, cornerDots, fg, bg, logo });
}

function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Lisibilité par un lecteur de QR : contraste suffisant, et modules plus foncés
 * que le fond (beaucoup d'appareils ne lisent pas les QR inversés).
 */
export function qrReadability(style: Pick<QrStyle, "fg" | "bg">): { ok: boolean; message?: string } {
  const fg = luminance(style.fg);
  const bg = luminance(style.bg);
  const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
  if (fg > bg) return { ok: false, message: "Le motif est plus clair que le fond : beaucoup de téléphones ne le liront pas." };
  if (ratio < 3.5) return { ok: false, message: "Contraste trop faible : le QR code risque de ne pas être lu." };
  if (ratio < 5) return { ok: true, message: "Contraste juste : testez le scan avant d’imprimer." };
  return { ok: true };
}
