"use client";

import { API_URL } from "@/lib/api-url";
import { CONTACT } from "@/lib/contact";
import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CircleDashed,
  Clock,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { useFile } from "../../app/context/FileContext";

interface SecurityInfo {
  email: string;
  twoFactorEmail: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  passwordChangedAt: string | null;
}

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

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }) : "—");

/** Règles du mot de passe administrateur : les mêmes qu'à l'API (12 caractères, une lettre et un chiffre, pas l'adresse e-mail). */
function rulesFor(pw: string, email: string) {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  return [
    { ok: pw.length >= 12, label: "12 caractères au moins" },
    { ok: /[A-Za-z]/.test(pw) && /\d/.test(pw), label: "Une lettre et un chiffre" },
    { ok: pw.length > 0 && !(local.length >= 4 && pw.toLowerCase().includes(local)), label: "Sans votre adresse e-mail" },
  ];
}

function strength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return { score, label: ["Trop court", "Faible", "Correct", "Bon", "Excellent"][pw ? score : 0] };
}

function Card({ icon: Icon, title, text, aside, children }: { icon: typeof Lock; title: string; text?: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="surface rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="icon-tile h-10 w-10 shrink-0"><Icon className="h-[18px] w-[18px]" /></span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-ink/90">{title}</h3>
            {text && <p className="mt-0.5 text-sm leading-5 text-sage">{text}</p>}
          </div>
        </div>
        {aside}
      </div>
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

function Notice({ kind, children }: { kind: "ok" | "error"; children: React.ReactNode }) {
  return kind === "ok" ? (
    <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {children}</p>
  ) : (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {children}</p>
  );
}

function PasswordInput({ label, value, onChange, show, onToggle, autoComplete, placeholder }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; autoComplete: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink/80">{label}</span>
      <span className="relative block">
        <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-sage" />
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field px-9" autoComplete={autoComplete} />
        <button type="button" onClick={onToggle} aria-label={show ? "Masquer" : "Afficher"} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-sage hover:text-ink">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

export default function AdminSettingsForm({ adminToken }: { adminToken: string }) {
  const { authUser, loginSession, logoutSession } = useFile();
  const email = authUser?.email ?? "";
  const authed = { Authorization: `Bearer ${adminToken}` };
  const jsonHeaders = { ...authed, "Content-Type": "application/json" };

  // --- état général ---
  const [info, setInfo] = useState<SecurityInfo | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadSecurity = () =>
    fetch(`${API_URL}/auth/security`, { headers: authed, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: SecurityInfo) => setInfo(d))
      .catch(() => undefined);

  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/orders/admin/system/status`, { headers: authed, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: SystemStatus) => alive && setStatus(d))
      .catch(() => alive && setStatusError(true));
    fetch(`${API_URL}/auth/security`, { headers: authed, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: SecurityInfo) => alive && setInfo(d))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const call = async (path: string, method: string, body?: unknown) => {
    const res = await fetch(`${API_URL}${path}`, { method, headers: jsonHeaders, credentials: "include", body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(res.status === 429 ? "Trop de tentatives : patientez une minute." : typeof data?.message === "string" ? data.message : "Opération impossible.");
    return data;
  };

  // --- mot de passe ---
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const rules = rulesFor(newPw, email);
  const pwStrength = strength(newPw);
  const pwReady = Boolean(curPw) && rules.every((r) => r.ok) && newPw === confPw;

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    setPwBusy(true);
    try {
      const data = await call("/auth/admin/credentials", "PUT", { currentPassword: curPw, newPassword: newPw });
      // Les autres sessions sont fermées : celle-ci reçoit de nouveaux jetons.
      if (data.access_token) loginSession(data.access_token, "admin", { id: authUser?.id, email }, data.refresh_token);
      setPwMsg({ kind: "ok", text: "Mot de passe modifié. Un e-mail de confirmation vient de vous être envoyé et vos autres sessions ont été fermées." });
      setCurPw("");
      setNewPw("");
      setConfPw("");
      void loadSecurity();
    } catch (err) {
      setPwMsg({ kind: "error", text: err instanceof Error ? err.message : "Erreur inconnue." });
    } finally {
      setPwBusy(false);
    }
  };

  // --- adresse e-mail ---
  const [newEmail, setNewEmail] = useState("");
  const [emailPw, setEmailPw] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const changeEmail = async (e: FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    setEmailBusy(true);
    try {
      const data = await call("/auth/admin/credentials", "PUT", { currentPassword: emailPw, newEmail: newEmail.trim() });
      if (data.access_token) loginSession(data.access_token, "admin", { id: authUser?.id, email: newEmail.trim().toLowerCase() }, data.refresh_token);
      setEmailMsg({ kind: "ok", text: "Adresse modifiée. L'ancienne et la nouvelle adresse ont reçu un e-mail d'information." });
      setNewEmail("");
      setEmailPw("");
      void loadSecurity();
    } catch (err) {
      setEmailMsg({ kind: "error", text: err instanceof Error ? err.message : "Erreur inconnue." });
    } finally {
      setEmailBusy(false);
    }
  };

  // --- vérification en deux étapes ---
  const [tfStage, setTfStage] = useState<"idle" | "code" | "disable">("idle");
  const [tfCode, setTfCode] = useState("");
  const [tfPw, setTfPw] = useState("");
  const [tfBusy, setTfBusy] = useState(false);
  const [tfMsg, setTfMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const startEnable = async () => {
    setTfMsg(null);
    setTfBusy(true);
    try {
      const r = await call("/auth/2fa/request", "POST");
      setTfStage("code");
      setTfMsg({ kind: "ok", text: `Code envoyé à ${r.sentTo}. Saisissez-le pour activer la protection.` });
    } catch (err) {
      setTfMsg({ kind: "error", text: err instanceof Error ? err.message : "Envoi impossible." });
    } finally {
      setTfBusy(false);
    }
  };
  const confirmTf = async (enabled: boolean) => {
    setTfMsg(null);
    setTfBusy(true);
    try {
      await call("/auth/2fa", "POST", enabled ? { enabled: true, code: tfCode } : { enabled: false, currentPassword: tfPw });
      setTfStage("idle");
      setTfCode("");
      setTfPw("");
      setTfMsg({ kind: "ok", text: enabled ? "Vérification en deux étapes activée." : "Vérification en deux étapes désactivée." });
      void loadSecurity();
    } catch (err) {
      setTfMsg({ kind: "error", text: err instanceof Error ? err.message : "Opération impossible." });
    } finally {
      setTfBusy(false);
    }
  };

  // --- sessions ---
  const [outBusy, setOutBusy] = useState(false);
  const [outConfirm, setOutConfirm] = useState(false);
  const logoutAll = async () => {
    setOutBusy(true);
    try {
      await call("/auth/logout-all", "POST");
    } catch {
      /* la session locale est fermée dans tous les cas */
    }
    logoutSession();
  };

  const hours = status ? Math.floor(status.uptimeSeconds / 3600) : 0;

  return (
    <div className="space-y-6">
      {/* En-tête : qui est connecté et l'état de sa protection. */}
      <section className="surface flex flex-wrap items-center gap-5 rounded-2xl p-5 sm:p-6">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-forest text-2xl font-semibold text-white ring-4 ring-white">{(email[0] ?? "A").toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-ink">{email || "Administrateur"}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Pill ok>Administrateur</Pill>
            <Pill ok={Boolean(info?.twoFactorEmail)}>{info?.twoFactorEmail ? "Double vérification active" : "Double vérification inactive"}</Pill>
          </div>
        </div>
        <button type="button" onClick={logoutSession} className="btn btn-outline btn-sm"><LogOut className="h-4 w-4" /> Se déconnecter</button>
      </section>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <Card icon={KeyRound} title="Mot de passe" text="Votre mot de passe actuel est demandé. Un e-mail confirme le changement et les autres sessions sont fermées.">
            <form onSubmit={changePassword} className="space-y-4">
              {pwMsg && <Notice kind={pwMsg.kind}>{pwMsg.text}</Notice>}
              <PasswordInput label="Mot de passe actuel" value={curPw} onChange={setCurPw} show={showPw} onToggle={() => setShowPw((v) => !v)} autoComplete="current-password" />
              <div>
                <PasswordInput label="Nouveau mot de passe" value={newPw} onChange={setNewPw} show={showPw} onToggle={() => setShowPw((v) => !v)} autoComplete="new-password" placeholder="12 caractères minimum" />
                {newPw && (
                  <span className="mt-2 flex items-center gap-2">
                    <span className="flex flex-1 gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= pwStrength.score ? (pwStrength.score <= 1 ? "bg-red-500" : pwStrength.score === 2 ? "bg-amber-500" : "bg-emerald-500") : "bg-line"}`} />
                      ))}
                    </span>
                    <span className="text-xs text-sage">{pwStrength.label}</span>
                  </span>
                )}
                <ul className="mt-3 space-y-1.5 text-[13px]">
                  {rules.map((r) => (
                    <li key={r.label} className={`flex items-center gap-2 ${r.ok ? "text-emerald-700" : "text-sage"}`}>
                      {r.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-50" />} {r.label}
                    </li>
                  ))}
                </ul>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink/80">Confirmer le nouveau mot de passe</span>
                <input type={showPw ? "text" : "password"} value={confPw} onChange={(e) => setConfPw(e.target.value)} className="field" autoComplete="new-password" aria-invalid={Boolean(confPw) && confPw !== newPw} />
                {confPw && confPw !== newPw && <span className="mt-1 block text-xs font-medium text-red-600">Les mots de passe ne correspondent pas.</span>}
              </label>
              <button type="submit" disabled={pwBusy || !pwReady} className="btn btn-primary w-full disabled:opacity-50">
                {pwBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Changer le mot de passe
              </button>
            </form>
          </Card>

          <Card icon={Mail} title="Adresse e-mail de connexion" text="Elle reçoit les codes, les alertes de sécurité et les liens de réinitialisation.">
            <form onSubmit={changeEmail} className="space-y-4">
              {emailMsg && <Notice kind={emailMsg.kind}>{emailMsg.text}</Notice>}
              <Row label="Adresse actuelle">{email || "—"}</Row>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink/80">Nouvelle adresse</span>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="field" autoComplete="email" placeholder="nouvelle@adresse.com" />
              </label>
              <PasswordInput label="Mot de passe actuel" value={emailPw} onChange={setEmailPw} show={showPw} onToggle={() => setShowPw((v) => !v)} autoComplete="current-password" />
              <button type="submit" disabled={emailBusy || !newEmail.trim() || !emailPw} className="btn btn-outline w-full disabled:opacity-50">
                {emailBusy && <Loader2 className="h-4 w-4 animate-spin" />} Changer l’adresse
              </button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            icon={Smartphone}
            title="Vérification en deux étapes"
            text="À chaque connexion, un code à 6 chiffres est envoyé par e-mail : un mot de passe volé ne suffit plus."
            aside={<Pill ok={Boolean(info?.twoFactorEmail)}>{info?.twoFactorEmail ? "Activée" : "Inactive"}</Pill>}
          >
            <div className="space-y-4">
              {tfMsg && <Notice kind={tfMsg.kind}>{tfMsg.text}</Notice>}
              {!info?.twoFactorEmail && tfStage === "idle" && (
                <>
                  <p className="text-sm leading-6 text-sage">Pour l’activer, nous envoyons d’abord un code de test à <strong className="text-ink">{email}</strong> : cela prouve que vos e-mails arrivent bien, et évite de vous enfermer dehors.</p>
                  <button type="button" onClick={startEnable} disabled={tfBusy} className="btn btn-primary w-full">
                    {tfBusy && <Loader2 className="h-4 w-4 animate-spin" />} Activer la protection
                  </button>
                </>
              )}
              {tfStage === "code" && (
                <div className="space-y-3">
                  <input value={tfCode} onChange={(e) => setTfCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" aria-label="Code reçu par e-mail" className="field text-center font-mono text-2xl font-bold tracking-[0.5em]" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => confirmTf(true)} disabled={tfBusy || tfCode.length !== 6} className="btn btn-primary flex-1 disabled:opacity-50">
                      {tfBusy && <Loader2 className="h-4 w-4 animate-spin" />} Confirmer
                    </button>
                    <button type="button" onClick={() => { setTfStage("idle"); setTfMsg(null); }} className="btn btn-outline">Annuler</button>
                  </div>
                </div>
              )}
              {info?.twoFactorEmail && tfStage === "idle" && (
                <button type="button" onClick={() => { setTfStage("disable"); setTfMsg(null); }} className="btn btn-outline w-full">Désactiver…</button>
              )}
              {tfStage === "disable" && (
                <div className="space-y-3">
                  <PasswordInput label="Mot de passe actuel" value={tfPw} onChange={setTfPw} show={showPw} onToggle={() => setShowPw((v) => !v)} autoComplete="current-password" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => confirmTf(false)} disabled={tfBusy || !tfPw} className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
                      {tfBusy ? "…" : "Désactiver la protection"}
                    </button>
                    <button type="button" onClick={() => { setTfStage("idle"); setTfPw(""); }} className="btn btn-outline">Annuler</button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card icon={MonitorSmartphone} title="Connexions et sessions" text="Une alerte e-mail part si une connexion admin vient d'une nouvelle adresse, ou après 5 échecs (compte bloqué 15 minutes).">
            <Row label="Dernière connexion">{when(info?.lastLoginAt ?? null)}</Row>
            <Row label="Depuis l’adresse">{info?.lastLoginIp ?? "—"}</Row>
            <Row label="Mot de passe modifié le">{info?.passwordChangedAt ? when(info.passwordChangedAt) : "Jamais depuis la création"}</Row>
            {!outConfirm ? (
              <button type="button" onClick={() => setOutConfirm(true)} className="btn btn-outline btn-sm mt-5"><LogOut className="h-4 w-4" /> Se déconnecter partout</button>
            ) : (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3.5">
                <p className="text-sm leading-5 text-red-800">Toutes vos sessions seront fermées, y compris celle-ci. Vous devrez vous reconnecter.</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={logoutAll} disabled={outBusy} className="rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-700">{outBusy ? "…" : "Confirmer"}</button>
                  <button type="button" onClick={() => setOutConfirm(false)} className="btn btn-outline btn-sm">Annuler</button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <h3 className="pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-sage">Site et système</h3>
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <Card icon={CreditCard} title="Paiement en ligne" text="FeexPay encaisse le Mobile Money et active le QR code.">
          {statusError ? (
            <p className="text-sm text-sage">État indisponible : l’API ne répond pas ou doit être redémarrée.</p>
          ) : !status ? (
            <p className="text-sm text-sage">Chargement…</p>
          ) : (
            <>
              <Row label="Clé API"><Pill ok={status.payment.configured}>{status.payment.configured ? "Configurée" : "Manquante"}</Pill></Row>
              <Row label="Mode"><Pill ok={status.payment.mode === "live"}>{status.payment.mode === "live" ? "Production" : "Test"}</Pill></Row>
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
            </>
          )}
        </Card>

        <Card icon={Globe} title="Coordonnées du site" text="Affichées sur le site et les factures.">
          <Row label="Marque">{CONTACT.brand}</Row>
          <Row label="WhatsApp">{CONTACT.whatsappDisplay}</Row>
          <Row label="E-mail">{CONTACT.email}</Row>
          <Row label="Horaires">{CONTACT.hours}</Row>
          <Row label="Adresse">{CONTACT.address}</Row>
        </Card>

        <Card icon={Clock} title="Système">
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
