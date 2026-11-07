"use client";

import AccountNav from "./account-nav";
import Overview from "./overview";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Images, Loader2, LogOut, PanelsTopLeft, Plus, QrCode, ScanLine, Settings2 } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { fetchMyOrders, type AccountOrder } from "@/lib/account";
import { STATUS_LABELS, fcfa, formatDate } from "@/lib/orders";

const ICONS = { page: PanelsTopLeft, media: Images, document: FileText, direct: QrCode } as const;

const BADGE: Record<AccountOrder["status"], string> = {
  quote: "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-line text-sage",
};

/** Espace client : toutes les commandes du compte, avec accès direct à chaque QR code. */
export default function AccountOrders() {
  const router = useRouter();
  const { authToken, authRole, authUser, logoutSession } = useFile();
  const [orders, setOrders] = useState<AccountOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Session lue dans le navigateur : on attend le premier rendu client avant de décider.
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!ready) return;
    if (!authToken) {
      router.replace("/connexion?next=%2Fcompte");
      return;
    }
    let alive = true;
    fetchMyOrders(authToken)
      .then((list) => alive && setOrders(list))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Chargement impossible."));
    return () => {
      alive = false;
    };
  }, [ready, authToken, router]);

  const logout = () => {
    logoutSession();
    router.replace("/");
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">Mon espace</h1>
          {authUser?.email && <p className="mt-1 text-sm text-sage">{authUser.email}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={logout} className="btn btn-outline btn-sm">
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
          <Link href="/creer" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" /> Nouveau QR code
          </Link>
        </div>
      </div>

      <div className="mt-6"><AccountNav /></div>
      <Overview />

      {authRole === "admin" && (
        <p className="mt-6 rounded-xl border border-line bg-white px-4 py-3 text-sm text-sage">
          Vous êtes connecté en tant qu’administrateur.{" "}
          <Link href="/admin" className="font-semibold text-forest underline-offset-4 hover:underline">
            Ouvrir l’administration
          </Link>
        </p>
      )}

      <div className="mt-8">
        {error ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : !orders ? (
          <p className="flex items-center gap-2 text-sm text-sage">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement de vos QR codes…
          </p>
        ) : orders.length === 0 ? (
          <div className="surface p-10 text-center">
            <QrCode className="mx-auto h-8 w-8 text-forest" />
            <h2 className="mt-4 text-lg font-semibold text-ink">Aucun QR code pour le moment</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-sage">
              Créez votre première page, image, vidéo ou PDF : il apparaîtra ici avec son QR code et sa facture.
            </p>
            <Link href="/creer" className="btn btn-primary mt-6">
              Créer un QR code <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => {
              const Icon = ICONS[o.serviceType] ?? QrCode;
              return (
                <li key={o.reference}>
                  <Link
                    href={`/commande/${o.reference}`}
                    className="surface surface-hover flex items-center gap-4 p-4 transition hover:-translate-y-0.5 sm:p-5"
                  >
                    <span className="icon-tile h-11 w-11 shrink-0">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{o.title}</span>
                      <span className="block text-xs text-sage">
                        {o.serviceLabel} · {formatDate(o.createdAt)} · {fcfa(o.amount)}
                      </span>
                      {o.scans && o.status === "paid" && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-forest">
                          <ScanLine className="h-3.5 w-3.5" />
                          {o.scans.total} scan{o.scans.total > 1 ? "s" : ""} · {o.scans.last7} ces 7 derniers jours
                        </span>
                      )}
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE[o.status]}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                    <ArrowRight className="hidden h-4 w-4 shrink-0 text-sage sm:block" />
                  </Link>
                  {o.slug && o.serviceType !== "direct" && o.status === "paid" && (
                    <Link href={`/compte/qr/${o.slug}`} className="ml-1 mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline">
                      <Settings2 className="h-3.5 w-3.5" /> Statistiques, catalogue et réservations
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
