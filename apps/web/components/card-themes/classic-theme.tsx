"use client";

import { useState } from "react";
import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { BrandIcon, DAYS, EmptyImage, Lightbox, MapFrame, todayId, useCardData, useOpenStatus, type CardThemeProps } from "./kit";

/**
 * Classique : en-tête aux couleurs de l'établissement, actions rapides, menu en
 * grille. Sur grand écran, informations pratiques dans une colonne latérale.
 */
export default function ClassicTheme(props: CardThemeProps) {
  const d = useCardData(props);
  const status = useOpenStatus(props.schedule);
  const [viewer, setViewer] = useState<number | null>(null);
  const today = todayId();

  return (
    <div className="@container min-h-full bg-[var(--pg-surface)] font-sans text-[var(--pg-text)]">
      {/* En-tête */}
      <header className="bg-[var(--pg-brand)] text-[var(--pg-on-brand)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 pb-16 pt-8 @3xl:flex-row @3xl:items-end @3xl:justify-between @3xl:px-10 @3xl:pb-20 @3xl:pt-12">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/95 shadow-lg @3xl:h-20 @3xl:w-20">
              {props.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={props.logoUrl} alt="" className="h-full w-full object-contain p-1.5" />
              ) : (
                <span className="text-2xl font-bold text-[var(--pg-brand)]">{d.initial}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight tracking-tight @3xl:text-4xl">{d.name}</h1>
              {(d.tagline || props.address) && <p className="mt-1 text-sm opacity-80 @3xl:text-base">{d.tagline ?? props.address}</p>}
            </div>
          </div>
          {status && (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-black/15 px-3 py-1.5 text-sm font-medium">
              <span className={`h-2 w-2 rounded-full ${status.open ? "bg-emerald-400" : "bg-white/60"}`} />
              {status.label}
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto -mt-10 max-w-6xl px-4 pb-12 @3xl:px-10">
        {/* Actions rapides */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] p-2 shadow-[0_12px_32px_rgba(0,0,0,0.08)] @3xl:max-w-xl">
          <Action href={d.href(d.whatsapp)} target={d.target} icon={<BrandIcon id="whatsapp" className="h-5 w-5" />} label="WhatsApp" primary />
          <Action href={d.href(d.tel)} icon={<Phone className="h-5 w-5" />} label="Appeler" />
          <Action href={d.href(props.locationUrl)} target={d.target} icon={<Navigation className="h-5 w-5" />} label="Itinéraire" />
        </div>

        <div className="mt-8 grid gap-8 @4xl:grid-cols-[1fr_320px]">
          <main className="min-w-0 space-y-10">
            {d.lines.length > 0 && (
              <section className="space-y-2 text-[15px] leading-7">
                {d.lines.map((line, i) => (
                  <p key={i} className={i === 0 ? "text-lg font-semibold" : "text-[var(--pg-muted)]"}>
                    {line}
                  </p>
                ))}
              </section>
            )}

            <section>
              <Heading title="Menu" count={props.menuImages.length} />
              <div className="mt-4 grid grid-cols-2 gap-3 @2xl:grid-cols-3 @5xl:grid-cols-4">
                {props.menuImages.length
                  ? props.menuImages.map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setViewer(i)}
                        className="group overflow-hidden rounded-xl border border-[var(--pg-line)] bg-[var(--pg-card)] text-left"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Menu, page ${i + 1}`} className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                        <span className="block px-3 py-2 text-xs font-medium text-[var(--pg-muted)]">Page {i + 1}</span>
                      </button>
                    ))
                  : [1, 2].map((i) => <EmptyImage key={i} label={`Page ${i}`} className="aspect-[3/4] rounded-xl" />)}
              </div>
            </section>

            {d.photos.length > 0 && (
              <section>
                <Heading title="Le lieu" count={d.photos.length} />
                <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] @3xl:grid @3xl:grid-cols-3 @3xl:overflow-visible">
                  {d.photos.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-[78%] shrink-0 snap-center rounded-xl object-cover @3xl:w-full" />
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className="space-y-4 @4xl:sticky @4xl:top-6 @4xl:self-start">
            {props.schedule && (
              <Panel icon={<Clock className="h-4 w-4" />} title="Horaires">
                <ul className="space-y-1.5 text-sm">
                  {DAYS.map((day) => {
                    const h = props.schedule?.[day.id];
                    const isToday = day.id === today;
                    return (
                      <li key={day.id} className={`flex justify-between rounded-lg px-2 py-1 ${isToday ? "bg-[var(--pg-soft)] font-semibold" : ""}`}>
                        <span>{day.label}</span>
                        <span className={h?.isOpen ? "" : "text-[var(--pg-muted)]"}>{h?.isOpen ? `${h.open} – ${h.close}` : "Fermé"}</span>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            )}

            {(props.address || d.coords) && (
              <Panel icon={<MapPin className="h-4 w-4" />} title="Adresse">
                {props.address && <p className="text-sm leading-6">{props.address}</p>}
                {d.coords && <MapFrame coords={d.coords} className="mt-3 h-40 rounded-xl" />}
              </Panel>
            )}

            {(d.phoneLabel || d.socials.length > 0) && (
              <Panel icon={<Phone className="h-4 w-4" />} title="Contact">
                {d.phoneLabel && (
                  <a href={d.href(d.tel)} className="block text-sm font-medium">
                    {d.phoneLabel}
                  </a>
                )}
                {d.socials.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {d.socials.map((s) => (
                      <a
                        key={s.id}
                        href={d.href(s.href)}
                        target={d.target}
                        rel="noreferrer"
                        aria-label={s.label}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pg-line)] text-[var(--pg-brand)] transition-colors hover:bg-[var(--pg-brand)] hover:text-[var(--pg-on-brand)]"
                      >
                        <BrandIcon id={s.id} />
                      </a>
                    ))}
                  </div>
                )}
              </Panel>
            )}
          </aside>
        </div>
      </div>

      <footer className="border-t border-[var(--pg-line)] py-6 text-center text-xs text-[var(--pg-muted)]">
        {d.name} · page créée avec Moncode
      </footer>

      <Lightbox images={props.menuImages} index={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}

function Action({ href, target, icon, label, primary }: { href?: string; target?: string; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <a
      href={href}
      target={target}
      rel="noreferrer"
      className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-semibold transition-colors ${
        primary ? "bg-[var(--pg-brand)] text-[var(--pg-on-brand)] hover:bg-[var(--pg-brand-deep)]" : "hover:bg-[var(--pg-soft)]"
      } ${href ? "" : "pointer-events-none"}`}
    >
      {icon}
      {label}
    </a>
  );
}

function Heading({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--pg-line)] pb-3">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {count ? <span className="text-sm text-[var(--pg-muted)]">{count} photo{count > 1 ? "s" : ""}</span> : null}
    </div>
  );
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
        <span className="text-[var(--pg-brand)]">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}
