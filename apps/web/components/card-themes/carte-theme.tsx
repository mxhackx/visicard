"use client";

import { Mail, Phone, UserPlus, Share2, MapPin, Globe } from "lucide-react";
import { BrandIcon, useCardData, useOpenStatus, type CardThemeProps } from "./kit";
import { HoursList } from "./extras";
import { cliniqueText } from "./fonts";

/** Carte de visite numérique : profil, actions en un geste, contact à enregistrer, partage. Pour les indépendants et les équipes. */
export default function CarteTheme(props: CardThemeProps) {
  const d = useCardData(props);
  const status = useOpenStatus(props.schedule);
  const title = d.lines[0];
  const links = d.lines.slice(1);

  const saveContact = () => {
    const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${d.name}`, `ORG:${d.name}`];
    if (title) lines.push(`TITLE:${title}`);
    if (props.phoneNumber) lines.push(`TEL;TYPE=CELL:${props.phoneNumber}`);
    if (props.address) lines.push(`ADR;TYPE=WORK:;;${props.address};;;;`);
    lines.push(`URL:${window.location.href}`, "END:VCARD");
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/vcard" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${d.name.replace(/[^\w-]+/g, "_")}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const share = () => {
    if (props.inPreview) return;
    if (navigator.share) navigator.share({ title: d.name, url: window.location.href }).catch(() => {});
    else navigator.clipboard?.writeText(window.location.href).catch(() => {});
  };

  const action = "flex items-center gap-3 rounded-2xl border border-[var(--pg-line)] bg-white px-4 py-3.5 font-medium shadow-sm transition active:scale-[0.99]";
  const icon = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--pg-brand)_12%,white)] text-[var(--pg-brand)]";

  return (
    <div className={`${cliniqueText.className} min-h-full bg-[color-mix(in_srgb,var(--pg-brand)_6%,var(--pg-surface))] pb-10 text-[var(--pg-text)]`}>
      <div className="mx-auto max-w-md">
        <div className="h-32 bg-[var(--pg-brand)] [background-image:radial-gradient(circle_at_80%_0%,color-mix(in_srgb,var(--pg-accent)_55%,transparent),transparent_60%)]" />
        <div className="-mt-14 px-5 text-center">
          <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
            {props.logoUrl || d.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={props.logoUrl || d.cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-[var(--pg-accent)] text-4xl font-semibold text-white">{d.initial}</span>
            )}
          </div>
          <h1 className="mt-4 text-[1.7rem] font-semibold leading-tight tracking-[-.01em]">{d.name}</h1>
          {(title || d.tagline) && <p className="mt-1 text-base opacity-75">{title ?? d.tagline}</p>}
          {props.address && <p className="mt-1 flex items-center justify-center gap-1.5 text-sm opacity-65"><MapPin className="h-3.5 w-3.5" /> {props.address}</p>}
          {status && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs shadow-sm">
              <span className={`h-2 w-2 rounded-full ${status.open ? "bg-emerald-500" : "bg-slate-400"}`} /> {status.label}
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 px-5">
          <button type="button" onClick={saveContact} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--pg-brand)] px-4 py-3.5 font-semibold text-[var(--pg-on-brand)] shadow-md">
            <UserPlus className="h-5 w-5" /> Enregistrer
          </button>
          <button type="button" onClick={share} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--pg-line)] bg-white px-4 py-3.5 font-semibold shadow-sm">
            <Share2 className="h-5 w-5" /> Partager
          </button>
        </div>

        <ul className="mt-4 space-y-3 px-5">
          {d.tel && (
            <li><a href={d.href(d.tel)} className={action}><span className={icon}><Phone className="h-5 w-5" /></span><span className="min-w-0"><span className="block text-xs opacity-60">Appeler</span><span className="block truncate">{d.phoneLabel}</span></span></a></li>
          )}
          {d.whatsapp && (
            <li><a href={d.href(d.whatsapp)} target={d.target} rel="noreferrer" className={action}><span className={icon}><BrandIcon id="whatsapp" className="h-5 w-5" /></span><span><span className="block text-xs opacity-60">Écrire</span><span className="block">WhatsApp</span></span></a></li>
          )}
          {props.locationUrl && (
            <li><a href={d.href(props.locationUrl)} target={d.target} rel="noreferrer" className={action}><span className={icon}><Globe className="h-5 w-5" /></span><span><span className="block text-xs opacity-60">Voir</span><span className="block">Site ou localisation</span></span></a></li>
          )}
          {d.socials.map((s) => (
            <li key={s.id}><a href={d.href(s.href)} target={d.target} rel="noreferrer" className={action}><span className={icon}><BrandIcon id={s.id} className="h-5 w-5" /></span><span><span className="block text-xs opacity-60">Suivre</span><span className="block">{s.label}</span></span></a></li>
          ))}
          {links.map((l, i) => (
            <li key={i} className={`${action} cursor-default`}><span className={icon}><Mail className="h-5 w-5" /></span><span className="min-w-0 break-words">{l}</span></li>
          ))}
        </ul>

        {props.schedule && (
          <section className="mx-5 mt-6 rounded-2xl border border-[var(--pg-line)] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] opacity-60">Disponibilités</h2>
            <HoursList schedule={props.schedule} className="space-y-1.5 text-sm" todayClassName="font-semibold text-[var(--pg-brand)]" />
          </section>
        )}
      </div>
    </div>
  );
}
