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
  const showPremium = premium.ready && !premium.active && !MASQUE.some((p) => path.startsWith(p));

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {showPremium && (
        <button
          type="button"
          onClick={() => openPremium({ label: "Passer Premium", suite: path })}
          className="premium-gold inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold shadow-[0_8px_22px_rgba(185,121,26,0.28)] ring-4 ring-white/25 transition active:scale-[0.98] hover:brightness-105"
        >
          <Crown className="h-4 w-4" /> Passer Premium
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
