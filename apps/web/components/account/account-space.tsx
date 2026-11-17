"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, CalendarClock, FileText, Images, Loader2, LogOut, Lock, PanelsTopLeft, QrCode, Receipt, ScanLine, Settings, BarChart3, Crown, TriangleAlert } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { useDialogs } from "./auth-dialog";
import { fetchMyOrders, fetchPremiumHistory, updateProfile, type AccountOrder, type PremiumReceipt } from "@/lib/account";
import { PREMIUM_PRICE, usePremium } from "@/lib/premium";
import { formatPhone, toPhone } from "./auth-form";
import { STATUS_LABELS, fcfa, formatDate } from "@/lib/orders";
import StyledQr from "@/components/qr/styled-qr";
import SendQrButton from "./send-qr-button";
import ScanStatsPanel from "./scan-stats";
import DataPrivacy from "./data-privacy";
import VerifyEmailNotice from "./verify-email-notice";

const ICONS = { page: PanelsTopLeft, media: Images, document: FileText, direct: QrCode } as const;

const BADGE: Record<AccountOrder["status"], string> = {
  quote: "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-line text-sage",
};

/** Espace client : QR codes, factures et paramètres du compte. */
export default function AccountSpace() {
  const router = useRouter();
  const tabParam = useSearchParams().get("onglet");
  const tab = tabParam === "factures" || tabParam === "parametres" || tabParam === "stats" ? tabParam : "codes";
  const { openAuth, openPremium } = useDialogs();
  const { authToken, authUser, logoutSession } = useFile();
  const premium = usePremium();
  const [orders, setOrders] = useState<AccountOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Session lue dans le navigateur : on attend le premier rendu client avant de décider.
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!ready) return;
    if (!authToken) {
      openAuth({ mode: "login" });
      return;
    }
    let alive = true;
    fetchMyOrders(authToken)
      .then((list) => alive && setOrders(list))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Chargement impossible."));
    return () => {
      alive = false;
    };
  }, [ready, authToken, openAuth]);

  const logout = () => {
    logoutSession();
    router.replace("/");
  };

  // La session vit dans le navigateur : tant que la page n'est pas hydratée, on n'affiche rien (même rendu serveur et navigateur).
  if (!ready) return <section className="mx-auto min-h-[calc(100svh-var(--header-h)-1px)] max-w-4xl px-4 py-12 sm:px-6 lg:py-16" aria-busy="true" />;

  // Sans compte, « Mon espace » ne montre rien : seulement la fenêtre de connexion.
  if (!authToken) {
    return (
      <section className="mx-auto flex min-h-[calc(100svh-var(--header-h)-1px)] max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="text-lg font-semibold text-ink/90">Connexion requise</h1>
        <p className="mt-1 text-sm text-sage">Connectez-vous pour retrouver vos QR codes.</p>
        <button type="button" onClick={() => openAuth({ mode: "login" })} className="btn btn-primary mt-5">
          Me connecter
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-[calc(100svh-var(--header-h)-1px)] w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-[radial-gradient(70%_120%_at_100%_0%,rgba(227,5,29,0.08),transparent_70%),linear-gradient(#fff,#fbf5f5)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-forest text-2xl font-semibold text-white ring-4 ring-white">
            {authUser?.picture && /^https:\/\//.test(authUser.picture) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={authUser.picture} alt="" width={64} height={64} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            ) : (
              ((authUser?.name || authUser?.email || "M").trim()[0] ?? "M").toUpperCase()
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="page-title truncate">{authUser?.name || "Mon espace"}</h1>
            <p className="truncate text-sm text-sage">{authUser?.email}</p>
          </div>
          {premium.ready && (premium.admin || premium.active) && (
            <span className="premium-pill"><Crown className="h-3 w-3" /> {premium.admin ? "Administrateur" : `Premium · jusqu’au ${formatDate(premium.until)}`}</span>
          )}
        </div>
      </div>

      <VerifyEmailNotice className="mt-4" />
      <PremiumNotice className="mt-4" />

      <div className="mt-8 grid flex-1 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-stretch">
        <nav aria-label="Mon espace" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:h-fit lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:border lg:border-line lg:bg-white lg:p-2 lg:pb-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={id === "codes" ? "/compte" : `/compte?onglet=${id}`}
              scroll={false}
              aria-current={tab === id ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition max-lg:border ${tab === id ? "bg-cream-deep text-forest max-lg:border-forest/30" : "text-ink/70 hover:bg-cream-deep hover:text-ink max-lg:border-line max-lg:bg-white"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
          <button type="button" onClick={logout} className="inline-flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-cream-deep hover:text-ink max-lg:border max-lg:border-line max-lg:bg-white lg:mt-2 lg:border-t lg:border-line lg:rounded-t-none lg:pt-4">
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </nav>

        <div className="flex min-w-0 flex-col">
          {error ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : !orders ? (
            <p className="flex items-center gap-2 text-sm text-sage">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </p>
          ) : tab === "stats" ? (
            <ScanStatsPanel token={authToken} />
          ) : tab === "factures" ? (
            <Invoices orders={orders} />
          ) : tab === "parametres" ? (
            <Settings_ />
          ) : (
            <>
              <Stats orders={orders} />
              {orders.length === 0 ? (
                <div className="surface mt-6 flex flex-1 flex-col items-center justify-center p-10 text-center">
                  <QrCode className="mx-auto h-8 w-8 text-forest" />
                  <h2 className="mt-4 text-lg font-semibold text-ink">Aucun QR code pour le moment</h2>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-sage">Créez votre premier QR code : il apparaîtra ici, avec ses statistiques.</p>
                  <Link href="/creer" className="btn btn-primary mt-6">
                    Créer un QR code <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
              <ul className="mt-6 space-y-3">
            {orders.map((o) => {
              const Icon = ICONS[o.serviceType] ?? QrCode;
              // QR code enregistré avant le paiement : visible dans la liste, mais inaccessible jusqu'au règlement.
              if (o.free && o.cardStatus === "draft") {
                return (
                  <li key={`draft-${o.slug}`} className="surface flex flex-wrap items-center gap-4 p-4 sm:p-5">
                    <span className="icon-tile h-11 w-11 shrink-0"><Lock className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{o.title}</span>
                      <span className="block text-xs text-sage">QR code Premium · {formatDate(o.createdAt)} · verrouillé jusqu’au paiement</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE.quote}`}>En attente de paiement</span>
                    <button type="button" onClick={() => openPremium({ label: "Débloquer mon QR code", suite: "/compte" })} className="btn btn-primary btn-sm w-full sm:w-auto">
                      Payer {PREMIUM_PRICE} FCFA
                    </button>
                  </li>
                );
              }
              if (o.free && o.payload) {
                return (
                  <li key={`free-${o.slug}`} className="surface flex flex-wrap items-center gap-4 p-4 sm:p-5">
                    <span className="icon-tile h-11 w-11 shrink-0"><QrCode className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{o.title}</span>
                      <span className="block text-xs text-sage">Lien gratuit · {formatDate(o.createdAt)}</span>
                    </span>
                    <StyledQr data={o.payload} style={o.qrStyle} downloadName={`moncode-${o.slug}`} hideQr className="w-full sm:w-44" />
                    {o.slug && <div className="w-full"><SendQrButton slug={o.slug} /></div>}
                  </li>
                );
              }
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
                  {o.slug && o.status === "paid" && <div className="ml-1"><SendQrButton slug={o.slug} /></div>}
                </li>
              );
            })}
          </ul>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

const TABS = [
  { id: "codes", label: "Mes QR codes", icon: QrCode },
  { id: "stats", label: "Statistiques", icon: BarChart3 },
  { id: "factures", label: "Factures", icon: Receipt },
  { id: "parametres", label: "Paramètres", icon: Settings },
] as const;

/** Trois repères en haut de « Mes QR codes ». */
function Stats({ orders }: { orders: AccountOrder[] }) {
  const premium = usePremium();
  const scans7 = orders.reduce((n, o) => n + (o.scans?.last7 ?? 0), 0);
  const tiles: [string, string, typeof QrCode][] = [
    [String(orders.length), "QR codes créés", QrCode],
    [String(scans7), "scans en 7 jours", ScanLine],
    [premium.admin ? "Illimité" : premium.active && premium.until ? formatDate(premium.until) : "Non activé", premium.admin ? "compte administrateur" : "Premium jusqu’au", CalendarClock],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {tiles.map(([v, l, Icon]) => (
        <div key={l} className="surface flex items-center gap-4 p-4">
          <span className="icon-tile h-11 w-11 shrink-0"><Icon className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold text-ink">{v}</p>
            <p className="text-xs text-sage">{l}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Factures : commandes payées (avec leur facture) et reçus des paiements Premium. */
function Invoices({ orders }: { orders: AccountOrder[] }) {
  const { authToken } = useFile();
  const [receipts, setReceipts] = useState<PremiumReceipt[] | null>(null);
  useEffect(() => {
    if (!authToken) return;
    let alive = true;
    fetchPremiumHistory(authToken).then((r) => alive && setReceipts(r)).catch(() => alive && setReceipts([]));
    return () => {
      alive = false;
    };
  }, [authToken]);
  const invoices = orders.filter((o) => o.invoiceNumber && o.reference);
  const empty = receipts !== null && receipts.length === 0 && invoices.length === 0;

  return (
    <div className="space-y-6">
      <section className="surface p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink/90">Paiements Premium</h2>
        {receipts === null ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-sage"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>
        ) : receipts.length === 0 ? (
          <p className="mt-3 text-sm text-sage">Aucun paiement pour le moment.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {receipts.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-ink/90">Moncode Premium · 1 an</p>
                  <p className="text-xs text-sage">Payé le {formatDate(r.paidAt)} par Mobile Money · réf. {r.reference} · valable jusqu’au {formatDate(r.expiresAt)}</p>
                </div>
                <span className="font-semibold text-ink/90">{fcfa(r.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink/90">Factures des commandes</h2>
        {invoices.length === 0 ? (
          <p className="mt-3 text-sm text-sage">{empty ? "Aucune facture pour le moment : elles apparaissent ici après chaque création de QR code." : "Aucune facture de commande."}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {invoices.map((o) => (
              <li key={o.reference} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink/90">{o.invoiceNumber} · {o.title}</p>
                  <p className="text-xs text-sage">{o.serviceLabel} · {formatDate(o.paidAt)} · {o.amount === 0 ? "Offert" : fcfa(o.amount)}</p>
                </div>
                <Link href={`/commande/${o.reference}/facture`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline">
                  <Receipt className="h-4 w-4" /> Voir la facture
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Paramètres : profil (nom, téléphone), abonnement Premium. */
function Settings_() {
  const { authToken, authUser, updateAuthUser } = useFile();
  const premium = usePremium();
  const [name, setName] = useState(authUser?.name ?? "");
  const [phone, setPhone] = useState((authUser?.phone ?? "").replace(/^\+229/, ""));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (name.trim().length < 2) return setError("Indiquez votre nom et prénom.");
    const full = phone.trim() ? toPhone(phone) : null;
    if (phone.trim() && !full) return setError("Numéro invalide : 8 ou 10 chiffres (ex. 01 97 00 00 00).");
    if (!authToken) return;
    setBusy(true);
    try {
      const saved = await updateProfile(authToken, { name: name.trim(), ...(full ? { phone: full } : {}) });
      updateAuthUser({ name: saved.name, phone: saved.phone });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={save} noValidate className="surface p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink/90">Profil</h2>
        <p className="mt-1 text-sm text-sage">Ces informations servent à vos paiements et à vos factures.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-ink/70">Nom et prénom
            <input className="field mt-1.5" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="block text-xs font-semibold text-ink/70">Adresse e-mail
            <input className="field mt-1.5 opacity-70" value={authUser?.email ?? ""} readOnly aria-readonly="true" />
          </label>
          <label className="block text-xs font-semibold text-ink/70 sm:col-span-2">Téléphone (Mobile Money)
            <div className="mt-1.5 flex max-w-sm overflow-hidden rounded-xl border border-line bg-white focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/20">
              <span className="flex shrink-0 items-center gap-2 border-r border-line bg-cream px-3 text-sm font-medium text-ink/80"><span aria-hidden="true">🇧🇯</span> +229</span>
              <input className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none" inputMode="tel" placeholder="01 97 00 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {authUser?.phone && <span className="mt-1 block font-normal text-sage">Enregistré : {formatPhone(authUser.phone)}</span>}
          </label>
        </div>
        {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
        <div className="mt-5 flex items-center gap-3">
          <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
          </button>
          {done && <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><Check className="h-4 w-4" /> Enregistré</span>}
        </div>
      </form>

      <section className="surface p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink/90">Abonnement</h2>
        {premium.admin ? (
          <p className="mt-2 text-sm text-sage">Compte administrateur : tout est inclus, sans limite.</p>
        ) : premium.active ? (
          <p className="mt-2 text-sm text-sage">Premium actif jusqu’au <strong className="font-semibold text-ink/90">{formatDate(premium.until)}</strong>. Un paiement avant cette date prolonge l’abonnement d’un an.{premium.pages?.limit != null && <> Pages digitales utilisées : <strong className="font-semibold text-ink/90">{premium.pages.used} / {premium.pages.limit}</strong>.</>}</p>
        ) : (
          <p className="mt-2 text-sm text-sage">Vous utilisez l’offre gratuite : liens simples uniquement. Premium débloque tous les contenus, les styles et le logo, pour 5 000 FCFA.</p>
        )}
        {!premium.admin && (
          <Link href="/paiement?suite=%2Fcompte%3Fonglet%3Dparametres" className="btn btn-outline btn-sm mt-4">
            {premium.active ? "Renouveler Premium" : "Passer en Premium"}
          </Link>
        )}
      </section>

      <DataPrivacy />
    </div>
  );
}

/** Bandeau de renouvellement : visible dans les 30 jours avant la fin du Premium, et après son expiration. */
function PremiumNotice({ className = "" }: { className?: string }) {
  const premium = usePremium();
  const { openPremium } = useDialogs();
  const [now] = useState(() => Date.now());
  if (!premium.ready || premium.admin || !premium.until) return null;
  const left = Math.ceil((new Date(premium.until).getTime() - now) / 86_400_000);
  const expired = !premium.active;
  if (!expired && left > 30) return null;
  const urgent = expired || left <= 7;
  return (
    <div role="status" className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm ${urgent ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-900"} ${className}`}>
      <TriangleAlert className="h-4 w-4 shrink-0" />
      <p className="min-w-[14rem] flex-1">
        {expired
          ? <>Votre Premium a expiré le <strong>{formatDate(premium.until)}</strong>. Renouvelez-le pour créer et télécharger à nouveau vos QR codes.</>
          : <>Votre Premium se termine {left <= 1 ? "demain" : `dans ${left} jours`} (le <strong>{formatDate(premium.until)}</strong>). Une année de plus s’ajoutera à la suite.</>}
      </p>
      <button type="button" onClick={() => openPremium({ label: "Renouveler Premium", suite: "/compte", renew: true })} className="btn btn-primary btn-sm max-sm:w-full">
        Renouveler · {PREMIUM_PRICE} FCFA
      </button>
    </div>
  );
}
