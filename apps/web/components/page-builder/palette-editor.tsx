"use client";

import { useState } from "react";
import { AlertTriangle, Check, RotateCcw, Wand2 } from "lucide-react";
import {
  LAYOUT_DEFAULTS,
  PALETTE_PRESETS,
  contrast,
  dominantColor,
  encodePalette,
  isCustomThemeId,
  isHex,
  paletteFor,
  paletteFromColor,
  samePalette,
  tones,
  type LayoutId,
  type Palette,
} from "@/lib/palette";

const FIELDS: { key: keyof Palette; label: string; hint: string }[] = [
  { key: "brand", label: "Principale", hint: "Bandeaux, boutons" },
  { key: "accent", label: "Accent", hint: "Filets, détails" },
  { key: "surface", label: "Fond", hint: "Fond de la page" },
  { key: "text", label: "Texte", hint: "Titres, paragraphes" },
];

/**
 * Couleurs de la page : une palette de départ, puis chaque couleur reste libre.
 * La valeur est la chaîne `themeId` (`custom#…`) ; vide = palette de la disposition.
 */
export default function PaletteEditor({
  themeId,
  layout,
  logoUrl,
  onChange,
}: {
  themeId: string;
  layout: LayoutId;
  logoUrl?: string;
  onChange: (themeId: string) => void;
}) {
  const palette = paletteFor(themeId, layout);
  const layoutDefault = LAYOUT_DEFAULTS[layout];
  const custom = isCustomThemeId(themeId) && !samePalette(palette, layoutDefault);
  const [extracting, setExtracting] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const apply = (p: Palette) => onChange(samePalette(p, layoutDefault) ? "" : encodePalette(p));
  const update = (next: Partial<Palette>) => apply({ ...palette, ...next });

  const fromLogo = async () => {
    if (!logoUrl) return;
    setExtracting(true);
    setLogoError(null);
    try {
      const color = await dominantColor(logoUrl);
      if (color) apply(paletteFromColor(color));
      else setLogoError("Le logo n’a pas de couleur assez marquée : choisissez-la à la main.");
    } catch {
      setLogoError("Lecture du logo impossible.");
    } finally {
      setExtracting(false);
    }
  };

  const t = tones(palette);
  const textOk = contrast(palette.text, palette.surface) >= 4.5;
  const brandOk = contrast(t.onBrand, palette.brand) >= 3;
  const presets = [layoutDefault, ...PALETTE_PRESETS.filter((p) => !samePalette(p, layoutDefault))];

  return (
    <div className="mt-5 space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-sage">Palettes de départ</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Palettes de départ">
          {presets.map((p, i) => {
            const on = samePalette(p, palette);
            return (
              <button
                key={encodePalette(p)}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => apply(p)}
                className={`group relative overflow-hidden rounded-xl border p-1 transition ${on ? "border-forest ring-2 ring-ambre/30" : "border-line hover:border-ambre/60"}`}
                aria-label={i === 0 ? "Palette d’origine de la disposition" : `Palette ${i}`}
              >
                <span className="flex h-12 overflow-hidden rounded-lg" style={{ backgroundColor: p.surface }}>
                  <span className="w-1/2" style={{ backgroundColor: p.brand }} />
                  <span className="flex w-1/2 flex-col items-center justify-center gap-1">
                    <span className="h-1.5 w-6 rounded-full" style={{ backgroundColor: p.text }} />
                    <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: p.accent }} />
                  </span>
                </span>
                {i === 0 && <span className="mt-1 block text-[10px] font-semibold text-sage">D’origine</span>}
                {on && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-forest shadow">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-sage">Ajuster chaque couleur</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <ColorField key={f.key} label={f.label} hint={f.hint} value={palette[f.key]} onChange={(hex) => update({ [f.key]: hex })} />
          ))}
        </div>
      </div>

      {(!textOk || !brandOk) && (
        <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {!textOk
            ? "Le texte se lit mal sur ce fond : foncez le texte ou éclaircissez le fond (ou l’inverse)."
            : "Le texte des boutons se lit mal sur la couleur principale : choisissez-la plus foncée ou plus claire."}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={fromLogo} disabled={!logoUrl || extracting} className="btn btn-outline btn-sm">
          <Wand2 className="h-4 w-4" />
          {extracting ? "Analyse du logo…" : "Partir des couleurs du logo"}
        </button>
        {custom && (
          <button type="button" onClick={() => onChange("")} className="btn btn-outline btn-sm">
            <RotateCcw className="h-4 w-4" /> Palette d’origine
          </button>
        )}
      </div>
      {!logoUrl && <p className="text-xs text-sage">Ajoutez un logo à l’étape Informations pour en reprendre les couleurs.</p>}
      {logoError && <p className="text-xs font-medium text-red-600">{logoError}</p>}
    </div>
  );
}

function ColorField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setDraft(value);
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-2.5">
      <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-line" style={{ backgroundColor: value }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={label}
        />
      </label>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink/90">{label}</p>
        <p className="truncate text-xs text-sage">{hint}</p>
      </div>
      <input
        className="field h-9 w-[6.25rem] shrink-0 px-2 py-1 font-mono text-xs uppercase"
        value={draft}
        maxLength={7}
        spellCheck={false}
        onChange={(e) => {
          const next = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
          setDraft(next);
          if (isHex(next)) onChange(next.toLowerCase());
        }}
        onBlur={() => setDraft(value)}
        aria-label={`${label}, code hexadécimal`}
      />
    </div>
  );
}
