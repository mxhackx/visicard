"use client";

import { Check, RotateCcw, ScanLine, AlertTriangle } from "lucide-react";
import {
  DEFAULT_QR_STYLE,
  QR_CORNERS,
  QR_CORNER_DOTS,
  QR_DOTS,
  QR_PALETTES,
  parseQrStyle,
  qrReadability,
  serializeQrStyle,
  type QrCornerDots,
  type QrCorners,
  type QrDots,
  type QrStyle,
} from "@/lib/qr-style";

const BRAND = { fg: "#c81d25", bg: "#ffffff" };
const PALETTES = [BRAND, ...QR_PALETTES];

/** Trois lignes de trois modules : de quoi reconnaître la forme choisie. */
const CELLS = [
  [0, 0], [1, 0], [2, 0],
  [0, 1], [2, 1],
  [1, 2], [2, 2],
];

function DotShape({ shape, fg }: { shape: QrDots; fg: string }) {
  const s = 9;
  const g = 2.5;
  return (
    <svg viewBox="0 0 36 36" className="h-full w-full" aria-hidden="true">
      {CELLS.map(([cx, cy]) => {
        const x = 3.5 + cx * (s + g);
        const y = 3.5 + cy * (s + g);
        const key = `${cx}${cy}`;
        if (shape === "dots") return <circle key={key} cx={x + s / 2} cy={y + s / 2} r={s / 2 - 0.5} fill={fg} />;
        if (shape === "classy" || shape === "classy-rounded") {
          const r = shape === "classy" ? 4.5 : 3.5;
          const d = `M${x + r} ${y}H${x + s}V${y + s - r}Q${x + s} ${y + s} ${x + s - r} ${y + s}H${x}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
          return <path key={key} d={d} fill={fg} stroke={fg} strokeWidth={shape === "classy" ? 0 : 1} strokeLinejoin="round" />;
        }
        const rx = shape === "square" ? 0 : shape === "rounded" ? 2.2 : 4.2;
        return <rect key={key} x={x} y={y} width={s} height={s} rx={rx} fill={fg} />;
      })}
    </svg>
  );
}

function CornerShape({ outer, inner, fg }: { outer: QrCorners; inner: QrCornerDots; fg: string }) {
  return (
    <svg viewBox="0 0 36 36" className="h-full w-full" aria-hidden="true">
      {outer === "dot" ? (
        <circle cx="18" cy="18" r="13.5" stroke={fg} strokeWidth="4" fill="none" />
      ) : (
        <rect x="4.5" y="4.5" width="27" height="27" rx={outer === "extra-rounded" ? 8 : 0} stroke={fg} strokeWidth="4" fill="none" />
      )}
      {inner === "dot" ? <circle cx="18" cy="18" r="6" fill={fg} /> : <rect x="12" y="12" width="12" height="12" fill={fg} />}
    </svg>
  );
}

function Card({ on, label, onClick, children }: { on: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 rounded-xl border bg-white p-3 text-center transition active:scale-[0.97] ${
        on ? "border-forest ring-2 ring-forest/30" : "border-line hover:border-ink/30"
      }`}
    >
      <span className="block h-12 w-12">{children}</span>
      <span className="text-xs font-medium leading-4 text-ink/80">{label}</span>
      {on && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-forest text-white">
          <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
        </span>
      )}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-sage">{title}</p>
      {children}
    </div>
  );
}

/** Options du QR code présentées en cartes illustrées : formes, coins et couleurs. */
export default function QrStyleCards({ value, onChange }: { value: string; onChange: (qrStyle: string) => void }) {
  const style = parseQrStyle(value);
  const set = (next: Partial<QrStyle>) => onChange(serializeQrStyle({ ...style, ...next }));
  const readability = qrReadability(style);
  const isDefault = serializeQrStyle(style) === serializeQrStyle(DEFAULT_QR_STYLE);

  return (
    <div className="space-y-6">
      <Group title="Couleurs">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7" role="radiogroup">
          {PALETTES.map((p) => {
            const on = p.fg === style.fg && p.bg === style.bg;
            return (
              <button
                key={`${p.fg}${p.bg}`}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`Motif ${p.fg} sur fond ${p.bg}`}
                onClick={() => set(p)}
                className={`relative flex aspect-square items-center justify-center rounded-xl border transition active:scale-95 ${
                  on ? "border-forest ring-2 ring-forest/30" : "border-line hover:border-ink/30"
                }`}
                style={{ backgroundColor: p.bg }}
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
                  <rect x="2" y="2" width="8" height="8" rx="2" fill={p.fg} />
                  <rect x="14" y="2" width="8" height="8" rx="2" fill={p.fg} />
                  <rect x="2" y="14" width="8" height="8" rx="2" fill={p.fg} />
                  <rect x="14" y="14" width="4" height="4" rx="1" fill={p.fg} />
                </svg>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Forme des points">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="radiogroup">
          {QR_DOTS.map((o) => (
            <Card key={o.id} on={style.dots === o.id} label={o.label} onClick={() => set({ dots: o.id })}>
              <DotShape shape={o.id} fg={style.fg} />
            </Card>
          ))}
        </div>
      </Group>

      <div className="grid gap-6 sm:grid-cols-2">
        <Group title="Coins">
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {QR_CORNERS.map((o) => (
              <Card key={o.id} on={style.corners === o.id} label={o.label} onClick={() => set({ corners: o.id })}>
                <CornerShape outer={o.id} inner={style.cornerDots} fg={style.fg} />
              </Card>
            ))}
          </div>
        </Group>
        <Group title="Centre des coins">
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {QR_CORNER_DOTS.map((o) => (
              <Card key={o.id} on={style.cornerDots === o.id} label={o.label} onClick={() => set({ cornerDots: o.id })}>
                <CornerShape outer={style.corners} inner={o.id} fg={style.fg} />
              </Card>
            ))}
          </div>
        </Group>
      </div>

      <Group title="Couleurs personnalisées">
        <div className="grid gap-3 sm:grid-cols-2">
          {([["fg", "Motif"], ["bg", "Fond"]] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5">
              <input
                type="color"
                value={style[key]}
                onChange={(e) => set({ [key]: e.target.value } as Partial<QrStyle>)}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-line bg-transparent p-0.5"
                aria-label={`Couleur du ${label.toLowerCase()}`}
              />
              <span className="min-w-0 text-sm text-ink/80">
                {label}
                <span className="ml-2 font-mono text-xs uppercase text-sage">{style[key]}</span>
              </span>
            </label>
          ))}
        </div>
      </Group>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`flex items-start gap-1.5 text-xs ${!readability.ok ? "font-medium text-red-600" : readability.message ? "text-amber-700" : "text-sage"}`}>
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
          <button type="button" onClick={() => onChange(serializeQrStyle(DEFAULT_QR_STYLE))} className="text-xs font-medium text-sage hover:text-ink">
            <RotateCcw className="mr-1 inline h-3 w-3" /> Style par défaut
          </button>
        )}
      </div>
    </div>
  );
}
