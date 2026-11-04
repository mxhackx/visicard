"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import Logo from "@/components/logo";
import { CONTACT, LEGAL } from "@/lib/contact";
import { fcfa, fetchOrder, fetchOrderAsAdmin, formatDate, recallOrderKey, type OrderView } from "@/lib/orders";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (admin) {
      if (isAuthLoading) return;
      if (!authToken) {
        setError("Connectez-vous en administrateur pour consulter ce document.");
        return;
      }
      fetchOrderAsAdmin(reference, authToken)
        .then(setOrder)
        .catch((err) => setError(err instanceof Error ? err.message : "Commande introuvable."));
      return;
    }
    const key = recallOrderKey(reference);
    if (!key) {
      setError("Ouvrez d’abord votre lien privé de commande sur cet appareil.");
      return;
    }
    fetchOrder(reference, key)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : "Commande introuvable."));
  }, [reference, admin, authToken, isAuthLoading]);

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
  if (isInvoice && order.status !== "paid") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-sm text-sage">La facture est émise automatiquement dès le paiement confirmé.</p>
        <Link href={back} className="btn btn-primary mt-6">
          Aller au paiement
        </Link>
      </div>
    );
  }

  const number = isInvoice ? order.invoiceNumber : order.quoteNumber;
  const date = isInvoice ? order.paidAt : order.createdAt;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={back}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Commande {reference}
        </Link>
        <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm">
          <Printer className="h-4 w-4" /> Imprimer / PDF
        </button>
      </div>

      <article className="rounded-2xl border border-line bg-white p-8 shadow-sm sm:p-12 print:rounded-none print:border-0 print:shadow-none">
        <header className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo variant="dark" />
            <div className="mt-4 space-y-0.5 text-xs leading-5 text-sage">
              <p>{CONTACT.address}</p>
              <p>{CONTACT.whatsappDisplay} · {CONTACT.email}</p>
              <p>{LEGAL.ifu} · {LEGAL.rccm}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-2xl font-semibold uppercase tracking-[0.08em] text-forest">
              {isInvoice ? "Facture" : "Devis"}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink/90">{number}</p>
            <p className="text-xs text-sage">Date : {formatDate(date)}</p>
            <p className="text-xs text-sage">Commande : {order.reference}</p>
            {isInvoice && <p className="text-xs text-sage">Réf. devis : {order.quoteNumber}</p>}
          </div>
        </header>

        <section className="grid gap-6 py-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">{isInvoice ? "Facturé à" : "Destinataire"}</p>
            <p className="mt-2 font-semibold text-ink/90">{order.customer.name}</p>
            <p className="text-sm text-ink/75">{order.customer.phone}</p>
            {order.customer.email && <p className="text-sm text-ink/75">{order.customer.email}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">Objet</p>
            <p className="mt-2 text-sm text-ink/80">
              {order.kind === "modification" ? "Modification de contenu" : order.serviceLabel}
            </p>
            <p className="text-sm text-ink/60">QR code : /c/{order.card.slug}</p>
          </div>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-line text-left text-xs uppercase tracking-[0.08em] text-sage">
              <th className="py-3 font-semibold">Désignation</th>
              <th className="py-3 text-right font-semibold">Qté</th>
              <th className="py-3 text-right font-semibold">Prix unitaire</th>
              <th className="py-3 text-right font-semibold">Montant</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.label} className="border-b border-line">
                <td className="py-3 pr-4 text-ink/85">{item.label}</td>
                <td className="py-3 text-right text-ink/85">{item.quantity}</td>
                <td className="py-3 text-right text-ink/85">{fcfa(item.unitPrice)}</td>
                <td className="py-3 text-right font-semibold text-ink/90">{fcfa(item.unitPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between border-t-2 border-ink/80 pt-3">
              <dt className="font-semibold text-ink/90">Total {isInvoice ? "payé" : "à payer"}</dt>
              <dd className="text-lg font-semibold text-forest">{fcfa(order.amount)}</dd>
            </div>
            <p className="text-right text-xs text-sage">{LEGAL.taxNote}</p>
          </dl>
        </div>

        <footer className="mt-10 border-t border-line pt-6 text-xs leading-5 text-sage">
          {isInvoice ? (
            <p>
              Facture acquittée le {formatDate(order.paidAt)}
              {order.lastPayment ? ` par ${PROVIDER_NAMES[order.lastPayment.provider] ?? order.lastPayment.provider}` : ""}.
              Merci pour votre confiance.
            </p>
          ) : (
            <p>
              Devis valable 30 jours. Le QR code est activé dès réception du paiement ; la facture est alors
              émise automatiquement.
            </p>
          )}
        </footer>
      </article>
    </div>
  );
}

const PROVIDER_NAMES: Record<string, string> = {
  momo: "MTN Mobile Money",
  fedapay: "FedaPay",
  manuel: "règlement enregistré par Moncode",
  simulation: "paiement de test",
};
