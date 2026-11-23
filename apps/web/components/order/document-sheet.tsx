/* eslint-disable @next/next/no-img-element -- logo SVG statique de petite taille */
import Logo from "@/components/logo";
import { CONTACT } from "@/lib/contact";

export interface DocRow {
  label: string;
  detail?: string;
  qty: number | string;
  unit?: string;
  total: string;
}

export type DocTone = "paid" | "pending" | "included";

const TONE: Record<DocTone, string> = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  included: "border-line bg-cream-deep text-ink/75",
};

/**
 * Feuille de devis ou de facture, au format A4 : même mise en page pour tous les documents (commande, abonnement Premium).
 * À l'écran c'est une page blanche centrée ; à l'impression (Imprimer → Enregistrer en PDF) les marges sont celles du papier.
 */
export default function DocumentSheet({
  title,
  number,
  meta,
  billLabel,
  billTo,
  subject,
  rows,
  totalLabel,
  total,
  status,
  feexpay = false,
  note,
  footer,
}: {
  title: "Facture" | "Devis";
  number: string;
  /** Lignes « libellé : valeur » sous le numéro (date, référence…). */
  meta: [string, string][];
  billLabel: string;
  billTo: string[];
  subject: string[];
  rows: DocRow[];
  totalLabel: string;
  total: string;
  status: { label: string; tone: DocTone };
  /** Mentionne le règlement par Mobile Money via FeexPay (avec son logo). */
  feexpay?: boolean;
  note?: string;
  footer: string;
}) {
  const hasUnit = rows.some((r) => r.unit);
  return (
    <article className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-2xl border border-line bg-white text-ink shadow-[0_18px_50px_rgba(23,23,26,0.08)] print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      <div className="h-1.5 w-full bg-forest [print-color-adjust:exact] [-webkit-print-color-adjust:exact]" aria-hidden="true" />

      <div className="px-6 pb-10 pt-8 sm:px-12 sm:pb-12 sm:pt-11 print:px-0 print:pb-0 print:pt-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between print:flex-row">
          <div>
            <Logo variant="dark" />
            <address className="mt-4 space-y-0.5 text-xs not-italic leading-5 text-sage">
              <p>{CONTACT.address}</p>
              <p>{CONTACT.whatsappDisplay}</p>
              <p>{CONTACT.email}</p>
            </address>
          </div>
          <div className="sm:text-right print:text-right">
            <p className="text-3xl font-semibold uppercase leading-none tracking-[0.1em] text-forest">{title}</p>
            <p className="mt-2 text-sm font-semibold tabular-nums text-ink">{number}</p>
            <span className={`mt-3 inline-block rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] [print-color-adjust:exact] [-webkit-print-color-adjust:exact] ${TONE[status.tone]}`}>{status.label}</span>
          </div>
        </header>

        <section className="mt-9 grid gap-7 border-y border-line py-7 sm:grid-cols-3 print:grid-cols-3">
          <div className="min-w-0 break-words">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">{billLabel}</p>
            <div className="mt-2 space-y-0.5 text-sm text-ink/80">
              {billTo.map((l, i) => <p key={l + i} className={i === 0 ? "font-semibold text-ink" : ""}>{l}</p>)}
            </div>
          </div>
          <div className="min-w-0 break-words">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">Objet</p>
            <div className="mt-2 space-y-0.5 text-sm text-ink/80">
              {subject.map((l, i) => <p key={l + i} className={i === 0 ? "font-semibold text-ink" : "text-ink/60"}>{l}</p>)}
            </div>
          </div>
          <dl className="min-w-0 space-y-1.5 text-sm">
            {meta.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-sage">{k}</dt>
                <dd className="text-right font-medium tabular-nums text-ink/85">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <table className="mt-8 w-full table-fixed text-sm">
          <colgroup>
            <col />
            <col className="w-14" />
            {hasUnit && <col className="w-28 max-sm:w-24" />}
            <col className="w-32 max-sm:w-28" />
          </colgroup>
          <thead>
            <tr className="border-b border-ink/70 text-left text-[11px] uppercase tracking-[0.1em] text-sage">
              <th className="pb-3 pr-3 font-semibold">Désignation</th>
              <th className="pb-3 text-right font-semibold">Qté</th>
              {hasUnit && <th className="pb-3 text-right font-semibold">Prix unitaire</th>}
              <th className="pb-3 text-right font-semibold">Montant</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label + i} className="break-inside-avoid border-b border-line align-top">
                <td className="py-4 pr-3">
                  <p className="break-words text-ink/90">{r.label}</p>
                  {r.detail && <p className="mt-0.5 text-xs text-sage">{r.detail}</p>}
                </td>
                <td className="py-4 text-right tabular-nums text-ink/80">{r.qty}</td>
                {hasUnit && <td className="whitespace-nowrap py-4 text-right tabular-nums text-ink/80">{r.unit ?? ""}</td>}
                <td className="whitespace-nowrap py-4 text-right font-semibold tabular-nums text-ink">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end break-inside-avoid">
          <div className="w-full max-w-[17rem] border-t-2 border-ink/80 pt-3">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm font-semibold text-ink">{totalLabel}</p>
              <p className="whitespace-nowrap text-xl font-semibold tabular-nums text-forest">{total}</p>
            </div>
          </div>
        </div>

        {(feexpay || note) && (
          <section className="mt-9 flex break-inside-avoid flex-col gap-3 rounded-xl border border-line bg-cream/60 px-5 py-4 text-xs leading-5 text-ink/75 sm:flex-row sm:items-center sm:justify-between [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
            {note && <p className="min-w-0 flex-1">{note}</p>}
            {feexpay && (
              <p className="flex shrink-0 items-center gap-2 text-sage">
                Réglé par Mobile Money via
                <img src="/payments/feexpay.svg" alt="FeexPay" width={72} height={16} className="h-4 w-auto" />
              </p>
            )}
          </section>
        )}

        <footer className="mt-10 break-inside-avoid border-t border-line pt-5 text-center text-[11px] leading-5 text-sage">
          <p>{footer}</p>
          <p className="mt-1">{CONTACT.brand} · {CONTACT.address} · {CONTACT.email}</p>
        </footer>
      </div>
    </article>
  );
}
