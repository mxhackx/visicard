"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  ExternalLink,
  Loader2,
  Pencil,
  RotateCcw,
  ShieldAlert,
  ShieldX,
} from "lucide-react";
import AdminShell from "./AdminShell";
import AdminEditCardModal from "./AdminEditCardModal";
import type { CardSummary } from "./AdminCardsList";
import { useAdminFetch } from "./use-admin-fetch";
import ContentPreview from "@/components/order/content-preview";
import { fcfa, formatDate, STATUS_LABELS, type CardPreview, type OrderStatus } from "@/lib/orders";

interface DetailOrder {
  id: string;
  reference: string;
  kind: "creation" | "modification";
  status: OrderStatus;
  amount: number;
  quoteNumber: string;
  invoiceNumber: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  createdAt: string;
  paidAt: string | null;
  payments: { id: string; provider: string; status: string; createdAt: string }[];
}

interface CardDetail extends CardPreview {
  id: string;
  slug: string;
  serviceType: "page" | "media" | "document";
  status: "draft" | "active" | "rejected";
  moderationNote: string | null;
  rejectedAt: string | null;
  cardUrl?: string;
  createdAt?: string;
  clientName: string | null;
  userName: string | null;
  workDone: string | null;
  amountReceived: number | null;
  qrCode: string | null;
  orders: DetailOrder[];
}

const SERVICE: Record<CardDetail["serviceType"], string> = {
  page: "Page digitale",
  media: "QR image ou vidéo",
  document: "QR document PDF",
};

