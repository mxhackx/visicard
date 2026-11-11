"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, ShieldAlert, X } from "lucide-react";

export interface EditableAccount {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "user";
  premiumUntil?: string | null;
}

const toInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
const fmt = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso)) : "aucun";

/**
 * Modification d'un compte, en trois temps : saisie, première confirmation (récapitulatif des changements),
 * seconde confirmation (retaper l'adresse e-mail actuelle du compte). L'API refuse sans cette adresse.
 */
export default function AdminAccountEditor({
  account,
  request,
  onClose,
  onSaved,
}: {
  account: EditableAccount;
  request: (path: string, init?: RequestInit) => Promise<Response>;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [step, setStep] = useState<"edit" | "confirm1" | "confirm2">("edit");
  const [name, setName] = useState(account.name ?? "");
  const [email, setEmail] = useState(account.email);
  const [password, setPassword] = useState("");
  const [until, setUntil] = useState(toInput(account.premiumUntil));
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changes: { label: string; from: string; to: string }[] = [];
  if (name.trim() !== (account.name ?? "")) changes.push({ label: "Nom", from: account.name || "—", to: name.trim() || "—" });
  if (email.trim().toLowerCase() !== account.email.toLowerCase()) changes.push({ label: "E-mail", from: account.email, to: email.trim().toLowerCase() });
  if (password) changes.push({ label: "Mot de passe", from: "actuel", to: "nouveau mot de passe" });
  if (until !== toInput(account.premiumUntil)) {
    changes.push({ label: "Premium jusqu’au", from: fmt(account.premiumUntil), to: until ? fmt(until) : "retiré" });
  }

  const apply = async () => {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { confirmEmail: typed };
      if (changes.some((c) => c.label === "Nom")) body.name = name;
      if (changes.some((c) => c.label === "E-mail")) body.email = email;
      if (password) body.password = password;
      if (changes.some((c) => c.label === "Premium jusqu’au")) body.premiumUntil = until ? new Date(`${until}T23:59:59Z`).toISOString() : null;
      const res = await request(`/auth/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.message === "string" ? data.message : "Modification impossible.");
      onSaved(`Compte ${account.email} modifié.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Modification impossible.");
      setBusy(false);
    }
  };

  const matches = typed.trim().toLowerCase() === account.email.toLowerCase();

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="edit-account-title">
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" />
      <div className="relative max-h-[94svh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-[0_30px_80px_rgba(23,23,26,0.35)] sm:rounded-3xl sm:p-7">
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute right-3 top-3 rounded-full p-2 text-sage transition hover:bg-cream-deep hover:text-ink">
          <X className="h-5 w-5" />
        </button>
        <h2 id="edit-account-title" className="text-xl font-semibold text-ink/90">Modifier le compte</h2>
        <p className="mt-1 text-sm text-sage">{account.email} · {account.role === "admin" ? "administrateur" : "client"}</p>

        {step === "edit" && (
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              if (changes.length === 0) return setError("Aucune modification à enregistrer.");
              if (password && password.length < 8) return setError("Le mot de passe doit compter au moins 8 caractères.");
              setStep("confirm1");
            }}
          >
            <label className="block text-sm font-medium text-ink/80">Nom
              <input className="field mt-1.5" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            </label>
            <label className="block text-sm font-medium text-ink/80">Adresse e-mail
              <input className="field mt-1.5" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
            </label>
            <label className="block text-sm font-medium text-ink/80">Nouveau mot de passe <span className="font-normal text-sage">(laisser vide pour ne pas le changer)</span>
              <input className="field mt-1.5" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} />
            </label>
            <div>
              <label className="block text-sm font-medium text-ink/80">Premium jusqu’au
                <input className="field mt-1.5" type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
              </label>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <button type="button" onClick={() => setUntil(toInput(new Date(Date.now() + 365 * 86400000).toISOString()))} className="rounded-full border border-line px-3 py-1 font-medium text-ink/80 hover:border-ink/30">Offrir 1 an</button>
                <button type="button" onClick={() => setUntil("")} className="rounded-full border border-line px-3 py-1 font-medium text-ink/80 hover:border-ink/30">Retirer Premium</button>
              </div>
            </div>
            {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline btn-sm">Annuler</button>
              <button type="submit" className="btn btn-primary btn-sm">Continuer</button>
            </div>
          </form>
        )}

        {step === "confirm1" && (
          <div className="mt-5">
            <p className="flex items-start gap-2 text-sm font-semibold text-ink/90"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> Première confirmation : vérifiez les changements</p>
            <ul className="mt-3 divide-y divide-line rounded-xl border border-line text-sm">
              {changes.map((c) => (
                <li key={c.label} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <span className="font-medium text-ink/80">{c.label}</span>
                  <span className="text-right text-sage"><span className="line-through">{c.from}</span> → <span className="font-semibold text-ink">{c.to}</span></span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-between gap-2">
              <button type="button" onClick={() => setStep("edit")} className="btn btn-outline btn-sm">Retour</button>
              <button type="button" onClick={() => setStep("confirm2")} className="btn btn-primary btn-sm">Oui, je suis sûr</button>
            </div>
          </div>
        )}

        {step === "confirm2" && (
          <div className="mt-5">
            <p className="flex items-start gap-2 text-sm font-semibold text-red-700"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> Dernière confirmation : action sensible</p>
            <p className="mt-2 text-sm leading-6 text-sage">Ces changements touchent le compte d’une personne. Pour confirmer, retapez son adresse e-mail actuelle :</p>
            <p className="mt-2 rounded-lg bg-cream-deep px-3 py-2 font-mono text-sm text-ink/90">{account.email}</p>
            <input className="field mt-3" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Retapez l’adresse e-mail" autoComplete="off" autoFocus />
            {error && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{error}</p>}
            <div className="mt-5 flex justify-between gap-2">
              <button type="button" disabled={busy} onClick={() => setStep("confirm1")} className="btn btn-outline btn-sm">Retour</button>
              <button type="button" disabled={!matches || busy} onClick={apply} className="btn btn-primary btn-sm disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Appliquer les modifications
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
