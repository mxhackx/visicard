"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, ExternalLink, Link2, Loader2, QrCode } from "lucide-react";
import { API_URL } from "@/lib/api-url";
import { SITE_URL } from "@/lib/site";
import { DIRECT_QR_TYPES, encodeDirectQr, type DirectQrData, type DirectQrType } from "@/lib/qr-payloads";
import { decodeDirectQr } from "@/lib/qr-decode";
import Step from "@/components/qr/step-card";
import StyledQr from "@/components/qr/styled-qr";
import { Fields, hasInput } from "@/components/qr/direct-qr-generator";
import { useAccountToken } from "./use-account";

interface Loaded {
  title: string;
  payload: string;
  qrStyle: string;
  status?: string;
}

/**
 * Modification du contenu d'un QR code direct, depuis le compte, dans le même cadre que la création :
 * saisie à gauche, les deux QR codes à droite. Le QR code « lien » (/c/slug) ne change jamais : seul ce qu'il ouvre est mis à jour.
 */
export default function DirectQrEditor({ slug }: { slug: string }) {
  const token = useAccountToken();
  const [card, setCard] = useState<Loaded | null>(null);
  const [type, setType] = useState<DirectQrType>("text");
  const [data, setData] = useState<DirectQrData[DirectQrType] | null>(null);
  const [title, setTitle] = useState("");
  const [savedPayload, setSavedPayload] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/cards/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("QR code introuvable."))))
      .then((c: { serviceType?: string; title?: string | null; contentUrl?: string | null; qrStyle?: string | null; status?: string }) => {
        if (!alive) return;
        if (c.serviceType !== "direct" || !c.contentUrl) throw new Error("Ce QR code n’a pas de contenu à modifier ici.");
        const d = decodeDirectQr(c.contentUrl);
        setCard({ title: c.title ?? "", payload: c.contentUrl, qrStyle: c.qrStyle ?? "", status: c.status });
        setType(d.type);
        setData(d.data);
        setTitle(c.title ?? "");
        setSavedPayload(c.contentUrl);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Chargement impossible."));
    return () => {
      alive = false;
    };
  }, [slug]);

  const encoded = data ? encodeDirectQr(type, data as never) : { payload: "", error: undefined };
  const dirty = Boolean(card) && (encoded.payload !== savedPayload || title.trim() !== card!.title);
  const linkUrl = `${SITE_URL}/c/${slug}`;

  const update = <K extends DirectQrType>(_key: K, patch: Partial<DirectQrData[K]>) => {
    setDone(false);
    setData((d) => ({ ...(d as object), ...patch }) as unknown as DirectQrData[DirectQrType]);
  };

  const save = async () => {
    if (!token || !encoded.payload) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/cards/${slug}/direct`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payload: encoded.payload, title }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((Array.isArray(body?.message) ? body.message[0] : body?.message) || "Enregistrement impossible.");
      setSavedPayload(encoded.payload);
      setCard((c) => (c ? { ...c, title: title.trim(), payload: encoded.payload } : c));
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  const meta = DIRECT_QR_TYPES.find((t) => t.id === type);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-12">
      <Link href="/compte" className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-ink"><ArrowLeft className="h-4 w-4" /> Mes QR codes</Link>

      {!card || !data ? (
        <div className="mt-6">
          {error ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-sage"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div className="min-w-0 space-y-6">
            <Step title="Informations">
              <div className="pb-5 pt-1">
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">Modifier mon QR code</h1>
                <p className="mt-2 text-sm leading-6 text-sage">
                  {meta?.label} · Le QR code « lien » reste identique : tout ce que vous changez ici s’applique à lui, sans réimprimer.
                </p>
              </div>
              <div className="mb-5">
                <label htmlFor="qr-title" className="mb-1.5 block text-xs font-semibold text-ink/70">Nom dans votre espace</label>
                <input id="qr-title" className="field" value={title} maxLength={80} onChange={(e) => { setTitle(e.target.value); setDone(false); }} />
              </div>
              <Fields type={type} data={data} update={update} />
              {error && <p role="alert" className="mt-4 flex items-center gap-1.5 text-sm text-red-700"><AlertTriangle className="h-4 w-4 shrink-0" /> {error}</p>}
              {!error && hasInput(data) && !encoded.payload && encoded.error && (
                <p className="mt-4 flex items-center gap-1.5 text-sm text-amber-700"><AlertTriangle className="h-4 w-4 shrink-0" /> {encoded.error}</p>
              )}
            </Step>

            <Step title="Enregistrer">
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => void save()} disabled={busy || !dirty || !encoded.payload} className="btn btn-primary disabled:opacity-50">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Enregistrer les modifications
                </button>
                {done && !dirty && <span role="status" className="text-sm font-medium text-emerald-700">Enregistré : votre QR code lien affiche déjà le nouveau contenu.</span>}
              </div>
            </Step>
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="surface p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink"><Link2 className="h-4 w-4 text-forest" /> QR code lien <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">ne change jamais</span></p>
              <p className="mt-1 text-xs leading-5 text-sage">À imprimer : il ouvre toujours le contenu à jour.</p>
              <div className="mt-3 flex justify-center rounded-xl bg-cream/60 p-4"><StyledQr data={linkUrl} style={card.qrStyle} size={170} downloadName={`moncode-${slug}-lien`} /></div>
              <a href={linkUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Tester le lien</a>
            </div>
            <div className="surface p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink"><QrCode className="h-4 w-4 text-forest" /> QR code contenu</p>
              <p className="mt-1 text-xs leading-5 text-sage">Le contenu est écrit dans le QR code : un exemplaire déjà imprimé ne suit pas vos modifications.</p>
              <div className="mt-3 flex justify-center rounded-xl bg-cream/60 p-4">
                {savedPayload && <StyledQr data={savedPayload} style={card.qrStyle} size={170} downloadName={`moncode-${slug}-contenu`} />}
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
