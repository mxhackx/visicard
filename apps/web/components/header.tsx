"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Code2, Info, LogOut, Menu, MessageCircle, QrCode, Tag, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFile } from "@/app/context/FileContext";
import Logo from "@/components/logo";
import { useDialogs } from "@/components/account/auth-dialog";

const navLinks = [
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/manuel", label: "Manuel" },
  { href: "/contact", label: "Contact" },
];

/** Liens du menu mobile : un peu plus complet que la barre du haut, avec une icône chacun. */
const menuLinks = [
  { href: "/#tarifs", label: "Tarifs", icon: Tag },
  { href: "/manuel", label: "Manuel d’utilisation", icon: BookOpen },
  { href: "/developpeurs", label: "API développeurs", icon: Code2 },
  { href: "/a-propos", label: "À propos", icon: Info },
  { href: "/contact", label: "Contact", icon: MessageCircle },
];

const noopSubscribe = () => () => {};

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
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
  const { authToken, authRole, authUser, logoutSession } = useFile();
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
    {/* En-tête dans le flux de la page (non fixe) : il défile avec elle. L'espace est réservé par .header-spacer. */}
    <header className="absolute inset-x-0 top-0 z-50 isolate border-b border-transparent bg-transparent text-ink">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Moncode — accueil" className="shrink-0">
          <Logo variant="dark" />
        </Link>

        {/* Liens et bouton regroupés à droite : les liens sont proches du bouton. */}
        <div className="hidden items-center gap-6 lg:flex">
        <nav aria-label="Sections du site" className="flex items-center gap-1">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-[15px] font-medium transition-colors ${active ? "bg-cream-deep text-forest" : "text-ink/70 hover:bg-cream-deep hover:text-ink"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 border-l border-line pl-6">
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

        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/creer" className="btn btn-primary btn-sm">Créer</Link>
          <button
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={isOpen}
            aria-controls="menu-mobile"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center border border-line bg-white text-ink transition-colors active:scale-95 hover:border-forest hover:text-forest"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
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
        className={`absolute inset-0 bg-ink/50 backdrop-blur-[3px] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        id="menu-mobile"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!isOpen}
        className={`absolute right-0 top-0 flex h-full w-[min(88vw,380px)] flex-col bg-white transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "translate-x-0 shadow-[-18px_0_50px_rgba(23,23,26,0.22)]" : "translate-x-full shadow-none"}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <Logo variant="dark" />
          <button
            ref={closeRef}
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cream-deep text-ink transition active:scale-90 hover:bg-line"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Carte du compte : qui est connecté, ou une invitation à se connecter. */}
          {account ? (
            <Link href={account.href} onClick={() => setIsOpen(false)} className="mt-2 flex items-center gap-3.5 rounded-2xl border border-line bg-[linear-gradient(#fff,#fbf5f5)] p-3.5 transition active:scale-[0.99]">
              {picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={picture} alt="" width={48} height={48} referrerPolicy="no-referrer" className="h-12 w-12 rounded-full object-cover ring-2 ring-white" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest text-lg font-semibold text-white ring-2 ring-white">{initial}</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-ink">{authUser?.name || account.label}</span>
                <span className="block truncate text-xs text-sage">{authUser?.email}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-sage" />
            </Link>
          ) : (
            <button type="button" onClick={() => { setIsOpen(false); openAuth({ mode: "login" }); }} className="mt-2 flex w-full items-center gap-3.5 rounded-2xl border border-line bg-[linear-gradient(#fff,#fbf5f5)] p-3.5 text-left transition active:scale-[0.99]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-deep text-ink"><UserRound className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">Se connecter</span>
                <span className="block text-xs text-sage">Retrouvez vos QR codes</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-sage" />
            </button>
          )}

          <nav aria-label="Sections du site" className="mt-4 space-y-1">
            {menuLinks.map(({ href, label, icon: Icon }, i) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  aria-current={active ? "page" : undefined}
                  style={{ transitionDelay: isOpen ? `${80 + i * 45}ms` : "0ms" }}
                  className={`flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-[16px] font-medium transition-[opacity,transform,background-color] duration-300 active:bg-cream-deep ${isOpen ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"} ${active ? "bg-cream-deep text-forest" : "text-ink/85 hover:bg-cream-deep"}`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-white text-forest" : "bg-cream-deep text-ink/70"}`}><Icon className="h-[18px] w-[18px]" /></span>
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="h-4 w-4 text-sage/70" />
                </Link>
              );
            })}
          </nav>

          {signedIn && (
            <button type="button" onClick={() => { setIsOpen(false); logoutSession(); router.replace("/"); }} className="mt-3 flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-3 text-left text-[15px] font-medium text-ink/70 transition hover:bg-cream-deep">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream-deep"><LogOut className="h-[18px] w-[18px]" /></span>
              Se déconnecter
            </button>
          )}
        </div>

        <div className="shrink-0 border-t border-line bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Link href="/creer" onClick={() => setIsOpen(false)} className="btn btn-primary w-full justify-center py-3.5 text-base">
            <QrCode className="h-[18px] w-[18px]" /> Créer un QR code
          </Link>
        </div>
      </aside>
    </div>
    </>
  );
}
