"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import DocumentSheet from "./document-sheet";
import { API_URL } from "@/lib/api-url";
import { fcfa, formatDate } from "@/lib/orders";
import { useFile } from "@/app/context/FileContext";
import SendInvoiceButton from "./send-invoice-button";

interface InvoiceData {
  invoiceNumber: string | null;
  issuedAt: string | null;
  validUntil: string | null;
  amount: number;
  reference: string;
  description: string;
  buyer: { name: string | null; email: string; phone: string | null };
}

/** Facture d'un paiement Premium, mise en page pour l'impression (Imprimer → Enregistrer en PDF). Visible par son propriétaire et par l'administration. */
export default function PremiumInvoice({ id }: { id: string }) {
  const { authToken, authRole, isAuthLoading } = useFile();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const back = authRole === "admin" ? "/admin?tab=premium" : "/compte?onglet=factures";

  useEffect(() => {
    if (isAuthLoading || !authToken) return;
    let alive = true;
    fetch(`${API_URL}/premium/invoice/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${authToken}` }, cache: "no-store" })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(typeof body?.message === "string" ? body.message : "Facture introuvable.");
        return body as InvoiceData;
      })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Facture introuvable."));
    return () => {
      alive = false;
    };
  }, [id, authToken, isAuthLoading]);

  if (!isAuthLoading && !authToken) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-sm text-sage">Connectez-vous pour consulter cette facture.</p>
        <Link href="/compte" className="btn btn-primary mt-6">Me connecter</Link>
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-sm text-sage">{error}</p>
        <Link href={back} className="btn btn-outline mt-6">Retour</Link>
      </div>
    );
  }
  if (!data) {
    return <div className="flex items-center justify-center gap-3 py-24 text-sage"><Loader2 className="h-5 w-5 animate-spin" /> Chargement…</div>;
  }

  return (
    <div className="mx-auto max-w-[210mm] px-4 py-10 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={back} className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-ink"><ArrowLeft className="h-4 w-4" /> Retour</Link>
        <div className="flex items-start gap-3">
          <SendInvoiceButton id={id} />
          <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm"><Printer className="h-4 w-4" /> Imprimer / PDF</button>
        </div>
      </div>

      <DocumentSheet
        title="Facture"
        number={data.invoiceNumber ?? "—"}
        meta={[
          ["Date", formatDate(data.issuedAt)],
          ["Paiement", data.reference.slice(0, 8).toUpperCase()],
        ]}
        billLabel="Facturé à"
        billTo={[data.buyer.name || data.buyer.email, ...(data.buyer.phone ? [data.buyer.phone] : []), ...(data.buyer.name ? [data.buyer.email] : [])]}
        subject={["Abonnement Premium", `Valable jusqu’au ${formatDate(data.validUntil)}`]}
        rows={[{ label: data.description, qty: 1, total: fcfa(data.amount) }]}
        totalLabel="Total payé"
        total={fcfa(data.amount)}
        status={{ label: "Payée", tone: "paid" }}
        feexpay
        note="Cette facture couvre tous les QR codes et pages créés avec votre abonnement : ils n’ont pas de facture séparée, seulement un devis."
        footer="Facture acquittée. Merci de votre confiance."
      />
    </div>
  );
}
