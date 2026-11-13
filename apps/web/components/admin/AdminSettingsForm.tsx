"use client";

import { API_URL } from "@/lib/api-url";
import { CONTACT } from "@/lib/contact";
import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  Lock,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useFile } from "../../app/context/FileContext";

interface SystemStatus {
  payment: {
    provider: string;
    configured: boolean;
    mode: "live" | "sandbox";
    webhookSecret: boolean;
    webhookPath: string;
    webhookUrl: string | null;
  };
  environment: string;
  node: string;
  uptimeSeconds: number;
}

function strength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return { score, label: ["Trop court", "Faible", "Correct", "Bon", "Excellent"][pw ? score : 0] };
}

function Card({ icon: Icon, title, text, children }: { icon: typeof Lock; title: string; text?: string; children: React.ReactNode }) {
  return (
    <section className="surface rounded-2xl p-5 sm:p-6">
      <h3 className="flex items-center gap-2 text-base font-semibold text-ink/90">
        <Icon className="h-4.5 w-4.5 text-forest" /> {title}
      </h3>
      {text && <p className="mt-1 text-sm text-sage">{text}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0">
      <span className="text-sage">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-ink/85">{children}</span>
    </div>
  );
}

function Pill({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleDashed className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

export default function AdminSettingsForm({ adminToken }: { adminToken: string }) {
  const { authUser, logoutSession } = useFile();
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/orders/admin/system/status`, { headers: { Authorization: `Bearer ${adminToken}` }, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: SystemStatus) => alive && setStatus(d))
      .catch(() => alive && setStatusError(true));
    return () => {
      alive = false;
    };
  }, [adminToken]);

  const pw = strength(newPassword);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (newPassword && newPassword.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (newPassword && newPassword !== confirmPassword) return setError("Les mots de passe ne correspondent pas.");
    if (!newEmail.trim() && !newPassword.trim()) return setError("Renseignez au moins un champ à modifier.");
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/auth/admin/credentials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ newEmail: newEmail.trim() || undefined, newPassword: newPassword.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Mise à jour impossible.");
      }
      setOk("Identifiants mis à jour.");
      setNewEmail("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setBusy(false);
    }
  };

  const hours = status ? Math.floor(status.uptimeSeconds / 3600) : 0;

  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <div className="space-y-5">
        <Card icon={UserRound} title="Mon profil">
          <Row label="E-mail de connexion">{authUser?.email ?? "—"}</Row>
          <Row label="Rôle"><Pill ok>Administrateur</Pill></Row>
          <button type="button" onClick={logoutSession} className="btn btn-outline btn-sm mt-5">
            <LogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </Card>

        <Card icon={Lock} title="Sécurité du compte" text="Changez votre adresse de connexion ou votre mot de passe.">
          <form onSubmit={submit} className="space-y-4">
            {ok && (
              <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {ok}
              </p>
            )}
            {error && (
              <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </p>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Nouvelle adresse e-mail</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-sage" />
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Laisser vide pour ne pas changer" className="field pl-9" autoComplete="email" />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Nouveau mot de passe</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-sage" />
                <input type={showPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="8 caractères minimum" className="field px-9" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Masquer" : "Afficher"} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-sage hover:text-ink">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
              {newPassword && (
                <span className="mt-2 flex items-center gap-2">
                  <span className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= pw.score ? (pw.score <= 1 ? "bg-red-500" : pw.score === 2 ? "bg-amber-500" : "bg-emerald-500") : "bg-line"}`} />
                    ))}
                  </span>
                  <span className="text-xs text-sage">{pw.label}</span>
                </span>
              )}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Confirmer le mot de passe</span>
              <input type={showPw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="field" autoComplete="new-password" aria-invalid={Boolean(confirmPassword) && confirmPassword !== newPassword} />
            </label>
            <button type="submit" disabled={busy || (!newEmail && !newPassword)} className="btn btn-primary w-full disabled:opacity-50">
              <Save className="h-4 w-4" /> {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>
        </Card>
      </div>

      <div className="space-y-5">
        <Card icon={CreditCard} title="Paiement en ligne" text="FeexPay encaisse le Mobile Money (MTN, Moov, Celtiis), puis active le QR code automatiquement.">
          {statusError ? (
            <p className="text-sm text-sage">État indisponible : l’API ne répond pas ou doit être redémarrée.</p>
          ) : !status ? (
            <p className="text-sm text-sage">Chargement…</p>
          ) : (
            <>
              <Row label="Clé API"><Pill ok={status.payment.configured}>{status.payment.configured ? "Configurée" : "Manquante"}</Pill></Row>
              <Row label="Mode"><Pill ok={status.payment.mode === "live"}>{status.payment.mode === "live" ? "Production" : "Test (sandbox)"}</Pill></Row>
              <Row label="Secret du webhook"><Pill ok={status.payment.webhookSecret}>{status.payment.webhookSecret ? "Active" : "Non définie"}</Pill></Row>
              <div className="mt-4 rounded-xl bg-cream-deep p-3">
                <p className="text-xs font-semibold text-ink/70">URL du webhook à déclarer chez FeexPay</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate text-xs text-ink/80">{status.payment.webhookUrl ?? `https://<votre-api>${status.payment.webhookPath}`}</code>
                  <button
                    type="button"
                    aria-label="Copier l’URL"
                    onClick={async () => {
                      await navigator.clipboard.writeText(status.payment.webhookUrl ?? status.payment.webhookPath);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1800);
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-sage hover:text-ink"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {!status.payment.configured && (
                <p className="mt-3 text-xs leading-5 text-amber-700">Sans clé, les clients règlent sur WhatsApp et vous confirmez l’encaissement dans « Commandes ».</p>
              )}
            </>
          )}
        </Card>

        <Card icon={Globe} title="Coordonnées du site" text="Affichées sur le site, les devis et les factures (modifiables dans lib/contact.ts).">
          <Row label="Marque">{CONTACT.brand}</Row>
          <Row label="WhatsApp">{CONTACT.whatsappDisplay}</Row>
          <Row label="Horaires">{CONTACT.hours}</Row>
          <Row label="Adresse">{CONTACT.address}</Row>
        </Card>

        <Card icon={ShieldCheck} title="Système">
          {status ? (
            <>
              <Row label="Environnement">{status.environment}</Row>
              <Row label="Node">{status.node}</Row>
              <Row label="API en marche depuis">{hours >= 1 ? `${hours} h` : `${Math.max(1, Math.round(status.uptimeSeconds / 60))} min`}</Row>
            </>
          ) : (
            <p className="text-sm text-sage">{statusError ? "Indisponible." : "Chargement…"}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
