"use client";

import { useState } from "react";
import { BrandIcon, EmptyImage, Lightbox, useCardData, type CardThemeProps } from "./kit";
import { HoursList, WhatsAppFab } from "./extras";
import { boutiqueDisplay } from "./fonts";

/** Boutique : titre géant, bande défilante, mosaïque de photos, grille de produits. Mode, accessoires, déco. */
export default function BoutiqueTheme(props: CardThemeProps) {
  const d = useCardData(props);
  const [viewer, setViewer] = useState<number | null>(null);
  const strip = `${props.address ?? "Nouveautés en boutique"} / Livraison possible / `.repeat(6);
  const [big, second, third] = [d.photos[0] ?? d.cover, d.photos[1], d.photos[2]];

  return (
    <div className="@container min-h-full bg-[var(--pg-surface)] font-sans text-[var(--pg-text)]">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-4 text-sm @3xl:px-10">
        <a href="#collection">Collection</a>
        <span className={`${boutiqueDisplay.className} text-lg font-extrabold`}>{d.name}</span>
        {d.whatsapp ? <a href={d.href(d.whatsapp)} target={d.target} rel="noreferrer" className="text-right">WhatsApp</a> : <span />}
      </div>
      <div aria-hidden="true" className="overflow-hidden bg-[var(--pg-brand)] py-2.5 text-sm text-[var(--pg-on-brand)]">
        <div className="pg-marquee">{strip}</div>
      </div>

      <header className="px-5 pt-7 @3xl:px-10">
        <h1 className={`${boutiqueDisplay.className} break-words text-[clamp(3.2rem,15vw,11.5rem)] font-extrabold leading-[.86] tracking-[-.045em]`}>{d.name}</h1>
        <div className="my-5 flex flex-wrap justify-between gap-3 text-base">
          <span>{d.tagline ?? props.address ?? "Boutique"}</span>
          <a href="#collection" className="font-semibold underline underline-offset-4">Voir la collection</a>
        </div>
        <div className="grid h-[min(110vw,560px)] grid-cols-[2fr_1fr] grid-rows-2 gap-1.5">
          <div className="row-span-2 overflow-hidden bg-[color-mix(in_srgb,var(--pg-text)_8%,var(--pg-surface))]">
            {big ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={big} alt="" className="h-full w-full object-cover" />
            ) : (
              <EmptyImage label="Photo principale" className="h-full border-0" />
            )}
          </div>
          <div className="overflow-hidden bg-[var(--pg-accent)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {second && <img src={second} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="overflow-hidden bg-[color-mix(in_srgb,var(--pg-text)_8%,var(--pg-surface))]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {third && <img src={third} alt="" className="h-full w-full object-cover" />}
          </div>
        </div>
      </header>

      <section id="collection" className="px-5 py-14 @3xl:px-10">
        <h2 className={`${boutiqueDisplay.className} mb-6 text-[clamp(2.2rem,8vw,4rem)] font-extrabold leading-none tracking-[-.03em]`}>Cette semaine</h2>
        <div className="grid grid-cols-2 gap-x-1.5 gap-y-7 @3xl:grid-cols-4">
          {props.menuImages.length ? (
            props.menuImages.map((src, i) => (
              <button key={src} type="button" onClick={() => setViewer(i)} className="text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Collection, page ${i + 1}`} className="aspect-[3/4] w-full object-cover" />
                <span className="mt-2 flex justify-between text-sm font-semibold"><span>Page {i + 1}</span><span className="underline underline-offset-4">Voir</span></span>
              </button>
            ))
          ) : (
            <EmptyImage label="Photos des produits" className="col-span-full aspect-[16/9]" />
          )}
        </div>
      </section>

      <section className="border-t-2 border-[var(--pg-text)] px-5 py-14 @3xl:grid @3xl:grid-cols-[1fr_1.2fr] @3xl:gap-12 @3xl:px-10">
        <h2 className={`${boutiqueDisplay.className} mb-6 text-[clamp(2rem,7vw,3.6rem)] font-extrabold leading-none tracking-[-.03em]`}>Une taille, une couleur, une question ?</h2>
        <div className="space-y-3 text-[17px] leading-7">
          {d.lines.map((l, i) => <p key={i}>{l}</p>)}
          {d.whatsapp && (
            <a href={d.href(d.whatsapp)} target={d.target} rel="noreferrer" className="mt-4 inline-flex items-center gap-2 bg-[var(--pg-brand)] px-6 py-4 font-bold text-[var(--pg-on-brand)]">
              <BrandIcon id="whatsapp" className="h-5 w-5" /> Écrire sur WhatsApp
            </a>
          )}
        </div>
      </section>

      <footer className="grid gap-6 border-t-2 border-[var(--pg-text)] px-5 pb-28 pt-8 text-sm @3xl:grid-cols-3 @3xl:px-10">
        <div>
          {props.address}
          {props.locationUrl && (
            <>
              <br />
              <a href={d.href(props.locationUrl)} target={d.target} rel="noreferrer" className="underline">Itinéraire</a>
            </>
          )}
        </div>
        <div>{d.tel && <a href={d.href(d.tel)}>{d.phoneLabel}</a>}</div>
        {props.schedule ? <HoursList schedule={props.schedule} className="space-y-0.5" /> : <div>Ouvert du lundi au samedi</div>}
      </footer>
      <WhatsAppFab href={d.whatsapp} hidden={props.inPreview} />
      <Lightbox images={props.menuImages} index={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
