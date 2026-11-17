"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { confirmEmail } from "@/lib/account";
import { notifyEmailChanged } from "@/lib/email-status";
import AuthForm from "./auth-form";
import { useRouter } from "next/navigation";

interface AuthOptions {
  mode?: "register" | "login";
  /** Jeton du lien « mot de passe oublié » reçu par e-mail. */
  resetToken?: string;
  /** Appelé une fois le compte créé ou la connexion faite. */
  onDone?: () => void;
}

interface Dialogs {
  /** Ouvre la fenêtre de création de compte / connexion (aucune page à part). */
  openAuth: (options?: AuthOptions) => void;
  /** Ouvre la page de paiement Premium ; `suite` est la page où revenir une fois payé. */
  openPremium: (offer: { label?: string; suite?: string; renew?: boolean }) => void;
}

const Ctx = createContext<Dialogs>({ openAuth: () => {}, openPremium: () => {} });
export const useDialogs = () => useContext(Ctx);

/** Fenêtre de compte et raccourci vers la page de paiement, disponibles partout. */
export function DialogsProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthOptions | null>(null);
  const router = useRouter();

  const openAuth = useCallback((options?: AuthOptions) => setAuth(options ?? {}), []);
  const openPremium = useCallback(
    (o: { label?: string; suite?: string; renew?: boolean }) => {
      const suite = o.suite ?? `${window.location.pathname}${window.location.search}`;
      router.push(`/paiement?suite=${encodeURIComponent(suite)}${o.renew ? "&renouveler=1" : ""}`);
    },
    [router],
  );
  // Lien de réinitialisation reçu par e-mail (/?reinit=…) : on ouvre le choix du nouveau mot de passe, puis on nettoie l'adresse.
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("reinit");
    if (!token) return;
    url.searchParams.delete("reinit");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    queueMicrotask(() => setAuth({ mode: "login", resetToken: token }));
  }, []);

  // Lien de confirmation d'adresse reçu par e-mail (/?verifier=…) : on le valide, puis on l'annonce dans une fenêtre centrée.
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("verifier");
    if (!token) return;
    url.searchParams.delete("verifier");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    confirmEmail(token)
      .then((r) => {
        notifyEmailChanged();
        setNotice({ ok: true, text: `Votre adresse ${r.email} est confirmée. Vous pouvez maintenant payer et recevoir vos factures.` });
      })
      .catch((e) => setNotice({ ok: false, text: e instanceof Error ? e.message : "Ce lien est invalide ou a expiré." }));
  }, []);

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
      {notice && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Confirmation d’adresse e-mail">
          <button type="button" aria-label="Fermer" onClick={() => setNotice(null)} className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-[0_30px_80px_rgba(23,23,26,0.35)]">
            <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${notice.ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
              {notice.ok ? <CheckCircle2 className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
            </span>
            <h2 className="mt-4 text-lg font-semibold text-ink">{notice.ok ? "Adresse confirmée" : "Lien non valide"}</h2>
            <p className="mt-2 text-sm leading-6 text-sage">{notice.text}</p>
            <button type="button" onClick={() => setNotice(null)} className="btn btn-primary mt-5 w-full">Continuer</button>
          </div>
        </div>
      )}
      {auth && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <button type="button" aria-label="Fermer" onClick={close} className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" />
          <div className="relative max-h-[90svh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_30px_80px_rgba(23,23,26,0.35)] sm:p-7">
            <button type="button" onClick={close} aria-label="Fermer" className="absolute right-3 top-3 rounded-full p-2 text-sage transition hover:bg-cream-deep hover:text-ink">
              <X className="h-5 w-5" />
            </button>
            <h2 id="auth-title" className="text-xl font-semibold text-ink/90">Mon compte</h2>
            <p className="mt-1 text-sm leading-6 text-sage">Retrouvez vos QR codes et créez-en de nouveaux.</p>
            <AuthForm
              className="mt-5"
              initialMode={auth.mode ?? "register"}
              resetToken={auth.resetToken}
              onDone={() => {
                const done = auth.onDone;
                close();
                done?.();
              }}
            />
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
