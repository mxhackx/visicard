"use client";

import { Crown, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { whatsappUrl, CONTACT } from "@/lib/contact";
import { usePremium } from "@/lib/premium";
import { useDialogs } from "@/components/account/auth-dialog";

/* Boutons flottants en bas à droite : « Passer Premium » (hors Premium) au-dessus du contact WhatsApp. */
const MASQUE = ["/paiement", "/admin", "/c/", "/connexion"];

export default function WhatsAppButton() {
  const premium = usePremium();
  const { openPremium } = useDialogs();
  const path = usePathname() || "/";
  // Pages publiques des clients (/c/…) : aucun bouton Moncode, la page appartient à son propriétaire.
  if (path.startsWith("/c/")) return null;
  const showPremium = premium.ready && !premium.active && !MASQUE.some((p) => path.startsWith(p));

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-3 sm:bottom-6 sm:right-6">
      {showPremium && (
        <button
          type="button"
          onClick={() => openPremium({ label: "Passer Premium", suite: path })}
          aria-label="Passer Premium"
          title="Passer Premium"
          className="premium-gold flex h-12 w-12 items-center justify-center rounded-full shadow-[0_8px_22px_rgba(185,121,26,0.28)] ring-4 ring-white/25 transition active:scale-[0.98] hover:-translate-y-0.5 hover:brightness-105"
        >
          <Crown className="h-5 w-5" />
          <span className="sr-only">Passer Premium</span>
        </button>
      )}
      <a
        href={whatsappUrl()}
        target="_blank"
        rel="noreferrer"
        aria-label={`Écrire sur WhatsApp au ${CONTACT.whatsappDisplay}`}
        className="group flex h-12 w-12 items-center justify-center rounded-full bg-forest text-white shadow-[0_12px_30px_rgba(227,5,29,0.3)] ring-4 ring-white/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-forest-dark"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="sr-only">WhatsApp</span>
      </a>
    </div>
  );
}
