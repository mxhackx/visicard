"use client";

import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import AuthForm from "./auth-form";

/** Vrai quand un client (ou l'équipe) est connecté : le paiement peut alors continuer. */
export function useIsSignedIn(): boolean {
  const { authToken, authRole } = useFile();
  return Boolean(authToken && authRole);
}

/**
 * Barrière du parcours : un contenu mis en ligne (page, image, vidéo, PDF) exige un compte,
 * pour que le client retrouve ensuite son QR code, sa facture et ses modifications.
 * La page reste affichée : rien de ce qui a été saisi n'est perdu.
 */
export default function AccountGate({ children }: { children: ReactNode }) {
  const signedIn = useIsSignedIn();
  if (signedIn) return <>{children}</>;
  return (
    <div className="surface p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-ink/90">Créez votre compte pour mettre votre QR code en ligne</h2>
      <p className="mt-1 flex items-start gap-2 text-sm leading-6 text-sage">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
        Une minute suffit. Vous retrouverez votre QR code, vos factures et vos modifications dans votre espace.
      </p>
      <AuthForm nested className="mt-5 max-w-md" />
    </div>
  );
}
