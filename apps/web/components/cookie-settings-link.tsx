"use client";

import { setConsent } from "@/lib/consent";

/** « Gérer les cookies » : rouvre le bandeau pour changer son choix. */
export default function CookieSettingsLink({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={() => setConsent(null)} className={className}>
      Gérer les cookies
    </button>
  );
}
