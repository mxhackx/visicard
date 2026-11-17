"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, CircleDashed, Crown, Loader2, Receipt, RefreshCw, Users, Wallet, XCircle } from "lucide-react";
import { useAdminFetch } from "./use-admin-fetch";
import { fcfa, formatDate } from "@/lib/orders";
import SendInvoiceButton from "@/components/order/send-invoice-button";

interface Overview {
  summary: { activeUsers: number; expiringSoon: number; expiredUsers: number; revenue: number; paidCount: number; pendingCount: number };
  users: { id: string; email: string; name: string | null; phone: string | null; premiumUntil: string | null; active: boolean; payments: number }[];
  payments: {
    id: string;
    status: "pending" | "paid" | "failed";
    amount: number;
    reference: string;
    invoiceNumber: string | null;
    paidAt: string | null;
    createdAt: string;
    user: { id: string; email: string; name: string | null; phone: string | null };
  }[];
}

const STATUS = {
  paid: { label: "Payé", cls: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  pending: { label: "En attente", cls: "bg-amber-50 text-amber-700", icon: CircleDashed },
  failed: { label: "Échoué", cls: "bg-red-50 text-red-700", icon: XCircle },
} as const;

/** Onglet « Premium » : comptes Premium (actifs, bientôt échus, échus) et tous les paiements Mobile Money avec leur facture. */
export default function AdminPremium({ adminToken }: { adminToken: string }) {
  const adminFetch = useAdminFetch(adminToken);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"payments" | "users">("payments");
  const [checking, setChecking] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const res = await adminFetch("/admin/premium");
      if (!res.ok) throw new Error("Chargement impossible.");
      setData((await res.json()) as Overview);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }, [adminFetch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const verify = async (id: string) => {
    setChecking(id);
    try {
      await adminFetch(`/admin/premium/${id}/verify`, { method: "POST" });
      await load();
    } finally {
      setChecking(null);
    }
  };

  if (error) return <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"><AlertCircle className="h-4 w-4" /> {error}</p>;
  if (!data) return <p className="flex items-center gap-2 text-sm text-sage"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>;

  const s = data.summary;
  const tiles: [string, string, typeof Crown][] = [
    [String(s.activeUsers), "comptes Premium actifs", Crown],
    [String(s.expiringSoon), "expirent sous 30 jours", CircleDashed],
    [fcfa(s.revenue), `encaissés (${s.paidCount} paiement${s.paidCount > 1 ? "s" : ""})`, Wallet],
    [String(s.pendingCount), "paiement(s) en attente", RefreshCw],
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(([v, l, Icon]) => (
          <div key={l} className="surface flex items-center gap-4 p-4">
            <span className="icon-tile h-11 w-11 shrink-0"><Icon className="h-5 w-5" /></span>
            <div className="min-w-0"><p className="truncate text-xl font-semibold text-ink">{v}</p><p className="text-xs text-sage">{l}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Affichage" className="inline-flex rounded-xl border border-line bg-white p-1">
          {([["payments", "Paiements et factures", Receipt], ["users", "Comptes Premium", Users]] as const).map(([id, label, Icon]) => (
            <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)} className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${view === id ? "bg-forest text-white" : "text-ink/70 hover:bg-cream-deep"}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void load()} className="btn btn-outline btn-sm"><RefreshCw className="h-4 w-4" /> Actualiser</button>
      </div>

      {view === "payments" ? (
        <section className="surface overflow-hidden">
          {data.payments.length === 0 ? (
            <p className="p-8 text-center text-sm text-sage">Aucun paiement Premium pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-line bg-cream-deep/70 text-xs uppercase tracking-[0.08em] text-sage">
                  <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Utilisateur</th><th className="px-4 py-3 text-right">Montant</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Facture</th><th className="px-4 py-3 text-right">Action</th></tr>
                </thead>
                <tbody>
                  {data.payments.map((p) => {
                    const st = STATUS[p.status];
                    return (
                      <tr key={p.id} className="border-b border-line last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 text-ink/80">{formatDate(p.paidAt ?? p.createdAt)}</td>
                        <td className="px-4 py-3"><p className="font-medium text-ink/90">{p.user.name || "—"}</p><p className="text-xs text-sage">{p.user.email}{p.user.phone ? ` · ${p.user.phone}` : ""}</p></td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-ink">{fcfa(p.amount)}</td>
                        <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}><st.icon className="h-3.5 w-3.5" /> {st.label}</span></td>
                        <td className="px-4 py-3">{p.invoiceNumber ? <div className="space-y-1"><Link href={`/facture/premium/${p.id}`} className="inline-flex items-center gap-1.5 font-semibold text-forest hover:underline"><Receipt className="h-4 w-4" /> {p.invoiceNumber}</Link><div><SendInvoiceButton id={p.id} compact /></div></div> : <span className="text-sage">—</span>}</td>
                        <td className="px-4 py-3 text-right">
                          {p.status === "pending" && (
                            <button type="button" onClick={() => void verify(p.id)} disabled={checking === p.id} className="btn btn-outline btn-sm">
                              {checking === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Vérifier chez FeexPay
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="surface overflow-hidden">
          {data.users.length === 0 ? (
            <p className="p-8 text-center text-sm text-sage">Aucun compte n’a encore souscrit Premium.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-line bg-cream-deep/70 text-xs uppercase tracking-[0.08em] text-sage">
                  <tr><th className="px-4 py-3">Utilisateur</th><th className="px-4 py-3">Téléphone</th><th className="px-4 py-3">Premium jusqu’au</th><th className="px-4 py-3">État</th><th className="px-4 py-3 text-right">Paiements</th></tr>
                </thead>
                <tbody>
                  {data.users.map((u) => {
                    const left = u.premiumUntil ? Math.ceil((new Date(u.premiumUntil).getTime() - now) / 86_400_000) : 0;
                    return (
                      <tr key={u.id} className="border-b border-line last:border-0">
                        <td className="px-4 py-3"><p className="font-medium text-ink/90">{u.name || "—"}</p><p className="text-xs text-sage">{u.email}</p></td>
                        <td className="whitespace-nowrap px-4 py-3 text-ink/80">{u.phone ?? "—"}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-ink/80">{formatDate(u.premiumUntil)}</td>
                        <td className="px-4 py-3">
                          {!u.active ? <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Expiré</span>
                            : left <= 30 ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Expire dans {left} j</span>
                            : <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Actif</span>}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-ink/80">{u.payments}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
