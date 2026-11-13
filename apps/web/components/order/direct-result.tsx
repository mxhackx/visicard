"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink, Receipt } from "lucide-react";
import StyledQr from "@/components/qr/styled-qr";
import { describePayload } from "@/lib/qr-info";

interface Props {
  payload: string;
  style?: string | null;
  slug: string;
  reference: string;
  invoiceNumber?: string | null;
  invoiceHref: string;
  amountLabel: string;
  paidLabel: string;
  /** Contenu complémentaire sous les cartes (lien privé…). */
  extra?: ReactNode;
}

/**
 * Page d'un QR code direct (Wi-Fi, texte, carte de visite…), dans le même cadre que les autres commandes :
 * le contenu et les détails à gauche, le QR code et ses téléchargements à droite (au-dessus sur mobile).
 */
export default function DirectResult({ payload, style, slug, reference, invoiceNumber, invoiceHref, amountLabel, paidLabel, extra }: Props) {
  const info = describePayload(payload);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(info.rows.map((r) => `${r.label} : ${r.value}`).join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
      <div className="min-w-0 space-y-6">
        <section className="surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink/90">Contenu du QR code · {info.kind}</h2>
            <button type="button" onClick={copy} className="btn btn-outline btn-sm">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <dl className="mt-4 divide-y divide-line text-sm">
            {info.rows.map((row, i) => (
              <div key={`${row.label}${i}`} className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-sage sm:pt-0.5">{row.label}</dt>
                <dd className="min-w-0 break-words font-medium text-ink/90">
                  {row.href ? (
                    <a href={row.href} target={row.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="inline-flex items-center gap-1.5 text-forest underline-offset-4 hover:underline">
                      {row.value} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="surface p-5 sm:p-6">
          <h2 className="text-base font-semibold text-ink/90">Détails de la commande</h2>
          <dl className="mt-4 divide-y divide-line text-sm">
            {([
              ["Référence", reference],
              ["Paiement", paidLabel],
              ["Montant", amountLabel],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-sage">{k}</dt>
                <dd className="text-right font-medium text-ink/90">{v}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-sage">Facture</dt>
              <dd className="text-right font-medium text-ink/90">
                <Link href={invoiceHref} className="inline-flex items-center gap-1.5 text-forest underline-offset-4 hover:underline">
                  <Receipt className="h-4 w-4" /> {invoiceNumber ?? "Voir"}
                </Link>
              </dd>
            </div>
          </dl>
        </section>

        {extra}
      </div>

      <aside className="order-first min-w-0 lg:order-none">
        <div className="surface p-5 text-center sm:p-6">
          <p className="text-sm font-semibold text-ink/80">Votre QR code</p>
          <div className="mt-4 flex justify-center">
            <StyledQr data={payload} style={style} size={300} downloadName={`moncode-${slug}`} className="w-full max-w-[320px]" />
          </div>
          <p className="mt-4 text-xs leading-5 text-sage">Ce QR code fonctionne seul : il ne passe pas par Moncode et ne peut plus être modifié une fois imprimé.</p>
        </div>
      </aside>
    </div>
  );
}
