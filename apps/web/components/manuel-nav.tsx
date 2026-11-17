"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sommaire du manuel : la section en cours est surlignée (fond rouge), un clic fait glisser la page
 * vers la section avec un défilement doux. Colonne collante sur ordinateur, barre défilante sur mobile.
 */
export default function ManuelNav({ items }: { items: readonly (readonly [string, string])[] }) {
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
    <nav aria-label="Sommaire du manuel" className="max-lg:sticky max-lg:top-0 max-lg:z-30 max-lg:-mx-4 max-lg:border-b max-lg:border-line max-lg:bg-white/90 max-lg:px-4 max-lg:backdrop-blur lg:sticky lg:top-4 lg:self-start">
      {/* Mobile : barre de pastilles */}
      <div ref={bar} className="flex gap-2 overflow-x-auto py-2.5 lg:hidden">
        {items.map(([id, label]) => (
          <a
            key={id}
            data-id={id}
            href={`#${id}`}
            onClick={(e) => go(e, id)}
            aria-current={active === id ? "true" : undefined}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-300 ${active === id ? "border-forest bg-forest text-white shadow-[0_8px_20px_rgba(227,5,29,0.25)]" : "border-line bg-white text-ink/75 hover:bg-cream-deep"}`}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Ordinateur : carte de sommaire */}
      <div className="hidden rounded-2xl border border-line bg-white p-3 shadow-[0_14px_36px_rgba(23,23,26,0.07)] lg:block">
        <p className="px-3 pb-2 pt-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-sage">Dans ce manuel</p>
        <ul className="max-h-[calc(100svh-9rem)] space-y-0.5 overflow-y-auto">
          {items.map(([id, label], i) => (
            <li key={id}>
              <a
                data-id={id}
                href={`#${id}`}
                onClick={(e) => go(e, id)}
                aria-current={active === id ? "true" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors duration-300 ${active === id ? "bg-forest text-white shadow-[0_8px_20px_rgba(227,5,29,0.22)]" : "text-ink/75 hover:bg-cream-deep hover:text-ink"}`}
              >
                <span className={`w-5 shrink-0 text-xs font-bold tabular-nums transition-colors duration-300 ${active === id ? "text-white/80" : "text-sage"}`}>{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">{label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
