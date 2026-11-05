/**
 * Style d'un QR code, au même format que le front (apps/web/lib/qr-style.ts) :
 * JSON `{ v, dots, corners, cornerDots, fg, bg, logo }` dans la colonne `qrStyle`.
 * L'API ne sait dessiner que les couleurs (bibliothèque `qrcode`) ; les formes
 * sont rendues par le navigateur.
 */
export interface QrStyle {
  v: 1;
  dots: string;
  corners: string;
  cornerDots: string;
  fg: string;
  bg: string;
  logo: boolean;
}

const DOTS = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'];
const CORNERS = ['square', 'extra-rounded', 'dot'];
const CORNER_DOTS = ['square', 'dot'];
const HEX = /^#[0-9a-f]{6}$/i;

export const DEFAULT_QR_STYLE: QrStyle = {
  v: 1,
  dots: 'rounded',
  corners: 'extra-rounded',
  cornerDots: 'dot',
  fg: '#111827',
  bg: '#ffffff',
  logo: true,
};

const LEGACY: Record<string, { fg: string; bg: string }> = {
  'style-1': { fg: '#181411', bg: '#ffffff' },
  'style-2': { fg: '#ef6a22', bg: '#ffffff' },
  'style-3': { fg: '#d4af37', bg: '#0f0d0c' },
  'style-4': { fg: '#2d3748', bg: '#f8fafc' },
  'style-5': { fg: '#065f46', bg: '#f0fdf4' },
};

const pick = (value: unknown, allowed: string[], fallback: string) =>
  typeof value === 'string' && allowed.includes(value) ? value : fallback;

/** Lit toute valeur enregistrée (JSON, ancien studio, `style-N`) sans jamais échouer. */
export function parseQrStyle(raw?: string | null): QrStyle {
  if (!raw) return DEFAULT_QR_STYLE;
  if (LEGACY[raw]) {
    return { ...DEFAULT_QR_STYLE, dots: 'square', corners: 'square', cornerDots: 'square', ...LEGACY[raw] };
  }
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return DEFAULT_QR_STYLE;
  }
  if (!data || typeof data !== 'object') return DEFAULT_QR_STYLE;
  const fg = typeof data.fg === 'string' ? data.fg : typeof data.color === 'string' ? data.color : '';
  const bg = typeof data.bg === 'string' ? data.bg : '';
  return {
    v: 1,
    dots: pick(data.dots ?? data.dotsType, DOTS, DEFAULT_QR_STYLE.dots),
    corners: pick(data.corners ?? data.cornersType, CORNERS, DEFAULT_QR_STYLE.corners),
    cornerDots: pick(data.cornerDots, CORNER_DOTS, DEFAULT_QR_STYLE.cornerDots),
    fg: HEX.test(fg) ? fg.toLowerCase() : DEFAULT_QR_STYLE.fg,
    bg: HEX.test(bg) ? bg.toLowerCase() : DEFAULT_QR_STYLE.bg,
    logo: typeof data.logo === 'boolean' ? data.logo : DEFAULT_QR_STYLE.logo,
  };
}

/** Valeur normalisée à enregistrer : seuls les champs connus, valeurs validées. */
export function normalizeQrStyle(raw?: string | null): string {
  const { v, dots, corners, cornerDots, fg, bg, logo } = parseQrStyle(raw);
  return JSON.stringify({ v, dots, corners, cornerDots, fg, bg, logo });
}

function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Couleurs sûres pour l'image PNG : un QR illisible retombe sur noir sur blanc. */
export function printableColors(style: QrStyle): { dark: string; light: string } {
  const fg = luminance(style.fg);
  const bg = luminance(style.bg);
  const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
  if (fg > bg || ratio < 3.5) return { dark: '#111827', light: '#ffffff' };
  return { dark: style.fg, light: style.bg };
}
