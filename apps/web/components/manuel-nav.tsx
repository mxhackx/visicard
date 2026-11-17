"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Logo from "@/components/logo";

/**
 * Sommaire du manuel : colonne fixe à gauche (elle ne défile jamais avec la page),
 * qui ne dépasse jamais la hauteur de l'écran — la liste des sections défile à l'intérieur.
 * Première ligne : le logo du site et « Manuel d'utilisation » côte à côte.
 * Sur mobile : barre fixe en haut (logo + titre sur la même ligne, pastilles en dessous).
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
    <>
      {/* Mobile : barre fixe en haut — logo et titre sur la même ligne, sommaire en pastilles dessous. */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-line bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link href="/" aria-label="Moncode — accueil" className="inline-flex shrink-0">
              <Logo variant="dark" />
            </Link>
            <span className="min-w-0 truncate text-sm font-semibold text-ink">Manuel d’utilisation</span>
          </div>
          <Link href="/creer" className="btn btn-primary btn-sm shrink-0">Créer</Link>
        </div>
        <nav ref={bar} aria-label="Sommaire du manuel" className="flex gap-2 overflow-x-auto px-4 pb-2.5">
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
        </nav>
      </div>

      {/* Ordinateur : colonne fixe, jamais plus haute que l'écran (la liste défile à l'intérieur). */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 shrink-0 flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-line px-4">
          <Link href="/" aria-label="Moncode — accueil" className="inline-flex shrink-0">
            <Logo variant="dark" />
          </Link>
          <span className="min-w-0 truncate text-sm font-semibold text-ink">Manuel d’utilisation</span>
        </div>
        <p className="mt-6 shrink-0 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sage">Sommaire</p>
        <nav aria-label="Sommaire du manuel" className="mt-1.5 min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
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
        <div className="mt-4 shrink-0 space-y-2 border-t border-line p-4">
          <Link href="/creer" className="btn btn-primary w-full justify-center">Créer un QR code <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/contact" className="block py-1.5 text-center text-sm font-medium text-sage transition hover:text-ink">Une question ? Contactez-nous</Link>
        </div>
      </aside>
    </>
  );
}
