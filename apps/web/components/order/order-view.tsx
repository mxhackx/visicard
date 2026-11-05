"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  PencilLine,
  Ban,
  CheckCircle2,
  Receipt,
  ShieldAlert,
  Smartphone,
  Wallet,
} from "lucide-react";
import StyledQr from "@/components/qr/styled-qr";
import { useOrderKey } from "@/lib/use-order-key";
import Stepper from "@/components/order/stepper";
import ContentPreview from "@/components/order/content-preview";
import {
  STATUS_LABELS,
  fcfa,
  adminOrderAction,
  fetchOrder,
  fetchOrderAsAdmin,
  formatDate,
  privateOrderUrl,
  refreshOrder,
  rememberOrderKey,
  startPayment,
  type OrderView as Order,
  type PaymentProvider,
} from "@/lib/orders";
import { whatsappUrl } from "@/lib/contact";

const POLL_MS = 4000;
const POLL_MAX_MS = 3 * 60 * 1000;

export default function OrderView({
  reference,
  keyFromUrl,
  returningFrom,
  adminToken,
}: {
  reference: string;
  keyFromUrl?: string;
  returningFrom?: string;
  /** Mode admin : lecture via l'API admin, actions d'encaissement au lieu du paiement. */
  adminToken?: string;
}) {
  const storedKey = useOrderKey(reference);
  // Le jeton vient du lien (première visite) ou du navigateur (retour, retour de FedaPay).
  const key = adminToken ? "admin" : (keyFromUrl || storedKey) ?? null;
  const [order, setOrder] = useState<Order | null>(null);
  const [fetchError, setError] = useState<string | null>(null);
  const error =
    !adminToken && !keyFromUrl && storedKey === null
      ? "Lien de commande incomplet. Ouvrez le lien privé reçu à la création de votre devis."
      : fetchError;
  const [polling, setPolling] = useState(false);
  const pollStarted = useRef<number>(0);

  // Le lien secret est mémorisé, puis retiré de la barre d'adresse.
  useEffect(() => {
    if (adminToken || !keyFromUrl) return;
    rememberOrderKey(reference, keyFromUrl);
    window.history.replaceState(null, "", `/commande/${reference}`);
  }, [keyFromUrl, reference, adminToken]);

  const load = useCallback(
    async (withRefresh = false) => {
      if (!key) return;
      try {
        const next = adminToken
          ? await fetchOrderAsAdmin(reference, adminToken)
          : withRefresh
            ? await refreshOrder(reference, key)
            : await fetchOrder(reference, key);
        setOrder(next);
        setError(null);
        return next;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Commande introuvable.");
      }
    },
    [key, reference, adminToken],
  );

  useEffect(() => {
    if (!key) return;
    const id = window.setTimeout(() => {
      load(Boolean(returningFrom)).then((o) => {
        if (o?.status === "pending" || returningFrom) {
          pollStarted.current = Date.now();
          setPolling(true);
        }
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, [key, load, returningFrom]);

  // Vérification périodique tant qu'un paiement est en attente.
  useEffect(() => {
    if (!polling) return;
    const id = window.setInterval(async () => {
      const o = await load(true);
      if (!o || o.status === "paid" || o.status === "quote" || Date.now() - pollStarted.current > POLL_MAX_MS) {
        setPolling(false);
      }
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [polling, load]);

  if (error && !order) {
    return (
      <Shell>
        <div className="surface mx-auto max-w-lg p-8 text-center">
          <span className="icon-tile mx-auto">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-ink/90">Commande inaccessible</h1>
          <p className="mt-2 text-sm leading-6 text-sage">{error}</p>
          <a
            href={whatsappUrl(`Bonjour Moncode, je n'arrive pas à ouvrir ma commande ${reference}.`)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary mt-6"
          >
            Nous contacter sur WhatsApp
          </a>
        </div>
      </Shell>
    );
  }

  if (!order || !key) {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-3 py-24 text-sage">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement de votre commande…
        </div>
      </Shell>
    );
  }

  const paid = order.status === "paid";
  const step = paid ? 4 : 2;

  return (
    <Shell>
      <div className="max-w-3xl">
        <Stepper current={step} />
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-sage">
            {order.kind === "modification" ? "Modification" : order.serviceLabel} · {order.reference}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-ink/90 sm:text-4xl">
            {paid
              ? order.kind === "modification"
                ? "Modification en ligne."
                : "Votre QR code est actif."
              : order.status === "cancelled"
                ? "Commande annulée."
                : "Il ne reste que le paiement."}
          </h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Preview order={order} />

        <div className="space-y-6">
          {order.card.status === "rejected" && <RejectedNotice order={order} />}
          {adminToken && <AdminOrderPanel order={order} adminToken={adminToken} onDone={() => load()} />}
          {paid ? (
            <QrPanel order={order} admin={Boolean(adminToken)} />
          ) : adminToken ? (
            <QuotePanel order={order} admin />
          ) : order.status !== "cancelled" && order.card.status !== "rejected" ? (
            <>
              <QuotePanel order={order} />
              <PaymentPanel
                order={order}
                orderKey={key}
                polling={polling}
                onStarted={() => {
                  pollStarted.current = Date.now();
                  setPolling(true);
                  load();
                }}
                onPaid={() => load()}
              />
            </>
          ) : null}
          {!adminToken && <PrivateLink reference={order.reference} orderKey={key} />}
        </div>
      </div>

      {paid && order.kind === "creation" && !adminToken && (
        <div className="surface mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink/90">Besoin de changer le contenu ?</h2>
            <p className="mt-1 text-sm text-sage">
              Chaque modification fait l’objet d’un nouveau devis. Le QR code imprimé reste le même.
            </p>
            {order.modifications.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {order.modifications.map((m) => (
                  <li key={m.reference} className="text-ink/80">
                    {m.reference} · {fcfa(m.amount)} · <span className="text-sage">{STATUS_LABELS[m.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link href={`/commande/${order.reference}/modifier`} className="btn btn-outline shrink-0">
            <PencilLine className="h-4 w-4" />
            Demander une modification
          </Link>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">{children}</section>;
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const tone =
    status === "paid"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "pending"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : status === "cancelled"
          ? "bg-red-50 text-red-700 ring-red-200"
          : "bg-leaf text-forest ring-ambre/30";
  return (
    <span className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${tone}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}

/* ------------------------------ Aperçu du contenu ------------------------------ */

function Preview({ order }: { order: Order }) {
  const p = order.card.preview;
  const draft = order.card.status === "draft";

  return (
    <div className="surface relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-sm font-semibold text-ink/90">
          {order.kind === "modification" ? "Contenu actuel" : "Aperçu de votre contenu"}
        </p>
        {draft && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <Lock className="h-3 w-3" /> Non publié
          </span>
        )}
      </div>

      <ContentPreview serviceType={order.serviceType} preview={p} watermark={draft ? "Aperçu" : null} />

      {order.kind === "modification" && order.pendingChanges && (
        <div className="border-t border-line px-5 py-4">
          <p className="text-sm font-semibold text-ink/90">Changements demandés</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {Object.keys(order.pendingChanges).map((field) => (
              <li key={field} className="rounded-full bg-leaf px-2.5 py-1 text-xs font-medium text-ambre-deep">
                {FIELD_LABELS[field] ?? field}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-sage">Appliqués automatiquement dès le paiement confirmé.</p>
        </div>
      )}
    </div>
  );
}

const FIELD_LABELS: Record<string, string> = {
  title: "Titre",
  restaurantName: "Nom",
  address: "Adresse",
  phoneNumber: "Téléphone",
  additionalInfo: "Description",
  facebookUrl: "Facebook",
  instagramUrl: "Instagram",
  xUrl: "X",
  snapchatUrl: "Snapchat",
  locationUrl: "Localisation",
  logoUrl: "Logo",
  imageUrl: "Image principale",
  menuImages: "Photos du menu",
  placeImages: "Photos du lieu",
  contentUrl: "Fichier",
  contentType: "Fichier",
  fileName: "Fichier",
  schedule: "Horaires",
  themeId: "Thème",
};

/* ------------------------------------ Devis ------------------------------------ */

function QuotePanel({ order, admin }: { order: Order; admin?: boolean }) {
  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-ink/90">Devis {order.quoteNumber}</p>
          <p className="text-xs text-sage">Émis le {formatDate(order.createdAt)} pour {order.customer.name}</p>
        </div>
        <Link
          href={admin ? `/admin/commandes/${order.reference}/devis` : `/commande/${order.reference}/devis`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-dark"
        >
          <FileText className="h-4 w-4" />
          Voir
        </Link>
      </div>
      <ul className="divide-y divide-line px-6">
        {order.items.map((item) => (
          <li key={item.label} className="flex items-start justify-between gap-4 py-3 text-sm">
            <span className="text-ink/80">{item.label}</span>
            <span className="shrink-0 font-semibold text-ink/90">{fcfa(item.unitPrice * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-line bg-cream-deep px-6 py-4">
        <span className="text-sm font-semibold text-ink/80">Total à payer</span>
        <span className="text-2xl font-semibold text-forest">{fcfa(order.amount)}</span>
      </div>
    </div>
  );
}

/* ----------------------------------- Paiement ----------------------------------- */

function PaymentPanel({
  order,
  orderKey,
  polling,
  onStarted,
  onPaid,
}: {
  order: Order;
  orderKey: string;
  polling: boolean;
  onStarted: () => void;
  onPaid: () => void;
}) {
  const methods = order.payment;
  // MoMo et FedaPay sont toujours proposés ; s'ils ne sont pas encore configurés côté
  // serveur, le client est orienté vers un règlement assisté. Dès que les clés sont
  // ajoutées dans l'API, les boutons fonctionnent sans autre changement.
  const available: PaymentProvider[] = ["momo", "fedapay", ...(methods.simulation ? (["simulation"] as const) : [])];
  const isReady = (id: PaymentProvider) => (id === "simulation" ? methods.simulation : methods[id]);
  const [provider, setProvider] = useState<PaymentProvider>(
    methods.momo ? "momo" : methods.fedapay ? "fedapay" : methods.simulation ? "simulation" : "momo",
  );
  const [phone, setPhone] = useState(order.customer.phone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waiting = order.status === "pending" || polling;
  const lastFailed = order.lastPayment?.status === "failed" && order.status === "quote";
  const ready = isReady(provider);

  const pay = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const result = await startPayment(order.reference, orderKey, provider, provider === "momo" ? phone : undefined);
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }
      if (result.status === "succeeded") onPaid();
      else onStarted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Le paiement n’a pas pu démarrer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="surface p-6">
      <h2 className="text-base font-semibold text-ink/90">Choisissez votre moyen de paiement</h2>

      <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Moyen de paiement">
        {available.map((id) => {
          const meta = PROVIDERS[id];
          const active = provider === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={waiting}
              onClick={() => setProvider(id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-60 ${
                active ? "border-forest bg-leaf/60" : "border-line bg-white hover:border-ambre/60"
              }`}
            >
              <span className={`icon-tile h-10 w-10 ${active ? "bg-forest text-white" : ""}`}>
                <meta.icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink/90">
                  {meta.label}
                  {!isReady(id) && (
                    <span className="rounded-full bg-cream-deep px-2 py-0.5 text-[11px] font-medium text-sage">
                      Bientôt
                    </span>
                  )}
                </span>
                <span className="block text-xs text-sage">{meta.hint}</span>
              </span>
              <span
                className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  active ? "border-forest bg-forest text-white" : "border-line"
                }`}
              >
                {active && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      {provider === "momo" && !waiting && ready && (
        <label className="mt-4 block">
          <span className="text-xs font-semibold text-ink/70">Numéro MTN MoMo à débiter</span>
          <input className="field mt-1.5" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
      )}

      {waiting ? (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
          <span>
            {order.lastPayment?.provider === "momo"
              ? "Validez la demande de paiement sur votre téléphone avec votre code MoMo. Cette page se met à jour toute seule."
              : "Paiement en cours de confirmation. Cette page se met à jour toute seule."}
          </span>
        </div>
      ) : ready ? (
        <button type="button" onClick={pay} disabled={busy} className="btn btn-primary mt-5 w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Payer {fcfa(order.amount)}
        </button>
      ) : (
        <div className="mt-5">
          <p className="rounded-xl border border-line bg-cream-deep px-4 py-3 text-sm leading-6 text-ink/75">
            Le paiement {PROVIDERS[provider].label} en ligne ouvre très bientôt. En attendant, réglez avec notre
            équipe : votre QR code est activé dès réception.
          </p>
          <a
            href={whatsappUrl(
              `Bonjour Moncode, je souhaite régler la commande ${order.reference} (${fcfa(order.amount)}) par ${PROVIDERS[provider].label}.`,
            )}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary mt-3 w-full"
          >
            <Smartphone className="h-4 w-4" />
            Payer {fcfa(order.amount)} avec l’équipe
          </a>
        </div>
      )}

      {(error || lastFailed) && (
        <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error ?? "Le dernier paiement n’a pas abouti. Vous pouvez réessayer."}
        </p>
      )}
      <p className="mt-3 text-center text-xs text-sage">Paiement sécurisé. Votre facture est émise automatiquement.</p>
    </div>
  );
}

const PROVIDERS: Record<PaymentProvider, { label: string; hint: string; icon: typeof Wallet }> = {
  momo: { label: "MTN Mobile Money", hint: "Demande de paiement envoyée sur votre téléphone", icon: Smartphone },
  fedapay: { label: "FedaPay", hint: "MoMo, Moov Money ou carte bancaire", icon: CreditCard },
  simulation: { label: "Paiement simulé", hint: "Environnement de test uniquement", icon: Wallet },
};

/* --------------------------------- QR code actif --------------------------------- */

function QrPanel({ order, admin }: { order: Order; admin?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        {order.cardUrl && (
          <StyledQr
            data={order.cardUrl}
            style={order.card.preview?.qrStyle}
            logoUrl={order.card.preview?.logoUrl}
            size={224}
            downloadName={`moncode-${order.card.slug}`}
            className="w-full max-w-[260px]"
          />
        )}
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          {order.cardUrl && (
            <a href={order.cardUrl} target="_blank" rel="noreferrer" className="btn btn-outline flex-1">
              <ExternalLink className="h-4 w-4" />
              Voir la page
            </a>
          )}
        </div>
        {order.cardUrl && (
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(order.cardUrl!);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex max-w-full items-center gap-2 truncate text-sm text-sage hover:text-ink"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span className="truncate">{order.cardUrl}</span>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-line bg-cream-deep px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-ink/90">Facture {order.invoiceNumber}</p>
          <p className="text-xs text-sage">Payée le {formatDate(order.paidAt)} · {fcfa(order.amount)}</p>
        </div>
        <Link
          href={admin ? `/admin/commandes/${order.reference}/facture` : `/commande/${order.reference}/facture`}
          className="btn btn-outline btn-sm"
        >
          <Receipt className="h-4 w-4" />
          Facture
        </Link>
      </div>
    </div>
  );
}

function PrivateLink({ reference, orderKey }: { reference: string; orderKey: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="surface-soft p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink/90">
        <Lock className="h-4 w-4 text-forest" />
        Gardez votre lien privé
      </p>
      <p className="mt-1 text-xs leading-5 text-sage">
        Il donne accès à ce devis, au paiement, à la facture et au QR code. Ne le partagez pas.
      </p>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(privateOrderUrl(reference, orderKey));
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="btn btn-outline btn-sm mt-3"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        {copied ? "Lien copié" : "Copier mon lien privé"}
      </button>
    </div>
  );
}

function RejectedNotice({ order }: { order: Order }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">Ce contenu n’a pas été validé</p>
        {order.card.moderationNote && <p className="mt-1 text-sm leading-6">Motif : {order.card.moderationNote}</p>}
        <a
          href={whatsappUrl(`Bonjour Moncode, au sujet de la commande ${order.reference} refusée.`)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-semibold underline underline-offset-4"
        >
          Nous contacter pour corriger
        </a>
      </div>
    </div>
  );
}

function AdminOrderPanel({ order, adminToken, onDone }: { order: Order; adminToken: string; onDone: () => void }) {
  const [busy, setBusy] = useState<"mark-paid" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const open = order.status === "quote" || order.status === "pending";

  const act = async (action: "mark-paid" | "cancel") => {
    const question =
      action === "mark-paid"
        ? `Confirmer l’encaissement de ${fcfa(order.amount)} ? La facture est émise et le QR code activé.`
        : "Annuler cette commande ?";
    if (!window.confirm(question)) return;
    setBusy(action);
    setError(null);
    try {
      await adminOrderAction(order.id, action, adminToken);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="surface p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">Vue administrateur</p>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-sage">Client</dt>
          <dd className="font-medium text-ink/90">{order.customer.name}</dd>
          <dd className="text-ink/70">{order.customer.phone}</dd>
          {order.customer.email && <dd className="text-ink/70">{order.customer.email}</dd>}
        </div>
        <div>
          <dt className="text-sage">Dernier paiement</dt>
          <dd className="font-medium text-ink/90">
            {order.lastPayment
              ? `${PROVIDERS[order.lastPayment.provider as PaymentProvider]?.label ?? order.lastPayment.provider} · ${order.lastPayment.status}`
              : "Aucun"}
          </dd>
        </div>
      </dl>
      {open && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" disabled={busy !== null} onClick={() => act("mark-paid")} className="btn btn-primary btn-sm">
            {busy === "mark-paid" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Encaisser (hors ligne)
          </button>
          <button type="button" disabled={busy !== null} onClick={() => act("cancel")} className="btn btn-outline btn-sm">
            {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
            Annuler
          </button>
        </div>
      )}
      <Link href={`/admin/cartes/${order.card.slug}`} className="mt-4 inline-flex text-sm font-semibold text-forest hover:text-forest-dark">
        Voir la fiche du QR code →
      </Link>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
