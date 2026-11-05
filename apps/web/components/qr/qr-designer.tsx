"use client";

import { useState } from "react";
import { AlertTriangle, Check, ImageIcon, RotateCcw, ScanLine } from "lucide-react";
import StyledQr from "./styled-qr";
import {
  DEFAULT_QR_STYLE,
  QR_CORNERS,
  QR_CORNER_DOTS,
  QR_DOTS,
  QR_PALETTES,
  parseQrStyle,
  qrReadability,
  serializeQrStyle,
  type QrStyle,
} from "@/lib/qr-style";

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Personnalisation du QR code, identique pour les pages, les médias et les documents.
 * La valeur est la chaîne JSON enregistrée dans `qrStyle`.
 */
export default function QrDesigner({
  value,
  onChange,
  data = "https://moncode.bj/c/apercu",
  logoUrl,
  brandColor,
  downloadName,
}: {
  value: string | null | undefined;
  onChange: (qrStyle: string) => void;
  /** Adresse encodée dans l'aperçu (l'adresse définitive est connue après création). */
  data?: string;
  logoUrl?: string | null;
  /** Couleur principale de la page, proposée en raccourci. */
  brandColor?: string | null;
  /** Affiche les boutons PNG / SVG sous l'aperçu. */
  downloadName?: string;
}) {
  const style = parseQrStyle(value);
  const set = (next: Partial<QrStyle>) => onChange(serializeQrStyle({ ...style, ...next }));
  const readability = qrReadability(style);
  const isDefault = serializeQrStyle(style) === serializeQrStyle(DEFAULT_QR_STYLE);

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,260px)_1fr]">
      <div className="flex flex-col items-center">
        <div className="surface-soft w-full p-5">
          <StyledQr data={data} style={style} logoUrl={logoUrl} size={210} downloadName={downloadName} />
        </div>
        <p
          className={`mt-3 flex items-start gap-1.5 text-center text-xs ${
            !readability.ok ? "font-medium text-red-600" : readability.message ? "text-amber-700" : "text-sage"
          }`}
        >
          {readability.message ? (
            <>
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {readability.message}
            </>
          ) : (
            <>
              <ScanLine className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Bon contraste : lisible par tous les téléphones.
            </>
          )}
        </p>
        {!isDefault && (
          <button type="button" onClick={() => onChange(serializeQrStyle(DEFAULT_QR_STYLE))} className="mt-2 text-xs font-medium text-sage hover:text-ink">
            <RotateCcw className="mr-1 inline h-3 w-3" /> Style par défaut
          </button>
        )}
      </div>

      <div className="min-w-0 space-y-5">
        <Group label="Couleurs">
          <div className="flex flex-wrap gap-2">
            {QR_PALETTES.map((p) => {
              const on = p.fg === style.fg && p.bg === style.bg;
              return (
                <button
                  key={`${p.fg}${p.bg}`}
                  type="button"
                  onClick={() => set(p)}
                  aria-label={`Motif ${p.fg} sur fond ${p.bg}`}
                  aria-pressed={on}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition ${
                    on ? "ring-2 ring-forest" : "ring-line hover:ring-ambre/60"
                  }`}
                  style={{ backgroundColor: p.bg }}
                >
                  <span className="h-4 w-4 rounded-[5px]" style={{ backgroundColor: p.fg }} />
                </button>
              );
            })}
            {brandColor && HEX.test(brandColor) && (
              <button
                type="button"
                onClick={() => set({ fg: brandColor.toLowerCase(), bg: "#ffffff" })}
                className="btn btn-outline btn-sm h-10"
              >
                <span className="h-3.5 w-3.5 rounded" style={{ backgroundColor: brandColor }} /> Couleur de la page
              </button>
            )}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <ColorInput label="Motif" value={style.fg} onChange={(fg) => set({ fg })} />
            <ColorInput label="Fond" value={style.bg} onChange={(bg) => set({ bg })} />
          </div>
        </Group>

        <Group label="Motif des points">
          <Chips options={QR_DOTS} value={style.dots} onChange={(dots) => set({ dots })} />
        </Group>

        <div className="grid gap-5 sm:grid-cols-2">
          <Group label="Coins">
            <Chips options={QR_CORNERS} value={style.corners} onChange={(corners) => set({ corners })} />
          </Group>
          <Group label="Centre des coins">
            <Chips options={QR_CORNER_DOTS} value={style.cornerDots} onChange={(cornerDots) => set({ cornerDots })} />
          </Group>
        </div>

        <label className={`flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 ${logoUrl ? "cursor-pointer" : "opacity-60"}`}>
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--color-forest)]"
            checked={style.logo && Boolean(logoUrl)}
            disabled={!logoUrl}
            onChange={(e) => set({ logo: e.target.checked })}
          />
          <ImageIcon className="h-4 w-4 text-forest" />
          <span className="text-sm text-ink/85">
            Logo au centre
            <span className="block text-xs text-sage">
              {logoUrl ? "Le QR code reste lisible : sa correction d’erreur est renforcée." : "Disponible lorsqu’un logo est fourni."}
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-sage">{label}</p>
      {children}
    </div>
  );
}

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
              on ? "border-forest bg-forest text-white" : "border-line bg-white text-ink/75 hover:border-ambre/60 hover:text-forest"
            }`}
          >
            {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setDraft(value);
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-2.5">
      <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-line" style={{ backgroundColor: value }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`Couleur : ${label}`}
        />
      </label>
      <span className="flex-1 text-sm font-medium text-ink/85">{label}</span>
      <input
        className="field h-9 w-[6.5rem] px-2 py-1 font-mono text-xs uppercase"
        value={draft}
        maxLength={7}
        spellCheck={false}
        onChange={(e) => {
          const next = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
          setDraft(next);
          if (HEX.test(next)) onChange(next.toLowerCase());
        }}
        onBlur={() => setDraft(value)}
        aria-label={`${label}, code hexadécimal`}
      />
    </div>
  );
}
