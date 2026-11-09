"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Check, Inbox, Loader2, MessageCircle, Phone, ShoppingBag, X } from "lucide-react";
import { myRequests, setRequestStatus, type VisitorRequest } from "@/lib/business";
import { useAccountToken } from "./use-account";
import AccountNav from "./account-nav";

const KIND = { booking: { label: "Réservation", icon: CalendarCheck }, order: { label: "Commande", icon: ShoppingBag }, contact: { label: "Message", icon: MessageCircle } } as const;
const fmt = (v: string) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(v));
const nf = new Intl.NumberFormat("fr-FR");

/** Boîte de réception : réservations, commandes et messages reçus après un scan. */
export default function RequestsInbox() {
  const token = useAccountToken();
  const [rows, setRows] = useState<VisitorRequest[] | null>(null);
  const [filter, setFilter] = useState<"new" | "done" | "all">("new");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setRows(await myRequests(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }, [token]);
  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const mark = async (id: string, status: string) => {
    if (!token) return;
    try {
      await setRequestStatus(token, id, status);
      setRows((r) => r?.map((x) => (x.id === id ? { ...x, status: status as VisitorRequest["status"] } : x)) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour impossible.");
    }
  };

  const shown = (rows ?? []).filter((r) => (filter === "all" ? true : filter === "new" ? r.status === "new" : r.status !== "new"));
  const pending = (rows ?? []).filter((r) => r.status === "new").length;

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="page-title">Demandes</h1>
      <p className="mt-2 text-sm text-sage">Réservations, commandes et messages envoyés par vos visiteurs après un scan. Activez-les depuis la page de chaque QR code.</p>
      <div className="mt-6"><AccountNav /></div>

      <div className="mt-6 flex gap-2">
        {([["new", `À traiter${pending ? ` (${pending})` : ""}`], ["done", "Traitées"], ["all", "Toutes"]] as const).map(([id, l]) => (
          <button key={id} type="button" onClick={() => setFilter(id)} className={`rounded-full border px-3.5 py-2 text-sm font-medium ${filter === id ? "border-forest bg-forest text-white" : "border-line bg-white text-ink/75"}`}>{l}</button>
        ))}
      </div>

      {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      {!rows && !error && <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-forest" /></div>}
      {rows && shown.length === 0 && (
        <div className="surface mt-6 px-6 py-14 text-center"><Inbox className="mx-auto h-8 w-8 text-line" /><p className="mt-3 text-sm text-sage">Aucune demande ici.</p></div>
      )}

      <ul className="mt-6 space-y-3">
        {shown.map((r) => {
          const K = KIND[r.kind];
          return (
            <li key={r.id} className={`surface p-4 sm:p-5 ${r.status !== "new" ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="flex items-center gap-2 font-semibold text-ink"><K.icon className="h-4 w-4 text-forest" /> {K.label} · {r.name}</p>
                <p className="text-xs text-sage">{r.card.title} · {fmt(r.createdAt)}</p>
              </div>
              {r.kind === "booking" && r.details && <p className="mt-2 text-sm text-ink/85">{r.details.date} à {r.details.time} · {r.details.people} personne{(r.details.people ?? 1) > 1 ? "s" : ""}</p>}
              {r.kind === "order" && r.details?.items && (
                <ul className="mt-2 text-sm text-ink/85">
                  {r.details.items.map((i, k) => <li key={k}>{i.qty} × {i.name}{i.price !== null ? ` · ${nf.format(i.price * i.qty)} FCFA` : ""}</li>)}
                  {r.details.total ? <li className="mt-1 font-semibold">Total : {nf.format(r.details.total)} FCFA</li> : null}
                </ul>
              )}
              {r.message && <p className="mt-2 rounded-lg bg-cream-deep px-3 py-2 text-sm text-ink/80">{r.message}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`tel:${r.phone}`} className="btn btn-outline btn-sm"><Phone className="h-4 w-4" /> {r.phone}</a>
                <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${r.name}, merci pour votre ${K.label.toLowerCase()}.`)}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                {r.status === "new" ? (
                  <>
                    <button type="button" onClick={() => mark(r.id, "cancelled")} className="btn btn-outline btn-sm"><X className="h-4 w-4" /> Refuser</button>
                    <button type="button" onClick={() => mark(r.id, "done")} className="btn btn-primary btn-sm"><Check className="h-4 w-4" /> Traitée</button>
                  </>
                ) : (
                  <button type="button" onClick={() => mark(r.id, "new")} className="text-sm font-medium text-sage hover:text-ink">Remettre à traiter</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
