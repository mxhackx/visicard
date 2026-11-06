"use client";

import { useState } from "react";
import { BrandIcon, EmptyImage, Lightbox, useCardData, useOpenStatus, type CardThemeProps } from "./kit";
import { HoursList, WhatsAppFab } from "./extras";
import { beauteDisplay, beauteText } from "./fonts";

/** Beauté : arche, tons poudrés, filets dorés. Pour salons, instituts, coiffeurs, spas. */
export default function BeauteTheme(props: CardThemeProps) {
  const d = useCardData(props);
  const status = useOpenStatus(props.schedule);
  const [viewer, setViewer] = useState<number | null>(null);
  const hero = d.cover;
  const btn = "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold";

  return (
    <div className={`${beauteText.className} @container min-h-full bg-[var(--pg-surface)] text-[var(--pg-text)]`}>
      <div className="px-5 pt-6 text-center">
        <p className={`${beauteDisplay.className} text-2xl tracking-wide`}>{d.name}</p>
        <nav className="mt-1.5 flex justify-center gap-5 text-sm">
          <a href="#carte">La carte</a>
          {d.photos.length > 1 && <a href="#realisations">Réalisations</a>}
          <a href="#infos">Infos</a>
        </nav>
      </div>

      <header className="px-5 pb-14 pt-8 text-center">
        <div className="relative mx-auto aspect-[3/4] w-[min(76%,340px)] overflow-hidden rounded-t-full bg-[linear-gradient(170deg,color-mix(in_srgb,var(--pg-accent)_35%,var(--pg-surface)),var(--pg-accent))]">
          {hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt="" className="h-full w-full object-cover" />
          )}
          {!hero && props.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.logoUrl} alt="" className="absolute inset-0 m-auto h-24 w-24 object-contain" />
          )}
        </div>
        <h1 className={`${beauteDisplay.className} relative -mt-8 break-words text-5xl leading-none tracking-[.01em] @2xl:text-8xl`}>{d.name}</h1>
        {(d.tagline || props.address) && <p className="mx-auto mt-4 max-w-[30ch] text-lg">{d.tagline ?? props.address}</p>}
        {status && <p className="mt-3 text-sm italic opacity-80">{status.label}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {d.whatsapp && (
            <a href={d.href(d.whatsapp)} target={d.target} rel="noreferrer" className={`${btn} bg-[var(--pg-brand)] text-[var(--pg-on-brand)]`}>
              <BrandIcon id="whatsapp" className="h-4 w-4" /> Réserver un moment
            </a>
          )}
          {props.locationUrl && (
            <a href={d.href(props.locationUrl)} target={d.target} rel="noreferrer" className={`${btn} border border-[var(--pg-text)]`}>
              Nous trouver
            </a>
          )}
        </div>
      </header>

      <section id="carte" className="px-5 py-12">
        <h2 className={`${beauteDisplay.className} mb-8 text-center text-5xl leading-[1.05] @2xl:text-6xl`}>La carte</h2>
        {d.lines.length > 0 && (
          <div className="mx-auto grid max-w-3xl gap-x-14 @2xl:grid-cols-2">
            {d.lines.map((l, i) => (
              <p key={i} className={`${beauteDisplay.className} border-b border-[var(--pg-accent)]/60 py-4 text-2xl`}>{l}</p>
            ))}
          </div>
        )}
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 @2xl:grid-cols-3">
          {props.menuImages.length ? (
            props.menuImages.map((src, i) => (
              <button key={src} type="button" onClick={() => setViewer(i)} className="overflow-hidden rounded-3xl bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Carte, page ${i + 1}`} className="aspect-[3/4] w-full object-cover" />
              </button>
            ))
          ) : (
            <EmptyImage label="Photos de la carte" className="col-span-full aspect-[16/9] rounded-3xl" />
          )}
        </div>
      </section>

      {d.photos.length > 1 && (
        <section id="realisations" className="px-5 py-12">
          <h2 className={`${beauteDisplay.className} mb-8 text-center text-5xl leading-[1.05] @2xl:text-6xl`}>Nos réalisations</h2>
          <div className="mx-auto flex max-w-3xl items-end justify-center gap-3">
            {d.photos.slice(0, 3).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt={`Réalisation ${i + 1}`} className={`min-w-0 flex-1 rounded-t-full object-cover ${["aspect-[3/5]", "aspect-[3/4]", "aspect-[3/5.6]"][i]}`} />
            ))}
          </div>
        </section>
      )}

      <section id="infos" className="px-5 pb-28 pt-12">
        <div className="mx-auto max-w-xl rounded-[28px] bg-white/80 p-7 shadow-sm">
          <h2 className={`${beauteDisplay.className} text-center text-4xl`}>Venez nous voir</h2>
          {props.address && <p className="mt-3 text-center">{props.address}</p>}
          {props.schedule && <HoursList schedule={props.schedule} className="mt-5 space-y-1.5 text-sm" todayClassName="font-bold text-[var(--pg-accent)]" />}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
            {d.tel && <a href={d.href(d.tel)} className="underline decoration-[var(--pg-accent)] underline-offset-4">{d.phoneLabel}</a>}
            {d.socials.map((s) => (
              <a key={s.id} href={d.href(s.href)} target={d.target} rel="noreferrer" className="underline decoration-[var(--pg-accent)] underline-offset-4">{s.label}</a>
            ))}
          </div>
        </div>
      </section>
      <WhatsAppFab href={d.whatsapp} hidden={props.inPreview} />
      <Lightbox images={props.menuImages} index={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
