"use client";

import Link from "next/link";
import { useState } from "react";
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
}

function Tile({ label, children, href }: { label: string; children: React.ReactNode; href?: string }) {
  const body = (
    <>
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sage">{label}</span>
      <span className="mt-2 break-words text-base font-semibold leading-snug text-ink/90 sm:text-lg">{children}</span>
      {href && (
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-forest">
          Ouvrir <ExternalLink className="h-3 w-3" />
        </span>
      )}
    </>
  );
  const cls = "surface flex min-h-[8.5rem] min-w-0 flex-col justify-start p-4 sm:aspect-square sm:min-h-0 sm:p-5";
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={`${cls} surface-hover`}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Petite page d'un QR direct : le code à gauche, au centre ; ses informations à droite, en carrés. */
export default function DirectResult({ payload, style, slug, reference, invoiceNumber, invoiceHref, amountLabel, paidLabel }: Props) {
  const info = describePayload(payload);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(info.rows.map((r) => r.value).join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 grid items-center gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
      <div className="surface mx-auto flex w-full max-w-sm flex-col items-center p-6 text-center">
        <StyledQr data={payload} style={style} size={260} downloadName={`moncode-${slug}`} className="w-full max-w-[280px]" />
        <p className="mt-4 text-xs leading-5 text-sage">Ce QR code fonctionne seul : il ne passe pas par Moncode.</p>
      </div>

      <div className="min-w-0">
        <p className="mb-3 text-sm font-semibold text-ink/80">{info.kind}</p>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {info.rows.map((row, i) => (
            <Tile key={`${row.label}${i}`} label={row.label} href={row.href}>
              {row.value}
            </Tile>
          ))}
          <Tile label="Commande">
            {reference}
            <span className="mt-1 block text-xs font-normal text-sage">{paidLabel} · {amountLabel}</span>
          </Tile>
          <Link href={invoiceHref} className="surface surface-hover flex min-h-[8.5rem] min-w-0 flex-col p-4 sm:aspect-square sm:min-h-0 sm:p-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sage">Facture</span>
            <span className="mt-2 text-base font-semibold text-ink/90 sm:text-lg">{invoiceNumber ?? "—"}</span>
            <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold text-forest">
              <Receipt className="h-3.5 w-3.5" /> Voir
            </span>
          </Link>
        </div>
        <button type="button" onClick={copy} className="btn btn-outline btn-sm mt-4">
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied ? "Copié" : "Copier les informations"}
        </button>
      </div>
    </div>
  );
}
