"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Logo from "@/components/logo";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/#services", label: "Services" },
  { href: "/#fonctionnement", label: "Fonctionnement" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/#avis", label: "Avis" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 brand-surface border-b border-white/10 shadow-[0_8px_30px_rgba(15,42,107,0.25)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Moncode — accueil" className="shrink-0">
          <Logo variant="light" />
        </Link>

        <nav aria-label="Sections du site" className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-white/80 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <Link href="/creer" className="btn btn-light btn-sm">
            Créer un QR code
          </Link>
        </div>

        <button
          type="button"
          aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 lg:hidden"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 lg:hidden">
          <nav aria-label="Sections du site" className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block border-b border-white/10 py-3 text-base font-medium text-white/85 last:border-0 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/creer" onClick={() => setIsOpen(false)} className="btn btn-light btn-sm my-3 w-full">
              Créer un QR code
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
