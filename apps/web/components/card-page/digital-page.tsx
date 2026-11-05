"use client";

import { useEffect, useRef, useState } from "react";
import type { PageContent, ResolvedPalette } from "@/lib/page-design";
import { formatTel } from "@/lib/page-design";

/**
 * Page digitale Moncode — design repris tel quel du site Exoticas (hero en
 * couleur de marque, galerie en plaques de glace, contact + carte, pied de
 * page), à trois différences près : tout est paramétré (textes, images, logo,
 * palette), les sections sans données disparaissent, et les règles sont
 * portées par `.exo-page` pour que le même rendu puisse vivre dans l'aperçu de
 * l'éditeur sans contaminer le reste de l'application.
 */

const ZOOM = 16;

function waLink(num: string, message: string) {
  const digits = num.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function itinLink(lat?: number | null, lng?: number | null, depuis?: { lat: number; lng: number }) {
  const d = lat != null && lng != null ? `destination=${lat},${lng}` : `destination=${encodeURIComponent("")}`;
  const o = depuis ? `origin=${depuis.lat},${depuis.lng}&` : "";
  return `https://www.google.com/maps/dir/?api=1&${o}${d}`;
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const m =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(m), Math.sqrt(1 - m));
}

function tuileDe(lat: number, lng: number, z: number) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
  return { x, y };
}

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

function ClockIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5V12l3.2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function Plan({ lat, lng }: { lat: number; lng: number }) {
  const { x, y } = tuileDe(lat, lng, ZOOM);
  const x0 = Math.floor(x) - 1;
  const y0 = Math.floor(y) - 1;
  const u = (x - x0) / 3;
  const v = (y - y0) / 3;
  const tuiles = [];
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 3; i++) {
      tuiles.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img key={`${i}-${j}`} src={`https://tile.openstreetmap.org/${ZOOM}/${x0 + i}/${y0 + j}.png`} width={256} height={256} alt="" loading="lazy" />
      );
    }
  }
  return (
    <a className="map" href={itinLink(lat, lng)} target="_blank" rel="noopener" aria-label="Ouvrir l'accès dans Google Maps">
      <span
        className="map-layer"
        style={{ left: `${(0.5 - 1.5 * u) * 100}%`, top: `${(0.5 - 1.5 * v) * 100}%`, transformOrigin: `${u * 100}% ${v * 100}%` } as React.CSSProperties}
      >
        {tuiles}
      </span>
      <span className="map-pin">
        <PinIcon size={28} />
      </span>
      <span className="map-cta">Ouvrir dans Google Maps</span>
      <span className="map-cred">© OpenStreetMap</span>
    </a>
  );
}

type Geo = { etat: "repos" | "demande" | "ok" | "refus" | "absent"; lat?: number; lng?: number; km?: number };

