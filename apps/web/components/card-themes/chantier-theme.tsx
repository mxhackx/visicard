"use client";

import { useState } from "react";
import { BrandIcon, EmptyImage, Lightbox, useCardData, type CardThemeProps } from "./kit";
import { HoursList, WhatsAppFab } from "./extras";
import { chantierDisplay, chantierText } from "./fonts";

const HAZARD = "h-3.5 bg-[repeating-linear-gradient(-45deg,var(--pg-brand)_0_14px,#111_14px_28px)]";

/** Chantier : acier, bandes de chantier, numéros d'allées. Quincailleries, matériaux, artisans. */
export default function ChantierTheme(props: CardThemeProps) {
  const d = useCardData(props);
  const [viewer, setViewer] = useState<number | null>(null);
  const cond = `${chantierDisplay.className} font-extrabold uppercase tracking-[-.01em]`;
  const steps = ["Envoyez votre liste sur WhatsApp.", "Recevez le prix total.", "Passez au magasin ou on livre."];

  return (
    <div className={`${chantierText.className} @container min-h-full bg-[var(--pg-surface)] text-[var(--pg-text)]`}>
      <div className={HAZARD} />
      <div className="bg-[var(--pg-text)] text-[var(--pg-surface)]">
        <div className="mx-auto flex h-[62px] max-w-5xl items-center justify-between gap-3 px-5">
          <span className={`${cond} truncate text-2xl`}>{d.name}</span>
          {d.whatsapp && <a href={d.href(d.whatsapp)} target={d.target} rel="noreferrer" className="font-bold text-[var(--pg-brand)]">WhatsApp</a>}
        </div>
      </div>

      <header className="bg-[var(--pg-text)] pb-12 pt-8 text-[var(--pg-surface)]">
        <div className="mx-auto grid max-w-5xl gap-7 px-5 @3xl:grid-cols-[1.5fr_1fr] @3xl:items-end">
          <div>
            <h1 className={`${cond} break-words text-[clamp(3rem,13vw,7rem)] leading-[.9]`}>{d.name}</h1>
            <p className="mt-4 max-w-[34ch] text-[19px] opacity-75">{d.tagline ?? props.address ?? "Du matériel au bon prix, livré sur place."}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {d.whatsapp && (
                <a href={d.href(d.whatsapp)} target={d.target} rel="noreferrer" className="inline-flex items-center gap-2 bg-[var(--pg-brand)] px-6 py-4 font-bold text-[#111]">
                  <BrandIcon id="whatsapp" className="h-5 w-5" /> Envoyer ma liste
                </a>
              )}
              {props.locationUrl && (
                <a href={d.href(props.locationUrl)} target={d.target} rel="noreferrer" className="border-2 border-[var(--pg-surface)] px-6 py-4 font-bold">
                  Itinéraire
                </a>
              )}
            </div>
          </div>
          <div className="bg-[var(--pg-brand)] p-5 text-[#111]">
            <h2 className={`${cond} mb-3 text-3xl leading-none`}>Comment commander</h2>
            <ol className="grid list-decimal gap-1.5 pl-5 font-semibold">
              {steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </div>
        </div>
      </header>
      <div className={HAZARD} />

      {d.lines.length > 0 && (
        <section className="mx-auto max-w-5xl px-5 py-14">
          <h2 className={`${cond} mb-6 text-[clamp(2.5rem,9vw,4.2rem)] leading-[.95]`}>Dans nos allées</h2>
          <div className="grid gap-2.5 @3xl:grid-cols-2">
            {d.lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[76px_1fr] items-center gap-4 border-l-8 border-[var(--pg-brand)] bg-white p-4">
                <div className={`${cond} text-sm leading-none opacity-60`}>
                  Allée
                  <b className="block text-5xl font-extrabold leading-none text-[var(--pg-brand)] opacity-100">{i + 1}</b>
                </div>
                <p className={`${chantierDisplay.className} text-[26px] font-extrabold uppercase leading-[1.05]`}>{l}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-5 pb-14">
        <h2 className={`${cond} mb-6 text-[clamp(2.5rem,9vw,4.2rem)] leading-[.95]`}>Catalogue</h2>
        <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
          {props.menuImages.length ? (
            props.menuImages.map((src, i) => (
              <button key={src} type="button" onClick={() => setViewer(i)} className="overflow-hidden border-t-8 border-[var(--pg-text)] bg-white text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Catalogue, page ${i + 1}`} className="aspect-[3/4] w-full object-cover" />
              </button>
            ))
          ) : (
            <EmptyImage label="Pages du catalogue" className="col-span-full aspect-[16/9]" />
          )}
        </div>
      </section>

      {d.photos.length > 0 && (
        <section className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-5 pb-14 @3xl:grid-cols-3">
          {d.photos.slice(0, 3).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
          ))}
        </section>
      )}

      <footer className="bg-[#111] px-5 pb-28 pt-10 text-[#bbb]">
        <div className="mx-auto grid max-w-5xl gap-6 @2xl:grid-cols-3">
          <div>
            <b className={`${cond} block text-xl text-[var(--pg-brand)]`}>Magasin</b>
            {props.address ?? "À renseigner"}
          </div>
          <div>
            <b className={`${cond} block text-xl text-[var(--pg-brand)]`}>Téléphone</b>
            {d.tel ? <a href={d.href(d.tel)} className="text-white">{d.phoneLabel}</a> : "À renseigner"}
          </div>
          <div>
            <b className={`${cond} block text-xl text-[var(--pg-brand)]`}>Ouverture</b>
            {props.schedule ? <HoursList schedule={props.schedule} className="text-sm" todayClassName="font-bold text-white" /> : "Lundi au samedi, dès 7 h 30"}
          </div>
        </div>
      </footer>
      <WhatsAppFab href={d.whatsapp} hidden={props.inPreview} />
      <Lightbox images={props.menuImages} index={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
