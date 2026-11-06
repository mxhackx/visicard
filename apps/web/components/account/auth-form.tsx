"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { loginAccount, registerAccount } from "@/lib/account";

type Mode = "register" | "login";

/**
 * Création de compte ou connexion, sur une seule carte. Utilisé tel quel dans le parcours de
 * commande (la page et ses données restent en place) et sur la page /connexion.
 */
export default function AuthForm({
  initialMode = "register",
  onDone,
  className = "",
}: {
  initialMode?: Mode;
  onDone?: () => void;
  className?: string;
}) {
  const { loginSession } = useFile();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "register" && name.trim().length < 2) return setError("Indiquez votre nom.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Adresse e-mail invalide.");
    if (password.length < (mode === "register" ? 8 : 1)) {
      return setError(mode === "register" ? "Le mot de passe doit compter au moins 8 caractères." : "Indiquez votre mot de passe.");
    }
    setBusy(true);
    try {
      const session =
        mode === "register"
          ? await registerAccount(name.trim(), email.trim(), password)
          : await loginAccount(email.trim(), password);
      loginSession(session.access_token, session.user.role, { id: session.user.id, email: session.user.email }, session.refresh_token);
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className={className}>
      <div className="inline-flex rounded-xl border border-line bg-white p-1" role="tablist" aria-label="Compte">
        {(
          [
            ["register", "Créer mon compte"],
            ["login", "J’ai un compte"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              setMode(id);
              setError(null);
            }}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              mode === id ? "bg-forest text-white" : "text-ink/70 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4">
        {mode === "register" && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink/70">Nom</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink/70">E-mail</span>
          <input className="field" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink/70">
            Mot de passe {mode === "register" && <span className="font-normal text-sage">(8 caractères minimum)</span>}
          </span>
          <input
            className="field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
        </label>
      </div>

      {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      <button type="submit" disabled={busy} className="btn btn-primary mt-5 w-full">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "register" ? "Créer mon compte et continuer" : "Me connecter"}
      </button>
    </form>
  );
}
