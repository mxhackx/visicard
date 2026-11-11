"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PREMIUM_SUITE_KEY, usePremium } from "@/lib/premium";
import { safeNext } from "@/lib/account";

/** Retour de FedaPay (`/creer?premium=retour`) : on attend la confirmation du paiement, puis on rouvre là où la personne en était. */
function Inner() {
  const router = useRouter();
  const back = useSearchParams().get("premium") === "retour";
  const { signedIn, ready, active, refresh } = usePremium();
  const [waited, setWaited] = useState(0);

  useEffect(() => {
    if (!back || !ready || !active) return;
    let suite = "/creer";
    try {
      suite = safeNext(sessionStorage.getItem(PREMIUM_SUITE_KEY), "/creer");
      sessionStorage.removeItem(PREMIUM_SUITE_KEY);
    } catch {}
    // Ouvert depuis le créateur : l'autre onglet se débloque seul, celui-ci se referme.
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }
    router.replace(suite);
  }, [back, ready, active, router]);

  useEffect(() => {
    if (!back || !signedIn || active || waited >= 40) return;
    const id = setTimeout(() => {
      void refresh();
      setWaited((n) => n + 1);
    }, 3000);
    return () => clearTimeout(id);
  }, [back, signedIn, active, waited, refresh]);

  if (!back || active) return null;
  return (
    <div role="status" className="fixed inset-x-4 bottom-6 z-[70] mx-auto flex max-w-md items-start gap-3 rounded-2xl bg-ink px-4 py-3.5 text-sm leading-6 text-white shadow-xl">
      <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
      {waited >= 40
        ? "Le paiement n’est pas encore confirmé. Si vous avez payé, patientez une minute puis rechargez la page."
        : "Confirmation du paiement par FedaPay… Cela prend quelques secondes."}
    </div>
  );
}

export default function PremiumReturn() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
