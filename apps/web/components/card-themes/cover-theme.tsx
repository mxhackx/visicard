"use client";

import { useState } from "react";
import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { BrandIcon, DAYS, EmptyImage, Lightbox, MapFrame, todayId, useCardData, useOpenStatus, type CardThemeProps } from "./kit";

type Tab = "menu" | "photos" | "infos";

/** Couverture : grande photo, logo rond qui la chevauche, onglets Menu / Photos / Infos. */
export default function CoverTheme(props: CardThemeProps) {
  const d = useCardData(props);
  const status = useOpenStatus(props.schedule);
  const [tab, setTab] = useState<Tab>("menu");
  const [viewer, setViewer] = useState<number | null>(null);
  const today = todayId();
  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "menu", label: "Menu", show: true },
    { id: "photos", label: "Photos", show: d.photos.length > 0 },
    { id: "infos", label: "Infos", show: true },
  ];

  return (
    <div className="@container min-h-full bg-[var(--pg-surface)] font-sans text-[var(--pg-text)]">
      <div className="relative h-60 overflow-hidden bg-[var(--pg-brand)] @3xl:h-[380px]">
        {d.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.cover} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        {status && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow">
            <span className={`h-2 w-2 rounded-full ${status.open ? "bg-emerald-500" : "bg-neutral-400"}`} />
            {status.label}
          </span>
        )}
      </div>

      <div className="mx-auto max-w-4xl px-5 @3xl:px-8">
        <div className="-mt-12 flex flex-col items-center text-center @3xl:-mt-16">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--pg-surface)] bg-white shadow-xl @3xl:h-32 @3xl:w-32">
            {props.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={props.logoUrl} alt="" className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-3xl font-bold text-[var(--pg-brand)]">{d.initial}</span>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight @3xl:text-4xl">{d.name}</h1>
          {(d.tagline || props.address) && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--pg-muted)]">
              <MapPin className="h-3.5 w-3.5" /> {d.tagline ?? props.address}
            </p>
          )}

          <div className="mt-5 flex w-full max-w-md gap-2">
            <a
              href={d.href(d.whatsapp)}
              target={d.target}
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--pg-brand)] px-4 py-3 text-sm font-semibold text-[var(--pg-on-brand)] shadow-lg transition-colors hover:bg-[var(--pg-brand-deep)]"
            >
              <BrandIcon id="whatsapp" className="h-4 w-4" /> Commander
            </a>
            <a href={d.href(d.tel)} aria-label="Appeler" className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--pg-line)] bg-[var(--pg-card)]">
              <Phone className="h-4 w-4" />
            </a>
            <a
              href={d.href(props.locationUrl)}
              target={d.target}
              rel="noreferrer"
              aria-label="Itinéraire"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--pg-line)] bg-[var(--pg-card)]"
            >
              <Navigation className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Onglets */}
        <nav className="sticky top-0 z-10 -mx-5 mt-8 flex justify-center gap-1 border-b border-[var(--pg-line)] bg-[var(--pg-surface)] px-5 @3xl:mx-0 @3xl:px-0" aria-label="Sections">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={`relative px-5 py-3.5 text-sm font-semibold transition-colors ${tab === t.id ? "text-[var(--pg-brand)]" : "text-[var(--pg-muted)]"}`}
              >
                {t.label}
                {tab === t.id && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[var(--pg-brand)]" />}
              </button>
            ))}
        </nav>

        <div className="py-6 pb-14">
          {tab === "menu" && (
            <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3">
              {props.menuImages.length
                ? props.menuImages.map((src, i) => (
                    <button key={src} type="button" onClick={() => setViewer(i)} className="overflow-hidden rounded-2xl border border-[var(--pg-line)] shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Menu, page ${i + 1}`} className="w-full object-cover" />
                    </button>
                  ))
                : <EmptyImage label="Photos du menu" className="aspect-[3/4] rounded-2xl" />}
            </div>
          )}

          {tab === "photos" && (
            <div className="columns-2 gap-3 @3xl:columns-3">
              {d.photos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt={`Photo ${i + 1}`} className="mb-3 w-full break-inside-avoid rounded-xl" />
              ))}
            </div>
          )}

          {tab === "infos" && (
            <div className="grid gap-4 @3xl:grid-cols-2">
              {d.lines.length > 0 && (
                <div className="rounded-2xl bg-[var(--pg-soft)] p-5 text-[15px] leading-7 @3xl:col-span-2">
                  {d.lines.map((l, i) => (
                    <p key={i}>{l}</p>
                  ))}
                </div>
              )}
              {props.schedule && (
                <div className="rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                    <Clock className="h-4 w-4 text-[var(--pg-brand)]" /> Horaires
                  </h3>
                  <ul className="space-y-1.5 text-sm">
                    {DAYS.map((day) => {
                      const h = props.schedule?.[day.id];
                      return (
                        <li key={day.id} className={`flex justify-between ${day.id === today ? "font-semibold text-[var(--pg-brand)]" : ""}`}>
                          <span>{day.label}</span>
                          <span>{h?.isOpen ? `${h.open} – ${h.close}` : "Fermé"}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <div className="overflow-hidden rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)]">
                {d.coords && <MapFrame coords={d.coords} className="h-44" />}
                <div className="space-y-3 p-5 text-sm">
                  {props.address && <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pg-brand)]" /> {props.address}</p>}
                  {d.phoneLabel && <p className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pg-brand)]" /> {d.phoneLabel}</p>}
                  {d.socials.length > 0 && (
                    <div className="flex gap-2 pt-1">
                      {d.socials.map((s) => (
                        <a key={s.id} href={d.href(s.href)} target={d.target} rel="noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--pg-soft)] text-[var(--pg-brand)]">
                          <BrandIcon id={s.id} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Lightbox images={props.menuImages} index={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
