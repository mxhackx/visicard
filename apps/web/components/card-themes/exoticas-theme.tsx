"use client";

import { useEffect, useRef, useState } from "react";
import { decodeCustom, exoticasVars } from "@/lib/palette";

/* ------------------------------------------------------------------
   Thème « Exoticas » : reprise fidèle du site /home/ares/exoticas
   (header transparent → vert au défilement, hero vert, galerie sur
   plaques de verre, contact WhatsApp + carte OSM, footer vert, bouton
   WhatsApp flottant), alimentée par les données d'une carte Moncode.

   Données utilisées :
   - restaurantName        → nom (wordmark, header, footer)
   - tagline (titre)        → signature sous le nom
   - additionalInfo         → 1re ligne = grand titre du hero, suite = texte
   - placeImages, menuImages→ photo du hero, fond mobile, galerie
   - phoneNumber            → appel, WhatsApp, formulaire de contact
   - address, locationUrl   → adresse, carte, itinéraire
   - schedule, réseaux      → horaires, liens du footer

   La page s'affiche dans une colonne étroite (aperçu téléphone, /c/…) :
   les points de rupture sont des container queries, pas des media queries.
------------------------------------------------------------------ */

interface ScheduleDay {
  isOpen: boolean;
  open: string;
  close: string;
}

export interface ExoticasThemeProps {
  restaurantName: string;
  /** `custom#marque#accent#fond#texte` (voir lib/page-design) ; sinon les couleurs d'origine. */
  themeId?: string | null;
  tagline?: string;
  logoUrl?: string;
  address?: string;
  locationUrl?: string;
  phoneNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  snapchatUrl?: string;
  additionalInfo?: string;
  schedule?: Record<string, ScheduleDay>;
  menuImages: string[];
  placeImages?: string[];
  inPreview?: boolean;
}

const DAYS: [string, string][] = [
  ["monday", "Lundi"],
  ["tuesday", "Mardi"],
  ["wednesday", "Mercredi"],
  ["thursday", "Jeudi"],
  ["friday", "Vendredi"],
  ["saturday", "Samedi"],
  ["sunday", "Dimanche"],
];

const ZOOM = 16;

function parseLocation(url?: string): { lat: number; lng: number } | null {
  if (!url) return null;
  const match = url.match(/[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ?? url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function itinLink(dest: { lat: number; lng: number } | null, fallback?: string, from?: { lat: number; lng: number }) {
  if (!dest) return fallback ?? "#";
  const o = from ? `origin=${from.lat},${from.lng}&` : "";
  return `https://www.google.com/maps/dir/?api=1&${o}destination=${dest.lat},${dest.lng}`;
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const m = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(m), Math.sqrt(1 - m));
}

function tuileDe(lat: number, lng: number, z: number) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
  return { x, y };
}

/** Élément qui défile réellement (le téléphone de l'aperçu, ou la fenêtre). */
function scrollParentOf(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
}

/* ------------------------------ icônes ------------------------------ */

function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 13.9c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.6-.1a11 11 0 0 1-5.9-5.1c-.5-.9-.6-1.7-.4-2.2.2-.6.6-1 .9-1.2.3-.2.6-.2.8-.2h.6c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.6l-.4.5c-.2.2-.2.3-.1.5.3.6 1.5 1.9 2.7 2.4.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.3.2.3.3.3.5v.6Z" />
    </svg>
  );
}

function PhoneIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17.2 17.2 0 0 1 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1l-2.1 2.3Z" />
    </svg>
  );
}

function PinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.6" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------ carte OSM ------------------------------ */

function Plan({ point, href }: { point: { lat: number; lng: number }; href: string }) {
  const { x, y } = tuileDe(point.lat, point.lng, ZOOM);
  const x0 = Math.floor(x) - 1;
  const y0 = Math.floor(y) - 1;
  const u = (x - x0) / 3;
  const v = (y - y0) / 3;
  const tuiles = [];
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 3; i++) {
      tuiles.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img key={`${i}-${j}`} src={`https://tile.openstreetmap.org/${ZOOM}/${x0 + i}/${y0 + j}.png`} width={256} height={256} alt="" />,
      );
    }
  }
  return (
    <a className="x-map" href={href} target="_blank" rel="noopener" aria-label="Ouvrir l'itinéraire dans Google Maps">
      <span
        className="x-map-layer"
        style={{ left: `${(0.5 - 1.5 * u) * 100}%`, top: `${(0.5 - 1.5 * v) * 100}%`, transformOrigin: `${u * 100}% ${v * 100}%` }}
      >
        {tuiles}
      </span>
      <span className="x-map-pin">
        <PinIcon size={28} />
      </span>
      <span className="x-map-cta">Ouvrir dans Google Maps</span>
      <span className="x-map-cred">© OpenStreetMap</span>
    </a>
  );
}

function Wordmark({ nom, tagline, logoUrl }: { nom: string; tagline?: string; logoUrl?: string }) {
  return (
    <span className="x-wordmark">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="x-mark" src={logoUrl} alt="" width={30} height={30} />
      )}
      <span className="x-wordmark-text">
        <span className="x-wordmark-nom">{nom}</span>
        {tagline && <span className="x-wordmark-sig">{tagline}</span>}
      </span>
    </span>
  );
}

