"use client";

import { useState } from "react";
import { BrandIcon, EmptyImage, Lightbox, useCardData, useOpenStatus, type CardThemeProps } from "./kit";
import { HoursList, WhatsAppFab } from "./extras";
import { hotelDisplay, hotelText } from "./fonts";

/** Hôtel : vert profond, laiton, sobriété d'un lieu calme. Hôtels, résidences, maisons d'hôtes. */
export default function HotelTheme(props: CardThemeProps) {
  const d = useCardData(props);
  const status = useOpenStatus(props.schedule);
  const [viewer, setViewer] = useState<number | null>(null);
  const serif = hotelDisplay.className;
  const photo = d.cover;

  return (
    <div className={`${hotelText.className} @container min-h-full bg-[var(--pg-surface)] leading-[1.7] text-[var(--pg-text)]`}>
      <div className="bg-[var(--pg-brand)] text-[var(--pg-on-brand)]">
        <div className="mx-auto flex h-[60px] max-w-5xl items-center justify-between px-5">
          <span className={`${serif} truncate text-[22px] font-medium`}>{d.name}</span>
          {d.tel && <a href={d.href(d.tel)} className="text-sm tracking-wider">Contact</a>}
        </div>
      </div>

      <header className="grid bg-[var(--pg-brand)] text-[var(--pg-on-brand)] @3xl:min-h-[70vh] @3xl:grid-cols-[1.15fr_1fr]">
        <div className="px-6 pb-28 pt-9 @3xl:self-end @3xl:px-14 @3xl:pb-32 @3xl:pt-16">
          {props.address && <p className="mb-3 text-[15px] text-[var(--pg-accent)]">{props.address}</p>}
          <h1 className={`${serif} break-words text-[clamp(3rem,11vw,6.5rem)] font-light leading-[.95] tracking-[-.01em]`}>{d.name}</h1>
          <p className="mt-5 max-w-[32ch] text-[17px] opacity-85">{d.tagline ?? "Un séjour calme, des chambres soignées. Réservez en direct, sans commission."}</p>
          {status && <p className="mt-5 text-sm text-[var(--pg-accent)]">{status.label}</p>}
        </div>
        <div className="relative min-h-[260px] overflow-hidden bg-[repeating-linear-gradient(180deg,color-mix(in_srgb,var(--pg-brand)_82%,white),color-mix(in_srgb,var(--pg-brand)_82%,white)_13px,var(--pg-brand)_13px,var(--pg-brand)_17px)]">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
      </header>

      <div className="relative z-10 mx-4 -mt-14 grid gap-3 bg-white p-5 shadow-[0_24px_50px_rgba(20,32,28,0.16)] @2xl:mx-auto @2xl:max-w-4xl @2xl:grid-cols-3 @2xl:items-center">
        {d.whatsapp && (
          <a href={d.href(d.whatsapp)} target={d.target} rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-[var(--pg-accent)] px-6 py-4 text-[15px] tracking-wide text-white">
            <BrandIcon id="whatsapp" className="h-5 w-5" /> Vérifier les disponibilités
          </a>
        )}
        {d.tel && <a href={d.href(d.tel)} className="border border-[var(--pg-line)] px-6 py-4 text-center text-[15px]">{d.phoneLabel}</a>}
        {props.locationUrl && <a href={d.href(props.locationUrl)} target={d.target} rel="noreferrer" className="border border-[var(--pg-line)] px-6 py-4 text-center text-[15px]">Itinéraire</a>}
      </div>

      <section className="mx-auto max-w-5xl px-6 pb-4 pt-20">
        <h2 className={`${serif} mb-7 text-[clamp(2.4rem,8vw,3.5rem)] font-light leading-[1.05]`}>Les chambres et tarifs</h2>
        <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-3">
          {props.menuImages.length ? (
            props.menuImages.map((src, i) => (
              <button key={src} type="button" onClick={() => setViewer(i)} className="overflow-hidden bg-white text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Tarifs, page ${i + 1}`} className="aspect-[3/4] w-full object-cover" />
              </button>
            ))
          ) : (
            <EmptyImage label="Photos des chambres et tarifs" className="col-span-full aspect-[16/9]" />
          )}
        </div>
      </section>

      {d.lines.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 pb-4 pt-16">
          <h2 className={`${serif} mb-7 text-[clamp(2.4rem,8vw,3.5rem)] font-light leading-[1.05]`}>Sur place</h2>
          <dl className="grid gap-x-16 gap-y-5 @3xl:grid-cols-2">
            {d.lines.map((l, i) => (
              <div key={i} className="border-t border-[color-mix(in_srgb,var(--pg-text)_20%,transparent)] pt-4">
                <dt className={`${serif} text-2xl font-medium`}>{l}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      {d.photos.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 pt-16">
          <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-3">
            {d.photos.slice(0, 3).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt={`Photo ${i + 1}`} className="aspect-[4/5] w-full object-cover" />
            ))}
          </div>
        </section>
      )}

      <footer className="mt-20 bg-[var(--pg-brand)] px-6 pb-28 pt-14 text-[var(--pg-on-brand)]">
        <div className="mx-auto grid max-w-5xl gap-8 @2xl:grid-cols-3">
          <div>
            <h3 className={`${serif} text-[26px] font-medium text-[var(--pg-accent)]`}>Adresse</h3>
            <p>{props.address ?? "À renseigner"}</p>
          </div>
          <div>
            <h3 className={`${serif} text-[26px] font-medium text-[var(--pg-accent)]`}>Réservations</h3>
            {d.tel ? <a href={d.href(d.tel)} className="underline">{d.phoneLabel}</a> : <p>À renseigner</p>}
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
            <h3 className={`${serif} text-[26px] font-medium text-[var(--pg-accent)]`}>Accueil</h3>
            {props.schedule ? <HoursList schedule={props.schedule} className="text-sm" /> : <p>Accueil jour et nuit</p>}
          </div>
        </div>
      </footer>
      <WhatsAppFab href={d.whatsapp} hidden={props.inPreview} />
      <Lightbox images={props.menuImages} index={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
