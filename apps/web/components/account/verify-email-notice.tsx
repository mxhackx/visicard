"use client";

import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { resendVerification } from "@/lib/account";
import { notifyEmailChanged, useEmailVerified } from "@/lib/email-status";

/** Bandeau « Confirmez votre adresse e-mail » : visible tant que le lien reçu à l'inscription n'a pas été ouvert. */
export default function VerifyEmailNotice({ className = "" }: { className?: string }) {
  const { authToken, authUser } = useFile();
  const { verified, refresh } = useEmailVerified();
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const id = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(id);
  }, [wait]);

  if (verified !== false || !authToken) return null;

  const resend = async () => {
    setBusy(true);
    setInfo(null);
    try {
      const r = await resendVerification(authToken);
      if (r.alreadyVerified) notifyEmailChanged();
      else {
        setInfo("Lien renvoyé : vérifiez votre boîte de réception (et les courriers indésirables).");
        setWait(45);
      }
    } catch (e) {
      setInfo(e instanceof Error ? e.message : "Envoi impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="status" className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        <MailCheck className="h-4 w-4 shrink-0" />
        <p className="min-w-[14rem] flex-1">
          Confirmez votre adresse e-mail{authUser?.email ? <> (<strong>{authUser.email}</strong>)</> : null} : c’est nécessaire pour payer et recevoir vos factures. Un lien vous a été envoyé à l’inscription.
        </p>
        <div className="flex gap-2 max-sm:w-full">
          <button type="button" onClick={resend} disabled={busy || wait > 0} className="btn btn-outline btn-sm max-sm:flex-1">
            {wait > 0 ? `Renvoyer (${wait} s)` : "Renvoyer le lien"}
          </button>
          <button type="button" onClick={() => void refresh()} className="btn btn-primary btn-sm max-sm:flex-1">J’ai confirmé</button>
        </div>
      </div>
      {info && <p className="mt-2 text-xs">{info}</p>}
    </div>
  );
}
