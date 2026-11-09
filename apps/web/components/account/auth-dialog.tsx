"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import AuthForm from "./auth-form";
import PremiumModal, { type PremiumOffer } from "@/components/qr/premium-modal";

interface AuthOptions {
  mode?: "register" | "login";
  /** Appelé une fois le compte créé ou la connexion faite. */
  onDone?: () => void;
}

interface Dialogs {
  /** Ouvre la fenêtre de création de compte / connexion (aucune page à part). */
  openAuth: (options?: AuthOptions) => void;
  /** Ouvre la fenêtre Premium : compte d'abord si besoin, puis paiement FedaPay. */
  openPremium: (offer: Pick<PremiumOffer, "label" | "suite">) => void;
}

const Ctx = createContext<Dialogs>({ openAuth: () => {}, openPremium: () => {} });
export const useDialogs = () => useContext(Ctx);

/** Les deux fenêtres du compte, disponibles partout : un clic, un popup, on reste sur la page. */
export function DialogsProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthOptions | null>(null);
  const [offer, setOffer] = useState<PremiumOffer | null>(null);

  const openAuth = useCallback((options?: AuthOptions) => setAuth(options ?? {}), []);
  const openPremium = useCallback(
    (o: Pick<PremiumOffer, "label" | "suite">) => setOffer({ label: o.label, href: o.suite ?? "/creer", suite: o.suite, price: "5 000", direct: true }),
    [],
  );
  const value = useMemo(() => ({ openAuth, openPremium }), [openAuth, openPremium]);
  const close = () => setAuth(null);

  useEffect(() => {
    if (!auth) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAuth(null);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [auth]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {auth && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <button type="button" aria-label="Fermer" onClick={close} className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" />
          <div className="relative max-h-[94svh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-[0_30px_80px_rgba(23,23,26,0.35)] sm:rounded-3xl sm:p-7">
            <button type="button" onClick={close} aria-label="Fermer" className="absolute right-3 top-3 rounded-full p-2 text-sage transition hover:bg-cream-deep hover:text-ink">
              <X className="h-5 w-5" />
            </button>
            <h2 id="auth-title" className="text-xl font-semibold text-ink/90">Mon compte</h2>
            <p className="mt-1 text-sm leading-6 text-sage">Retrouvez vos QR codes et créez-en de nouveaux.</p>
            <AuthForm
              className="mt-5"
              initialMode={auth.mode ?? "register"}
              onDone={() => {
                const done = auth.onDone;
                close();
                done?.();
              }}
            />
          </div>
        </div>
      )}
      <PremiumModal offer={offer} onClose={() => setOffer(null)} />
    </Ctx.Provider>
  );
}
