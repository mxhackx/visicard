"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFile } from "@/app/context/FileContext";
import Logo from "@/components/logo";
import { useDialogs } from "@/components/account/auth-dialog";

const navLinks = [
  { href: "/#exemples", label: "Exemples" },
  { href: "/#tarifs", label: "Tarifs" },
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
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);
  const { authToken, authRole, authUser } = useFile();
  const { openAuth } = useDialogs();
  // La session vit dans le navigateur : on n'affiche « Mon compte » qu'après l'hydratation, et seulement connecté.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const signedIn = mounted && Boolean(authToken);
  const picture = signedIn && /^https:\/\//.test(authUser?.picture ?? "") ? authUser!.picture! : null;
  const account = signedIn ? (authRole === "admin" ? { href: "/admin", label: "Administration" } : { href: "/compte", label: "Mon compte" }) : null;
  // Sans photo Google : l'initiale du nom (ou de l'e-mail) sur un rond aux couleurs de Moncode.
  const initial = ((authUser?.name || authUser?.email || "M").trim()[0] ?? "M").toUpperCase();

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

        {/* Liens et bouton regroupés à droite : les liens sont proches du bouton. */}
        <div className="hidden items-center gap-10 lg:flex">
        <nav aria-label="Sections du site" className="flex items-center gap-8">
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

        <div className="flex items-center gap-5">
          {account && (
            <Link href={account.href} aria-label={account.label} title={account.label} className="block h-9 w-9 overflow-hidden rounded-full ring-2 ring-white transition hover:ring-forest">
              {picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={picture} alt="" width={36} height={36} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-forest text-sm font-semibold text-white">{initial}</span>
              )}
            </Link>
          )}
          {!signedIn && (
            <button type="button" onClick={() => openAuth({ mode: "login" })} className="btn btn-outline btn-sm">
              Se connecter
            </button>
          )}
          <Link href="/creer" className="btn btn-primary btn-sm">
            Créer un QR code
          </Link>
        </div>
        </div>

        <button
          type="button"
          aria-label="Ouvrir le menu"
          aria-expanded={isOpen}
          aria-controls="menu-mobile"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:border-forest hover:text-forest lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

    </header>

    {/* Menu mobile : panneau qui glisse depuis la droite. Hors du <header>, dont la transformation
        piégerait un élément « fixed ». */}
    <div className={`fixed inset-0 z-[60] lg:hidden ${isOpen ? "" : "pointer-events-none"}`} aria-hidden={!isOpen}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fermer le menu"
        onClick={() => setIsOpen(false)}
        className={`absolute inset-0 bg-ink/45 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        id="menu-mobile"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!isOpen}
        className={`absolute right-0 top-0 flex h-full w-[min(86vw,360px)] flex-col bg-white shadow-[-12px_0_40px_rgba(23,23,26,0.18)] transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <span className="text-sm font-semibold text-ink/70">Menu</span>
          <button
            ref={closeRef}
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:border-forest hover:text-forest"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="Sections du site" className="flex-1 overflow-y-auto px-5 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block border-b border-line py-4 text-lg font-medium text-ink/85 hover:text-forest"
            >
              {link.label}
            </Link>
          ))}
          {account && (
            <Link href={account.href} onClick={() => setIsOpen(false)} className="flex items-center gap-3 border-b border-line py-4 text-lg font-medium text-ink/85 hover:text-forest">
              {picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={picture} alt="" width={32} height={32} referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white">{initial}</span>
              )}
              {account.label}
            </Link>
          )}
        </nav>

        <div className="shrink-0 space-y-3 border-t border-line p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {!signedIn && (
            <button type="button" onClick={() => { setIsOpen(false); openAuth({ mode: "login" }); }} className="btn btn-outline w-full">
              Se connecter
            </button>
          )}
          <Link href="/creer" onClick={() => setIsOpen(false)} className="btn btn-primary w-full">
            Créer un QR code
          </Link>
        </div>
      </aside>
    </div>
    </>
  );
}
