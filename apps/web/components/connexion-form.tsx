"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  Images,
  Loader2,
  Lock,
  Mail,
  PanelsTopLeft,
} from "lucide-react";
import Logo, { LogoMark } from "@/components/logo";
import { useFile } from "@/app/context/FileContext";

const perks = [
  { icon: PanelsTopLeft, label: "Créer des QR codes pour vos clients, sans paiement" },
  { icon: Images, label: "Suivre les commandes, devis et factures" },
  { icon: FileText, label: "Gérer les comptes administrateurs" },
];

export default function ConnexionForm({ next }: { next: string }) {
  const router = useRouter();
  const { loginSession, authToken, authRole, isAuthLoading } = useFile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const target = next.startsWith("/admin") ? next : "/admin";

  useEffect(() => {
    if (isAuthLoading || !authToken || authRole !== "admin") return;
    router.replace(target);
  }, [authToken, authRole, isAuthLoading, router, target]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    setIsLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";

    try {
      const endpoint = "/auth/login";
      const payload = { identifier: email.trim(), password };

      const res = await fetch(`${apiUrl}${endpoint}`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "Connexion impossible. Vérifiez vos identifiants.",
        );
      }

      const role: "admin" | "user" = data.user?.role === "admin" ? "admin" : "user";
      loginSession(
        data.access_token,
        role,
        { id: data.user?.id, email: data.user?.email },
        data.refresh_token,
      );

      if (role !== "admin") {
        throw new Error("Accès réservé à l’administration. Les clients n’ont pas besoin de compte : créez votre QR code directement.");
      }
      router.replace("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen text-ink lg:grid-cols-[0.92fr_1.08fr]">
      {/* Panneau noir — la promesse et le parcours */}
      <aside className="brand-surface relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full border border-white/10"
          aria-hidden="true"
        />

        <div className="relative">
          <Link href="/" aria-label="Moncode — accueil" className="inline-flex">
            <Logo variant="light" />
          </Link>

          <p className="mt-16 text-[12.5px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Administration Moncode
          </p>
          <h1 className="mt-4 max-w-sm text-4xl font-semibold leading-[1.1] tracking-[-0.02em]">
            Toute l’activité, au même endroit.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
            Cet espace est réservé à l’équipe. Les clients créent et paient leur QR code sans compte.
          </p>

          <ul className="mt-10 space-y-4 border-t border-white/12 pt-8">
            {perks.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3 text-sm leading-6 text-white/75">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/[0.06]">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-12 flex items-center gap-3 border-t border-white/12 pt-6">
          <LogoMark variant="light" className="h-9 w-9" />
          <p className="text-xs leading-5 text-white/55">
            Un QR code imprimé reste valable même après modification du contenu.
          </p>
        </div>
      </aside>

      {/* Panneau formulaire */}
      <section className="relative flex min-h-screen flex-col">

        <header className="relative flex items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:justify-end">
          <Link href="/" className="lg:hidden" aria-label="Moncode — accueil">
            <Logo variant="dark" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sage transition-colors hover:text-ink"
          >
            Retour au site
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="relative flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <div className="glass w-full max-w-[480px] p-6 sm:p-9">
            <p className="eyebrow">Espace administrateur</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink/90 sm:text-4xl">
              Connexion
            </h2>
            <p className="mt-3 text-sm leading-6 text-sage">
              Vous êtes client ?{" "}
              <Link href="/creer" className="font-semibold text-forest hover:text-forest-dark">
                Créez votre QR code sans compte
              </Link>
              .
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Field
                id="email"
                label="Adresse e-mail"
                type="email"
                icon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={setEmail}
                placeholder="vous@exemple.com"
                autoComplete="email"
                onClearError={() => setError(null)}
              />

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                  Mot de passe
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sage">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Votre mot de passe"
                    autoComplete="current-password"
                    className="field pl-10 pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sage transition-colors hover:text-ink"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-700"
                >
                  {error}
                </p>
              )}

              <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  id,
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  onClearError,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  onClearError: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sage">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            onClearError();
          }}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="field pl-10"
          required
        />
      </div>
    </div>
  );
}
