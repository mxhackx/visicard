"use client";

import { useOrderKey } from "@/lib/use-order-key";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import DocumentSheet from "./document-sheet";
import { fcfa, fetchOrder, fetchOrderAsAdmin, formatDate, type OrderView } from "@/lib/orders";
import { useFile } from "@/app/context/FileContext";

/** Devis ou facture, mis en page pour l'impression (Imprimer → Enregistrer en PDF). */
export default function OrderDocument({
  reference,
  kind,
  admin,
}: {
  reference: string;
  kind: "devis" | "facture";
  /** Consultation par un administrateur (sans lien privé). */
  admin?: boolean;
}) {
  const { authToken, isAuthLoading } = useFile();
  const back = admin ? `/admin/commandes/${reference}` : `/commande/${reference}`;
  const [order, setOrder] = useState<OrderView | null>(null);
  const [fetchError, setError] = useState<string | null>(null);
  const key = useOrderKey(reference);
  const error = admin
    ? !isAuthLoading && !authToken
      ? "Connectez-vous en administrateur pour consulter ce document."
      : fetchError
    : key === null
      ? "Ouvrez d’abord votre lien privé de commande sur cet appareil."
      : fetchError;

  useEffect(() => {
    if (admin) {
      if (isAuthLoading || !authToken) return;
      fetchOrderAsAdmin(reference, authToken)
        .then(setOrder)
        .catch((err) => setError(err instanceof Error ? err.message : "Commande introuvable."));
      return;
    }
    if (!key) return;
    fetchOrder(reference, key)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : "Commande introuvable."));
  }, [reference, admin, authToken, isAuthLoading, key]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-sm text-sage">{error}</p>
        <Link href={back} className="btn btn-outline mt-6">
          Retour à la commande
        </Link>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-sage">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
      </div>
    );
  }

  const isInvoice = kind === "facture";
  const included = order.amount === 0;
  // Une commande couverte par Premium n'a pas de facture : la seule facture est celle de l'abonnement.
  if (isInvoice && (order.status !== "paid" || included)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-sm text-sage">
          {included
            ? "Ce QR code est inclus dans votre abonnement Premium : il n’a pas de facture. Retrouvez celle de votre paiement dans Mon espace › Factures."
            : "La facture est émise dès que votre paiement est confirmé."}
        </p>
        <Link href={included ? "/compte?onglet=factures" : back} className="btn btn-primary mt-6">
          {included ? "Mes factures" : "Retour à la commande"}
        </Link>
      </div>
    );
  }

  const number = (isInvoice ? order.invoiceNumber : order.quoteNumber) ?? "—";
  const date = isInvoice ? order.paidAt : order.createdAt;
  const paid = order.status === "paid";

  return (
    <div className="mx-auto max-w-[210mm] px-4 py-10 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={back} className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Commande {reference}
        </Link>
        <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm">
          <Printer className="h-4 w-4" /> Imprimer / PDF
        </button>
      </div>

      <DocumentSheet
        title={isInvoice ? "Facture" : "Devis"}
        number={number}
        meta={[
          ["Date", formatDate(date)],
          ["Commande", order.reference],
          ...(isInvoice ? ([["Réf. devis", order.quoteNumber]] as [string, string][]) : []),
        ]}
        billLabel={isInvoice ? "Facturé à" : "Destinataire"}
        billTo={[order.customer.name, order.customer.phone, ...(order.customer.email ? [order.customer.email] : [])]}
        subject={[order.kind === "modification" ? "Modification de contenu" : order.serviceLabel, `QR code : /c/${order.card.slug}`]}
        rows={order.items.map((item) => ({
          label: item.label,
          qty: item.quantity,
          unit: included ? "—" : fcfa(item.unitPrice),
          total: included ? "Inclus" : fcfa(item.unitPrice * item.quantity),
        }))}
        totalLabel={isInvoice ? "Total payé" : "Total à payer"}
        total={included ? "0 FCFA" : fcfa(order.amount)}
        status={included ? { label: "Inclus dans Premium", tone: "included" } : paid ? { label: "Payée", tone: "paid" } : { label: "En attente", tone: "pending" }}
        feexpay={!included && (isInvoice || !paid) && order.lastPayment?.provider !== "manuel"}
        note={
          included
            ? "Ce QR code est inclus dans votre abonnement Premium : aucun paiement ni facture supplémentaire. Votre facture est celle de l’abonnement."
            : isInvoice
              ? `Facture acquittée le ${formatDate(order.paidAt)}${order.lastPayment?.provider === "manuel" ? " (règlement enregistré par Moncode)" : ""}.`
              : "Devis valable 30 jours. Le QR code est activé et la facture émise dès la confirmation du paiement."
        }
        footer={isInvoice ? "Merci pour votre confiance." : "Ce devis n’est pas une facture."}
      />
    </div>
  );
}
