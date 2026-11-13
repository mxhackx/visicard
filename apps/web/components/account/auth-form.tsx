"use client";

import { useState, type FormEvent } from "react";
import GoogleButton from "./google-button";
import { Loader2 } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import Link from "next/link";
import { forgotPassword, loginAccount, registerAccount, resetPassword, updateProfile } from "@/lib/account";

type Mode = "register" | "login";
type Info = { token: string; role: "admin" | "user" };

/** Numéro saisi → +indicatif. Un numéro local de 8 ou 10 chiffres est béninois (+229). */
export function toPhone(raw: string): string | null {
  const t = raw.trim();
  const digits = t.replace(/\D/g, "");
  if (/^(\+|00)/.test(t)) return digits.replace(/^00/, "").length >= 8 ? `+${digits.replace(/^00/, "")}` : null;
  if (digits.startsWith("229") && (digits.length === 11 || digits.length === 13)) return `+${digits}`;
  return digits.length === 8 || digits.length === 10 ? `+229${digits}` : null;
}

/** +2290197000000 → +229 01 97 00 00 00 (indicatif béninois ; les autres numéros restent tels quels). */
export function formatPhone(p: string): string {
  const m = /^\+229(\d{8,10})$/.exec(p);
  return m ? `+229 ${m[1].replace(/(\d{2})(?=\d)/g, "$1 ")}` : p;
}

