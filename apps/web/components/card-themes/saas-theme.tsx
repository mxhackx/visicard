"use client";

import { useState } from "react";
import { ArrowRight, Check, Clock, MapPin, Phone, Sparkles } from "lucide-react";
import { BrandIcon, DAYS, EmptyImage, Lightbox, MapFrame, todayId, useCardData, useOpenStatus, type CardThemeProps } from "./kit";

/**
 * SaaS : la mise en page d'une page produit moderne — barre de navigation avec
 * appel à l'action, accroche, aperçu du menu en vitrine, cartes d'information,
 * bandeau de conversion. Simple, aéré, orienté « passer commande ».
 */
export default function SaasTheme(props: CardThemeProps) {
  const d = useCardData(props);
  const status = useOpenStatus(props.schedule);
  const [viewer, setViewer] = useState<number | null>(null);
  const today = todayId();
  const [headline, ...rest] = d.lines;
  const todayHours = props.schedule?.[today];

  const highlights = [
    todayHours?.isOpen ? `Ouvert aujourd’hui ${todayHours.open} – ${todayHours.close}` : null,
    d.whatsapp ? "Commande en un message WhatsApp" : null,
    props.menuImages.length ? `Menu complet · ${props.menuImages.length} page${props.menuImages.length > 1 ? "s" : ""}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="@container min-h-full bg-[var(--pg-surface)] font-sans text-[var(--pg-text)] antialiased">
      {/* Navigation */}
      <nav className="sticky top-0 z-20 border-b border-[var(--pg-line)] bg-[color-mix(in_srgb,var(--pg-surface)_88%,transparent)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 @3xl:h-16 @3xl:px-8">
          <span className="flex min-w-0 items-center gap-2.5 font-semibold">
            {props.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={props.logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--pg-brand)] text-sm text-[var(--pg-on-brand)]">{d.initial}</span>
            )}
            <span className="truncate">{d.name}</span>
          </span>
          <span className="hidden items-center gap-6 text-sm text-[var(--pg-muted)] @3xl:flex">
            <a href="#saas-menu">Menu</a>
            <a href="#saas-infos">Infos</a>
          </span>
          <a
            href={d.href(d.whatsapp)}
            target={d.target}
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--pg-brand)] px-3.5 py-2 text-sm font-semibold text-[var(--pg-on-brand)] shadow-sm hover:bg-[var(--pg-brand-deep)]"
          >
            Commander
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_srgb,var(--pg-brand)_16%,transparent),transparent)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-12 @3xl:px-8 @4xl:grid-cols-[1.05fr_0.95fr] @4xl:items-center @4xl:pb-24 @4xl:pt-20">
          <div className="text-center @4xl:text-left">
            {status && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--pg-line)] bg-[var(--pg-card)] px-3 py-1 text-xs font-medium">
                <span className={`h-1.5 w-1.5 rounded-full ${status.open ? "bg-emerald-500" : "bg-[var(--pg-muted)]"}`} />
                {status.label}
              </span>
            )}
            <h1 className="mt-5 text-[clamp(2.1rem,7cqw,3.9rem)] font-bold leading-[1.05] tracking-[-0.035em]">
              {headline ?? d.name}
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[var(--pg-muted)] @4xl:mx-0 @4xl:text-lg">
              {rest[0] ?? d.tagline ?? props.address ?? "Consultez le menu, puis commandez en un message."}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 @md:flex-row @4xl:justify-start">
              <a
                href={d.href(d.whatsapp)}
                target={d.target}
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--pg-brand)] px-5 py-3 text-sm font-semibold text-[var(--pg-on-brand)] shadow-[0_10px_30px_color-mix(in_srgb,var(--pg-brand)_35%,transparent)] hover:bg-[var(--pg-brand-deep)]"
              >
                <BrandIcon id="whatsapp" className="h-4 w-4" /> Commander sur WhatsApp
              </a>
              <a
                href="#saas-menu"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--pg-line)] bg-[var(--pg-card)] px-5 py-3 text-sm font-semibold"
              >
                Voir le menu <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            {highlights.length > 0 && (
              <ul className="mt-7 flex flex-col items-center gap-2 text-sm text-[var(--pg-muted)] @4xl:items-start">
                {highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[var(--pg-brand)]" strokeWidth={2.5} /> {h}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Vitrine : le menu dans une fenêtre */}
          <div className="mx-auto w-full max-w-md rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.14)] @4xl:max-w-none">
            <div className="flex items-center gap-1.5 px-2 pb-2 pt-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 truncate rounded-md bg-[var(--pg-soft)] px-2 py-0.5 text-[11px] text-[var(--pg-muted)]">menu · {d.name}</span>
            </div>
            {d.cover ? (
              <button type="button" onClick={() => props.menuImages.length && setViewer(0)} className="block w-full overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={props.menuImages[0] ?? d.cover} alt="Aperçu du menu" className="aspect-[4/3] w-full object-cover object-top" />
              </button>
            ) : (
              <EmptyImage label="Aperçu du menu" className="aspect-[4/3] rounded-xl" />
            )}
          </div>
        </div>
      </header>

      {/* Cartes d'information */}
      <section id="saas-infos" className="mx-auto grid max-w-6xl gap-4 px-4 @3xl:grid-cols-3 @3xl:px-8">
        <Feature icon={<Clock className="h-5 w-5" />} title="Horaires">
          {props.schedule ? (
            <ul className="space-y-1">
              {DAYS.map((day) => {
                const h = props.schedule?.[day.id];
                return (
                  <li key={day.id} className={`flex justify-between ${day.id === today ? "font-semibold text-[var(--pg-text)]" : ""}`}>
                    <span>{day.label}</span>
                    <span>{h?.isOpen ? `${h.open}–${h.close}` : "Fermé"}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            "Horaires non communiqués."
          )}
        </Feature>
        <Feature icon={<MapPin className="h-5 w-5" />} title="Adresse">
          <p>{props.address || "Adresse sur la carte."}</p>
          {d.coords && <MapFrame coords={d.coords} className="mt-3 h-32 rounded-lg" />}
          {props.locationUrl && (
            <a href={d.href(props.locationUrl)} target={d.target} rel="noreferrer" className="mt-3 inline-flex items-center gap-1 font-semibold text-[var(--pg-brand)]">
              Itinéraire <ArrowRight className="h-3.5 w-3.5" />
            </a>
          )}
        </Feature>
        <Feature icon={<Phone className="h-5 w-5" />} title="Contact">
          {d.phoneLabel && <p className="font-medium text-[var(--pg-text)]">{d.phoneLabel}</p>}
          <p className="mt-1">Réponse rapide sur WhatsApp.</p>
          {d.socials.length > 0 && (
            <div className="mt-3 flex gap-2">
              {d.socials.map((s) => (
                <a key={s.id} href={d.href(s.href)} target={d.target} rel="noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--pg-line)] text-[var(--pg-text)] hover:border-[var(--pg-brand)] hover:text-[var(--pg-brand)]">
                  <BrandIcon id={s.id} />
                </a>
              ))}
            </div>
          )}
        </Feature>
      </section>

      {/* Menu */}
      <section id="saas-menu" className="mx-auto max-w-6xl px-4 py-16 @3xl:px-8 @3xl:py-24">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--pg-brand)]">
            <Sparkles className="h-3.5 w-3.5" /> Le menu
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] @3xl:text-4xl">Tout ce qu’on sert, page par page</h2>
          {rest.length > 1 && <p className="mt-3 text-[var(--pg-muted)]">{rest.slice(1).join(" ")}</p>}
        </div>
        <div className="mt-10 grid gap-4 @md:grid-cols-2 @4xl:grid-cols-3">
          {props.menuImages.length
            ? props.menuImages.map((src, i) => (
                <button key={src} type="button" onClick={() => setViewer(i)} className="group overflow-hidden rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] p-2 text-left transition-shadow hover:shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Menu, page ${i + 1}`} className="aspect-[3/4] w-full rounded-xl object-cover" />
                  <span className="flex items-center justify-between px-2 pb-1 pt-3 text-sm font-medium">
                    Page {i + 1} <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </button>
              ))
            : [1, 2, 3].map((i) => <EmptyImage key={i} label={`Page ${i}`} className="aspect-[3/4] rounded-2xl" />)}
        </div>
        {d.photos.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 @3xl:grid-cols-4">
            {d.photos.slice(0, 4).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-2xl object-cover" />
            ))}
          </div>
        )}
      </section>

      {/* Bandeau de conversion */}
      <section className="px-4 pb-16 @3xl:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 rounded-3xl bg-[var(--pg-brand)] px-6 py-10 text-center text-[var(--pg-on-brand)] @3xl:flex-row @3xl:justify-between @3xl:px-12 @3xl:text-left">
          <div>
            <h2 className="text-2xl font-bold tracking-tight @3xl:text-3xl">Une envie ? Commandez maintenant.</h2>
            <p className="mt-2 opacity-80">Un message suffit : on vous répond sur WhatsApp.</p>
          </div>
          <a
            href={d.href(d.whatsapp)}
            target={d.target}
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--pg-on-brand)] px-5 py-3 text-sm font-semibold text-[var(--pg-brand)]"
          >
            <BrandIcon id="whatsapp" className="h-4 w-4" /> Écrire sur WhatsApp
          </a>
        </div>
      </section>

      <footer className="border-t border-[var(--pg-line)] px-4 py-6 text-center text-xs text-[var(--pg-muted)]">
        © {d.name} · Page créée avec Moncode
      </footer>
      <Lightbox images={props.menuImages} index={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] p-6 text-sm leading-6 text-[var(--pg-muted)]">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--pg-brand)_12%,transparent)] text-[var(--pg-brand)]">{icon}</span>
      <h3 className="mb-2 mt-4 text-base font-semibold text-[var(--pg-text)]">{title}</h3>
      {children}
    </div>
  );
}
