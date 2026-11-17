"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Scale } from "lucide-react";

/**
 * Sommaire des pages légales, sur le modèle du manuel : barre latérale fixe à gauche
 * (la section en cours a un fond gris, un clic fait glisser la page avec un défilement doux),
 * et sur mobile une barre de pastilles collée en haut.
 */
export default function LegalNav({ items }: { items: readonly (readonly [string, string])[] }) {
  const [active, setActive] = useState(items[0]?.[0] ?? "");
  const manual = useRef(false); // un clic en cours : l'observateur ne reprend la main qu'à l'arrivée
  const bar = useRef<HTMLDivElement>(null);

  // Suivi du défilement : la section qui occupe le haut de l'écran est la section active.
  useEffect(() => {
    const els = items.map(([id]) => document.getElementById(id)).filter((e): e is HTMLElement => Boolean(e));
    const io = new IntersectionObserver(
      (entries) => {
        if (manual.current) return;
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  // Sur mobile, la pastille active reste visible dans la barre.
  useEffect(() => {
    const chip = bar.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    const box = bar.current;
    if (chip && box && box.scrollWidth > box.clientWidth) box.scrollTo({ left: chip.offsetLeft - box.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setActive(id);
    manual.current = true;
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    window.setTimeout(() => (manual.current = false), 900);
  };

  return (
    <>
      {/* Mobile : barre de pastilles collée en haut */}
      <nav aria-label="Sommaire" className="sticky top-0 z-30 border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
        <div ref={bar} className="flex gap-2 overflow-x-auto py-2.5">
          {items.map(([id, label]) => (
            <a
              key={id}
              data-id={id}
              href={`#${id}`}
              onClick={(e) => go(e, id)}
              aria-current={active === id ? "true" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-300 ${active === id ? "border-line bg-cream-deep text-forest" : "border-line bg-white text-ink/75 hover:bg-cream"}`}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* Ordinateur : barre latérale fixe, comme le manuel et l'administration */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-line bg-white px-4 py-6 lg:flex">
        <p className="flex items-center gap-2.5 px-3 text-sm font-semibold text-ink">
          <span className="icon-tile h-9 w-9"><Scale className="h-[18px] w-[18px]" /></span>
          Documents légaux
        </p>
        <p className="mt-6 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sage">Sommaire</p>
        <nav aria-label="Sommaire" className="mt-1.5 min-h-0 flex-1 space-y-1 overflow-y-auto">
          {items.map(([id, label], i) => (
            <a
              key={id}
              data-id={id}
              href={`#${id}`}
              onClick={(e) => go(e, id)}
              aria-current={active === id ? "true" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors duration-300 ${active === id ? "bg-cream-deep text-forest" : "text-ink/70 hover:bg-cream hover:text-ink"}`}
            >
              <span className={`w-5 shrink-0 text-xs font-bold tabular-nums transition-colors duration-300 ${active === id ? "text-forest" : "text-sage"}`}>{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">{label}</span>
            </a>
          ))}
        </nav>
        <div className="mt-4 border-t border-line pt-4">
          <Link href="/contact" className="block py-1.5 text-center text-sm font-medium text-sage transition hover:text-ink">Une question ? Contactez-nous</Link>
        </div>
      </aside>
    </>
  );
}
