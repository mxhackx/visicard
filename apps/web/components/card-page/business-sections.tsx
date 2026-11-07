"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CalendarCheck, Check, Loader2, MessageCircle, Minus, Plus, Send, ShoppingBag, Tag, UserPlus, Share2 } from "lucide-react";
import { sendRequest, type Catalog, type RequestMode } from "@/lib/business";

const nf = new Intl.NumberFormat("fr-FR");
const fcfa = (n: number) => `${nf.format(n)} FCFA`;

interface Props {
  slug: string;
  name: string;
  phone?: string;
  address?: string;
  website?: string;
  catalog?: Catalog;
  requestMode: RequestMode;
}

/** Fichier .vcf du commerce : « Enregistrer le contact » en un geste. */
function downloadVcard({ name, phone, address }: { name: string; phone?: string; address?: string }) {
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${name}`, `ORG:${name}`];
  if (phone) lines.push(`TEL;TYPE=WORK,VOICE:${phone}`);
  if (address) lines.push(`ADR;TYPE=WORK:;;${address};;;;`);
  lines.push(`URL:${window.location.href}`, "END:VCARD");
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/vcard" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.replace(/[^\w-]+/g, "_")}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Promotion, catalogue, réservation / commande / message, partage : ce que le visiteur peut faire après le scan. */
export default function BusinessSections({ slug, name, phone, address, catalog, requestMode }: Props) {
  const products = useMemo(() => catalog?.products ?? [], [catalog]);
  const promo = catalog?.promo ?? null;
  const [cart, setCart] = useState<Record<string, number>>({});
  const [kind, setKind] = useState<"order" | "booking" | "contact">(requestMode === "order" ? "order" : requestMode === "booking" ? "booking" : "contact");
  const [form, setForm] = useState({ name: "", phone: "", message: "", date: "", time: "19:00", people: 2, website: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const total = useMemo(() => products.reduce((n, p) => n + (cart[p.id ?? ""] ?? 0) * (p.price ?? 0), 0), [cart, products]);
  const count = Object.values(cart).reduce((n, q) => n + q, 0);
  const hasAnything = promo || products.length > 0 || requestMode !== "none" || phone;
  if (!hasAnything) return null;

  const setQty = (id: string, delta: number) => setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(99, (c[id] ?? 0) + delta)) }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await sendRequest(slug, {
        kind,
        name: form.name,
        phone: form.phone,
        message: form.message,
        website: form.website,
        details:
          kind === "booking"
            ? { date: form.date, time: form.time, people: form.people }
            : kind === "order"
              ? { items: Object.entries(cart).filter(([, q]) => q > 0).map(([id, qty]) => ({ id, qty })) }
              : undefined,
      });
      setSent(true);
      setCart({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10 font-sans text-ink">
      {promo && (
        <div className="rounded-2xl bg-forest p-5 text-white shadow-lg">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/80"><Tag className="h-4 w-4" /> Promotion</p>
          <p className="mt-2 text-xl font-semibold">{promo.title}</p>
          {promo.text && <p className="mt-1 text-sm text-white/90">{promo.text}</p>}
          {promo.until && <p className="mt-3 text-xs text-white/75">Jusqu’au {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(new Date(promo.until))}</p>}
        </div>
      )}

      {products.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><ShoppingBag className="h-5 w-5 text-forest" /> Catalogue</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {products.map((p) => (
              <li key={p.id} className="flex gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{p.name}</p>
                  {p.description && <p className="mt-0.5 text-xs leading-5 text-sage">{p.description}</p>}
                  {p.price !== null && <p className="mt-1 text-sm font-semibold text-forest">{fcfa(p.price)}</p>}
                </div>
                {requestMode === "order" && p.id && (
                  <div className="flex shrink-0 flex-col items-center justify-center gap-1">
                    {(cart[p.id] ?? 0) === 0 ? (
                      <button type="button" onClick={() => setQty(p.id!, 1)} aria-label={`Ajouter ${p.name}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-white"><Plus className="h-4 w-4" /></button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => setQty(p.id!, -1)} aria-label="Retirer un" className="flex h-8 w-8 items-center justify-center rounded-full border border-line"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-5 text-center text-sm font-semibold tabular-nums">{cart[p.id]}</span>
                        <button type="button" onClick={() => setQty(p.id!, 1)} aria-label="Ajouter un" className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {requestMode !== "none" && (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          {sent ? (
            <div className="py-4 text-center" role="status">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-6 w-6" /></span>
              <p className="mt-3 text-lg font-semibold">Demande envoyée</p>
              <p className="mt-1 text-sm text-sage">{name} vous recontactera au {form.phone}.</p>
              {phone && (
                <a
                  href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${name}, je viens d’envoyer ${kind === "booking" ? "une réservation" : kind === "order" ? "une commande" : "un message"} depuis votre page (${form.name}).`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm mt-4"
                >
                  <MessageCircle className="h-4 w-4" /> Prévenir par WhatsApp
                </a>
              )}
              <button type="button" onClick={() => setSent(false)} className="mt-3 block w-full text-sm font-semibold text-forest">Faire une autre demande</button>
            </div>
          ) : (
            <form onSubmit={submit} className="relative space-y-4">
              {requestMode !== "contact" && (
                <div className="inline-flex rounded-xl border border-line bg-cream-deep p-1" role="tablist">
                  {([requestMode, "contact"] as const).map((k) => (
                    <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k as typeof kind)} className={`rounded-lg px-3.5 py-2 text-sm font-medium ${kind === k ? "bg-white text-ink shadow-sm" : "text-ink/60"}`}>
                      {k === "order" ? "Commander" : k === "booking" ? "Réserver" : "Nous écrire"}
                    </button>
                  ))}
                </div>
              )}
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                {kind === "booking" ? <CalendarCheck className="h-5 w-5 text-forest" /> : kind === "order" ? <ShoppingBag className="h-5 w-5 text-forest" /> : <Send className="h-5 w-5 text-forest" />}
                {kind === "booking" ? "Réserver une table ou un créneau" : kind === "order" ? "Passer commande" : "Envoyer un message"}
              </h2>
              {kind === "order" && (
                <p className="rounded-xl bg-cream-deep px-3 py-2.5 text-sm text-ink/80">
                  {count === 0 ? "Ajoutez des produits dans le catalogue ci-dessus." : <><strong>{count}</strong> article{count > 1 ? "s" : ""} · <strong>{fcfa(total)}</strong></>}
                </p>
              )}
              <input type="text" name="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" required placeholder="Votre nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
                <input className="field" required type="tel" inputMode="tel" placeholder="Votre téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
              </div>
              {kind === "booking" && (
                <div className="grid grid-cols-3 gap-3">
                  <input className="field col-span-3 sm:col-span-1" required type="date" min={new Date().toISOString().slice(0, 10)} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-label="Date" />
                  <input className="field" required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} aria-label="Heure" />
                  <input className="field" required type="number" min={1} max={50} value={form.people} onChange={(e) => setForm({ ...form, people: Number(e.target.value) })} aria-label="Personnes" />
                </div>
              )}
              <textarea className="field min-h-20" placeholder={kind === "contact" ? "Votre message" : "Précisions (facultatif)"} required={kind === "contact"} maxLength={500} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
              <button type="submit" disabled={busy || (kind === "order" && count === 0)} className="btn btn-primary w-full disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {kind === "booking" ? "Envoyer ma réservation" : kind === "order" ? "Envoyer ma commande" : "Envoyer"}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2 pb-4">
        {phone && (
          <a href={`https://wa.me/${phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
        )}
        <button type="button" onClick={() => downloadVcard({ name, phone, address })} className="btn btn-outline btn-sm"><UserPlus className="h-4 w-4" /> Enregistrer le contact</button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button type="button" onClick={() => navigator.share({ title: name, url: window.location.href }).catch(() => {})} className="btn btn-outline btn-sm"><Share2 className="h-4 w-4" /> Partager</button>
        )}
      </div>
    </section>
  );
}
