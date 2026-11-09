"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, Inbox, Loader2, ScanLine, Trophy } from "lucide-react";
import { myCards, myEstablishments, type Establishment, type MyCard } from "@/lib/business";
import { useAccountToken } from "./use-account";
import AccountNav from "./account-nav";

/** Compare les QR codes du compte : scans, tendance, demandes reçues ; filtre par établissement. */
export default function Performances() {
  const token = useAccountToken();
  const [cards, setCards] = useState<MyCard[] | null>(null);
  const [ests, setEsts] = useState<Establishment[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    Promise.all([myCards(token), myEstablishments(token)])
      .then(([c, e]) => alive && (setCards(c), setEsts(e)))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Chargement impossible."));
    return () => {
      alive = false;
    };
  }, [token]);

  const shown = useMemo(() => (cards ?? []).filter((c) => filter === "all" || (filter === "none" ? !c.establishment : c.establishment?.id === filter)).sort((a, b) => b.scans.last30 - a.scans.last30), [cards, filter]);
  const max = Math.max(1, ...shown.map((c) => c.scans.last30));
  const sum = (k: "total" | "last7" | "last30") => shown.reduce((n, c) => n + c.scans[k], 0);
  const best = shown[0]?.scans.last30 ? shown[0] : null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="page-title">Performances</h1>
      <p className="mt-2 text-sm text-sage">Comparez vos QR codes : ouvertures de page, tendance et demandes reçues.</p>
      <div className="mt-6"><AccountNav /></div>

      {error && <p role="alert" className="mt-6 text-sm font-medium text-red-600">{error}</p>}
      {!cards && !error && <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-forest" /></div>}

      {cards && cards.length === 0 && (
        <div className="surface mt-8 px-6 py-14 text-center">
          <ScanLine className="mx-auto h-8 w-8 text-line" />
          <p className="mt-3 text-sm text-sage">Aucun QR code en ligne pour l’instant. Les statistiques apparaissent dès le premier scan.</p>
          <Link href="/creer" className="btn btn-primary mt-5">Créer un QR code</Link>
        </div>
      )}

      {cards && cards.length > 0 && (
        <>
          {ests.length > 0 && (
            <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {[{ id: "all", name: "Tous" }, ...ests.map((e) => ({ id: e.id, name: e.name })), { id: "none", name: "Sans établissement" }].map((e) => (
                <button key={e.id} type="button" onClick={() => setFilter(e.id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium ${filter === e.id ? "border-ink bg-ink text-white" : "border-line bg-white text-ink/75 hover:border-ink/30"}`}>
                  {e.id !== "all" && e.id !== "none" && <Building2 className="h-3.5 w-3.5" />} {e.name}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3">
            {([["Total", sum("total")], ["7 derniers jours", sum("last7")], ["30 derniers jours", sum("last30")]] as const).map(([l, v]) => (
              <div key={l} className="surface p-4 text-center sm:p-5">
                <p className="text-2xl font-semibold text-forest sm:text-3xl">{new Intl.NumberFormat("fr-FR").format(v)}</p>
                <p className="mt-1 text-xs text-sage sm:text-sm">scans · {l}</p>
              </div>
            ))}
          </div>

          {best && (
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <Trophy className="h-4 w-4 shrink-0" /> <span>Meilleur QR code (30 jours) : <strong>{best.title}</strong> avec {best.scans.last30} scan{best.scans.last30 > 1 ? "s" : ""}.</span>
            </p>
          )}

          <ul className="mt-6 space-y-3">
            {shown.map((c) => (
              <li key={c.slug}>
                <Link href={`/compte/qr/${c.slug}`} className="surface surface-hover block p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{c.title}</p>
                      <p className="mt-0.5 text-xs text-sage">{c.establishment?.name ?? "Sans établissement"} · {c.status === "active" ? "En ligne" : "Non activé"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {c.newRequests > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-forest px-2.5 py-1 text-xs font-semibold text-white"><Inbox className="h-3 w-3" /> {c.newRequests}</span>}
                      <ArrowRight className="h-4 w-4 text-sage" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream-deep" role="img" aria-label={`${c.scans.last30} scans sur 30 jours`}>
                      <div className="h-full rounded-full bg-forest" style={{ width: `${Math.max(c.scans.last30 ? 4 : 0, (c.scans.last30 / max) * 100)}%` }} />
                    </div>
                    <p className="w-40 shrink-0 text-right text-xs tabular-nums text-sage"><strong className="text-ink">{c.scans.last30}</strong> / 30 j · {c.scans.last7} / 7 j · {c.scans.total} au total</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
