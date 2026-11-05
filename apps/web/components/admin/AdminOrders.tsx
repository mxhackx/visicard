"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Ban, CheckCircle2, Loader2, RefreshCw, Receipt, Search } from "lucide-react";
import { providerLabel } from "@/lib/contact";
import { useAdminFetch } from "./use-admin-fetch";

interface AdminOrder {
  id: string;
  reference: string;
  kind: "creation" | "modification";
  serviceType: "page" | "media" | "document";
  status: "quote" | "pending" | "paid" | "cancelled";
  amount: number;
  quoteNumber: string;
  invoiceNumber: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  createdAt: string;
  paidAt: string | null;
  card: { slug: string; title: string | null; restaurantName: string | null; status: string };
  lastPayment: { provider: string; status: string; createdAt: string } | null;
}

const STATUS: Record<AdminOrder["status"], { label: string; className: string }> = {
  quote: { label: "Devis", className: "bg-leaf text-forest" },
  pending: { label: "Paiement en cours", className: "bg-amber-50 text-amber-700" },
  paid: { label: "Payée", className: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Annulée", className: "bg-red-50 text-red-700" },
};

const SERVICE: Record<AdminOrder["serviceType"], string> = { page: "Page", media: "Image / vidéo", document: "PDF" };

type Filter = "all" | AdminOrder["status"];
const fcfa = new Intl.NumberFormat("fr-FR");

export default function AdminOrders({ adminToken }: { adminToken: string }) {
  const adminFetch = useAdminFetch(adminToken);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/orders");
      if (!res.ok) throw new Error("Impossible de charger les commandes.");
      setOrders(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    // Chargement différé d'un tour : l'état n'est jamais modifié pendant l'effet lui-même.
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const act = async (order: AdminOrder, action: "mark-paid" | "cancel") => {
    const question =
      action === "mark-paid"
        ? `Confirmer l’encaissement de ${fcfa.format(order.amount)} FCFA pour ${order.reference} ? Le QR code sera activé et la facture émise.`
        : `Annuler la commande ${order.reference} ?`;
    if (!window.confirm(question)) return;
    setBusyId(order.id);
    setError(null);
    try {
      const res = await adminFetch(`/orders/admin/${order.id}/${action}`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof data?.message === "string" ? data.message : "Action impossible.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setBusyId(null);
    }
  };

  const stats = useMemo(
    () => ({
      revenue: orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.amount, 0),
      toCollect: orders.filter((o) => o.status === "quote" || o.status === "pending").reduce((s, o) => s + o.amount, 0),
      open: orders.filter((o) => o.status === "quote" || o.status === "pending").length,
    }),
    [orders],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      return [o.reference, o.customerName, o.customerPhone, o.quoteNumber, o.invoiceNumber, o.card.restaurantName, o.card.title]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [orders, filter, query]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Encaissé" value={`${fcfa.format(stats.revenue)} FCFA`} highlight />
        <Tile label="Reste à encaisser" value={`${fcfa.format(stats.toCollect)} FCFA`} />
        <Tile label="Devis ouverts" value={String(stats.open)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-[0_2px_4px_rgba(171,190,209,0.2)]">
          {(["all", "quote", "pending", "paid", "cancelled"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f ? "bg-forest text-white" : "text-ink/70 hover:bg-cream-deep"
              }`}
            >
              {f === "all" ? "Toutes" : STATUS[f].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="relative block sm:w-72">
            <span className="sr-only">Rechercher une commande</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-sage" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Référence, client, téléphone…"
              className="field !min-h-[2.5rem] pl-9"
            />
          </label>
          <button type="button" onClick={load} disabled={loading} className="btn btn-outline btn-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="surface overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sage">
            <Loader2 className="h-5 w-5 animate-spin" /> Chargement des commandes…
          </div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Receipt className="mx-auto h-8 w-8 text-line" />
            <p className="mt-3 text-sm text-sage">Aucune commande pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-cream-deep/70 text-xs uppercase tracking-[0.08em] text-sage">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Commande</th>
                  <th className="px-4 py-3.5 font-semibold">Client</th>
                  <th className="px-4 py-3.5 font-semibold">Montant</th>
                  <th className="px-4 py-3.5 font-semibold">Statut</th>
                  <th className="px-4 py-3.5 font-semibold">Pièces</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-cream-deep/60">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/commandes/${o.reference}`} className="font-semibold text-forest hover:text-forest-dark">
                        {o.reference}
                      </Link>
                      <p className="text-xs text-sage">
                        {o.kind === "modification" ? "Modification" : SERVICE[o.serviceType]} ·{" "}
                        {o.card.restaurantName || o.card.title || `/c/${o.card.slug}`}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-ink/85">{o.customerName}</p>
                      <p className="text-xs text-sage">{o.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink/90">{fcfa.format(o.amount)} FCFA</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[o.status].className}`}>
                        {STATUS[o.status].label}
                      </span>
                      {o.lastPayment && (
                        <p className="mt-1 text-xs text-sage">{providerLabel(o.lastPayment.provider)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-ink/70">
                      <p>{o.quoteNumber}</p>
                      {o.invoiceNumber && <p className="font-semibold text-ink/85">{o.invoiceNumber}</p>}
                      <p className="text-sage">{new Date(o.createdAt).toLocaleDateString("fr-FR")}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {o.status === "quote" || o.status === "pending" ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={busyId === o.id}
                            onClick={() => act(o, "mark-paid")}
                            className="btn btn-primary btn-sm"
                            title="Paiement reçu sur WhatsApp"
                          >
                            {busyId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Encaisser
                          </button>
                          <button
                            type="button"
                            disabled={busyId === o.id}
                            onClick={() => act(o, "cancel")}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sage transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label="Annuler la commande"
                            title="Annuler"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-right text-xs text-sage">
                          {o.paidAt ? `Payée le ${new Date(o.paidAt).toLocaleDateString("fr-FR")}` : "—"}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${highlight ? "brand-surface" : "surface"}`}>
      <p className={`text-sm font-medium ${highlight ? "text-white/80" : "text-sage"}`}>{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${highlight ? "text-white" : "text-ink/90"}`}>{value}</p>
    </div>
  );
}
