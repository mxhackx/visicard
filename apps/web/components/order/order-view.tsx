"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  MessageCircle,
  PencilLine,
  RefreshCw,
  Ban,
  CheckCircle2,
  Receipt,
  ShieldAlert,
  CreditCard,
} from "lucide-react";
import FedapayBadge from "@/components/fedapay-badge";
import DirectResult from "@/components/order/direct-result";
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
  rememberOrderKey,
  type OrderView as Order,
  refreshOrder,
  startPayment,
} from "@/lib/orders";
import { providerLabel, whatsappUrl } from "@/lib/contact";

export default function OrderView({
  reference,
  keyFromUrl,
  adminToken,
}: {
  reference: string;
  keyFromUrl?: string;
  /** Mode admin : lecture via l'API admin, actions d'encaissement au lieu du paiement. */
  adminToken?: string;
}) {
  const storedKey = useOrderKey(reference);
  // Le jeton vient du lien (première visite) ou du navigateur (visites suivantes).
  const key = adminToken ? "admin" : (keyFromUrl || storedKey) ?? null;
  const [order, setOrder] = useState<Order | null>(null);
  const [fetchError, setError] = useState<string | null>(null);
  const error =
    !adminToken && !keyFromUrl && storedKey === null
      ? "Lien de commande incomplet. Ouvrez le lien privé reçu à la création de votre devis."
      : fetchError;

  // Le lien secret est mémorisé, puis retiré de la barre d'adresse.
  useEffect(() => {
    if (adminToken || !keyFromUrl) return;
    rememberOrderKey(reference, keyFromUrl);
    window.history.replaceState(null, "", `/commande/${reference}`);
  }, [keyFromUrl, reference, adminToken]);

  const load = useCallback(
    async () => {
      if (!key) return;
      try {
        const next = adminToken ? await fetchOrderAsAdmin(reference, adminToken) : await fetchOrder(reference, key);
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
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [key, load]);

  // Retour de la page de paiement FedaPay : on relit le statut chez FedaPay (jamais depuis l'adresse).
  useEffect(() => {
    if (adminToken || !key) return;
    if (new URLSearchParams(window.location.search).get("paiement") !== "fedapay") return;
    window.history.replaceState(null, "", `/commande/${reference}`);
    let tries = 0;
    let timer = 0;
    const check = async () => {
      try {
        const next = await refreshOrder(reference, key);
        setOrder(next);
        // Le paiement mobile peut mettre quelques secondes à être confirmé.
        if (next.status === "pending" && ++tries < 8) timer = window.setTimeout(check, 4000);
      } catch {
        /* le bouton « actualiser » reste disponible */
      }
    };
    void check();
    return () => window.clearTimeout(timer);
  }, [adminToken, key, reference]);

  // Le paiement est confirmé par l'équipe : la page se relit quand le client y revient.
  useEffect(() => {
    if (adminToken) return;
    const onFocus = () => document.visibilityState === "visible" && void load();
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [load, adminToken]);

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

      {paid && order.serviceType === "direct" && order.card.preview?.contentUrl ? (
        <>
        <DirectResult
          payload={order.card.preview.contentUrl}
          style={order.card.preview.qrStyle}
          slug={order.card.slug}
          reference={order.reference}
          invoiceNumber={order.invoiceNumber}
          invoiceHref={adminToken ? `/admin/commandes/${order.reference}/facture` : `/commande/${order.reference}/facture`}
          amountLabel={fcfa(order.amount)}
          paidLabel={`Payée le ${formatDate(order.paidAt)}`}
        />
        {!adminToken && <div className="mt-6 max-w-2xl"><PrivateLink reference={order.reference} orderKey={key} /></div>}
        </>
      ) : (
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
              <PaymentPanel order={order} onRefresh={load} onPay={async () => { const { paymentUrl } = await startPayment(reference, key!); window.location.assign(paymentUrl); }} />
            </>
          ) : null}
          {!adminToken && <PrivateLink reference={order.reference} orderKey={key} />}
        </div>
      </div>
      )}

      {paid && order.kind === "creation" && !adminToken && order.serviceType !== "direct" && (
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

function PaymentPanel({ order, onRefresh, onPay }: { order: Order; onRefresh: () => Promise<unknown>; onPay: () => Promise<void> }) {
  const [checking, setChecking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const message =
    `Bonjour Moncode, j’ai une question sur ma commande ${order.reference} ` +
    `(devis ${order.quoteNumber}, ${order.serviceLabel}, ${fcfa(order.amount)}).`;

  return (
    <div className="surface p-6">
      <h2 className="text-base font-semibold text-ink/90">Paiement</h2>
      <p className="mt-2 text-sm leading-6 text-sage">
        Réglez {fcfa(order.amount)} par Mobile Money ou carte. Votre QR code est activé et votre facture émise dès la confirmation.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <button
          type="button"
          disabled={paying}
          onClick={async () => {
            setPaying(true);
            setPayError(null);
            try {
              await onPay();
            } catch (err) {
              setPayError(
                err instanceof Error && !/503|indisponible/i.test(err.message)
                  ? err.message
                  : "Le paiement en ligne est momentanément indisponible. Écrivez-nous sur WhatsApp : nous vous aidons à finaliser.",
              );
              setPaying(false);
            }
          }}
          className="btn btn-primary min-w-0 flex-1 sm:flex-none"
        >
          {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {paying ? "Redirection…" : `Payer ${fcfa(order.amount)}`}
        </button>
        <FedapayBadge />
      </div>
      {payError && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{payError}</p>}
      <button
        type="button"
        disabled={checking}
        onClick={async () => {
          setChecking(true);
          await onRefresh();
          setChecking(false);
        }}
        className="btn btn-outline btn-sm mt-4 w-full"
      >
        {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        J’ai payé : actualiser
      </button>
      <a href={whatsappUrl(message)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-ink">
        <MessageCircle className="h-4 w-4" /> Une question sur le paiement ? Écrivez-nous
      </a>
      <p className="mt-3 text-xs text-sage">
        Référence : <span className="font-semibold text-ink/80">{order.reference}</span>
      </p>
    </div>
  );
}

/* --------------------------------- QR code actif --------------------------------- */

function QrPanel({ order, admin }: { order: Order; admin?: boolean }) {
  const [copied, setCopied] = useState(false);
  const direct = order.serviceType === "direct";
  // Un QR direct encode son contenu ; les autres pointent vers la page Moncode.
  const qrData = direct ? (order.card.preview?.contentUrl ?? null) : order.cardUrl;
  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        {qrData && (
          <StyledQr
            data={qrData}
            style={order.card.preview?.qrStyle}
            logoUrl={order.card.preview?.logoUrl}
            size={224}
            downloadName={`moncode-${order.card.slug}`}
            className="w-full max-w-[260px]"
          />
        )}
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          {order.cardUrl && !direct && (
            <a href={order.cardUrl} target="_blank" rel="noreferrer" className="btn btn-outline flex-1">
              <ExternalLink className="h-4 w-4" />
              Voir la page
            </a>
          )}
        </div>
        {order.cardUrl && !direct && (
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
        Il donne accès à ce devis, à la facture et au QR code. Ne le partagez pas.
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
        ? `Confirmer avoir reçu ${fcfa(order.amount)} (réglé sur WhatsApp) ? La facture est émise et le QR code activé.`
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
          <dd>
            <a
              href={`https://wa.me/${order.customer.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-ink/70 underline-offset-4 hover:text-forest hover:underline"
            >
              {order.customer.phone}
            </a>
          </dd>
          {order.customer.email && <dd className="text-ink/70">{order.customer.email}</dd>}
        </div>
        <div>
          <dt className="text-sage">Paiement</dt>
          <dd className="font-medium text-ink/90">
            {order.lastPayment ? `${providerLabel(order.lastPayment.provider)} · ${order.lastPayment.status}` : "À régler sur WhatsApp"}
          </dd>
        </div>
      </dl>
      {open && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" disabled={busy !== null} onClick={() => act("mark-paid")} className="btn btn-primary btn-sm">
            {busy === "mark-paid" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Paiement reçu : encaisser
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
