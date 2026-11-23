"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Check, Copy, ExternalLink, UserPlus, Wifi } from "lucide-react";
import { decodeDirectQr, relayHref } from "@/lib/qr-decode";

/**
 * Page ouverte par le QR code « lien » d'un contenu direct (/c/slug) : le contenu étant modifiable depuis le compte,
 * le visiteur est envoyé vers le lien, l'appel, l'e-mail… ou voit le contenu (Wi-Fi, texte), ou télécharge le contact / l'événement.
 */
export default function DirectRelay({ payload }: { payload: string }) {
  const decoded = useMemo(() => decodeDirectQr(payload), [payload]);
  const href = relayHref(decoded);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (href) window.location.replace(href);
  }, [href]);

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {}
  };
  const download = (content: string, type: string, name: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen items-center justify-center p-6 font-sans">
      <div className="surface w-full max-w-md p-7 text-center">
        {children}
        <p className="mt-6 text-xs text-sage">Propulsé par <Link href="/" className="font-semibold text-forest">Moncode</Link></p>
      </div>
    </div>
  );
  const btn = "btn btn-primary mt-5 w-full";

  if (href) {
    return shell(
      <>
        <p className="text-sm text-sage">Redirection en cours…</p>
        <a href={href} className={btn}><ExternalLink className="h-4 w-4" /> Continuer</a>
      </>,
    );
  }

  switch (decoded.type) {
    case "wifi": {
      const w = decoded.data;
      return shell(
        <>
          <span className="icon-tile mx-auto h-12 w-12"><Wifi className="h-6 w-6" /></span>
          <h1 className="mt-4 text-xl font-semibold text-ink">Réseau Wi-Fi</h1>
          <dl className="mt-5 divide-y divide-line rounded-xl border border-line bg-white text-left text-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3"><dt className="text-sage">Nom</dt><dd className="font-semibold text-ink">{w.ssid}</dd></div>
            {w.security !== "nopass" && (
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="text-sage">Mot de passe</dt>
                <dd className="flex items-center gap-2 font-semibold text-ink">{w.password}
                  <button type="button" aria-label="Copier le mot de passe" onClick={() => void copy(w.password, "pw")} className="rounded-lg p-1.5 text-forest hover:bg-cream">
                    {copied === "pw" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </dd>
              </div>
            )}
          </dl>
          <p className="mt-4 text-xs leading-5 text-sage">Ouvrez les réglages Wi-Fi de votre téléphone, choisissez ce réseau et saisissez le mot de passe.</p>
        </>,
      );
    }
    case "vcard": {
      const v = decoded.data;
      const name = [v.firstName, v.lastName].filter(Boolean).join(" ") || v.org;
      return shell(
        <>
          <span className="icon-tile mx-auto h-12 w-12"><UserPlus className="h-6 w-6" /></span>
          <h1 className="mt-4 text-xl font-semibold text-ink">{name}</h1>
          {(v.title || v.org) && <p className="mt-1 text-sm text-sage">{[v.title, v.org].filter(Boolean).join(" · ")}</p>}
          <ul className="mt-4 space-y-1 text-sm text-ink/80">
            {[v.mobile, v.work, v.email, v.website, v.address].filter(Boolean).map((l) => <li key={l}>{l}</li>)}
          </ul>
          <button type="button" className={btn} onClick={() => download(payload, "text/vcard;charset=utf-8", `${name || "contact"}.vcf`)}>
            <UserPlus className="h-4 w-4" /> Enregistrer le contact
          </button>
        </>,
      );
    }
    case "event": {
      const e = decoded.data;
      return shell(
        <>
          <span className="icon-tile mx-auto h-12 w-12"><CalendarPlus className="h-6 w-6" /></span>
          <h1 className="mt-4 text-xl font-semibold text-ink">{e.title}</h1>
          <p className="mt-1 text-sm text-sage">{[e.start.replace("T", " à "), e.location].filter(Boolean).join(" · ")}</p>
          {e.description && <p className="mt-3 text-sm leading-6 text-ink/80">{e.description}</p>}
          <button type="button" className={btn} onClick={() => download(payload, "text/calendar;charset=utf-8", "evenement.ics")}>
            <CalendarPlus className="h-4 w-4" /> Ajouter à l’agenda
          </button>
        </>,
      );
    }
    default:
      return shell(
        <>
          <p className="whitespace-pre-wrap break-words text-left text-[15px] leading-7 text-ink">{decoded.type === "text" ? decoded.data.text : payload}</p>
          <button type="button" className={btn} onClick={() => void copy(payload, "text")}>
            {copied === "text" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied === "text" ? "Copié" : "Copier le texte"}
          </button>
        </>,
      );
  }
}
