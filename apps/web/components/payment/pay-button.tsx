/* eslint-disable @next/next/no-img-element -- logo SVG statique de petite taille */
import { Loader2 } from "lucide-react";

/**
 * Bouton de paiement : fond blanc, un titre d'action et, dessous, le prix et sa durée ; le logo FeexPay est dans le bouton.
 * (Le prestataire est visible au moment de payer, sans mention en plus.)
 */
export default function PayButton({
  label,
  note,
  busy = false,
  busyLabel,
  type = "button",
  onClick,
  disabled,
  className = "",
}: {
  /** Action : « Débloquer mon QR code », « Confirmer le paiement »… */
  label: string;
  /** Ligne sous l'action : prix et durée. */
  note?: string;
  busy?: boolean;
  busyLabel?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={`${label}${note ? `, ${note}` : ""}, avec FeexPay`}
      className={`group flex min-h-[3.75rem] w-full items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-2.5 text-left shadow-[0_6px_18px_rgba(23,23,26,0.08)] transition hover:border-forest hover:shadow-[0_10px_26px_rgba(23,23,26,0.12)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        {busy && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-forest" />}
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold leading-5 text-ink">{busy ? (busyLabel ?? "Un instant…") : label}</span>
          {note && !busy && <span className="mt-0.5 block truncate text-xs font-medium text-forest">{note}</span>}
        </span>
      </span>
      <span className="flex shrink-0 items-center border-l border-line pl-4">
        <img src="/payments/feexpay.svg" alt="FeexPay" width={84} height={20} className="h-5 w-auto" />
      </span>
    </button>
  );
}
