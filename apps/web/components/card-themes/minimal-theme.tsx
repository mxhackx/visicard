"use client";

import { useState } from "react";
import { BrandIcon, DAYS, EmptyImage, Lightbox, todayId, useCardData, useOpenStatus, type CardThemeProps } from "./kit";

/** Minimaliste : typographique, centré, beaucoup d'air ; le menu avant tout. */
export default function MinimalTheme(props: CardThemeProps) {
  const d = useCardData(props);
  const status = useOpenStatus(props.schedule);
  const [viewer, setViewer] = useState<number | null>(null);
  const today = todayId();
  const links = [
    d.whatsapp && { label: "WhatsApp", href: d.whatsapp },
    d.tel && { label: "Appeler", href: d.tel },
    props.locationUrl && { label: "Itinéraire", href: props.locationUrl },
    ...d.socials.map((s) => ({ label: s.label, href: s.href })),
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div className="@container min-h-full bg-[var(--pg-surface)] text-[var(--pg-text)]">
      <div className="mx-auto max-w-2xl px-6 py-14 @3xl:py-24">
        <header className="text-center">
          {props.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.logoUrl} alt="" className="mx-auto mb-8 h-16 w-16 object-contain @3xl:h-20 @3xl:w-20" />
          )}
          <h1 className="font-serif text-4xl font-normal leading-[1.05] tracking-tight @3xl:text-6xl">{d.name}</h1>
          {(d.tagline || props.address) && (
            <p className="mt-4 text-xs uppercase tracking-[0.28em] text-[var(--pg-muted)]">{d.tagline ?? props.address}</p>
          )}
          {status && <p className="mt-3 text-sm text-[var(--pg-muted)]">{status.label}</p>}
          <div className="mx-auto mt-10 h-px w-12 bg-[var(--pg-accent)]" />
        </header>

        {d.lines.length > 0 && (
          <div className="mt-10 space-y-3 text-center font-serif text-lg leading-8 @3xl:text-xl">
            {d.lines.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
        )}

        <section className="mt-14 space-y-6">
          <p className="text-center text-xs uppercase tracking-[0.28em] text-[var(--pg-muted)]">La carte</p>
          {props.menuImages.length
            ? props.menuImages.map((src, i) => (
                <button key={src} type="button" onClick={() => setViewer(i)} className="block w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Menu, page ${i + 1}`} className="w-full" />
                </button>
              ))
            : <EmptyImage label="Photos du menu" className="aspect-[3/4]" />}
        </section>

        {d.photos.length > 0 && (
          <section className="mt-16 grid grid-cols-2 gap-2">
            {d.photos.slice(0, 4).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt={`Photo ${i + 1}`} className={`w-full object-cover ${i === 0 && d.photos.length !== 2 ? "col-span-2 aspect-[16/9]" : "aspect-square"}`} />
            ))}
          </section>
        )}

        {props.schedule && (
          <section className="mt-16">
            <p className="text-center text-xs uppercase tracking-[0.28em] text-[var(--pg-muted)]">Horaires</p>
            <dl className="mx-auto mt-6 max-w-xs space-y-2 text-sm">
              {DAYS.map((day) => {
                const h = props.schedule?.[day.id];
                return (
                  <div key={day.id} className={`flex justify-between border-b border-[var(--pg-line)] pb-2 ${day.id === today ? "font-semibold" : ""}`}>
                    <dt>{day.label}</dt>
                    <dd className={h?.isOpen ? "" : "text-[var(--pg-muted)]"}>{h?.isOpen ? `${h.open} – ${h.close}` : "Fermé"}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
        )}

        {links.length > 0 && (
          <nav className="mt-16 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
            {links.map((l) => (
              <a key={l.label} href={d.href(l.href)} target={d.target} rel="noreferrer" className="underline decoration-[var(--pg-accent)] decoration-1 underline-offset-[6px] hover:decoration-2">
                {l.label}
              </a>
            ))}
          </nav>
        )}

        {props.address && <p className="mt-10 text-center text-sm text-[var(--pg-muted)]">{props.address}</p>}
        {d.whatsapp && !props.inPreview && (
          <a
            href={d.whatsapp}
            target="_blank"
            rel="noreferrer"
            aria-label="Écrire sur WhatsApp"
            className="fixed bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--pg-brand)] text-[var(--pg-on-brand)] shadow-lg"
          >
            <BrandIcon id="whatsapp" className="h-5 w-5" />
          </a>
        )}
      </div>
      <Lightbox images={props.menuImages} index={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
