"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LayoutDashboard, Loader2, LogOut, Plus, QrCode, Receipt, Settings, Users } from "lucide-react";
import Logo from "@/components/logo";
import { useFile } from "@/app/context/FileContext";
import { API_URL } from "@/lib/api-url";

export type AdminSection = "overview" | "cards" | "orders" | "new" | "accounts" | "settings";

const NAV_GROUPS: { label: string; items: { id: AdminSection; label: string; href: string; icon: typeof Users }[] }[] = [
  {
    label: "Pilotage",
    items: [
      { id: "overview", label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
      { id: "orders", label: "Commandes", href: "/admin?tab=orders", icon: Receipt },
    ],
  },
  {
    label: "Contenu",
    items: [{ id: "cards", label: "QR codes", href: "/admin?tab=cards", icon: QrCode }],
  },
  {
    label: "Équipe",
    items: [
      { id: "accounts", label: "Utilisateurs", href: "/admin?tab=accounts", icon: Users },
      { id: "settings", label: "Paramètres", href: "/admin?tab=settings", icon: Settings },
    ],
  },
];
const NAV = NAV_GROUPS.flatMap((g) => g.items);

/** Nombre de devis en attente de paiement : le badge qui dit où agir. */
function useOpenOrders(token: string | null) {
  const [open, setOpen] = useState(0);
  useEffect(() => {
    if (!token) return;
    let alive = true;
    fetch(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setOpen(Number(d?.orders?.open) || 0))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token]);
  return open;
}

/**
 * Cadre commun des pages d'administration : contrôle d'accès, barre latérale,
 * en-tête. Le contenu reçoit le jeton admin.
 */
export default function AdminShell({
  active,
  title,
  hint,
  actions,
  children,
}: {
  active: AdminSection;
  title: string;
  hint?: string;
  actions?: React.ReactNode;
  children: (adminToken: string) => React.ReactNode;
}) {
  const router = useRouter();
  const { authToken, authRole, isAuthLoading, logoutSession } = useFile();
  // Faux au rendu serveur, vrai dès l'hydratation (évite un écart d'affichage).
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const allowed = Boolean(authToken) && authRole === "admin";
  const openOrders = useOpenOrders(allowed ? authToken : null);

  useEffect(() => {
    if (!isAuthLoading && !allowed) router.replace("/admin/connexion");
  }, [allowed, isAuthLoading, router]);

  const logout = () => {
    logoutSession();
    router.replace("/admin/connexion");
  };

  if (!mounted || isAuthLoading || !allowed || !authToken) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-sage">
        <Loader2 className="h-5 w-5 animate-spin" />
        Vérification de l’accès administrateur…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full font-sans text-ink">
      <aside className="brand-surface sticky top-0 hidden h-screen w-64 shrink-0 flex-col px-4 py-6 lg:flex">
        <Link href="/" className="px-2" aria-label="Moncode : retour au site">
          <Logo variant="light" />
        </Link>
        <Link href="/admin/nouveau" className="btn btn-light mt-8 w-full">
          <Plus className="h-4 w-4" /> Nouveau QR code
        </Link>
        <nav className="mt-6 space-y-5" aria-label="Sections de l'administration">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{group.label}</p>
              <div className="mt-1.5 space-y-1">
                {group.items.map(({ id, label, href, icon: Icon }) => (
                  <Link
                    key={id}
                    href={href}
                    aria-current={active === id ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${
                      active === id ? "bg-white text-forest shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    <span className="flex-1">{label}</span>
                    {id === "orders" && openOrders > 0 && (
                      <span className="rounded-full bg-forest px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
                        {openOrders}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-white/15 pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-[18px] w-[18px]" />
            Voir le site
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-white">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-ink/90">{title}</h1>
              {hint && <p className="truncate text-sm text-sage">{hint}</p>}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <Link href="/admin/nouveau" className="btn btn-primary btn-sm lg:hidden">
                <Plus className="h-4 w-4" /> Nouveau
              </Link>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink/80 transition-colors hover:text-ink lg:hidden"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Déconnexion</span>
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden" aria-label="Sections de l'administration">
            {NAV.map(({ id, label, href, icon: Icon }) => (
              <Link
                key={id}
                href={href}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active === id ? "bg-forest text-white" : "text-ink/70 hover:bg-cream-deep"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {id === "orders" && openOrders > 0 && (
                  <span className="rounded-full bg-forest px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {openOrders}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 lg:px-8">{children(authToken)}</main>
      </div>
    </div>
  );
}
