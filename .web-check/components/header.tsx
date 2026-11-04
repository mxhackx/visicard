"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Moncode - accueil" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-sm">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" aria-hidden="true">
              <rect width="200" height="200" rx="38" fill="#0f172a" opacity="0.12"/>
              <g fill="#ffffff">
                <rect x="20" y="20" width="12" height="12"/>
                <rect x="35" y="20" width="12" height="12"/>
                <rect x="50" y="20" width="12" height="12"/>
                <rect x="20" y="35" width="12" height="12"/>
                <rect x="50" y="35" width="12" height="12"/>
                <rect x="20" y="50" width="12" height="12"/>
                <rect x="35" y="50" width="12" height="12"/>
                <rect x="50" y="50" width="12" height="12"/>
                <rect x="128" y="20" width="12" height="12"/>
                <rect x="143" y="20" width="12" height="12"/>
                <rect x="158" y="20" width="12" height="12"/>
                <rect x="128" y="35" width="12" height="12"/>
                <rect x="158" y="35" width="12" height="12"/>
                <rect x="128" y="50" width="12" height="12"/>
                <rect x="143" y="50" width="12" height="12"/>
                <rect x="158" y="50" width="12" height="12"/>
                <rect x="20" y="128" width="12" height="12"/>
                <rect x="35" y="128" width="12" height="12"/>
                <rect x="50" y="128" width="12" height="12"/>
                <rect x="20" y="143" width="12" height="12"/>
                <rect x="50" y="143" width="12" height="12"/>
                <rect x="20" y="158" width="12" height="12"/>
                <rect x="35" y="158" width="12" height="12"/>
                <rect x="50" y="158" width="12" height="12"/>
                <circle cx="100" cy="100" r="8" fill="#22d3ee"/>
                <circle cx="75" cy="100" r="5" fill="#22d3ee"/>
                <circle cx="125" cy="100" r="5" fill="#22d3ee"/>
                <circle cx="100" cy="75" r="5" fill="#22d3ee"/>
                <circle cx="100" cy="125" r="5" fill="#22d3ee"/>
              </g>
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">Moncode</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link href="/#fonctionnement" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">Fonctionnement</Link>
          <Link href="/#tarifs" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">Tarifs</Link>
          <Link href="/#avis" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">Avis</Link>
          <Link href="/about" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">À propos</Link>
          <Link href="/contact" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">Contact</Link>
          <Link href="/connexion" className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Se connecter</Link>
        </nav>

        <button
          type="button"
          aria-label="Ouvrir le menu"
          onClick={() => setIsOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 md:hidden"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2 p-4">
            <Link href="/#fonctionnement" onClick={() => setIsOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Fonctionnement</Link>
            <Link href="/#tarifs" onClick={() => setIsOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Tarifs</Link>
            <Link href="/#avis" onClick={() => setIsOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Avis</Link>
            <Link href="/about" onClick={() => setIsOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">À propos</Link>
            <Link href="/contact" onClick={() => setIsOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Contact</Link>
            <Link href="/connexion" onClick={() => setIsOpen(false)} className="mt-2 block rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white">Se connecter</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