export default function DigitalPage({
  content,
  palette,
  preview = false,
}: {
  content: PageContent;
  palette: ResolvedPalette;
  /** Aperçu dans l'éditeur : pas de bandeau fixe, pas de plein écran. */
  preview?: boolean;
}) {
  const [form, setForm] = useState({ nom: "", contact: "", message: "" });
  const [envoye, setEnvoye] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [geo, setGeo] = useState<Geo>({ etat: "repos" });
  const root = useRef<HTMLDivElement>(null);

  const c = content;
  const telEspace = c.tel ? formatTel(c.tel) : "";
  const telHref = c.tel ? `tel:+${c.tel.replace(/\D/g, "")}` : "";
  const hasGallery = c.gallery.length > 0;
  const hasHero = !!c.heroImageUrl;
  const hasCoords = c.lat != null && c.lng != null;

  /* révélation au scroll, avec garde-fou : rien ne reste caché */
  useEffect(() => {
    const box = root.current;
    if (!box) return;
    const cibles = Array.from(box.querySelectorAll<HTMLElement>("[data-reveal]"));
    const montrer = (el: Element) => el.classList.add("in");
    const dansVue = () => cibles.forEach((el) => el.getBoundingClientRect().top < window.innerHeight * 0.92 && montrer(el));
    dansVue();
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && (montrer(e.target), io?.unobserve(e.target))),
        { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
      );
      cibles.forEach((el) => io?.observe(el));
    }
    const garde = window.setTimeout(() => cibles.forEach(montrer), 2500);
    return () => {
      io?.disconnect();
      window.clearTimeout(garde);
    };
  }, [hasGallery, c.brandName]);

  /* en-tête compact + barre de progression (hors aperçu) */
  useEffect(() => {
    if (preview) return;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [preview]);

  function localiser() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return setGeo({ etat: "absent" });
    setGeo({ etat: "demande" });
    navigator.geolocation.getCurrentPosition(
      (p) => setGeo({ etat: "ok", lat: p.coords.latitude, lng: p.coords.longitude, km: distanceKm({ lat: p.coords.latitude, lng: p.coords.longitude }, { lat: c.lat!, lng: c.lng! }) }),
      () => setGeo({ etat: "refus" }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = `Bonjour ${c.brandName || ""},\n\nJe m'appelle ${form.nom || "—"}. ${form.message}\n\nMe joindre : ${form.contact || "—"}`;
    window.open(waLink(c.whatsapp || c.tel, msg), "_blank", "noopener");
    setEnvoye(true);
  }

  const vars = {
    "--brand": palette.brand,
    "--brand-dark": palette.brandDark,
    "--brand-night": palette.brandNight,
    "--accent": palette.accent,
    "--surface": palette.surface,
    "--text": palette.text,
    "--muted": palette.muted,
    "--line": palette.line,
    "--on-brand": palette.onBrand,
  } as React.CSSProperties;

  return (
    <div ref={root} className={`exo-page${preview ? " exo-preview" : ""}${scrolled ? " is-scrolled" : ""}`} style={vars}>
      <style>{CSS}</style>

      {!preview && <div className="progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />}

      <header className="site-head">
        <div className="wrap head-in">
          <a href="#top" className="head-logo" aria-label={c.brandName}>
            {c.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="mark" src={c.logoUrl} alt="" width={28} height={28} decoding="async" />
            ) : (
              <span className="mark mark-fallback" aria-hidden="true">{(c.brandName || "M").slice(0, 1)}</span>
            )}
            <span className="head-nom">{c.brandName}</span>
          </a>
          <nav className="head-nav">
            {hasGallery && <a href="#galerie">Galerie</a>}
            <a href="#contact">Contact</a>
            {c.tel && (
              <a className="btn btn-light btn-sm" href={telHref}>
                <PhoneIcon size={16} /> Appeler
              </a>
            )}
          </nav>
        </div>
      </header>

      <main id="top">
        <section className={`hero${hasHero ? " has-img" : ""}`}>
          {hasHero && <div className="hero-bg" style={{ backgroundImage: `url('${c.heroImageUrl}')` }} aria-hidden="true" />}
          <div className="wrap hero-in">
            <div className="hero-copy">
              <span className="rise" style={{ "--d": "60ms" } as React.CSSProperties}>
                <span className="wordmark">
                  {c.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="mark" src={c.logoUrl} alt="" width={30} height={30} decoding="async" />
                  )}
                  <span className="wordmark-text">
                    <span className="wordmark-nom">{c.brandName}</span>
                    {c.signature && <span className="wordmark-sig">{c.signature}</span>}
                  </span>
                </span>
              </span>
              {c.headline && (
                <h1 className="rise" style={{ "--d": "160ms" } as React.CSSProperties}>
                  {c.headline}
                </h1>
              )}
              {c.lede && (
                <p className="rise" style={{ "--d": "260ms" } as React.CSSProperties}>
                  {c.lede}
                </p>
              )}
              <div className="hero-cta rise" style={{ "--d": "360ms" } as React.CSSProperties}>
                <a className="btn btn-light" href="#contact">
                  {c.ctaPrimaire}
                </a>
                {hasGallery && (
                  <a className="btn btn-ghost" href="#galerie">
                    {c.ctaSecondaire}
                  </a>
                )}
              </div>
              {c.adresseCourte && (
                <p className="hero-adr rise" style={{ "--d": "460ms" } as React.CSSProperties}>
                  {c.adresseCourte}
                </p>
              )}
            </div>
            {hasHero && (
              <div className="hero-photo rise" style={{ "--d": "320ms" } as React.CSSProperties}>
                <div className="frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="kenburns" src={c.heroImageUrl} alt={c.brandName} />
                </div>
              </div>
            )}
          </div>
        </section>

        {hasGallery && (
          <section id="galerie" className="section">
            <div className="wrap">
              <h2 data-reveal className="reveal">{c.titreGalerie}</h2>
              {c.ledeGalerie && (
                <p data-reveal className="reveal lede" style={{ "--d": "90ms" } as React.CSSProperties}>
                  {c.ledeGalerie}
                </p>
              )}
              <div className="grid">
                {c.gallery.map((g, i) => (
                  <a
                    className="card reveal"
                    data-reveal
                    style={{ "--d": `${(i % 4) * 70}ms` } as React.CSSProperties}
                    href={g.src}
                    key={`${g.src}-${i}`}
                    target="_blank"
                    rel="noopener"
                  >
                    <span className="card-img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.src} alt={g.caption} title={g.caption} loading="lazy" decoding="async" />
                    </span>
                    {g.caption && <figcaption>{g.caption}</figcaption>}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="contact" className="section section-alt">
          <div className="wrap contact-in">
            <div data-reveal className="reveal">
              <h2>{c.titreContact}</h2>
              {c.ledeContact && <p className="lede">{c.ledeContact}</p>}
              <form onSubmit={onSubmit} className="form">
                <label>
                  Nom
                  <input required value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="Votre nom" autoComplete="name" />
                </label>
                <label>
                  Téléphone ou e-mail
                  <input required value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="01 …  ou  vous@exemple.com" autoComplete="tel" />
                </label>
                <label>
                  Message
                  <textarea rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Je souhaite…"></textarea>
                </label>
                <button className="btn btn-primary" type="submit">
                  Envoyer le message
                </button>
                <p className={`note${envoye ? " show" : ""}`} role="status">
                  Message prêt dans WhatsApp. Vous pouvez aussi nous appeler{telHref ? <> au <a href={telHref}>{telEspace}</a></> : null}
                  {c.email ? <> ou écrire à <a href={`mailto:${c.email}`}>{c.email}</a></> : null}.
                </p>
              </form>
            </div>

            <aside data-reveal className="reveal coords" style={{ "--d": "160ms" } as React.CSSProperties}>
              {hasCoords && <Plan lat={c.lat!} lng={c.lng!} />}

              <dl>
                {c.tel && (
                  <>
                    <dt>Téléphone</dt>
                    <dd>
                      <a href={telHref}>{telEspace}</a>
                    </dd>
                  </>
                )}
                {c.email && (
                  <>
                    <dt>Courriel</dt>
                    <dd>
                      <a href={`mailto:${c.email}`}>{c.email}</a>
                    </dd>
                  </>
                )}
                {c.adresseCourte && (
                  <>
                    <dt>Adresse</dt>
                    <dd>{c.adresseCourte}</dd>
                    {c.adresseLongue && <dd className="muted">{c.adresseLongue}</dd>}
                  </>
                )}
                {c.horaires && (
                  <>
                    <dt>Horaires</dt>
                    <dd>{c.horaires}</dd>
                  </>
                )}
                {c.reseaux.length > 0 && (
                  <>
                    <dt>Réseaux</dt>
                    <dd className="socials">
                      {c.reseaux.map((r) => (
                        <a key={r.url} href={r.url} target="_blank" rel="noopener">
                          {r.label}
                        </a>
                      ))}
                    </dd>
                  </>
                )}
              </dl>

              {hasCoords && (
                <div className="geo">
                  <button type="button" className="btn btn-geo" onClick={localiser} disabled={geo.etat === "demande"}>
                    <PinIcon size={17} />
                    {geo.etat === "demande" ? "Localisation en cours…" : "Itinéraire depuis ma position"}
                  </button>
                  <p className="geo-msg" role="status" key={geo.etat}>
                    {geo.etat === "ok" && (
                      <>
                        Nous sommes à environ{" "}
                        <strong>{geo.km! < 10 ? geo.km!.toFixed(1).replace(".", ",") : Math.round(geo.km!)} km</strong> de toi (à vol d&apos;oiseau).{" "}
                        <a href={itinLink(c.lat, c.lng, { lat: geo.lat!, lng: geo.lng! })} target="_blank" rel="noopener">
                          Ouvrir l&apos;itinéraire
                        </a>
                      </>
                    )}
                    {geo.etat === "refus" && (
                      <>
                        Position indisponible — autorise l&apos;accès, ou lance l&apos;itinéraire et indique ton départ.{" "}
                        <a href={itinLink(c.lat, c.lng)} target="_blank" rel="noopener">
                          Ouvrir Google Maps
                        </a>
                      </>
                    )}
                    {geo.etat === "demande" && <>Calcul de la distance depuis ta position…</>}
                    {geo.etat === "absent" && (
                      <>
                        Ce navigateur ne fournit pas de position.{" "}
                        <a href={itinLink(c.lat, c.lng)} target="_blank" rel="noopener">
                          Ouvrir Google Maps
                        </a>
                      </>
                    )}
                    {geo.etat === "repos" && (
                      <>
                        Le repère sur la carte est approximatif :{" "}
                        <a href={itinLink(c.lat, c.lng)} target="_blank" rel="noopener">
                          itinéraire
                        </a>
                        .
                      </>
                    )}
                  </p>
                </div>
              )}

              {(c.whatsapp || c.tel) && (
                <a className="btn btn-wa" href={waLink(c.whatsapp || c.tel, c.messageWa)} target="_blank" rel="noopener">
                  <WhatsAppIcon size={18} /> Écrire sur WhatsApp
                </a>
              )}
            </aside>
          </div>
        </section>
      </main>

      <footer className="site-foot">
        <div className="wrap foot-in">
          <div data-reveal className="reveal">
            <span className="wordmark">
              {c.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="mark" src={c.logoUrl} alt="" width={30} height={30} decoding="async" />
              )}
              <span className="wordmark-text">
                <span className="wordmark-nom">{c.brandName}</span>
                {c.signature && <span className="wordmark-sig">{c.signature}</span>}
              </span>
            </span>
          </div>
          <div data-reveal className="reveal foot-col" style={{ "--d": "90ms" } as React.CSSProperties}>
            {c.tel && (
              <p>
                <strong>Téléphone</strong>
                <a href={telHref}>{telEspace}</a>
              </p>
            )}
            {c.email && (
              <p>
                <strong>Courriel</strong>
                <a href={`mailto:${c.email}`}>{c.email}</a>
              </p>
            )}
            {c.horaires && (
              <p>
                <strong>Horaires</strong>
                <span className="with-icon">
                  <ClockIcon size={15} /> {c.horaires}
                </span>
              </p>
            )}
          </div>
          <div data-reveal className="reveal foot-col" style={{ "--d": "180ms" } as React.CSSProperties}>
            {c.adresseCourte && (
              <p>
                <strong>Adresse</strong>
                {c.adresseCourte}
                {c.adresseLongue && <span className="muted">{c.adresseLongue}</span>}
              </p>
            )}
          </div>
        </div>
        <div className="wrap foot-bottom">
          <span>
            © {new Date().getFullYear()} {c.brandName}
            {c.signature ? ` — ${c.signature}` : ""}
          </span>
        </div>
      </footer>

      {!preview && (c.whatsapp || c.tel) && (
        <a className="wa-fixed" href={waLink(c.whatsapp || c.tel, `Bonjour ${c.brandName},`)} target="_blank" rel="noopener" aria-label="Écrire sur WhatsApp">
          <WhatsAppIcon size={24} />
        </a>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Styles : portés depuis la page Exoticas, scopés sous .exo-page.
------------------------------------------------------------------ */

const CSS = `
.exo-page{
  --r:8px;
  --ease:cubic-bezier(.22,.61,.36,1);
  --ease-out:cubic-bezier(.16,1,.3,1);
  --lbl:600 .74rem/1.2 ui-sans-serif,system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --lbl-space:.16em;
  --glace:color-mix(in srgb,#fff 62%,transparent);
  --glace-forte:color-mix(in srgb,#fff 78%,transparent);
  --glace-bord:1px solid rgba(20,25,12,.09);
  --glace-relu:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 0 1px rgba(255,255,255,.28);
  --glace-ombre:0 1px 2px rgba(20,25,12,.06),0 14px 34px rgba(20,25,12,.12);
  --glace-ombre-h:0 3px 7px rgba(20,25,12,.09),0 22px 48px rgba(20,25,12,.18);
  --flou:blur(14px) saturate(1.25);
  box-sizing:border-box;color:var(--text);background:var(--surface);
  font:16.5px/1.62 ui-sans-serif,system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;overflow-x:hidden;min-height:100vh;
}
.exo-page *,.exo-page *::before,.exo-page *::after{box-sizing:border-box}
.exo-page h1,.exo-page h2,.exo-page h3{margin:0 0 .55rem;font-weight:550;text-wrap:balance}
.exo-page h1{font-size:clamp(2.35rem,4.6vw,3.45rem);line-height:1.04;letter-spacing:-.035em}
.exo-page h2{font-size:clamp(1.65rem,2.6vw,2.15rem);line-height:1.1;letter-spacing:-.03em}
.exo-page h3{font-size:1.02rem;line-height:1.2;letter-spacing:-.015em}
.exo-page p{margin:0 0 1rem;text-wrap:pretty}
.exo-page a{color:inherit}
.exo-page img{display:block;max-width:100%}
.exo-page .wrap{max-width:1080px;margin:0 auto;padding:0 20px}
.exo-page .muted{color:var(--muted)}
.exo-page a[href^="tel"]{font-variant-numeric:tabular-nums}
.exo-page section[id]{scroll-margin-top:88px}
.exo-page h2::before{content:"";display:block;width:44px;height:1px;background:var(--accent);
  margin:0 0 20px;transform-origin:0 50%;transition:transform .7s var(--ease-out) .12s}
.exo-page [data-reveal] h2::before,.exo-page h2[data-reveal]::before{transform:scaleX(0)}
.exo-page .in h2::before,.exo-page h2.in::before{transform:scaleX(1)}

.exo-page .progress{position:fixed;inset:0 auto auto 0;height:2px;width:100%;z-index:60;
  background:var(--accent);transform-origin:0 50%;transform:scaleX(0);transition:transform .12s linear}

.exo-page .site-head{position:fixed;top:0;left:0;right:0;z-index:50;color:#fff;
  background:transparent;transition:background .45s var(--ease),box-shadow .45s var(--ease),padding .45s var(--ease);padding:6px 0}
.exo-page .site-head::before{content:"";position:absolute;inset:0;background:var(--brand);opacity:0;transition:opacity .45s var(--ease);z-index:-1}
.exo-page.is-scrolled .site-head::before{opacity:1}
.exo-page.is-scrolled .site-head{box-shadow:0 6px 24px rgba(20,25,12,.18)}
.exo-page .head-in{display:flex;align-items:center;justify-content:space-between;height:60px;transition:height .45s var(--ease)}
.exo-page.is-scrolled .head-in{height:54px}
.exo-page .head-logo{display:flex;align-items:center;gap:9px;color:#fff;text-decoration:none}
.exo-page .head-nom{font-size:1.15rem;letter-spacing:.01em}
.exo-page .mark{transition:transform .6s var(--ease-out);border-radius:6px;object-fit:contain}
.exo-page .mark-fallback{display:grid;place-items:center;width:28px;height:28px;background:var(--accent);color:#fff;font-weight:600}
.exo-page .head-logo:hover .mark{transform:rotate(-8deg) scale(1.06)}
.exo-page .head-nav{display:flex;align-items:center;gap:22px;font-size:.95rem}
.exo-page .head-nav a:not(.btn){text-decoration:none;color:#fff;position:relative}
.exo-page .head-nav a:not(.btn)::after{content:"";position:absolute;left:0;bottom:-6px;height:1.5px;width:100%;
  background:currentColor;transform:scaleX(0);transform-origin:0 50%;transition:transform .35s var(--ease-out)}
.exo-page .head-nav a:not(.btn):hover::after{transform:scaleX(1)}

.exo-page .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  border:1px solid transparent;border-radius:var(--r);padding:12px 20px;text-decoration:none;
  font-size:.95rem;cursor:pointer;position:relative;overflow:hidden;font-family:inherit;
  transition:transform .3s var(--ease-out),box-shadow .3s var(--ease-out),background .3s var(--ease),color .3s var(--ease)}
.exo-page .btn::after{content:"";position:absolute;inset:0;background:rgba(255,255,255,.22);transform:translateX(-101%);transition:transform .55s var(--ease-out)}
.exo-page .btn:hover::after{transform:translateX(0)}
.exo-page .btn:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(20,25,12,.22)}
.exo-page .btn:active{transform:translateY(0)}
.exo-page .btn-light{background:#fff;color:var(--brand);border-color:#fff}
.exo-page .btn-light:hover{background:var(--surface)}
.exo-page .btn-primary{background:var(--brand);color:var(--on-brand)}
.exo-page .btn-primary:hover{background:var(--brand-dark)}
.exo-page .btn-ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.5)}
.exo-page .btn-ghost:hover{background:rgba(255,255,255,.12);border-color:#fff}
.exo-page .btn-sm{padding:9px 15px;font-size:.9rem}
.exo-page .btn-wa{background:#fff;color:var(--brand);border-color:var(--line);width:100%}
.exo-page .btn-wa:hover{background:var(--surface)}

.exo-page .hero{position:relative;background:var(--brand);color:var(--on-brand);padding:150px 0 96px;overflow:hidden}
@media (min-width:821px){
  .exo-page .hero{min-height:100vh;min-height:100svh;display:grid;grid-template-columns:minmax(0,1fr);align-content:center}
  .exo-page .hero .hero-in{width:100%}
  .exo-page .hero .frame{max-width:clamp(340px,46vh,440px)}
}
.exo-page .hero-bg{position:absolute;inset:0;background-size:cover;background-position:50% 34%;opacity:0;transition:opacity .8s var(--ease)}
.exo-page .hero-in{position:relative;display:grid;grid-template-columns:1.15fr .85fr;gap:44px;align-items:center}
.exo-page .wordmark{display:inline-flex;align-items:center;gap:10px}
.exo-page .wordmark-text{display:flex;flex-direction:column;line-height:1.1}
.exo-page .wordmark-nom{font-size:1.5rem}
.exo-page .wordmark-sig{font-size:.72rem;letter-spacing:.32em;text-transform:uppercase;opacity:.85}
.exo-page .hero-copy h1{margin:24px 0 18px;max-width:15ch}
.exo-page .hero-copy p{max-width:44ch;font-size:1.06rem;line-height:1.55;color:color-mix(in srgb,var(--on-brand) 92%,transparent)}
.exo-page .hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.exo-page .hero-adr{margin:24px 0 0;font-size:.95rem;color:color-mix(in srgb,var(--on-brand) 82%,transparent)}
.exo-page .hero-photo{display:flex;justify-content:flex-end}
.exo-page .frame{position:relative;width:100%;max-width:340px;aspect-ratio:1/1;border-radius:14px;overflow:hidden;
  border:1px solid rgba(255,255,255,.28);box-shadow:0 24px 60px rgba(15,25,8,.35);background:var(--brand-dark)}
.exo-page .frame img{width:100%;height:100%;object-fit:cover;object-position:50% 38%}
.exo-page .kenburns{animation:exo-kb 22s ease-in-out infinite alternate}
@keyframes exo-kb{from{transform:scale(1.02)}to{transform:scale(1.14) translate(-2%,-3%)}}
.exo-page .rise{animation:exo-rise .9s var(--ease-out) both;animation-delay:var(--d,0ms)}
@keyframes exo-rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}

.exo-page [data-reveal]{opacity:0;transform:translateY(26px);
  transition:opacity .8s var(--ease-out) var(--d,0ms),transform .8s var(--ease-out) var(--d,0ms)}
.exo-page [data-reveal].in{opacity:1;transform:none}

.exo-page .section{padding:clamp(64px,8vw,104px) 0}
.exo-page .section-alt{background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.exo-page .lede{color:var(--muted);font-size:1.04rem;line-height:1.6;max-width:52ch;margin:0 0 8px}

.exo-page .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:30px}
.exo-page .card{display:flex;flex-direction:column;text-decoration:none;color:inherit;
  background:var(--glace);border:var(--glace-bord);border-radius:var(--r);padding:6px;
  box-shadow:var(--glace-relu),var(--glace-ombre);
  transition:transform .4s var(--ease-out),box-shadow .4s var(--ease-out),background .3s var(--ease)}
.exo-page .card:hover{transform:translateY(-3px);background:var(--glace-forte);box-shadow:var(--glace-relu),var(--glace-ombre-h)}
.exo-page .card:focus-visible{outline:2px solid var(--brand);outline-offset:3px}
.exo-page .card-img{display:block;overflow:hidden;aspect-ratio:3/4;background:var(--surface);border-radius:5px}
.exo-page .card-img img{width:100%;height:100%;object-fit:cover;display:block}
.exo-page .card figcaption{padding:9px 4px 2px;font-size:.85rem;line-height:1.3;color:var(--muted)}
.exo-page .card:hover figcaption{color:var(--text)}

.exo-page .contact-in{display:grid;grid-template-columns:1.1fr .9fr;gap:52px;align-items:start}
.exo-page .form{display:grid;gap:18px;width:100%;max-width:560px;margin:26px auto 0;
  padding:26px 26px 28px;background:var(--glace);border:var(--glace-bord);border-radius:var(--r);
  box-shadow:var(--glace-relu),var(--glace-ombre);backdrop-filter:var(--flou);-webkit-backdrop-filter:var(--flou)}
.exo-page .form label{display:grid;gap:7px;font:var(--lbl);letter-spacing:var(--lbl-space);text-transform:uppercase;color:var(--muted)}
.exo-page .form input,.exo-page .form textarea{font-family:inherit;font-size:1rem;line-height:1.5;color:var(--text);
  background:rgba(255,255,255,.72);border:var(--glace-bord);box-shadow:var(--glace-relu),inset 0 1px 2px rgba(20,25,12,.05);
  border-radius:var(--r);padding:11px 13px;width:100%;
  transition:border-color .3s var(--ease),box-shadow .3s var(--ease),background .3s var(--ease)}
.exo-page .form input:hover,.exo-page .form textarea:hover{border-color:var(--line);background:rgba(255,255,255,.85)}
.exo-page .form input:focus,.exo-page .form textarea:focus{outline:none;border-color:var(--brand);background:#fff;
  box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent),inset 0 1px 2px rgba(20,25,12,.04)}
.exo-page .form .btn{justify-self:start;margin-top:4px}
.exo-page .note{font-size:.88rem;color:var(--muted);border-left:2px solid var(--accent);padding-left:12px;margin:0;
  max-height:0;opacity:0;overflow:hidden;transition:max-height .6s var(--ease-out),opacity .6s var(--ease)}
.exo-page .note.show{max-height:160px;opacity:1}
.exo-page .coords{background:var(--glace);border:var(--glace-bord);border-radius:var(--r);padding:0 26px 24px;overflow:hidden;
  box-shadow:var(--glace-relu),var(--glace-ombre);transition:transform .5s var(--ease-out),box-shadow .5s var(--ease-out)}
.exo-page .coords:hover{transform:translateY(-4px);box-shadow:var(--glace-relu),var(--glace-ombre-h)}
.exo-page .coords dl{display:grid;grid-template-columns:88px 1fr;gap:9px 16px;margin:22px 0;font-size:.96rem}
.exo-page .coords dt{font:var(--lbl);letter-spacing:var(--lbl-space);text-transform:uppercase;color:var(--muted);padding-top:4px}
.exo-page .coords dd{margin:0}
.exo-page .coords dd.muted{grid-column:2}
.exo-page .coords a{text-decoration:none;border-bottom:1px solid var(--line);transition:border-color .3s var(--ease),color .3s var(--ease)}
.exo-page .coords a:hover{color:var(--brand);border-color:var(--brand)}
.exo-page .socials{display:flex;flex-wrap:wrap;gap:10px}

.exo-page .map{position:relative;display:block;overflow:hidden;border:0;border-bottom:1px solid var(--line);
  aspect-ratio:1/1;margin:0 -26px 22px;background:var(--surface);text-decoration:none}
.exo-page .map-layer{position:absolute;width:150%;aspect-ratio:1/1;display:grid;grid-template-columns:repeat(3,1fr);transition:transform .9s var(--ease-out)}
.exo-page .map:hover .map-layer{transform:scale(1.07)}
.exo-page .map-layer img{width:100%;height:auto;display:block}
.exo-page .map-pin{position:absolute;left:50%;top:50%;color:var(--brand);transform:translate(-50%,-92%);filter:drop-shadow(0 4px 8px rgba(20,25,12,.35))}
.exo-page .map-pin svg{animation:exo-pin 2.8s var(--ease) infinite}
@keyframes exo-pin{0%,55%,100%{transform:translateY(0)}70%{transform:translateY(-7px)}85%{transform:translateY(0)}}
.exo-page .map-cta{position:absolute;right:9px;bottom:9px;color:var(--brand);font-size:.76rem;font-weight:600;
  padding:6px 11px;border-radius:var(--r);opacity:0;transform:translateY(8px);background:var(--glace-forte);border:var(--glace-bord);
  box-shadow:var(--glace-relu),0 6px 16px rgba(20,25,12,.2);backdrop-filter:blur(9px) saturate(1.3);-webkit-backdrop-filter:blur(9px) saturate(1.3);
  transition:opacity .4s var(--ease),transform .4s var(--ease-out),box-shadow .3s var(--ease)}
.exo-page .map:hover .map-cta,.exo-page .map:focus-visible .map-cta{opacity:1;transform:none}
.exo-page .map-cred{position:absolute;left:8px;bottom:7px;font-size:.66rem;color:var(--muted);background:rgba(255,255,255,.66);
  border:var(--glace-bord);box-shadow:var(--glace-relu);padding:2px 7px;border-radius:4px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.exo-page .geo{display:grid;gap:10px;margin:0 0 18px}
.exo-page .btn-geo{background:var(--glace-forte);color:var(--brand);border:var(--glace-bord);
  box-shadow:var(--glace-relu),0 2px 8px rgba(20,25,12,.08);width:100%;font-family:inherit}
.exo-page .btn-geo:hover:not(:disabled){background:#fff}
.exo-page .btn-geo:disabled{opacity:.65;cursor:progress;transform:none;box-shadow:none}
.exo-page .btn-geo svg{animation:exo-nudge 2.4s var(--ease) infinite}
@keyframes exo-nudge{0%,70%,100%{transform:translateY(0)}80%{transform:translateY(-3px)}90%{transform:translateY(0)}}
.exo-page .geo-msg{margin:0;font-size:.85rem;color:var(--muted);animation:exo-fade .6s var(--ease-out) both}
.exo-page .geo-msg strong{color:var(--text);font-weight:600}
.exo-page .geo-msg a{color:var(--brand);border-bottom:1px solid var(--line)}
@keyframes exo-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

.exo-page .site-foot{background:var(--brand);color:var(--on-brand);padding:clamp(68px,8vw,96px) 0 40px}
.exo-page .foot-in{display:grid;grid-template-columns:1.2fr 1fr 1.2fr;gap:32px}
.exo-page .foot-col p{margin:0 0 14px;font-size:1rem;color:color-mix(in srgb,var(--on-brand) 92%,transparent)}
.exo-page .foot-col strong{display:block;font:var(--lbl);font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;
  color:color-mix(in srgb,var(--on-brand) 62%,transparent);margin-bottom:9px}
.exo-page .foot-col a{text-decoration:none;border-bottom:1px solid transparent;transition:border-color .3s var(--ease)}
.exo-page .foot-col a:hover{border-color:color-mix(in srgb,var(--on-brand) 70%,transparent)}
.exo-page .foot-col .muted{display:block;color:color-mix(in srgb,var(--on-brand) 62%,transparent);font-size:.9rem;margin-top:5px}
.exo-page .foot-col .with-icon{display:block}
.exo-page .foot-bottom{margin-top:28px;padding-top:14px;border-top:1px solid color-mix(in srgb,var(--on-brand) 16%,transparent);
  font-size:.82rem;color:color-mix(in srgb,var(--on-brand) 62%,transparent)}

.exo-page .wa-fixed{position:fixed;right:18px;bottom:18px;z-index:55;width:54px;height:54px;border-radius:50%;
  background:var(--brand);color:var(--on-brand);display:grid;place-items:center;text-decoration:none;
  box-shadow:0 8px 22px rgba(20,25,12,.3);transition:transform .35s var(--ease-out),background .3s var(--ease)}
.exo-page .wa-fixed::before{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid var(--accent);animation:exo-pulse 2.6s var(--ease-out) infinite}
.exo-page .wa-fixed:hover{background:var(--brand-dark);transform:scale(1.08)}
@keyframes exo-pulse{0%{transform:scale(1);opacity:.7}70%{transform:scale(1.55);opacity:0}100%{opacity:0}}

.exo-page .hero.has-img .hero-bg{opacity:0}

@media (max-width:900px){
  .exo-page .grid{grid-template-columns:repeat(3,1fr)}
  .exo-page .contact-in,.exo-page .foot-in{grid-template-columns:1fr;gap:30px}
}
@media (max-width:820px){
  .exo-page .hero{min-height:100vh;min-height:100svh;display:grid;align-content:end;padding:96px 0 26px}
  .exo-page .hero.has-img .hero-bg{opacity:1;animation:exo-zoom 26s var(--ease) infinite alternate}
  @keyframes exo-zoom{from{transform:scale(1)}to{transform:scale(1.12)}}
  .exo-page .hero-in{grid-template-columns:1fr;gap:0}
  .exo-page .hero-copy{background:var(--brand);padding:24px 20px;border-radius:12px;box-shadow:0 18px 44px rgba(15,25,8,.28)}
  .exo-page .hero-photo{display:none}
  .exo-page .hero-cta{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .exo-page .hero-cta .btn{padding:12px 10px;font-size:.9rem}
  .exo-page .head-nav{gap:12px;font-size:.88rem}
  .exo-page .section{padding:48px 0}
  .exo-page .grid{grid-template-columns:repeat(3,1fr);gap:12px}
}
@media (max-width:620px){
  .exo-page .grid{grid-template-columns:repeat(2,1fr)}
  .exo-page .card figcaption{font-size:.82rem;padding:8px 3px 2px}
}
@media (max-width:460px){
  .exo-page .hero-cta{grid-template-columns:1fr}
}

/* -------- aperçu dans l'éditeur : même page, sans les effets plein écran -------- */
.exo-page.exo-preview{position:relative;min-height:0;font-size:15px}
.exo-page.exo-preview .site-head{position:static;padding:0}
.exo-page.exo-preview .site-head::before{opacity:1}
.exo-page.exo-preview .hero{padding:40px 0;min-height:0}
.exo-page.exo-preview .hero .frame{max-width:220px}
.exo-page.exo-preview .section{padding:44px 0}
.exo-page.exo-preview [data-reveal]{opacity:1;transform:none}
.exo-page.exo-preview .rise{animation:none}
.exo-page.exo-preview .progress,.exo-page.exo-preview .wa-fixed{display:none}

@media (prefers-reduced-motion:reduce){
  .exo-page *,.exo-page *::before,.exo-page *::after{animation:none!important;transition:none!important}
  .exo-page [data-reveal]{opacity:1;transform:none}
  .exo-page .rise{opacity:1}
}
`;
