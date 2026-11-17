"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, Eye } from "lucide-react";

/**
 * Aperçu pour téléphone et iPad : un petit bouton collé en haut de l'écran ; un appui déploie l'aperçu
 * par-dessus le contenu, un autre le réduit. Il ne prend aucune place tant qu'il est fermé.
 * Sur grand écran, l'aperçu reste affiché à droite et ce bouton n'existe pas.
 */
export default function PreviewPopover({ children, label = "Aperçu" }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="sticky top-2 z-40 mt-4 flex justify-end lg:hidden">
      {open && <button type="button" tabIndex={-1} aria-label="Réduire l’aperçu" onClick={() => setOpen(false)} className="fixed inset-0 z-0 cursor-default bg-ink/45 backdrop-blur-[2px]" />}
      <div className="relative z-10">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="apercu-flottant"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white/95 px-4 text-sm font-semibold text-ink shadow-[0_8px_22px_rgba(23,23,26,0.14)] backdrop-blur transition active:scale-95"
        >
          <Eye className="h-4 w-4 text-forest" />
          {label}
          <ChevronDown className={`h-4 w-4 text-sage transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div
            id="apercu-flottant"
            role="dialog"
            aria-label={label}
            className="fixed left-1/2 top-1/2 max-h-[86svh] w-[min(90vw,340px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl shadow-[0_24px_60px_rgba(23,23,26,0.28)] [&_[role=radio][aria-checked=false]_.device-label]:hidden"
          >
            {children}
            <button type="button" onClick={() => setOpen(false)} className="sticky bottom-0 block w-full rounded-b-2xl border-t border-line bg-white py-3 text-sm font-semibold text-forest">
              Réduire l’aperçu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
