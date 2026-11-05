"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { BrandIcon, DAYS, EmptyImage, Lightbox, todayId, useCardData, useOpenStatus, type CardThemeProps } from "./kit";

/**
 * Avant-garde : éditorial, grandes capitales, sections numérotées, galerie
 * asymétrique. Pensé pour une palette sombre, mais suit n'importe quelle palette.
 */
export default function AvantGardeTheme(props: CardThemeProps) {
  const d = useCardData(props);
  const status = useOpenStatus(props.schedule);
  const [viewer, setViewer] = useState<number | null>(null);
  const today = todayId();
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  return (
    <div className="@container min-h-full bg-[var(--pg-surface)] text-[var(--pg-text)]">
      {/* Ouverture */}
      <section className="relative overflow-hidden">
        {d.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[color-mix(in_srgb,var(--pg-surface)_40%,transparent)] to-[var(--pg-surface)]" />
        <div className="relative mx-auto flex min-h-[460px] max-w-6xl flex-col justify-between px-6 py-8 @3xl:min-h-[620px] @3xl:px-12 @3xl:py-12">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em]">
            <span className="flex items-center gap-3">
              {props.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={props.logoUrl} alt="" className="h-9 w-9 rounded-full bg-white object-contain p-1" />
              )}
              {d.tagline ?? "Carte"}
            </span>
            {status && <span className="text-[var(--pg-accent)]">{status.open ? "Ouvert" : "Fermé"}</span>}
          </div>
          <div>
            <div className="mb-6 h-px w-16 bg-[var(--pg-accent)]" />
            <h1 className="text-[clamp(2.6rem,13cqw,8rem)] font-black uppercase leading-[0.86] tracking-[-0.04em]">{d.name}</h1>
            {d.lines[0] && <p className="mt-6 max-w-md text-base leading-7 text-[var(--pg-muted)] @3xl:text-lg">{d.lines[0]}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={d.href(d.whatsapp)}
                target={d.target}
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[var(--pg-brand)] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--pg-on-brand)] transition-opacity hover:opacity-90"
              >
                <BrandIcon id="whatsapp" className="h-4 w-4" /> Réserver
              </a>
              {props.locationUrl && (
                <a
                  href={d.href(props.locationUrl)}
                  target={d.target}
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-[var(--pg-line)] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em]"
                >
                  Itinéraire <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-16 @3xl:px-12">
        <Section num={num()} title="La carte">
          <div className="grid gap-4 @2xl:grid-cols-2">
            {props.menuImages.length
              ? props.menuImages.map((src, i) => (
                  <button key={src} type="button" onClick={() => setViewer(i)} className="group relative overflow-hidden text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Menu, page ${i + 1}`} className="w-full transition-transform duration-500 group-hover:scale-[1.02]" />
                    <span className="absolute left-3 top-3 bg-[var(--pg-surface)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </button>
                ))
              : <EmptyImage label="Photos du menu" className="aspect-[3/4]" />}
          </div>
        </Section>

        {d.photos.length > 0 && (
          <Section num={num()} title="Le lieu">
            <div className="grid grid-cols-6 gap-3">
              {d.photos.slice(0, 5).map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt={`Photo ${i + 1}`}
                  className={`h-full w-full object-cover ${["col-span-6 aspect-[16/9] @3xl:col-span-4", "col-span-3 aspect-square @3xl:col-span-2", "col-span-3 aspect-square @3xl:col-span-2", "col-span-3 aspect-square @3xl:col-span-2", "col-span-3 aspect-square @3xl:col-span-2"][i]}`}
                />
              ))}
            </div>
          </Section>
        )}

        {(d.lines.length > 1 || props.schedule || props.address) && (
          <Section num={num()} title="Infos">
            <div className="grid gap-10 @3xl:grid-cols-2">
              {props.schedule && (
                <dl className="space-y-3 text-sm uppercase tracking-[0.12em]">
                  {DAYS.map((day) => {
                    const h = props.schedule?.[day.id];
                    return (
                      <div key={day.id} className={`flex justify-between border-b border-[var(--pg-line)] pb-3 ${day.id === today ? "text-[var(--pg-accent)]" : ""}`}>
                        <dt>{day.label}</dt>
                        <dd>{h?.isOpen ? `${h.open} — ${h.close}` : "Fermé"}</dd>
                      </div>
                    );
                  })}
                </dl>
              )}
              <div className="space-y-5 text-[15px] leading-7">
                {d.lines.slice(1).map((l, i) => (
                  <p key={i} className="text-[var(--pg-muted)]">{l}</p>
                ))}
                {props.address && <p className="text-xl font-bold uppercase leading-tight tracking-tight">{props.address}</p>}
                {d.phoneLabel && <p className="text-sm tracking-[0.12em]">{d.phoneLabel}</p>}
                {d.socials.length > 0 && (
                  <div className="flex gap-4 pt-2">
                    {d.socials.map((s) => (
                      <a key={s.id} href={d.href(s.href)} target={d.target} rel="noreferrer" aria-label={s.label} className="text-[var(--pg-accent)] hover:opacity-80">
                        <BrandIcon id={s.id} className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Section>
        )}
      </div>

      <footer className="border-t border-[var(--pg-line)] px-6 py-6 text-center text-[10px] uppercase tracking-[0.3em] text-[var(--pg-muted)]">
        {d.name}
      </footer>
      <Lightbox images={props.menuImages} index={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--pg-line)] pt-8 [&:not(:first-child)]:mt-16 first:mt-4">
      <div className="mb-8 flex items-baseline gap-4">
        <span className="text-xs font-bold text-[var(--pg-accent)]">{num}</span>
        <h2 className="text-3xl font-black uppercase tracking-[-0.03em] @3xl:text-5xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}
