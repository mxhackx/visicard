"use client";

import { useState } from "react";
import { MapPin, Phone, Clock, Star } from "lucide-react";
import { BrandIcon, EmptyImage, Lightbox, MapFrame, useCardData, useOpenStatus, type CardThemeProps } from "./kit";
import { HoursList, WhatsAppFab } from "./extras";
import { cliniqueText } from "./fonts";
import { formatFcfa, parseMenuModel } from "@/lib/menu-lines";

/* Fiche d'annuaire : titre et statut, boutons WhatsApp et Appeler, adresse et horaires en cartes, menu par catégories avec plats et prix. */

export default function AnnuaireTheme(props: CardThemeProps) {
  const d = useCardData(props);
  const status = useOpenStatus(props.schedule);
  const [viewer, setViewer] = useState<number | null>(null);
  const model = parseMenuModel(props.additionalInfo ?? "");
  const sections = model.sections.filter((s) => s.dishes.length);
  const description = d.tagline ?? (model.tagline || undefined);
  const chips = model.tags;

  const card = "rounded-2xl border border-[var(--pg-line)] bg-white p-5 shadow-sm";
  const h2 = "text-lg font-semibold";
  const btn = "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98]";

  return (
    <div className={`${cliniqueText.className} min-h-full bg-[color-mix(in_srgb,var(--pg-brand)_5%,var(--pg-surface))] pb-24 text-[var(--pg-text)]`}>
      <div className="mx-auto max-w-2xl px-4 pt-5">
        <div className="flex items-start gap-4">
          {props.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.logoUrl} alt="" className="h-16 w-16 shrink-0 rounded-2xl border border-[var(--pg-line)] bg-white object-cover" />
          )}
          <div className="min-w-0">
            {status && (
              <p className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.open ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.open ? "bg-emerald-500" : "bg-slate-500"}`} /> {status.open ? "Restaurant ouvert" : "Restaurant fermé"}
              </p>
            )}
            <h1 className="mt-1.5 break-words text-[1.75rem] font-bold leading-tight">{d.name}</h1>
          </div>
        </div>
        {description && <p className="mt-3 text-[15px] leading-6 opacity-75">{description}</p>}

        {(d.whatsapp || d.tel) && (
          <div className="mt-5 flex gap-3">
            {d.whatsapp && (
              <a href={d.href(d.whatsapp)} target={d.target} rel="noreferrer" className={`${btn} bg-[#25d366] text-white`}>
                <BrandIcon id="whatsapp" className="h-5 w-5" /> WhatsApp
              </a>
            )}
            {d.tel && (
              <a href={d.href(d.tel)} className={`${btn} bg-[var(--pg-brand)] text-[var(--pg-on-brand)]`}>
                <Phone className="h-4 w-4" /> Appeler
              </a>
            )}
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <section className={card}>
            <h2 className={`${h2} flex items-center gap-2`}><MapPin className="h-5 w-5 text-[var(--pg-brand)]" /> Adresse</h2>
            <p className="mt-2 text-sm leading-6 opacity-80">{props.address ?? "Adresse à renseigner"}</p>
            {props.locationUrl && (
              <a href={d.href(props.locationUrl)} target={d.target} rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-[var(--pg-brand)] underline">Itinéraire</a>
            )}
          </section>
          <section className={card}>
            <h2 className={`${h2} flex items-center gap-2`}><Clock className="h-5 w-5 text-[var(--pg-brand)]" /> Horaires</h2>
            {props.schedule ? (
              <HoursList schedule={props.schedule} className="mt-2 space-y-1 text-sm" todayClassName="font-semibold text-[var(--pg-brand)]" />
            ) : (
              <p className="mt-2 text-sm opacity-80">À renseigner</p>
            )}
          </section>
        </div>

        {chips.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {chips.map((t) => (
              <li key={t} className="rounded-full bg-[color-mix(in_srgb,var(--pg-brand)_10%,white)] px-3 py-1 text-sm font-medium text-[var(--pg-brand)]">#{t.replace(/\s+/g, "")}</li>
            ))}
          </ul>
        )}

        <section className="mt-8" aria-labelledby="annuaire-menu">
          <h2 id="annuaire-menu" className="text-2xl font-bold">Menu</h2>
          {sections.length > 1 && (
            <nav className="sticky top-0 z-10 -mx-4 mt-3 flex gap-2 overflow-x-auto bg-[color-mix(in_srgb,var(--pg-brand)_5%,var(--pg-surface))] px-4 py-2" aria-label="Catégories du menu">
              {sections.map((s, i) => (
                <a key={s.title} href={d.href(`#annuaire-${i}`)} className="shrink-0 rounded-full border border-[var(--pg-line)] bg-white px-4 py-1.5 text-sm font-semibold shadow-sm">{s.title}</a>
              ))}
            </nav>
          )}
          {sections.map((s, i) => (
            <div key={s.title} id={`annuaire-${i}`} className="mt-5 scroll-mt-14">
              {sections.length > 1 && <h3 className="mb-2 text-lg font-semibold text-[var(--pg-brand)]">{s.title}</h3>}
              <ul className="divide-y divide-[var(--pg-line)] rounded-2xl border border-[var(--pg-line)] bg-white shadow-sm">
                {s.dishes.map((dish, j) => (
                  <li key={j} className="flex items-baseline justify-between gap-4 px-4 py-3">
                    <span className="font-medium">{dish.name}</span>
                    <span className="shrink-0 font-bold text-[var(--pg-brand)]">{formatFcfa(dish.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mt-5 grid grid-cols-2 gap-3">
            {props.menuImages.length ? (
              props.menuImages.map((src, i) => (
                <button key={src} type="button" onClick={() => setViewer(i)} className="overflow-hidden rounded-2xl border border-[var(--pg-line)] bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Menu, page ${i + 1}`} className="aspect-[3/4] w-full object-cover" />
                </button>
              ))
            ) : !sections.length ? (
              <EmptyImage label="Photos du menu" className="col-span-full aspect-[16/9] rounded-2xl" />
            ) : null}
          </div>
        </section>

        {d.photos.length > 0 && (
          <section className="mt-8 grid grid-cols-2 gap-3">
            {d.photos.slice(0, 6).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full rounded-2xl object-cover" />
            ))}
          </section>
        )}

        {d.coords && (
          <section className="mt-8">
            <h2 className="text-2xl font-bold">Localisation</h2>
            <MapFrame coords={d.coords} className="mt-3 h-56 overflow-hidden rounded-2xl" />
          </section>
        )}

        {d.socials.length > 0 && (
          <section className="mt-8 flex flex-wrap items-center gap-3">
            <Star className="h-4 w-4 text-[var(--pg-brand)]" />
            {d.socials.map((s) => (
              <a key={s.id} href={d.href(s.href)} target={d.target} rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[var(--pg-line)] bg-white px-3.5 py-2 text-sm font-medium shadow-sm">
                <BrandIcon id={s.id} className="h-4 w-4" /> {s.label}
              </a>
            ))}
          </section>
        )}
      </div>
      <WhatsAppFab href={d.whatsapp} hidden={props.inPreview} />
      <Lightbox images={props.menuImages} index={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
