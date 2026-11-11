"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, FileText, Smartphone, Video } from "lucide-react";
import TypeArt from "./type-art";
import PremiumModal, { type PremiumOffer } from "./premium-modal";
import { usePremium } from "@/lib/premium";
import { DIRECT_QR_TYPES, type DirectQrType } from "@/lib/qr-payloads";

const PRICE = "5 000";

interface Tile {
  id: string;
  label: string;
  href: string;
  free?: boolean;
  art?: DirectQrType;
  icon?: typeof Video;
}

export const TILES: Tile[] = [
  { id: "url", label: "Lien web", href: "/creer", free: true, art: "url" },
  ...DIRECT_QR_TYPES.filter((t) => t.id !== "url").map((t) => ({ id: t.id, label: t.label, href: `/creer?type=${t.id}`, art: t.id })),
  { id: "media", label: "Image ou vidéo", href: "/creer?type=media", icon: Video },
  { id: "document", label: "Document PDF", href: "/creer?type=document", icon: FileText },
  { id: "page", label: "Page digitale", href: "/creer?type=page", icon: Smartphone },
];

/**
 * Le choix du contenu, identique pour tous les types (lien, Wi-Fi, PDF, page digitale…) : le lien est gratuit,
 * le reste est Premium. Un clic sur une option Premium prévient une seule fois, puis tout reste débloqué.
 */
export default function ContentPicker({ current, trial, onTrial }: { current: string; trial: boolean; onTrial: () => void }) {
  const router = useRouter();
  const premium = usePremium();
  const [offer, setOffer] = useState<PremiumOffer | null>(null);
  const unlocked = premium.active || trial;

  const pick = (t: Tile) => {
    const go = () => router.push(t.href, { scroll: false });
    if (unlocked || t.free) return go();
    setOffer({ label: t.label, href: t.href, price: PRICE, onTry: () => (onTrial(), go()) });
  };

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-sage">Que mettre dans le QR code ?</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {TILES.map((t) => {
          const on = t.id === current;
          const dim = !t.free && !unlocked && !on;
          return (
            <li key={t.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => (on ? undefined : pick(t))}
                className={`group relative flex w-full flex-col items-center gap-2 rounded-xl border bg-white p-3 text-center transition active:scale-[0.97] ${
                  on ? "border-forest ring-2 ring-forest/30" : "border-line hover:-translate-y-0.5 hover:border-ink/30"
                }`}
              >
                <span className={dim ? "opacity-60 blur-[1.5px] transition group-hover:blur-[0.5px]" : ""}>
                  {t.art ? (
                    <TypeArt type={t.art} className="h-10 w-10" />
                  ) : t.icon ? (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf text-ambre-deep"><t.icon className="h-5 w-5" /></span>
                  ) : null}
                </span>
                <span className="text-xs font-medium leading-4 text-ink/80">{t.label}</span>
                {!t.free && !premium.active && <Crown className="premium-gold absolute right-1.5 top-1.5 h-4 w-4 rounded-full p-0.5" aria-hidden="true" />}
                {on && (
                  <span className={`absolute top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-forest text-white ${t.free ? "right-1.5" : "left-1.5"}`}>
                    <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <PremiumModal offer={offer} onClose={() => setOffer(null)} />
    </div>
  );
}
