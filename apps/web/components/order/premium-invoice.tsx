"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import Logo from "@/components/logo";
import { CONTACT } from "@/lib/contact";
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
    <div className="mx-auto max-w-3xl px-4 py-10 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={back} className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-ink"><ArrowLeft className="h-4 w-4" /> Retour</Link>
        <div className="flex items-start gap-3">
          <SendInvoiceButton id={id} />
          <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm"><Printer className="h-4 w-4" /> Imprimer / PDF</button>
        </div>
      </div>

      <article className="rounded-2xl border border-line bg-white p-8 shadow-sm sm:p-12 print:rounded-none print:border-0 print:shadow-none">
        <header className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo variant="dark" />
            <div className="mt-4 space-y-0.5 text-xs leading-5 text-sage">
              <p>{CONTACT.address}</p>
              <p>{CONTACT.whatsappDisplay}</p>
              <p>{CONTACT.email}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-2xl font-semibold uppercase tracking-[0.08em] text-forest">Facture</p>
            <p className="mt-1 text-sm font-semibold text-ink/90">{data.invoiceNumber ?? "—"}</p>
            <p className="text-xs text-sage">Date : {formatDate(data.issuedAt)}</p>
            <p className="text-xs text-sage">Paiement : {data.reference.slice(0, 8).toUpperCase()}</p>
          </div>
        </header>

        <section className="grid gap-6 py-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">Facturé à</p>
            <p className="mt-2 font-semibold text-ink/90">{data.buyer.name || data.buyer.email}</p>
            {data.buyer.phone && <p className="text-sm text-ink/75">{data.buyer.phone}</p>}
            <p className="text-sm text-ink/75">{data.buyer.email}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">Objet</p>
            <p className="mt-2 text-sm text-ink/80">Abonnement Premium</p>
            <p className="text-sm text-ink/60">Valable jusqu’au {formatDate(data.validUntil)}</p>
          </div>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-line text-left text-xs uppercase tracking-[0.08em] text-sage">
              <th className="py-3 font-semibold">Désignation</th>
              <th className="w-20 py-3 text-right font-semibold">Qté</th>
              <th className="w-40 py-3 text-right font-semibold">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line">
              <td className="py-4 pr-4 text-ink/85">{data.description}</td>
              <td className="w-20 py-4 text-right text-ink/85">1</td>
              <td className="w-40 whitespace-nowrap py-4 text-right font-medium text-ink/90">{fcfa(data.amount)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink"><span>Total payé</span><span>{fcfa(data.amount)}</span></div>
            <p className="text-right text-xs text-sage">Réglé par Mobile Money (FeexPay).</p>
          </div>
        </div>

        <footer className="mt-10 border-t border-line pt-5 text-xs leading-5 text-sage">
          Facture acquittée. Merci de votre confiance. {CONTACT.brand} · {CONTACT.address} · {CONTACT.email}
        </footer>
      </article>
    </div>
  );
}
