"use client";

import { useState } from "react";
import { BrandIcon, EmptyImage, Lightbox, MapFrame, useCardData, useOpenStatus, type CardThemeProps } from "./kit";
import { HoursList, WhatsAppFab } from "./extras";
import { cliniqueText } from "./fonts";

/** Santé : clair, rassurant, repères nets. Cliniques, cabinets, laboratoires, pharmacies. */
export default function CliniqueTheme(props: CardThemeProps) {
  const d = useCardData(props);
  const status = useOpenStatus(props.schedule);
  const [viewer, setViewer] = useState<number | null>(null);
  const btn = "inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-3.5 font-semibold";

  return (
    <div className={`${cliniqueText.className} @container min-h-full bg-[var(--pg-surface)] leading-relaxed text-[var(--pg-text)]`}>
      {d.tel && (
        <div className="bg-[#d93636] px-3 py-2 text-center text-sm font-semibold text-white">
          Urgence ? Appelez le <a href={d.href(d.tel)} className="underline">{d.phoneLabel}</a>
        </div>
      )}
      <div className="border-b border-[var(--pg-line)]">
        <div className="mx-auto flex h-[66px] max-w-5xl items-center gap-3 px-5">
          {props.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.logoUrl} alt="" className="h-9 w-9 object-contain" />
          ) : (
            <span aria-hidden="true" className="relative h-[34px] w-[34px] shrink-0">
              <span className="absolute left-3 top-0 h-[34px] w-2.5 rounded bg-[var(--pg-brand)]" />
              <span className="absolute left-0 top-3 h-2.5 w-[34px] rounded bg-[var(--pg-brand)]" />
            </span>
          )}
          <b className="min-w-0 flex-1 truncate font-semibold">{d.name}</b>
          {d.whatsapp && (
            <a href={d.href(d.whatsapp)} target={d.target} rel="noreferrer" className={`${btn} !py-2.5 bg-[color-mix(in_srgb,var(--pg-brand)_12%,var(--pg-surface))] text-[var(--pg-brand)]`}>
              Écrire
            </a>
          )}
        </div>
      </div>

      <header className="mx-auto grid max-w-5xl gap-8 px-5 py-10 @3xl:grid-cols-[1.2fr_1fr] @3xl:items-center @3xl:py-16">
        <div>
          <h1 className="text-[clamp(2rem,7vw,3.5rem)] font-semibold leading-[1.08] tracking-[-.015em]">{d.name}</h1>
          <p className="mb-6 mt-4 max-w-[40ch] text-lg opacity-75">{d.tagline ?? props.address ?? "Prenez rendez-vous simplement, recevez la confirmation sur WhatsApp."}</p>
          <div className="flex flex-wrap gap-3">
            {d.whatsapp && (
              <a href={d.href(d.whatsapp)} target={d.target} rel="noreferrer" className={`${btn} bg-[var(--pg-brand)] text-[var(--pg-on-brand)]`}>
                <BrandIcon id="whatsapp" className="h-5 w-5" /> Prendre rendez-vous
              </a>
            )}
            {props.locationUrl && (
              <a href={d.href(props.locationUrl)} target={d.target} rel="noreferrer" className={`${btn} bg-[color-mix(in_srgb,var(--pg-brand)_12%,var(--pg-surface))] text-[var(--pg-brand)]`}>
                Itinéraire
              </a>
            )}
          </div>
          {status && (
            <p className="mt-5 flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 rounded-full ${status.open ? "bg-emerald-500" : "bg-slate-400"}`} />
              {status.label}
            </p>
          )}
        </div>
        <div className="overflow-hidden rounded-2xl border border-[var(--pg-line)] shadow-[0_10px_30px_rgba(16,42,42,0.08)]">
          {d.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.cover} alt="" className="aspect-[4/3] w-full object-cover" />
          ) : (
            <EmptyImage label="Photo de l’établissement" className="aspect-[4/3] border-0" />
          )}
        </div>
      </header>

      {d.lines.length > 0 && (
        <section className="mx-auto max-w-5xl px-5 py-10">
          <h2 className="mb-5 text-[clamp(1.7rem,5vw,2.5rem)] font-semibold tracking-[-.01em]">Ce que nous proposons</h2>
          <div className="border-t border-[var(--pg-line)]">
            {d.lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[44px_1fr] items-center gap-4 border-b border-[var(--pg-line)] py-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--pg-brand)_12%,var(--pg-surface))] text-xl font-semibold text-[var(--pg-brand)]">+</span>
                <p className="font-medium">{l}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {props.menuImages.length > 0 && (
        <section className="bg-[color-mix(in_srgb,var(--pg-brand)_8%,var(--pg-surface))] px-5 py-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-5 text-[clamp(1.7rem,5vw,2.5rem)] font-semibold tracking-[-.01em]">Tarifs et documents</h2>
            <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
              {props.menuImages.map((src, i) => (
                <button key={src} type="button" onClick={() => setViewer(i)} className="overflow-hidden rounded-xl bg-white text-left shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Document ${i + 1}`} className="aspect-[3/4] w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto grid max-w-5xl gap-8 px-5 pb-28 pt-12 @3xl:grid-cols-2">
        <div>
          <h2 className="mb-4 text-[clamp(1.7rem,5vw,2.5rem)] font-semibold tracking-[-.01em]">Nous trouver</h2>
          <p>{props.address ?? "Adresse à renseigner"}</p>
          {d.tel && <a href={d.href(d.tel)} className="mt-2 block font-medium text-[var(--pg-brand)]">{d.phoneLabel}</a>}
          {props.schedule && <HoursList schedule={props.schedule} className="mt-5 max-w-xs space-y-1.5 text-sm" todayClassName="font-semibold text-[var(--pg-brand)]" />}
        </div>
        {d.coords ? <MapFrame coords={d.coords} className="h-64 rounded-2xl" /> : <EmptyImage label="Carte" className="h-64 rounded-2xl" />}
      </section>
      <WhatsAppFab href={d.whatsapp} hidden={props.inPreview} />
      <Lightbox images={props.menuImages} index={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
