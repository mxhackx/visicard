"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Cookie } from "lucide-react";
import { setConsent, useConsent } from "@/lib/consent";

/** Bandeau de choix : cookies indispensables toujours actifs ; services de Google et cartes intégrées sur accord. */
export default function CookieBanner() {
  const consent = useConsent();
  const pathname = usePathname();
  const [late, setLate] = useState(false);

  // Après l'animation d'accueil : le bandeau ne doit pas passer avant le premier écran.
  useEffect(() => {
    const t = window.setTimeout(() => setLate(true), 1800);
    return () => window.clearTimeout(t);
  }, []);

  if (consent !== null || !late || pathname.startsWith("/admin")) return null;

  return (
    <div role="dialog" aria-label="Cookies et services tiers" className="fixed inset-x-3 bottom-3 z-[75] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[26rem]">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_24px_60px_rgba(23,23,26,0.22)]">
        <div className="flex items-start gap-3">
          <span className="icon-tile h-10 w-10 shrink-0"><Cookie className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink">Cookies et services tiers</p>
            <p className="mt-1 text-sm leading-6 text-sage">
              Moncode utilise des cookies <strong className="font-semibold text-ink/80">indispensables</strong> (votre connexion). Avec votre accord, nous activons aussi les services de <strong className="font-semibold text-ink/80">Google</strong> (connexion en un clic) et les <strong className="font-semibold text-ink/80">cartes</strong> intégrées. Aucun suivi publicitaire.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row">
          <button type="button" onClick={() => setConsent("essential")} className="btn btn-outline flex-1 justify-center">Refuser</button>
          <button type="button" onClick={() => setConsent("all")} className="btn btn-primary flex-1 justify-center">Accepter</button>
        </div>
      </div>
    </div>
  );
}
