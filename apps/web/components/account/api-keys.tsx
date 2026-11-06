"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, BookOpen, Check, Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { createKey, listKeys, revokeKey, type DevKeysResponse, type NewKey } from "@/lib/developers";

const fmt = (v: string | null) => (v ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v)) : "jamais");
const nf = new Intl.NumberFormat("fr-FR");

/** Gestion des clés d'API : création (clé montrée une seule fois), consommation du mois, révocation. */
export default function ApiKeys() {
  const router = useRouter();
  const { authToken } = useFile();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<DevKeysResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<NewKey | null>(null);
  const [copied, setCopied] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setReady(true), []);

  const load = useCallback(async () => {
    if (!authToken) return;
    try {
      setData(await listKeys(authToken));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }, [authToken]);

  useEffect(() => {
    if (!ready) return;
    if (!authToken) {
      router.replace("/connexion?next=%2Fcompte%2Fcles-api");
      return;
    }
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [ready, authToken, router, load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setBusy(true);
    setError(null);
    try {
      setFresh(await createKey(authToken, name));
      setName("");
      setCopied(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string, label: string) => {
    if (!authToken || !window.confirm(`Révoquer la clé « ${label} » ? Les applications qui l’utilisent cesseront de fonctionner.`)) return;
    setError(null);
    try {
      await revokeKey(authToken, id);
      if (fresh?.id === id) setFresh(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Révocation impossible.");
    }
  };

  const active = data?.keys.filter((k) => !k.revokedAt) ?? [];
  const revoked = data?.keys.filter((k) => k.revokedAt) ?? [];

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-sage">Espace développeur</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-ink">Clés d’API</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-sage">
            Générez des QR codes depuis vos applications. Chaque clé a son quota mensuel ; elle n’est affichée qu’une fois à sa création.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/developpeurs" className="btn btn-outline btn-sm"><BookOpen className="h-4 w-4" /> Documentation</Link>
          <Link href="/compte" className="btn btn-outline btn-sm">Mon espace</Link>
        </div>
      </div>

      {data && (
        <p className="mt-6 rounded-xl border border-line bg-white px-4 py-3 text-sm text-sage">
          {data.limits.unlimited
            ? "Compte administrateur : aucune limite de requêtes sur vos clés."
            : `Offre développeur : ${nf.format(data.limits.perMonth ?? 0)} requêtes par mois et ${data.limits.perMinute} par minute pour chaque clé, ${data.limits.maxKeys} clés actives maximum.`}
        </p>
      )}

      {fresh && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5" role="status">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><Check className="h-4 w-4" /> Clé « {fresh.name} » créée : copiez-la maintenant, elle ne sera plus affichée.</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-white px-3 py-2.5 text-sm text-ink ring-1 ring-emerald-200">{fresh.key}</code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(fresh.key);
                setCopied(true);
              }}
              className="btn btn-outline btn-sm shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied ? "Copiée" : "Copier"}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={create} className="surface mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5">
        <label className="block flex-1">
          <span className="mb-1.5 block text-sm font-medium text-ink/80">Nom de la clé</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mon application" maxLength={60} required minLength={2} />
        </label>
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Créer une clé
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 text-sm font-medium text-red-600"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}</p>
      )}

      <div className="mt-8">
        {!data && !error ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-forest" /></div>
        ) : active.length === 0 ? (
          <div className="surface px-6 py-12 text-center">
            <KeyRound className="mx-auto h-8 w-8 text-line" />
            <p className="mt-3 text-sm text-sage">Aucune clé active. Créez-en une pour commencer.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {active.map((k) => {
              const pct = k.perMonth ? Math.min(100, Math.round((k.usedThisMonth / k.perMonth) * 100)) : 0;
              return (
                <li key={k.id} className="surface p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{k.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-sage">{k.prefix}…</p>
                    </div>
                    <button type="button" aria-label={`Révoquer ${k.name}`} onClick={() => revoke(k.id, k.name)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-sage transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between text-xs text-sage">
                      <span>{nf.format(k.usedThisMonth)} requête{k.usedThisMonth > 1 ? "s" : ""} ce mois-ci</span>
                      <span>{k.perMonth ? `sur ${nf.format(k.perMonth)}` : "illimité"}</span>
                    </div>
                    {k.perMonth ? (
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                        <div className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-forest"}`} style={{ width: `${pct}%` }} />
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-3 text-xs text-sage">Créée le {fmt(k.createdAt)} · dernière utilisation : {fmt(k.lastUsedAt)}</p>
                </li>
              );
            })}
          </ul>
        )}
        {revoked.length > 0 && (
          <details className="mt-6 text-sm text-sage">
            <summary className="cursor-pointer font-medium">{revoked.length} clé{revoked.length > 1 ? "s" : ""} révoquée{revoked.length > 1 ? "s" : ""}</summary>
            <ul className="mt-2 space-y-1">
              {revoked.map((k) => <li key={k.id}>{k.name} · {k.prefix}… · révoquée le {fmt(k.revokedAt)}</li>)}
            </ul>
          </details>
        )}
      </div>
    </section>
  );
}
