"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { PREMIUM_PRICE, usePremium } from "@/lib/premium";
import { useDialogs } from "./auth-dialog";

/** Vrai quand un client (ou l'équipe) est connecté : le paiement peut alors continuer. */
export function useIsSignedIn(): boolean {
  const { authToken, authRole } = useFile();
  return Boolean(authToken && authRole);
}

/**
 * Barrière du parcours : il faut un compte, puis Premium (5 000 FCFA par Mobile Money), avant de créer.
 * Les deux étapes se font dans une fenêtre : la page et ce qui a été saisi restent en place.
 */
export default function AccountGate({ children }: { children: ReactNode }) {
  const signedIn = useIsSignedIn();
  const premium = usePremium();
  const path = usePathname();
  const { openAuth, openPremium } = useDialogs();

  if (signedIn && !premium.ready) {
    return (
      <div className="surface flex items-center justify-center gap-2 p-8 text-sm text-sage" role="status">
        <Loader2 className="h-4 w-4 animate-spin" /> Vérification de votre compte…
      </div>
    );
  }
  if (signedIn && !premium.active) {
    return (
      <div className="surface p-6 text-center sm:p-8">
        <h2 className="text-lg font-semibold text-ink/90">Passez en Premium pour continuer</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-sage">
          {PREMIUM_PRICE} FCFA, payés par Mobile Money. Votre contenu reste ici, rien n’est perdu.
        </p>
        <button type="button" onClick={() => openPremium({ label: "Passer en Premium", suite: path || "/creer" })} className="btn btn-primary mt-5">
          Payer {PREMIUM_PRICE} FCFA
        </button>
      </div>
    );
  }
  if (signedIn) return <>{children}</>;
  return (
    <div className="surface p-6 text-center sm:p-8">
      <h2 className="text-lg font-semibold text-ink/90">Créez votre compte pour continuer</h2>
      <p className="mx-auto mt-1 flex max-w-sm items-start justify-center gap-2 text-sm leading-6 text-sage">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
        Une minute suffit. Vous retrouverez vos QR codes dans votre espace.
      </p>
      <button type="button" onClick={() => openAuth({ mode: "register" })} className="btn btn-primary mt-5">
        Créer mon compte ou me connecter
      </button>
    </div>
  );
}
