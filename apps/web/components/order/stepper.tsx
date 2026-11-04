import { Check } from "lucide-react";

export const CLIENT_STEPS = ["Contenu", "Devis", "Paiement", "QR code"] as const;

/** Progression du client : contenu → devis → paiement → QR code actif. */
export default function Stepper({ current, steps = CLIENT_STEPS }: { current: number; steps?: readonly string[] }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Étapes de votre commande">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 last:flex-none">
            <span className="flex items-center gap-2">
              <span
                aria-current={active ? "step" : undefined}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-forest text-white"
                    : active
                      ? "bg-white text-forest ring-2 ring-forest"
                      : "bg-white text-sage ring-1 ring-line"
                }`}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
              </span>
              <span
                className={`hidden text-sm sm:inline ${active ? "font-semibold text-ink/90" : done ? "text-ink/80" : "text-sage"}`}
              >
                {label}
              </span>
            </span>
            {index < steps.length - 1 && (
              <span className={`h-px flex-1 ${done ? "bg-forest" : "bg-line"}`} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