function PhoneInput({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-line bg-white focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/20">
      <span className="flex shrink-0 items-center gap-2 border-r border-line bg-cream px-3 text-sm font-medium text-ink/80">
        <span aria-hidden="true">🇧🇯</span> +229
      </span>
      <input id={id} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none" inputMode="tel" autoComplete="tel-national" placeholder="01 97 00 00 00" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/**
 * Création de compte ou connexion, sur une seule carte : le nom et le téléphone sont demandés dès la création,
 * ce qui évite de les redemander à chaque paiement. Un compte sans numéro (Google, ancien compte) le complète à la connexion.
 */
export default function AuthForm({
  initialMode = "register",
  onDone,
  className = "",
  nested = false,
  resetToken,
}: {
  initialMode?: Mode;
  /** Lien reçu par e-mail : ouvre directement le choix d'un nouveau mot de passe. */
  resetToken?: string;
  onDone?: (info: Info) => void;
  className?: string;
  /** Rendu à l’intérieur d’un autre formulaire : pas de <form> imbriqué (invalide en HTML). */
  nested?: boolean;
}) {
  const { loginSession, updateAuthUser } = useFile();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Connexion réussie mais profil incomplet : on demande le nom et le numéro avant de continuer.
  const [pending, setPending] = useState<(Info & { name: string }) | null>(null);
  // Mot de passe oublié : demande du lien (« forgot »), puis nouveau mot de passe (« reset », via le lien de l'e-mail).
  const [stage, setStage] = useState<"auth" | "forgot" | "reset">(resetToken ? "reset" : "auth");
  const [notice, setNotice] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const finish = (info: Info, user: { name?: string | null; phone?: string | null }) => {
    if (info.role !== "admin" && !user.phone) {
      setPending({ ...info, name: user.name ?? "" });
      setName(user.name ?? "");
      return;
    }
    onDone?.(info);
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (mode === "register") {
      if (name.trim().length < 2) return setError("Indiquez votre nom et prénom.");
      if (!toPhone(phone)) return setError("Numéro de téléphone invalide : 8 ou 10 chiffres (ex. 01 97 00 00 00).");
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Adresse e-mail invalide.");
    if (password.length < (mode === "register" ? 8 : 1)) {
      return setError(mode === "register" ? "Le mot de passe doit compter au moins 8 caractères." : "Indiquez votre mot de passe.");
    }
    setBusy(true);
    try {
      const session =
        mode === "register"
          ? await registerAccount(name.trim(), email.trim(), password, toPhone(phone)!)
          : await loginAccount(email.trim(), password);
      loginSession(session.access_token, session.user.role, { id: session.user.id, email: session.user.email, name: session.user.name, picture: session.user.picture, phone: session.user.phone }, session.refresh_token);
      finish({ token: session.access_token, role: session.user.role }, session.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!pending) return;
    setError(null);
    const full = toPhone(phone);
    if (name.trim().length < 2) return setError("Indiquez votre nom et prénom.");
    if (!full) return setError("Numéro de téléphone invalide : 8 ou 10 chiffres (ex. 01 97 00 00 00).");
    setBusy(true);
    try {
      const saved = await updateProfile(pending.token, { name: name.trim(), phone: full });
      updateAuthUser({ name: saved.name, phone: saved.phone });
      onDone?.({ token: pending.token, role: pending.role });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const wrap = (content: React.ReactNode, onSubmit: (e?: FormEvent) => void) =>
    nested ? (
      <div
        className={className}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
            e.preventDefault();
            void onSubmit();
          }
        }}
      >
        {content}
      </div>
    ) : (
      <form onSubmit={onSubmit} noValidate className={className}>
        {content}
      </form>
    );

  const sendLink = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Adresse e-mail invalide.");
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      setNotice("Si un compte existe pour cette adresse, un e-mail avec un lien (valable une heure) vient d’être envoyé. Pensez à regarder dans vos courriers indésirables.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const saveNewPassword = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (newPassword.length < 8) return setError("Le mot de passe doit compter au moins 8 caractères.");
    if (!resetToken) return;
    setBusy(true);
    try {
      await resetPassword(resetToken, newPassword);
      setNewPassword("");
      setNotice("Mot de passe modifié. Vous pouvez vous connecter.");
      setMode("login");
      setStage("auth");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Réinitialisation impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (stage === "forgot") {
    return wrap(
      <>
        <h3 className="text-lg font-semibold text-ink/90">Mot de passe oublié</h3>
        <p className="mt-1 text-sm leading-6 text-sage">Indiquez l’adresse de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe.</p>
        <label className="mt-5 block">
          <span className="mb-1.5 block text-xs font-semibold text-ink/70">E-mail</span>
          <input className="field" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm leading-5 text-emerald-800">{notice}</p>}
        {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
        <button type={nested ? "button" : "submit"} onClick={nested ? () => void sendLink() : undefined} disabled={busy} className="btn btn-primary mt-5 w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Envoyer le lien
        </button>
        <button type="button" onClick={() => { setStage("auth"); setMode("login"); setNotice(null); setError(null); }} className="mt-2 block w-full text-center text-sm font-medium text-sage transition hover:text-ink">
          Retour à la connexion
        </button>
      </>,
      sendLink,
    );
  }

  if (stage === "reset") {
    return wrap(
      <>
        <h3 className="text-lg font-semibold text-ink/90">Nouveau mot de passe</h3>
        <p className="mt-1 text-sm leading-6 text-sage">Choisissez un mot de passe d’au moins 8 caractères.</p>
        <label className="mt-5 block">
          <span className="mb-1.5 block text-xs font-semibold text-ink/70">Nouveau mot de passe</span>
          <input className="field" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
        </label>
        {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
        <button type={nested ? "button" : "submit"} onClick={nested ? () => void saveNewPassword() : undefined} disabled={busy} className="btn btn-primary mt-5 w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer le mot de passe
        </button>
      </>,
      saveNewPassword,
    );
  }

  if (pending) {
    return wrap(
      <>
        <h3 className="text-lg font-semibold text-ink/90">Complétez votre profil</h3>
        <p className="mt-1 text-sm leading-6 text-sage">Facultatif : votre nom et votre numéro Mobile Money, pour payer plus vite. Vous pourrez le faire plus tard.</p>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink/70">Nom et prénom</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink/70">Téléphone (Mobile Money)</span>
            <PhoneInput id="profile-phone" value={phone} onChange={setPhone} />
          </label>
        </div>
        {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
        <button type={nested ? "button" : "submit"} onClick={nested ? () => void saveProfile() : undefined} disabled={busy} className="btn btn-primary mt-5 w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer et continuer
        </button>
        <button type="button" onClick={() => onDone?.({ token: pending.token, role: pending.role })} className="mt-2 block w-full text-center text-sm font-medium text-sage transition hover:text-ink">
          Plus tard
        </button>
      </>,
      saveProfile,
    );
  }

  return wrap(
    <>
      <GoogleButton onDone={(info) => finish(info, info.user)} onError={setError} />
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
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${mode === id ? "bg-forest text-white" : "text-ink/70 hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm leading-5 text-emerald-800">{notice}</p>}

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4">
        {mode === "register" && (
          <>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink/70">Nom et prénom</span>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink/70">Téléphone <span className="font-normal text-sage">(Mobile Money)</span></span>
              <PhoneInput id="register-phone" value={phone} onChange={setPhone} />
            </label>
          </>
        )}
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink/70">E-mail</span>
          <input className="field" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink/70">
            Mot de passe {mode === "register" && <span className="font-normal text-sage">(8 caractères minimum)</span>}
          </span>
          <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} />
        </label>
        {mode === "login" && (
          <button type="button" onClick={() => { setStage("forgot"); setNotice(null); setError(null); }} className="-mt-1 justify-self-start text-sm font-medium text-forest underline-offset-4 hover:underline">
            Mot de passe oublié ?
          </button>
        )}
      </div>

      {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      <button type={nested ? "button" : "submit"} onClick={nested ? () => void submit() : undefined} disabled={busy} className="btn btn-primary mt-5 w-full">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "register" ? "Créer mon compte et continuer" : "Me connecter"}
      </button>
      {mode === "register" && (
        <p className="mt-3 text-center text-xs leading-5 text-sage">
          En créant un compte, vous acceptez les{" "}
          <Link href="/conditions" target="_blank" className="font-medium text-ink/80 underline-offset-2 hover:underline">conditions d’utilisation</Link> et la{" "}
          <Link href="/confidentialite" target="_blank" className="font-medium text-ink/80 underline-offset-2 hover:underline">politique de confidentialité</Link>.
        </p>
      )}
    </>,
    submit,
  );
}