const CARD_STATUS: Record<CardDetail["status"], { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  draft: { label: "En attente de paiement", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  rejected: { label: "Refusé", className: "bg-red-50 text-red-700 ring-red-200" },
};

const REJECT_PRESETS = [
  "Contenu inapproprié ou contraire à nos conditions",
  "Images floues ou illisibles",
  "Informations incomplètes (nom, contact, adresse)",
  "Droits sur les images non établis",
];

export default function AdminCardDetail({ slug }: { slug: string }) {
  return (
    <AdminShell active="cards" title="Fiche du QR code" hint={`/c/${slug}`}>
      {(token) => <DetailBody slug={slug} adminToken={token} />}
    </AdminShell>
  );
}

function DetailBody({ slug, adminToken }: { slug: string; adminToken: string }) {
  const adminFetch = useAdminFetch(adminToken);
  const [card, setCard] = useState<CardDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminFetch(`/cards/${slug}/admin`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof data?.message === "string" ? data.message : "QR code introuvable.");
      setCard(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    }
  }, [adminFetch, slug]);

  useEffect(() => {
    load();
  }, [load]);

  const restore = async () => {
    if (!window.confirm("Réactiver ce QR code ? Il redevient visible (ou payable s'il n'a pas été réglé).")) return;
    setBusy(true);
    try {
      const res = await adminFetch(`/cards/${slug}/restore`, { method: "POST" });
      if (!res.ok) throw new Error("Réactivation impossible.");
      setCard(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Réactivation impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (!card) {
    return error ? (
      <div className="surface mx-auto max-w-lg p-8 text-center">
        <p className="text-sm text-sage">{error}</p>
        <Link href="/admin?tab=cards" className="btn btn-outline mt-6">
          Retour aux QR codes
        </Link>
      </div>
    ) : (
      <div className="flex items-center justify-center gap-3 py-24 text-sage">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
      </div>
    );
  }

  const status = CARD_STATUS[card.status];
  const name = card.restaurantName || card.title || card.slug;
  const customer = card.orders.find((o) => o.kind === "creation") ?? card.orders[0];

  return (
    <div className="space-y-6">
      <Link href="/admin?tab=cards" className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Tous les QR codes
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-sage">{SERVICE[card.serviceType]}</p>
          <h2 className="truncate text-2xl font-semibold text-ink/90 sm:text-3xl">{name}</h2>
          <span className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${status.className}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {status.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {card.status === "active" && card.cardUrl && (
            <a href={card.cardUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              <ExternalLink className="h-4 w-4" /> Page publique
            </a>
          )}
          <button type="button" onClick={() => setEditing(true)} className="btn btn-outline btn-sm">
            <Pencil className="h-4 w-4" /> Modifier
          </button>
          {card.status === "rejected" ? (
            <button type="button" disabled={busy} onClick={restore} className="btn btn-primary btn-sm">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Réactiver
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRejecting(true)}
              className="btn btn-sm border-red-200 bg-white text-red-600 hover:bg-red-50"
            >
              <ShieldX className="h-4 w-4" /> Refuser
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {card.status === "rejected" && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Refusé le {formatDate(card.rejectedAt)}</p>
            <p className="mt-1 text-sm">Motif montré au client : {card.moderationNote}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface overflow-hidden">
          <div className="border-b border-line px-5 py-3 text-sm font-semibold text-ink/90">Contenu</div>
          <ContentPreview
            serviceType={card.serviceType}
            preview={card}
            watermark={card.status === "draft" ? "Aperçu" : card.status === "rejected" ? "Refusé" : null}
          />
        </div>

        <div className="space-y-6">
          {card.qrCode && (
            <div className="surface flex items-center gap-5 p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.qrCode} alt="QR code" className="h-28 w-28 rounded-xl border border-line bg-white p-2" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink/90">QR code actif</p>
                <p className="truncate text-xs text-sage">{card.cardUrl}</p>
                <a href={card.qrCode} download={`moncode-${card.slug}.png`} className="btn btn-outline btn-sm mt-3">
                  <Download className="h-4 w-4" /> Télécharger
                </a>
              </div>
            </div>
          )}

          <div className="surface p-5">
            <p className="text-sm font-semibold text-ink/90">Informations</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Info label="Client" value={customer?.customerName ?? card.clientName} />
              <Info label="Téléphone" value={customer?.customerPhone ?? card.phoneNumber} />
              <Info label="E-mail" value={customer?.customerEmail} />
              <Info label="Créé le" value={formatDate(card.createdAt)} />
              <Info label="Intervenant" value={card.userName} />
              <Info label="Montant saisi" value={card.amountReceived ? fcfa(card.amountReceived) : null} />
            </dl>
            {!customer && <p className="mt-3 text-xs text-sage">Créé directement par l’administration, sans commande.</p>}
          </div>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-line px-5 py-3 text-sm font-semibold text-ink/90">
          Commandes ({card.orders.length})
        </div>
        {card.orders.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-sage">Aucune commande : QR code créé par l’administration.</p>
        ) : (
          <ul className="divide-y divide-line">
            {card.orders.map((o) => (
              <li key={o.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/admin/commandes/${o.reference}`} className="font-semibold text-forest hover:text-forest-dark">
                    {o.reference}
                  </Link>
                  <p className="text-xs text-sage">
                    {o.kind === "modification" ? "Modification" : "Création"} · {o.quoteNumber}
                    {o.invoiceNumber ? ` · ${o.invoiceNumber}` : ""} · {formatDate(o.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink/90">{fcfa(o.amount)}</span>
                  <span className="rounded-full bg-cream-deep px-2.5 py-1 text-xs font-semibold text-ink/75">
                    {STATUS_LABELS[o.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <AdminEditCardModal
          card={toSummary(card)}
          adminToken={adminToken}
          onClose={() => setEditing(false)}
          onSuccess={() => {
            setEditing(false);
            load();
          }}
        />
      )}

      {rejecting && (
        <RejectDialog
          slug={card.slug}
          adminFetch={adminFetch}
          onClose={() => setRejecting(false)}
          onDone={(next) => {
            setRejecting(false);
            setCard(next);
          }}
        />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-sage">{label}</dt>
      <dd className="truncate font-medium text-ink/90">{value || "—"}</dd>
    </div>
  );
}

function toSummary(card: CardDetail): CardSummary {
  return {
    id: card.id,
    slug: card.slug,
    imageUrl: card.imageUrl ?? "",
    logoUrl: card.logoUrl ?? null,
    menuImages: card.menuImages ?? [],
    cardUrl: card.cardUrl ?? "",
    userName: card.userName,
    clientName: card.clientName,
    workDone: card.workDone,
    amountReceived: card.amountReceived,
    restaurantName: card.restaurantName ?? null,
    phoneNumber: card.phoneNumber ?? null,
    address: card.address ?? null,
    additionalInfo: card.additionalInfo ?? null,
    serviceType: card.serviceType,
    title: card.title ?? null,
    status: card.status,
    createdAt: card.createdAt ?? new Date().toISOString(),
  };
}

function RejectDialog({
  slug,
  adminFetch,
  onClose,
  onDone,
}: {
  slug: string;
  adminFetch: ReturnType<typeof useAdminFetch>;
  onClose: () => void;
  onDone: (card: CardDetail) => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await adminFetch(`/cards/${slug}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof data?.message === "string" ? data.message : "Refus impossible.");
      onDone(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refus impossible.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-ink/90">Refuser ce QR code</h3>
        <p className="mt-1 text-sm text-sage">
          La page publique est désactivée et les devis non payés sont annulés. Le motif est montré au client.
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {REJECT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setReason(preset)}
              className="rounded-full border border-line px-2.5 py-1 text-xs text-ink/75 hover:border-forest/40 hover:text-forest"
            >
              {preset}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motif du refus"
          className="field mt-3"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="btn btn-outline">
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || reason.trim().length < 3}
            className="btn border-red-600 bg-red-600 text-white hover:bg-red-700"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Refuser le QR code
          </button>
        </div>
      </div>
    </div>
  );
}
