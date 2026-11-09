"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFile } from "@/app/context/FileContext";
import Logo from "@/components/logo";

const navLinks = [
  { href: "/#fonctionnement", label: "Fonctionnement" },
  { href: "/#exemples", label: "Exemples" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/#avis", label: "Fondateurs" },
  { href: "/manuel", label: "Manuel" },
  { href: "/contact", label: "Contact" },
];

const noopSubscribe = () => () => {};

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  // En défilement, l'en-tête s'efface : il revient en haut de page, au survol du bord haut (ordinateur)
  // ou en remontant la page du doigt (tactile).
  const [scrolled, setScrolled] = useState(false);
  const [peek, setPeek] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    let raf = 0;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 80);
        if (touch) {
          if (y < lastY.current - 2 && y > 80) setPeek(true);
          else if (y > lastY.current + 2) setPeek(false);
        }
        lastY.current = y;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  const hidden = scrolled && !peek && !isOpen;
  const { authToken, authRole } = useFile();
  // La session vit dans le navigateur : on n'affiche « Mon compte » qu'après l'hydratation, et seulement connecté.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const account = mounted && authToken && authRole !== "admin" ? { href: "/compte", label: "Mon compte" } : null;

  return (
    <>
    {/* Bande invisible au bord haut de l'écran : l'approcher avec la souris fait revenir l'en-tête. */}
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-40 hidden h-3 lg:block" onMouseEnter={() => setPeek(true)} />
    <header
      onMouseLeave={() => setPeek(false)}
      className={`fixed inset-x-0 top-0 z-50 isolate border-b text-ink will-change-transform transition-[transform,background-color,border-color] duration-300 ease-out ${scrolled ? "border-line bg-[#fdf9f9]" : "border-transparent bg-transparent"} ${hidden ? "-translate-y-full" : "translate-y-0"}`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Moncode — accueil" className="shrink-0">
          <Logo variant="dark" />
        </Link>

        <nav aria-label="Sections du site" className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative py-1 text-[15px] font-medium text-ink/70 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-forest after:transition-transform hover:text-ink hover:after:scale-x-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          {account && (
            <Link href={account.href} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink/80 transition-colors hover:border-forest hover:text-forest">
              {account.label}
            </Link>
          )}
          <Link href="/creer" className="btn btn-primary btn-sm">
            Créer un QR code
          </Link>
        </div>

        <button
          type="button"
          aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:border-forest hover:text-forest lg:hidden"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-line lg:hidden">
          <nav aria-label="Sections du site" className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block border-b border-line py-3 text-base font-medium text-ink/80 last:border-0 hover:text-forest"
              >
                {link.label}
              </Link>
            ))}
            {account && (
              <Link href={account.href} onClick={() => setIsOpen(false)} className="block border-b border-line py-3 text-base font-medium text-ink/80 hover:text-forest">
                {account.label}
              </Link>
            )}
            <Link href="/creer" onClick={() => setIsOpen(false)} className="btn btn-primary btn-sm my-3 w-full">
              Créer un QR code
            </Link>
          </nav>
        </div>
      )}
    </header>
    </>
  );
}
