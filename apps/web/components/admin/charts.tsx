"use client";

import { useState } from "react";

/* ------------------------------------------------------------------
   Graphiques du tableau de bord : une seule série à la fois, une seule
   teinte (l'accent du site), barres fines arrondies côté valeur,
   info-bulle au survol / au focus, axes discrets.
------------------------------------------------------------------ */

export interface BarDatum {
  /** Libellé court sous l'axe (affiché pour quelques barres seulement). */
  label: string;
  /** Libellé complet dans l'info-bulle. */
  title: string;
  value: number;
  /** Valeur formatée pour l'info-bulle. */
  display: string;
}

/** Histogramme vertical d'une série (temps en abscisse). */
export function BarChart({
  data,
  height = 160,
  labelEvery = 1,
  ariaLabel,
}: {
  data: BarDatum[];
  height?: number;
  /** N'affiche qu'un libellé d'abscisse sur N (séries longues). */
  labelEvery?: number;
  ariaLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const active = hover !== null ? data[hover] : null;

  return (
    <figure className="m-0" aria-label={ariaLabel}>
      <div className="relative" style={{ height }}>
        {/* repères : ligne de base + mi-hauteur, très discrets */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line/70" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-line" />
        <div className="absolute inset-0 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
          {data.map((d, i) => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${d.title} : ${d.display}`}
              className="group relative flex h-full min-w-0 flex-1 items-end justify-center outline-none"
            >
              <span
                className={`block w-full max-w-[28px] rounded-t-[4px] transition-colors ${
                  hover === null || hover === i ? "bg-forest" : "bg-forest/35"
                } ${d.value === 0 ? "bg-line" : ""}`}
                style={{ height: d.value === 0 ? 2 : `${Math.max(3, (d.value / max) * 100)}%` }}
              />
            </button>
          ))}
        </div>
        {active && hover !== null && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg"
            style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
          >
            <span className="block text-white/70">{active.title}</span>
            <span className="font-semibold">{active.display}</span>
          </div>
        )}
      </div>
      <div className="mt-2 flex gap-[2px] text-[11px] text-sage">
        {data.map((d, i) => (
          <span key={i} className="min-w-0 flex-1 truncate text-center">
            {i % labelEvery === 0 || i === data.length - 1 ? d.label : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Répartition en barres horizontales (une teinte, valeur et part en texte). */
export function MeterList({ items }: { items: { label: string; value: number }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return <p className="text-sm text-sage">Aucune donnée pour l’instant.</p>;
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const share = Math.round((item.value / total) * 100);
        return (
          <li key={item.label}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-ink/85">{item.label}</span>
              <span className="tabular-nums text-sage">
                <span className="font-semibold text-ink/90">{item.value}</span> · {share} %
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-deep">
              <div className="h-full rounded-full bg-forest" style={{ width: `${share}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
