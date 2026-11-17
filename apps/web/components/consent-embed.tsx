"use client";

import { useState, type ReactNode } from "react";
import { MapPin } from "lucide-react";
import { useConsent } from "@/lib/consent";

/** Contenu intégré d'un service tiers (carte) : affiché avec l'accord du visiteur, ou sur demande pour cette visite. */
export default function ConsentEmbed({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  const consent = useConsent();
  const [shown, setShown] = useState(false);
  if (consent === "all" || shown) return <>{children}</>;
  return (
    <div className={`flex flex-col items-center justify-center gap-3 bg-cream px-6 py-10 text-center ${className}`}>
      <span className="icon-tile h-11 w-11"><MapPin className="h-5 w-5" /></span>
      <p className="text-sm leading-6 text-sage">{label} est fournie par OpenStreetMap, un service tiers.</p>
      <button type="button" onClick={() => setShown(true)} className="btn btn-outline btn-sm">Afficher la carte</button>
    </div>
  );
}
