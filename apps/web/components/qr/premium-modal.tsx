"use client";

import { useEffect } from "react";
import { ArrowRight, Crown } from "lucide-react";

export interface PremiumOffer {
  /** Ce que la personne a voulu utiliser (« Wi-Fi », « Élégant »…). */
  label: string;
  /** Page qui débloque la fonctionnalité. */
  href: string;
  /** Prix affiché, en FCFA. */
  price: string;
  /** Option à essayer : la fenêtre prévient une fois, puis débloque ; le paiement vient à la fin, sur sa propre page. */
  onTry?: () => void;
}

/** Avertissement « Option Premium » : un clic sur « Essayer maintenant » débloque tout, le paiement se fait à la fin. */
export default function PremiumModal({ offer, onClose }: { offer: PremiumOffer | null; onClose: () => void }) {
  useEffect(() => {
    if (!offer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [offer, onClose]);

  if (!offer) return null;

  const tryIt = () => {
    offer.onTry?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="premium-title">
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_80px_rgba(23,23,26,0.35)] sm:rounded-3xl">
        <div className="premium-gold px-6 pb-6 pt-7 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]">
            <Crown className="h-6 w-6" />
          </span>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] opacity-75">Option Premium</p>
          <h2 id="premium-title" className="mt-1 text-xl font-bold tracking-[-0.02em]">« {offer.label} »</h2>
        </div>
        <div className="px-6 pb-6 pt-5">
          <p className="text-sm leading-6 text-ink/80">Cette option fait partie de Premium. Vous pouvez l’essayer tout de suite.</p>
          <button type="button" onClick={tryIt} className="btn btn-primary mt-5 w-full justify-center py-3.5 text-base">
            Essayer maintenant <ArrowRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} className="mt-1 w-full py-2.5 text-sm font-medium text-sage transition hover:text-ink">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
