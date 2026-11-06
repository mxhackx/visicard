"use client";

import { useState } from "react";
import { BrandIcon, EmptyImage, Lightbox, useCardData, useOpenStatus, type CardThemeProps } from "./kit";
import { HoursList, WhatsAppFab } from "./extras";
import { maquisDisplay, maquisText } from "./fonts";

/** Maquis : enseigne jaune, ardoise de menu, couleurs franches. Pour restaurants, bars, maquis. */
export default function MaquisTheme(props: CardThemeProps) {
  const d = useCardData(props);
  const status = useOpenStatus(props.schedule);
  const [viewer, setViewer] = useState<number | null>(null);

  return (
    <div className={`${maquisText.className} @container min-h-full bg-[var(--pg-surface)] text-[var(--pg-text)]`}>
      <div className="bg-[var(--pg-accent)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-5">
          <span className={`${maquisDisplay.className} truncate text-xl text-[var(--pg-brand)]`}>{d.name}</span>
          {d.whatsapp && (
            <a href={d.href(d.whatsapp)} target={d.target} rel="noreferrer" className="shrink-0 rounded-md bg-[var(--pg-text)] px-3.5 py-2 text-sm font-bold text-[var(--pg-surface)]">
              Écrire
            </a>
          )}
        </div>
      </div>

      <header className="bg-[var(--pg-accent)] px-5 pb-20 pt-5 [clip-path:polygon(0_0,100%_0,100%_86%,0_100%)]">
        <div className="mx-auto max-w-3xl rounded-xl border-[8px] border-[var(--pg-text)] bg-[var(--pg-surface)] px-5 py-8 text-center shadow-[10px_10px_0_var(--pg-brand)] @2xl:px-10 @2xl:py-12">
          {props.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.logoUrl} alt="" className="mx-auto mb-4 h-16 w-16 object-contain" />
          )}
          <h1 className={`${maquisDisplay.className} break-words text-4xl leading-[1.05] text-[var(--pg-brand)] [text-shadow:3px_3px_0_var(--pg-accent)] @2xl:text-7xl`}>{d.name}</h1>
          {(d.tagline || props.address) && <p className="mx-auto mt-4 max-w-[34ch] text-lg">{d.tagline ?? props.address}</p>}
          {status && <p className="mt-3 text-sm font-semibold text-[var(--pg-muted)]">{status.label}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {d.whatsapp && (
              <a href={d.href(d.whatsapp)} target={d.target} rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-[var(--pg-brand)] px-5 py-3.5 font-bold text-[var(--pg-on-brand)]">
                <BrandIcon id="whatsapp" className="h-5 w-5" /> Commander sur WhatsApp
              </a>
            )}
            {props.locationUrl && (
              <a href={d.href(props.locationUrl)} target={d.target} rel="noreferrer" className="rounded-md bg-[var(--pg-text)] px-5 py-3.5 font-bold text-[var(--pg-surface)]">
                Voir l’itinéraire
              </a>
            )}
          </div>
        </div>
      </header>

      <section className="-mt-px bg-[var(--pg-text)] px-5 pb-16 pt-12 text-[var(--pg-surface)] [background-image:radial-gradient(rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:5px_5px]">
        <div className="mx-auto max-w-4xl">
          <h2 className={`${maquisDisplay.className} text-center text-4xl text-[var(--pg-accent)] @2xl:text-5xl`}>Au menu</h2>
          {d.lines.length > 0 && (
            <ul className="mx-auto mt-8 grid max-w-3xl gap-x-14 gap-y-4 @2xl:grid-cols-2">
              {d.lines.map((l, i) => (
                <li key={i} className="flex items-baseline gap-3 text-[17px] font-semibold">
                  <span>{l}</span>
                  <i className="flex-1 -translate-y-1.5 border-b-2 border-dotted border-white/40" />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8 grid grid-cols-2 gap-3 @3xl:grid-cols-3">
            {props.menuImages.length ? (
              props.menuImages.map((src, i) => (
                <button key={src} type="button" onClick={() => setViewer(i)} className="overflow-hidden rounded-lg border-4 border-[var(--pg-surface)] bg-[var(--pg-surface)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Menu, page ${i + 1}`} className="aspect-[3/4] w-full object-cover" />
                </button>
              ))
            ) : (
              <EmptyImage label="Photos du menu" className="col-span-full aspect-[16/9] rounded-lg" />
            )}
          </div>
        </div>
      </section>

      {d.photos.length > 0 && (
        <section className="px-5 py-14">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 @2xl:grid-cols-3">
            {d.photos.slice(0, 6).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-md border-4 border-[var(--pg-text)] object-cover" />
            ))}
          </div>
        </section>
      )}

      <footer className="bg-[var(--pg-brand)] px-5 pb-28 pt-12 text-[var(--pg-on-brand)]">
        <div className="mx-auto grid max-w-4xl gap-8 @2xl:grid-cols-3">
          <div>
            <h3 className={`${maquisDisplay.className} text-2xl text-[var(--pg-accent)]`}>Où nous trouver</h3>
            <p className="mt-1">{props.address ?? "Adresse à renseigner"}</p>
          </div>
          <div>
            <h3 className={`${maquisDisplay.className} text-2xl text-[var(--pg-accent)]`}>Téléphone</h3>
            {d.tel ? <a href={d.href(d.tel)} className="mt-1 block underline">{d.phoneLabel}</a> : <p className="mt-1">À renseigner</p>}
            {d.socials.length > 0 && (
              <div className="mt-3 flex gap-3">
                {d.socials.map((s) => (
                  <a key={s.id} href={d.href(s.href)} target={d.target} rel="noreferrer" aria-label={s.label}>
                    <BrandIcon id={s.id} className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className={`${maquisDisplay.className} text-2xl text-[var(--pg-accent)]`}>Horaires</h3>
            {props.schedule ? <HoursList schedule={props.schedule} className="mt-1 text-sm" /> : <p className="mt-1">Tous les jours</p>}
          </div>
        </div>
      </footer>
      <WhatsAppFab href={d.whatsapp} hidden={props.inPreview} />
      <Lightbox images={props.menuImages} index={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
