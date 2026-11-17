"use client";

import { useRef, useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { loginWithCode, type CodeChallenge, type SessionResult } from "@/lib/account";

/** Seconde étape de la connexion : le code à 6 chiffres reçu par e-mail (vérification en deux étapes). */
export default function LoginCodeForm({
  step,
  onSession,
  onBack,
}: {
  step: CodeChallenge;
  onSession: (session: SessionResult) => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (code.replace(/\D/g, "").length !== 6) return setError("Saisissez les 6 chiffres du code.");
    setBusy(true);
    setError(null);
    try {
      onSession(await loginWithCode(step.challenge, code));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code incorrect.");
      setBusy(false);
      input.current?.focus();
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-leaf text-ambre-deep"><MailCheck className="h-6 w-6" /></span>
        <h2 className="mt-3 text-lg font-semibold text-ink/90">Vérification en deux étapes</h2>
        <p className="mt-1 text-sm leading-6 text-sage">Un code à 6 chiffres vient d’être envoyé à <strong className="text-ink">{step.sentTo}</strong>. Il est valable 10 minutes.</p>
      </div>
      <input
        ref={input}
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="••••••"
        aria-label="Code de vérification"
        className="field text-center font-mono text-2xl font-bold tracking-[0.5em]"
      />
      {error && <p role="alert" className="text-center text-sm font-medium text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary w-full justify-center">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Valider
      </button>
      <button type="button" onClick={onBack} className="block w-full text-center text-sm font-medium text-sage transition hover:text-ink">Revenir à la connexion</button>
    </form>
  );
}