/* ------------------------------ thème ------------------------------ */

type Geo = { etat: "repos" | "demande" | "ok" | "refus" | "absent"; lat?: number; lng?: number; km?: number };

export default function ExoticasTheme(props: ExoticasThemeProps) {
  const {
    restaurantName,
    themeId,
    tagline,
    logoUrl,
    address,
    locationUrl,
    phoneNumber,
    facebookUrl,
    instagramUrl,
    xUrl,
    snapchatUrl,
    additionalInfo,
    schedule,
    menuImages,
    placeImages = [],
    inPreview = false,
  } = props;

  const root = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({ nom: "", contact: "", message: "" });
  const [envoye, setEnvoye] = useState(false);
  const [geo, setGeo] = useState<Geo>({ etat: "repos" });
  const [bienvenue, setBienvenue] = useState<"off" | "frappe" | "leve">("off");
  const [frappe, setFrappe] = useState("");
  const lancee = useRef(false);

  const nom = restaurantName || "Votre établissement";
  const [accroche, ...suite] = (additionalInfo ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const titre = suite.length ? accroche : nom;
  const texte = suite.length ? suite.join(" ") : accroche;
  const photos = [...placeImages, ...menuImages];
  const visuel = photos[0];
  const digits = phoneNumber?.replace(/\D/g, "") ?? "";
  const telHref = digits ? `tel:+${digits}` : undefined;
  const point = parseLocation(locationUrl);
  const itin = itinLink(point, locationUrl);
  const link = (href?: string) => (inPreview ? undefined : href);
  const waLink = (message: string) => (digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : undefined);
  const horaires = schedule ? DAYS.filter(([key]) => schedule[key]) : [];
  const reseaux = [
    { label: "Facebook", href: facebookUrl },
    { label: "Instagram", href: instagramUrl },
    { label: "X", href: xUrl },
    { label: "Snapchat", href: snapchatUrl },
  ].filter((r) => r.href);

  /* Bienvenue dactylographiée, une fois par établissement (jamais en aperçu). */
  useEffect(() => {
    if (inPreview || lancee.current) return;
    const cle = `exo-bienvenue:${nom}`;
    let dejaVue = false;
    try {
      dejaVue = localStorage.getItem(cle) === "1";
    } catch {
      dejaVue = false;
    }
    if (dejaVue || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lancee.current = true;
    try {
      localStorage.setItem(cle, "1");
    } catch {
      /* navigation privée : la bienvenue se rejouera */
    }
    const chars = [...`Bienvenue chez ${nom}`];
    const PAS = 62;
    const FIN = chars.length * PAS + 900;
    window.setTimeout(() => setBienvenue("frappe"), 0);
    let i = 0;
    const typer = window.setInterval(() => {
      i += 1;
      setFrappe(chars.slice(0, i).join(""));
      if (i >= chars.length) window.clearInterval(typer);
    }, PAS);
    window.setTimeout(() => setBienvenue("leve"), FIN);
    window.setTimeout(() => setBienvenue("off"), FIN + 800);
  }, [inPreview, nom]);

  /* En-tête compact, barre de progression et révélations, sur le bon défileur. */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const scroller = scrollParentOf(el);
    const target: HTMLElement | Window = scroller ?? window;
    const read = () => {
      const y = scroller ? scroller.scrollTop : window.scrollY;
      const max = scroller ? scroller.scrollHeight - scroller.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 24);
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
    };
    read();
    target.addEventListener("scroll", read, { passive: true });

    el.classList.add("x-js");
    const cibles = Array.from(el.querySelectorAll<HTMLElement>("[data-x-reveal]"));
    const montrer = (c: Element) => c.classList.add("x-in");
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              montrer(e.target);
              io?.unobserve(e.target);
            }
          }),
        { root: scroller, rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
      );
      cibles.forEach((c) => io?.observe(c));
    }
    const garde = window.setTimeout(() => cibles.forEach(montrer), 2500);
    return () => {
      target.removeEventListener("scroll", read);
      io?.disconnect();
      window.clearTimeout(garde);
    };
  }, [photos.length]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = waLink(`Bonjour ${nom},\n\nJe m'appelle ${form.nom || "—"}. ${form.message}\n\nMe joindre : ${form.contact || "—"}`);
    if (url && !inPreview) window.open(url, "_blank", "noopener");
    setEnvoye(true);
  };

  const localiser = () => {
    if (!point) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return setGeo({ etat: "absent" });
    setGeo({ etat: "demande" });
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude: lat, longitude: lng } = p.coords;
        setGeo({ etat: "ok", lat, lng, km: distanceKm({ lat, lng }, point) });
      },
      () => setGeo({ etat: "refus" }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  return (
    <div ref={root} className="exo" style={{ ...customVars(themeId), "--x-hero-h": inPreview ? "560px" : "100svh" } as React.CSSProperties}>
      <style>{css}</style>

      <header className={`x-head${scrolled ? " is-scrolled" : ""}`}>
        <div className="x-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
        <div className="x-wrap x-head-in">
          <a href={link("#x-top")} className="x-head-logo" aria-label={`${nom}, accueil`}>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="x-mark" src={logoUrl} alt="" width={28} height={28} />
            )}
            <span className="x-head-nom">{nom}</span>
          </a>
          <nav className="x-head-nav">
            {photos.length > 0 && <a href={link("#x-galerie")}>Galerie</a>}
            <a href={link("#x-contact")}>Contact</a>
            {telHref && (
              <a className="x-btn x-btn-light x-btn-sm" href={link(telHref)}>
                <PhoneIcon size={16} /> Appeler
              </a>
            )}
          </nav>
        </div>
      </header>

      <main id="x-top">
        <section
          className={`x-hero${bienvenue !== "off" ? " is-welcome" : ""}`}
          style={visuel ? ({ "--x-hero-img": `url('${visuel}')` } as React.CSSProperties) : undefined}
        >
          <div className="x-hero-bg" aria-hidden="true" />
          {bienvenue !== "off" && (
            <div className={`x-welcome${bienvenue === "leve" ? " x-welcome-up" : ""}`} aria-hidden="true">
              <p className="x-welcome-texte">
                {frappe}
                <span className="x-welcome-caret" />
              </p>
            </div>
          )}
          <div className="x-wrap x-hero-in">
            <div className="x-hero-copy">
              <span className="x-rise" style={{ "--d": "60ms" } as React.CSSProperties}>
                <Wordmark nom={nom} tagline={tagline} logoUrl={logoUrl} />
              </span>
              <h1 className="x-rise" style={{ "--d": "160ms" } as React.CSSProperties}>
                {titre}
              </h1>
              {texte && (
                <p className="x-rise" style={{ "--d": "260ms" } as React.CSSProperties}>
                  {texte}
                </p>
              )}
              <div className="x-hero-cta x-rise" style={{ "--d": "360ms" } as React.CSSProperties}>
                <a className="x-btn x-btn-light" href={link("#x-contact")}>
                  Nous contacter
                </a>
                {photos.length > 0 && (
                  <a className="x-btn x-btn-ghost" href={link("#x-galerie")}>
                    Voir la galerie
                  </a>
                )}
              </div>
              {address && (
                <p className="x-hero-adr x-rise" style={{ "--d": "460ms" } as React.CSSProperties}>
                  {address}
                </p>
              )}
            </div>
            {visuel && (
              <div className="x-hero-photo x-rise" style={{ "--d": "320ms" } as React.CSSProperties}>
                <div className="x-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="x-kenburns" src={visuel} alt={`Visuel de ${nom}`} />
                </div>
              </div>
            )}
          </div>
        </section>

        {photos.length > 0 && (
          <section id="x-galerie" className="x-section">
            <div className="x-wrap">
              <h2 data-x-reveal className="x-reveal">
                Galerie
              </h2>
              <p data-x-reveal className="x-reveal x-lede" style={{ "--d": "90ms" } as React.CSSProperties}>
                {photos.length} photo{photos.length > 1 ? "s" : ""}. Chaque carte s’ouvre en pleine image.
              </p>
              <div className="x-grid">
                {photos.map((src, i) => (
                  <a
                    className="x-card x-reveal"
                    data-x-reveal
                    style={{ "--d": `${(i % 4) * 70}ms` } as React.CSSProperties}
                    href={link(src)}
                    key={`${src}-${i}`}
                    target="_blank"
                    rel="noopener"
                  >
                    <span className="x-card-img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`${nom}, photo ${i + 1}`} loading="lazy" decoding="async" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="x-contact" className="x-section x-section-alt">
          <div className="x-wrap x-contact-in">
            {digits && (
              <div data-x-reveal className="x-reveal">
                <h2>Contact</h2>
                <p className="x-lede">Écrivez-nous : votre message s’ouvre dans WhatsApp, on vous répond rapidement.</p>
                <form onSubmit={onSubmit} className="x-form">
                  <label>
                    Nom
                    <input required value={form.nom} onChange={set("nom")} placeholder="Votre nom" autoComplete="name" />
                  </label>
                  <label>
                    Téléphone ou e-mail
                    <input required value={form.contact} onChange={set("contact")} placeholder="01 …  ou  vous@exemple.com" autoComplete="tel" />
                  </label>
                  <label>
                    Message
                    <textarea required rows={4} value={form.message} onChange={set("message")} placeholder="Bonjour, je souhaite…" />
                  </label>
                  <button className="x-btn x-btn-primary" type="submit">
                    Envoyer le message
                  </button>
                  <p className={`x-note${envoye ? " show" : ""}`} role="status">
                    Message prêt dans WhatsApp. Vous pouvez aussi nous appeler au{" "}
                    <a href={link(telHref)}>{phoneNumber}</a>.
                  </p>
                </form>
              </div>
            )}

            <aside data-x-reveal className="x-reveal x-coords" style={{ "--d": "160ms" } as React.CSSProperties}>
              {point && <Plan point={point} href={itin} />}
              <dl>
                {phoneNumber && (
                  <>
                    <dt>Téléphone</dt>
                    <dd>
                      <a href={link(telHref)}>{phoneNumber}</a>
                    </dd>
                  </>
                )}
                {address && (
                  <>
                    <dt>Adresse</dt>
                    <dd>{address}</dd>
                  </>
                )}
                {horaires.length > 0 && (
                  <>
                    <dt>Horaires</dt>
                    <dd>
                      {horaires.map(([key, label]) => (
                        <span key={key} className="x-hour">
                          <span>{label}</span>
                          <span className="x-muted">
                            {schedule![key].isOpen ? `${schedule![key].open} – ${schedule![key].close}` : "Fermé"}
                          </span>
                        </span>
                      ))}
                    </dd>
                  </>
                )}
              </dl>

              {point && (
                <div className="x-geo">
                  <button type="button" className="x-btn x-btn-geo" onClick={localiser} disabled={geo.etat === "demande" || inPreview}>
                    <PinIcon size={17} />
                    {geo.etat === "demande" ? "Localisation en cours…" : "Itinéraire depuis ma position"}
                  </button>
                  <p className="x-geo-msg" role="status" key={geo.etat}>
                    {geo.etat === "ok" && (
                      <>
                        Nous sommes à environ{" "}
                        <strong>{geo.km! < 10 ? geo.km!.toFixed(1).replace(".", ",") : Math.round(geo.km!)} km</strong> de vous (à vol
                        d’oiseau).{" "}
                        <a href={itinLink(point, locationUrl, { lat: geo.lat!, lng: geo.lng! })} target="_blank" rel="noopener">
                          Ouvrir l’itinéraire
                        </a>
                      </>
                    )}
                    {(geo.etat === "refus" || geo.etat === "absent") && (
                      <>
                        Position indisponible.{" "}
                        <a href={link(itin)} target="_blank" rel="noopener">
                          Ouvrir Google Maps
                        </a>
                      </>
                    )}
                    {geo.etat === "demande" && <>Calcul de la distance depuis votre position…</>}
                    {geo.etat === "repos" && (
                      <>
                        <a href={link(itin)} target="_blank" rel="noopener">
                          Itinéraire vers {nom}
                        </a>
                        .
                      </>
                    )}
                  </p>
                </div>
              )}

              {digits && (
                <a className="x-btn x-btn-wa" href={link(waLink(`Bonjour ${nom}, j'aimerais avoir des informations.`))} target="_blank" rel="noopener">
                  <WhatsAppIcon size={18} /> Écrire sur WhatsApp
                </a>
              )}
            </aside>
          </div>
        </section>
      </main>

      <footer className="x-foot">
        <div className="x-wrap x-foot-in">
          <div data-x-reveal className="x-reveal">
            <Wordmark nom={nom} tagline={tagline} logoUrl={logoUrl} />
          </div>
          <div data-x-reveal className="x-reveal x-foot-col" style={{ "--d": "90ms" } as React.CSSProperties}>
            {phoneNumber && (
              <p>
                <strong>Téléphone</strong>
                <a href={link(telHref)}>{phoneNumber}</a>
              </p>
            )}
            {reseaux.length > 0 && (
              <p>
                <strong>Réseaux</strong>
                {reseaux.map((r, i) => (
                  <span key={r.label}>
                    {i > 0 && " · "}
                    <a href={link(r.href)} target="_blank" rel="noopener">
                      {r.label}
                    </a>
                  </span>
                ))}
              </p>
            )}
          </div>
          {address && (
            <div data-x-reveal className="x-reveal x-foot-col" style={{ "--d": "180ms" } as React.CSSProperties}>
              <p>
                <strong>Adresse</strong>
                {address}
              </p>
            </div>
          )}
        </div>
        <div className="x-wrap x-foot-bottom">
          <span>
            © {new Date().getFullYear()} {nom}
            {tagline ? ` — ${tagline}` : ""}
          </span>
        </div>
      </footer>

      {digits && (
        <div className="x-wa-dock">
          <a className="x-wa-fixed" href={link(waLink(`Bonjour ${nom},`))} target="_blank" rel="noopener" aria-label="Écrire sur WhatsApp">
            <WhatsAppIcon size={24} />
          </a>
        </div>
      )}
    </div>
  );
}

/** Palette libre → variables ; sinon les couleurs d'origine du site, à l'identique. */
function customVars(themeId?: string | null) {
  const palette = decodeCustom(themeId);
  return palette ? exoticasVars(palette) : undefined;
}

/* ------------------------------------------------------------------
   Styles : ceux d'Exoticas, isolés sous .exo (pas de fuite vers le site
   Moncode), media queries → container queries.
------------------------------------------------------------------ */

const css = `
.exo{
  --vert:#466931;--vert-fonce:#3A5528;--vert-nuit:#2C4220;--vert-accent:#6EA03F;
  --creme:#F7F6F1;--texte:#22331B;--muted:#6E7A66;--line:#DDE2D6;--r:8px;
  --sur-vert:#fff;--ombre:#14230C;--line-fort:#C3CDB8;
  --ease:cubic-bezier(.22,.61,.36,1);--ease-out:cubic-bezier(.16,1,.3,1);
  --lbl:600 .74rem/1.2 ui-sans-serif,system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;--lbl-space:.16em;
  --glace:rgba(255,255,255,.62);--glace-forte:rgba(255,255,255,.78);
  --glace-bord:1px solid color-mix(in srgb,var(--ombre) 9%,transparent);
  --glace-relu:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 0 1px rgba(255,255,255,.28);
  --glace-ombre:0 1px 2px color-mix(in srgb,var(--ombre) 6%,transparent),0 14px 34px color-mix(in srgb,var(--ombre) 12%,transparent);
  --glace-ombre-h:0 3px 7px color-mix(in srgb,var(--ombre) 9%,transparent),0 22px 48px color-mix(in srgb,var(--ombre) 18%,transparent);
  --flou:blur(14px) saturate(1.25);
  container-type:inline-size;position:relative;min-height:100%;
  color:var(--texte);background:var(--creme);
  font:16.5px/1.62 ui-sans-serif,system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;overflow-x:clip;text-align:left;
}
.exo *{box-sizing:border-box}
.exo h1,.exo h2,.exo h3{margin:0 0 .55rem;font-weight:550;text-wrap:balance;color:inherit}
.exo h1{font-size:clamp(2.35rem,4.6vw,3.45rem);line-height:1.04;letter-spacing:-.035em}
.exo h2{font-size:clamp(1.65rem,2.6vw,2.15rem);line-height:1.1;letter-spacing:-.03em}
.exo p{margin:0 0 1rem;text-wrap:pretty}
.exo a{color:inherit}
.exo img{display:block;max-width:100%}
.exo .x-wrap{max-width:1080px;margin:0 auto;padding:0 20px}
.exo .x-muted{color:var(--muted)}
.exo section[id]{scroll-margin-top:88px}
.exo h2::before{content:"";display:block;width:44px;height:1px;background:var(--vert-accent);
  margin:0 0 20px;transform-origin:0 50%;transition:transform .7s var(--ease-out) .12s}
.exo.x-js h2::before{transform:scaleX(0)}
.exo.x-js .x-in h2::before,.exo.x-js h2.x-in::before{transform:scaleX(1)}

/* barre de progression */
.exo .x-progress{position:absolute;inset:0 auto auto 0;height:2px;width:100%;z-index:2;
  background:var(--vert-accent);transform-origin:0 50%;transform:scaleX(0);transition:transform .12s linear}

/* header : collant dans la colonne, posé sur le hero */
.exo .x-head{position:sticky;top:0;z-index:50;color:var(--sur-vert);margin-bottom:-72px;padding:6px 0;
  transition:box-shadow .45s var(--ease)}
.exo .x-head::before{content:"";position:absolute;inset:0;background:var(--vert);opacity:0;transition:opacity .45s var(--ease);z-index:-1}
.exo .x-head.is-scrolled::before{opacity:1}
.exo .x-head.is-scrolled{box-shadow:0 6px 24px color-mix(in srgb,var(--ombre) 18%,transparent)}
.exo .x-head-in{display:flex;align-items:center;justify-content:space-between;height:60px;transition:height .45s var(--ease)}
.exo .x-head.is-scrolled .x-head-in{height:54px}
.exo .x-head-logo{display:flex;align-items:center;gap:9px;color:var(--sur-vert);text-decoration:none;min-width:0}
.exo .x-head-nom{font-size:1.15rem;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.exo .x-mark{border-radius:6px;object-fit:cover;transition:transform .6s var(--ease-out)}
.exo .x-head-logo:hover .x-mark{transform:rotate(-8deg) scale(1.06)}
.exo .x-head-nav{display:flex;align-items:center;gap:22px;font-size:.95rem}
.exo .x-head-nav a:not(.x-btn){text-decoration:none;color:var(--sur-vert);position:relative}
.exo .x-head-nav a:not(.x-btn)::after{content:"";position:absolute;left:0;bottom:-6px;height:1.5px;width:100%;
  background:currentColor;transform:scaleX(0);transform-origin:0 50%;transition:transform .35s var(--ease-out)}
.exo .x-head-nav a:not(.x-btn):hover::after{transform:scaleX(1)}

/* boutons */
.exo .x-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  border:1px solid transparent;border-radius:var(--r);padding:12px 20px;text-decoration:none;
  font:inherit;font-size:.95rem;line-height:1.2;cursor:pointer;position:relative;overflow:hidden;
  transition:transform .3s var(--ease-out),box-shadow .3s var(--ease-out),background .3s var(--ease),color .3s var(--ease)}
.exo .x-btn::after{content:"";position:absolute;inset:0;background:rgba(255,255,255,.22);transform:translateX(-101%);transition:transform .55s var(--ease-out)}
.exo .x-btn:hover::after{transform:translateX(0)}
.exo .x-btn:hover{transform:translateY(-2px);box-shadow:0 10px 24px color-mix(in srgb,var(--ombre) 22%,transparent)}
.exo .x-btn:active{transform:translateY(0)}
.exo .x-btn-light{background:#fff;color:var(--vert);border-color:#fff}
.exo .x-btn-light:hover{background:var(--creme)}
.exo .x-btn-primary{background:var(--vert);color:var(--sur-vert)}
.exo .x-btn-primary:hover{background:var(--vert-fonce)}
.exo .x-btn-ghost{background:transparent;color:var(--sur-vert);border-color:color-mix(in srgb,var(--sur-vert) 50%,transparent)}
.exo .x-btn-ghost:hover{background:color-mix(in srgb,var(--sur-vert) 12%,transparent);border-color:var(--sur-vert)}
.exo .x-btn-sm{padding:9px 15px;font-size:.9rem}
.exo .x-btn-wa{background:#fff;color:var(--vert);border-color:var(--line);width:100%}
.exo .x-btn-wa:hover{background:var(--creme)}

/* hero */
.exo .x-hero{position:relative;background:var(--vert);color:var(--sur-vert);padding:150px 0 96px;overflow:hidden}
.exo .x-hero-bg{position:absolute;inset:0;background-image:var(--x-hero-img);background-size:cover;background-position:50% 34%;opacity:0;transition:opacity .8s var(--ease)}
.exo .x-hero-in{position:relative;display:grid;grid-template-columns:1.15fr .85fr;gap:44px;align-items:center}
.exo .x-wordmark{display:inline-flex;align-items:center;gap:10px;color:var(--sur-vert)}
.exo .x-wordmark-text{display:flex;flex-direction:column;line-height:1.1}
.exo .x-wordmark-nom{font-size:1.5rem}
.exo .x-wordmark-sig{font-size:.72rem;letter-spacing:.32em;text-transform:uppercase;opacity:.85}
.exo .x-hero-copy h1{margin:24px 0 18px;max-width:15ch}
.exo .x-hero-copy p{max-width:44ch;font-size:1.06rem;line-height:1.55;color:color-mix(in srgb,var(--sur-vert) 92%,transparent)}
.exo .x-hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.exo .x-hero-adr{margin:24px 0 0;font-size:.95rem;color:color-mix(in srgb,var(--sur-vert) 82%,transparent)}
.exo .x-hero-photo{display:flex;justify-content:flex-end}
.exo .x-frame{position:relative;width:100%;max-width:340px;aspect-ratio:1/1;border-radius:14px;overflow:hidden;
  border:1px solid color-mix(in srgb,var(--sur-vert) 28%,transparent);box-shadow:0 24px 60px color-mix(in srgb,var(--ombre) 35%,transparent);background:var(--vert-fonce)}
.exo .x-frame img{width:100%;height:100%;object-fit:cover;object-position:50% 38%}
.exo .x-kenburns{animation:x-kb 22s ease-in-out infinite alternate}
@keyframes x-kb{from{transform:scale(1.02)}to{transform:scale(1.14) translate(-2%,-3%)}}

/* bienvenue dactylographiée */
.exo .x-hero.is-welcome .x-rise{animation-play-state:paused}
.exo .x-welcome{position:absolute;inset:0;z-index:2;display:grid;place-items:center;padding:0 24px;
  background:var(--vert);color:var(--sur-vert);text-align:center;transition:transform .8s var(--ease)}
.exo .x-welcome-up{transform:translateY(-100%)}
.exo .x-welcome-texte{margin:0;min-height:1.2em;font-size:clamp(1.4rem,4.6vw,2.15rem);line-height:1.15;letter-spacing:-.02em}
.exo .x-welcome-caret{display:inline-block;width:2px;height:1.05em;margin-left:3px;vertical-align:-.12em;background:currentColor;animation:x-caret 1.05s steps(1,end) infinite}
@keyframes x-caret{50%{opacity:0}}

.exo .x-rise{animation:x-rise .9s var(--ease-out) both;animation-delay:var(--d,0ms)}
@keyframes x-rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}

.exo.x-js [data-x-reveal]{opacity:0;transform:translateY(26px);
  transition:opacity .8s var(--ease-out) var(--d,0ms),transform .8s var(--ease-out) var(--d,0ms)}
.exo.x-js [data-x-reveal].x-in{opacity:1;transform:none}

/* sections */
.exo .x-section{padding:clamp(64px,8vw,104px) 0}
.exo .x-section-alt{background:var(--creme);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.exo .x-lede{color:var(--muted);font-size:1.04rem;line-height:1.6;max-width:52ch;margin:0 0 8px}

/* galerie : planche-contact sur plaques de verre */
.exo .x-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:30px}
.exo .x-card{display:flex;flex-direction:column;text-decoration:none;color:inherit;
  background:var(--glace);border:var(--glace-bord);border-radius:var(--r);padding:6px;
  box-shadow:var(--glace-relu),var(--glace-ombre);
  transition:transform .4s var(--ease-out),box-shadow .4s var(--ease-out),background .3s var(--ease)}
.exo .x-card:hover{transform:translateY(-3px);background:var(--glace-forte);box-shadow:var(--glace-relu),var(--glace-ombre-h)}
.exo .x-card:focus-visible{outline:2px solid var(--vert);outline-offset:3px}
.exo .x-card-img{display:block;overflow:hidden;aspect-ratio:3/4;background:var(--creme);border-radius:5px}
.exo .x-card-img img{width:100%;height:100%;object-fit:cover;display:block}

/* contact */
.exo .x-contact-in{display:grid;grid-template-columns:1.1fr .9fr;gap:52px;align-items:start}
.exo .x-form{display:grid;gap:18px;width:100%;max-width:560px;margin:26px auto 0;padding:26px 26px 28px;
  background:var(--glace);border:var(--glace-bord);border-radius:var(--r);
  box-shadow:var(--glace-relu),var(--glace-ombre);backdrop-filter:var(--flou);-webkit-backdrop-filter:var(--flou)}
.exo .x-form label{display:grid;gap:7px;font:var(--lbl);letter-spacing:var(--lbl-space);text-transform:uppercase;color:var(--muted)}
.exo .x-form input,.exo .x-form textarea{font-family:inherit;font-size:1rem;line-height:1.5;color:var(--texte);
  background:rgba(255,255,255,.72);border:var(--glace-bord);box-shadow:var(--glace-relu),inset 0 1px 2px color-mix(in srgb,var(--ombre) 5%,transparent);
  border-radius:var(--r);padding:11px 13px;width:100%;text-transform:none;letter-spacing:normal;font-weight:400;
  transition:border-color .3s var(--ease),box-shadow .3s var(--ease),background .3s var(--ease)}
.exo .x-form input:hover,.exo .x-form textarea:hover{border-color:var(--line-fort);background:rgba(255,255,255,.85)}
.exo .x-form input:focus,.exo .x-form textarea:focus{outline:none;border-color:var(--vert);background:#fff;
  box-shadow:0 0 0 3px color-mix(in srgb,var(--vert-accent) 22%,transparent),inset 0 1px 2px color-mix(in srgb,var(--ombre) 4%,transparent)}
.exo .x-form .x-btn{justify-self:start;margin-top:4px}
.exo .x-note{font-size:.88rem;color:var(--muted);border-left:2px solid var(--vert-accent);padding-left:12px;margin:0;
  max-height:0;opacity:0;overflow:hidden;transition:max-height .6s var(--ease-out),opacity .6s var(--ease)}
.exo .x-note.show{max-height:120px;opacity:1}
.exo .x-coords{background:var(--glace);border:var(--glace-bord);border-radius:var(--r);padding:0 26px 24px;overflow:hidden;
  box-shadow:var(--glace-relu),var(--glace-ombre);transition:transform .5s var(--ease-out),box-shadow .5s var(--ease-out)}
.exo .x-coords:hover{transform:translateY(-4px);box-shadow:var(--glace-relu),var(--glace-ombre-h)}
.exo .x-coords dl{display:grid;grid-template-columns:88px 1fr;gap:9px 16px;margin:22px 0;font-size:.96rem}
.exo .x-coords dt{font:var(--lbl);letter-spacing:var(--lbl-space);text-transform:uppercase;color:var(--muted);padding-top:4px}
.exo .x-coords dd{margin:0}
.exo .x-coords a{text-decoration:none;border-bottom:1px solid var(--line);transition:border-color .3s var(--ease),color .3s var(--ease)}
.exo .x-coords a:hover{color:var(--vert);border-color:var(--vert)}
.exo .x-coords a.x-btn,.exo .x-coords a.x-map{border-bottom:0}
.exo .x-hour{display:flex;justify-content:space-between;gap:12px;font-size:.9rem}

/* carte OSM */
.exo .x-map{position:relative;display:block;overflow:hidden;border:0;border-bottom:1px solid var(--line) !important;
  aspect-ratio:1/1;margin:0 -26px 22px;background:var(--creme);text-decoration:none}
.exo .x-map-layer{position:absolute;width:150%;aspect-ratio:1/1;display:grid;grid-template-columns:repeat(3,1fr);transition:transform .9s var(--ease-out)}
.exo .x-map:hover .x-map-layer{transform:scale(1.07)}
.exo .x-map-layer img{width:100%;height:auto;display:block}
.exo .x-map-pin{position:absolute;left:50%;top:50%;color:var(--vert);transform:translate(-50%,-92%);filter:drop-shadow(0 4px 8px color-mix(in srgb,var(--ombre) 35%,transparent))}
.exo .x-map-pin svg{animation:x-pin 2.8s var(--ease) infinite}
@keyframes x-pin{0%,55%,100%{transform:translateY(0)}70%{transform:translateY(-7px)}85%{transform:translateY(0)}}
.exo .x-map-cta{position:absolute;right:9px;bottom:9px;color:var(--vert);font-size:.76rem;font-weight:600;padding:6px 11px;border-radius:var(--r);
  opacity:0;transform:translateY(8px);background:var(--glace-forte);border:var(--glace-bord);box-shadow:var(--glace-relu),0 6px 16px color-mix(in srgb,var(--ombre) 20%,transparent);
  backdrop-filter:blur(9px) saturate(1.3);-webkit-backdrop-filter:blur(9px) saturate(1.3);transition:opacity .4s var(--ease),transform .4s var(--ease-out)}
.exo .x-map:hover .x-map-cta,.exo .x-map:focus-visible .x-map-cta{opacity:1;transform:none}
.exo .x-map-cred{position:absolute;left:8px;bottom:7px;font-size:.66rem;color:#3d4c36;background:rgba(255,255,255,.66);
  border:var(--glace-bord);box-shadow:var(--glace-relu);padding:2px 7px;border-radius:4px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.exo .x-geo{display:grid;gap:10px;margin:0 0 18px}
.exo .x-btn-geo{background:var(--glace-forte);color:var(--vert);border:var(--glace-bord);box-shadow:var(--glace-relu),0 2px 8px color-mix(in srgb,var(--ombre) 8%,transparent);width:100%}
.exo .x-btn-geo:hover:not(:disabled){background:#fff}
.exo .x-btn-geo:disabled{opacity:.65;cursor:default;transform:none;box-shadow:none}
.exo .x-btn-geo svg{animation:x-nudge 2.4s var(--ease) infinite}
@keyframes x-nudge{0%,70%,100%{transform:translateY(0)}80%{transform:translateY(-3px)}90%{transform:translateY(0)}}
.exo .x-geo-msg{margin:0;font-size:.85rem;color:var(--muted);animation:x-fadein .6s var(--ease-out) both}
.exo .x-geo-msg strong{color:var(--texte);font-weight:600}
.exo .x-geo-msg a{color:var(--vert);border-bottom:1px solid var(--line)}
@keyframes x-fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* footer */
.exo .x-foot{background:var(--vert);color:var(--sur-vert);padding:clamp(68px,8vw,96px) 0 40px}
.exo .x-foot-in{display:grid;grid-template-columns:1.2fr 1fr 1.2fr;gap:32px}
.exo .x-foot-col p{margin:0 0 14px;font-size:1rem;color:color-mix(in srgb,var(--sur-vert) 92%,transparent)}
.exo .x-foot-col strong{display:block;font:var(--lbl);font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;color:color-mix(in srgb,var(--sur-vert) 62%,transparent);margin-bottom:9px}
.exo .x-foot-col a{text-decoration:none;border-bottom:1px solid transparent;transition:border-color .3s var(--ease)}
.exo .x-foot-col a:hover{border-color:color-mix(in srgb,var(--sur-vert) 70%,transparent)}
.exo .x-foot-bottom{margin-top:28px;padding-top:14px;border-top:1px solid color-mix(in srgb,var(--sur-vert) 16%,transparent);font-size:.82rem;color:color-mix(in srgb,var(--sur-vert) 62%,transparent)}

/* whatsapp flottant : collé en bas de la colonne */
.exo .x-wa-dock{position:sticky;bottom:18px;z-index:55;height:0;display:flex;justify-content:flex-end;padding-right:18px}
.exo .x-wa-fixed{position:relative;width:54px;height:54px;margin-top:-54px;border-radius:50%;background:var(--vert);color:var(--sur-vert);
  display:grid;place-items:center;text-decoration:none;box-shadow:0 8px 22px color-mix(in srgb,var(--ombre) 30%,transparent);
  transition:transform .35s var(--ease-out),background .3s var(--ease)}
.exo .x-wa-fixed::before{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid var(--vert-accent);animation:x-pulse 2.6s var(--ease-out) infinite}
.exo .x-wa-fixed:hover{background:var(--vert-fonce);transform:scale(1.08)}
@keyframes x-pulse{0%{transform:scale(1);opacity:.7}70%{transform:scale(1.55);opacity:0}100%{opacity:0}}

/* grande largeur : hero plein cadre, contenu centré */
@container (min-width:821px){
  .exo .x-hero{min-height:var(--x-hero-h);display:grid;grid-template-columns:minmax(0,1fr);align-content:center}
  .exo .x-hero .x-hero-in{width:100%}
  .exo .x-hero .x-frame{max-width:clamp(340px,46vh,440px)}
}
@container (max-width:900px){
  .exo .x-grid{grid-template-columns:repeat(3,1fr)}
  .exo .x-contact-in,.exo .x-foot-in{grid-template-columns:1fr;gap:30px}
}
/* colonne étroite (téléphone, /c/…) : photo en fond, bande verte en bas */
@container (max-width:820px){
  .exo .x-hero{min-height:var(--x-hero-h);display:grid;align-content:end;padding:96px 0 26px}
  .exo .x-hero-bg{opacity:1;animation:x-zoom 26s var(--ease) infinite alternate}
  .exo .x-hero-in{grid-template-columns:1fr;gap:0}
  .exo .x-hero-copy{background:var(--vert);padding:24px 20px;border-radius:12px;box-shadow:0 18px 44px color-mix(in srgb,var(--ombre) 28%,transparent)}
  .exo .x-hero-photo{display:none}
  .exo .x-hero-cta{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .exo .x-hero-cta .x-btn{padding:12px 10px;font-size:.9rem}
  .exo .x-head-nav{gap:12px;font-size:.88rem}
  .exo .x-section{padding:48px 0}
  .exo .x-grid{grid-template-columns:repeat(3,1fr);gap:12px}
  .exo h1{font-size:2.35rem}
  .exo h2{font-size:1.65rem}
}
@keyframes x-zoom{from{transform:scale(1)}to{transform:scale(1.12)}}
@container (max-width:620px){
  .exo .x-grid{grid-template-columns:repeat(2,1fr)}
}
@container (max-width:460px){
  .exo .x-hero-cta{grid-template-columns:1fr}
  .exo .x-head-nav a:not(.x-btn){display:none}
}

@media (prefers-reduced-motion:reduce){
  .exo *,.exo *::before,.exo *::after{animation:none!important;transition:none!important}
  .exo.x-js [data-x-reveal]{opacity:1;transform:none}
  .exo .x-rise{opacity:1}
}
`;
