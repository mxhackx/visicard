"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import SectionHeading from "@/components/section-heading";
import PhonePreview from "@/components/phone-preview";
import ExamplePage from "@/components/example-page";
import { LAYOUT_OPTIONS } from "@/lib/layouts";
import { EXAMPLES, EXAMPLE_IDS } from "@/lib/examples";
import { SECTORS } from "@/lib/sectors";
import type { LayoutId } from "@/lib/palette";

/** Un onglet par métier, dans l'ordre de SECTORS (les styles génériques n'ont pas d'exemple). */
const TABS = SECTORS.filter((s) => EXAMPLE_IDS.includes(s.layout));

const SHORT: Record<string, string> = {
  maquis: "Maquis et bar",
  beaute: "Salon",
  boutique: "Boutique",
  hotel: "Hôtel",
  clinique: "Clinique",
  chantier: "Quincaillerie",
  carte: "Carte de visite",
};

export default function ExamplesSection() {
  const [layout, setLayout] = useState<LayoutId>(TABS[0].layout);
  const [touchX, setTouchX] = useState<number | null>(null);
  const index = TABS.findIndex((t) => t.layout === layout);
  const option = LAYOUT_OPTIONS.find((o) => o.id === layout)!;
  const example = EXAMPLES[layout]!;
  const go = (delta: number) => setLayout(TABS[(index + delta + TABS.length) % TABS.length].layout);
  const items = example.additionalInfo.split("\n").filter(Boolean);

  return (
    <section id="exemples" className="anchor">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          title="Une page faite pour votre métier"
          subtitle="Choisissez votre activité : la page est prête à être remplie avec vos informations, vos photos et vos horaires."
        />

        <div className="-mx-4 mt-10 flex scroll-pl-4 snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0" role="tablist" aria-label="Métiers">
          {TABS.map((t) => {
            const on = t.layout === layout;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setLayout(t.layout)}
                className={`inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition active:scale-95 ${
                  on ? "border-forest bg-forest text-white" : "border-line bg-white text-ink/80 hover:border-ink/30"
                }`}
              >
                <t.icon className="h-4 w-4" /> {SHORT[t.layout]}
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-20">
          <div className="min-w-0 order-2 lg:order-1">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-forest">{option.sector}</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">{example.restaurantName}</h3>
            <p className="mt-3 max-w-md text-[15px] leading-7 text-sage">{example.tagline}</p>

            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-sage">Ce que la page contient</p>
            <ul className="mt-3 space-y-2">
              {items.map((it) => (
                <li key={it} className="flex gap-3 text-[15px] leading-6 text-ink/85">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-forest" /> {it}
                </li>
              ))}
              <li className="flex gap-3 text-[15px] leading-6 text-ink/85">
                <Check className="mt-1 h-4 w-4 shrink-0 text-forest" /> Bouton WhatsApp, horaires et itinéraire
              </li>
            </ul>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link href="/creer?service=page" className="btn btn-primary">
                Créer ma page <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={`/exemples/${layout}`} className="text-center text-sm font-semibold text-forest underline-offset-4 hover:underline">
                Voir l’exemple en plein écran
              </Link>
            </div>
          </div>

          <div className="order-1 mx-auto min-w-0 max-w-full lg:order-2">
            <PhonePreview
              width={268}
              height={500}
              onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (touchX === null) return;
                const dx = e.changedTouches[0].clientX - touchX;
                setTouchX(null);
                if (Math.abs(dx) > 90) go(dx < 0 ? 1 : -1);
              }}
            >
              <div key={layout} className="example-enter">
                <ExamplePage layout={layout} />
              </div>
            </PhonePreview>
          </div>
        </div>
      </div>
    </section>
  );
}
