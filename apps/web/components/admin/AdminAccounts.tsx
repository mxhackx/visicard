"use client";

import { API_URL } from "@/lib/api-url";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
  UserRound,
  Users,
} from "lucide-react";
import { useFile } from "../../app/context/FileContext";

interface Account {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "user";
  cardsCount: number;
  ordersCount: number;
  paidOrdersCount: number;
  totalPaid: number;
  lastOrderAt: string | null;
  createdAt: string;
  suspect: boolean;
  suspectReasons: string[];
}

type Filter = "all" | "admin" | "user" | "suspect";

const fmtDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
const fmtFcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)} FCFA`;

export default function AdminAccounts({ adminToken }: { adminToken: string }) {
  const { refreshAccessToken } = useFile();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", password: "", role: "admin" as "admin" | "user" });

  const apiUrl = API_URL;

  const request = useCallback(
    async (path: string, init?: RequestInit, token = adminToken): Promise<Response> => {
      let res = await fetch(`${apiUrl}${path}`, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          res = await fetch(`${apiUrl}${path}`, {
            ...init,
            headers: {
              ...(init?.headers ?? {}),
              Authorization: `Bearer ${refreshed}`,
            },
          });
        }
      }

      return res;
    },
    [adminToken, apiUrl, refreshAccessToken],
  );

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await request("/auth/accounts");
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "Impossible de charger les comptes.",
        );
      }

      setAccounts(Array.isArray(data) ? (data as Account[]) : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de charger les comptes.");
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  useEffect(() => {
    // Chargement différé d'un tour : l'état n'est jamais modifié pendant l'effet lui-même.
    const id = window.setTimeout(() => void loadAccounts(), 0);
    return () => window.clearTimeout(id);
  }, [loadAccounts]);

  const changeRole = async (account: Account, role: "admin" | "user") => {
    if (role === "user") {
      const confirmed = window.confirm(
        `Retirer le rôle administrateur à ${account.email} ? Cette personne gardera son compte client.`,
      );
      if (!confirmed) return;
    }

    setUpdatingId(account.id);
    setError(null);
    setSuccess(null);

    try {
      const res = await request(`/auth/accounts/${account.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "Modification du rôle impossible.",
        );
      }

      setAccounts((current) =>
        current.map((item) =>
          item.id === account.id ? { ...item, role: data.role ?? role } : item,
        ),
      );
      setSuccess(
        role === "admin"
          ? `${account.email} est maintenant administrateur.`
          : `${account.email} est redevenu un compte client.`,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Modification du rôle impossible.");
    } finally {
      setUpdatingId(null);
    }
  };

  const failure = async (res: Response, fallback: string) => {
    const data = await res.json().catch(() => ({}));
    return typeof data?.message === "string" ? data.message : fallback;
  };

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await request("/auth/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error(await failure(res, "Création du compte impossible."));
      setSuccess(`Compte ${draft.role === "admin" ? "administrateur" : "client"} créé pour ${draft.email}.`);
      setDraft({ name: "", email: "", password: "", role: draft.role });
      setShowCreate(false);
      await loadAccounts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Création du compte impossible.");
    } finally {
      setCreating(false);
    }
  };

  const removeAccounts = async (targets: Account[], label: string) => {
    if (targets.length === 0) return;
    if (!window.confirm(`${label}\n\nCette action est définitive.`)) return;
    setError(null);
    setSuccess(null);
    let removed = 0;
    let lastError: string | null = null;
    for (const account of targets) {
      setUpdatingId(account.id);
      try {
        const res = await request(`/auth/accounts/${account.id}`, { method: "DELETE" });
        if (res.ok) removed += 1;
        else lastError = await failure(res, "Suppression impossible.");
      } catch {
        lastError = "Suppression impossible.";
      }
    }
    setUpdatingId(null);
    if (removed > 0) setSuccess(removed === 1 ? "Compte supprimé." : `${removed} comptes supprimés.`);
    if (lastError) setError(lastError);
    await loadAccounts();
  };

  const admins = accounts.filter((account) => account.role === "admin").length;
  const clients = accounts.length - admins;
  const suspects = useMemo(() => accounts.filter((a) => a.suspect), [accounts]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((a) => {
      if (filter === "admin" && a.role !== "admin") return false;
      if (filter === "user" && a.role !== "user") return false;
      if (filter === "suspect" && !a.suspect) return false;
      return !q || a.email.toLowerCase().includes(q) || (a.name ?? "").toLowerCase().includes(q);
    });
  }, [accounts, filter, query]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-ink/90">
            <Users className="h-5 w-5 text-forest" />
            Utilisateurs
          </h2>
          <p className="mt-1 max-w-xl text-sm text-sage">
            Tous les comptes créés depuis le site : créez un administrateur, suivez l’activité de
            chaque client et supprimez les faux comptes.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-forest px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-forest-dark"
        >
          {showCreate ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {showCreate ? "Fermer" : "Créer un compte"}
        </button>
        <button
          type="button"
          onClick={loadAccounts}
          disabled={isLoading}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink/80 transition-colors hover:bg-cream-deep disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Comptes" value={accounts.length} icon={Users} />
        <Stat label="Administrateurs" value={admins} icon={ShieldCheck} />
        <Stat label="Clients" value={clients} icon={UserRound} />
        <Stat label="Suspects" value={suspects.length} icon={AlertCircle} />
      </div>

      {showCreate && (
        <form onSubmit={createAccount} className="surface mb-6 rounded-2xl p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink/90">Nouveau compte</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className="field" placeholder="Nom (facultatif)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoComplete="off" />
            <input className="field" type="email" required placeholder="Adresse e-mail" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} autoComplete="off" />
            <input className="field" type="password" required minLength={8} placeholder="Mot de passe (8 caractères minimum)" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} autoComplete="new-password" />
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Rôle">
              {(["admin", "user"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={draft.role === r}
                  onClick={() => setDraft({ ...draft, role: r })}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${draft.role === r ? "border-forest bg-forest/5 text-forest ring-2 ring-forest/20" : "border-line bg-white text-ink/75 hover:border-ink/30"}`}
                >
                  {r === "admin" ? "Administrateur" : "Client"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-sage">Communiquez le mot de passe de façon sûre : la personne pourra le changer ensuite.</p>
            <button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-dark disabled:opacity-60">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Créer le compte
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
          <input className="field pl-9" placeholder="Rechercher un nom ou un e-mail" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {([["all", "Tous"], ["admin", "Admins"], ["user", "Clients"], ["suspect", "Suspects"]] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setFilter(id)} className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition ${filter === id ? "border-forest bg-forest text-white" : "border-line bg-white text-ink/75 hover:border-ink/30"}`}>
              {label}{id === "suspect" && suspects.length > 0 ? ` (${suspects.length})` : ""}
            </button>
          ))}
          {suspects.length > 0 && (
            <button
              type="button"
              onClick={() => removeAccounts(suspects, `Supprimer les ${suspects.length} comptes suspects (adresses jetables ou sans activité) ?`)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" /> Retirer les faux comptes
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="overflow-hidden surface rounded-2xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-5 w-5 animate-spin text-forest" />
            <p className="text-sm text-sage">Chargement des comptes…</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto h-8 w-8 text-line" />
            <p className="mt-3 text-sm text-sage">Aucun compte pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-cream-deep/70 text-xs uppercase tracking-[0.08em] text-sage">
                <tr>
                  <th className="h-12 px-4 font-medium">Compte</th>
                  <th className="h-12 px-4 font-medium">Rôle</th>
                  <th className="h-12 px-4 font-medium">Activité</th>
                  <th className="h-12 px-4 font-medium">Inscription</th>
                  <th className="h-12 px-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (<tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-sage">Aucun compte ne correspond.</td></tr>)}
                {visible.map((account) => {
                  const isAdmin = account.role === "admin";
                  const isUpdating = updatingId === account.id;

                  return (
                    <tr key={account.id} className="border-b border-line last:border-0 hover:bg-cream-deep/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                              isAdmin
                                ? "bg-leaf text-ambre-deep"
                                : "bg-cream-deep text-ink/70"
                            }`}
                          >
                            {(account.name || account.email).slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink/90">
                              {account.name || "Sans nom"}
                            </p>
                            <p className="truncate text-xs text-sage">{account.email}</p>
                            {account.suspect && (
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-red-600" title={account.suspectReasons.join(" · ")}>
                                <AlertCircle className="h-3 w-3" /> Suspect · {account.suspectReasons[0]}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isAdmin
                              ? "bg-leaf text-ambre-deep"
                              : "bg-cream-deep text-ink/70"
                          }`}
                        >
                          {isAdmin ? (
                            <Crown className="h-3.5 w-3.5" />
                          ) : (
                            <UserRound className="h-3.5 w-3.5" />
                          )}
                          {isAdmin ? "Admin" : "Client"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs leading-5 text-ink/70">
                        <p>{account.cardsCount} QR · {account.ordersCount} commande{account.ordersCount > 1 ? "s" : ""}</p>
                        <p className="text-sage">{account.paidOrdersCount > 0 ? `${fmtFcfa(account.totalPaid)} payés` : "Rien de payé"} · dernière : {fmtDate(account.lastOrderAt)}</p>
                      </td>
                      <td className="px-4 py-3 text-ink/70">
                        {fmtDate(account.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => changeRole(account, isAdmin ? "user" : "admin")}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                            isAdmin
                              ? "border border-line bg-white text-ink/80 hover:bg-cream-deep"
                              : "bg-forest text-white hover:bg-forest-dark"
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isAdmin ? (
                            <UserRound className="h-3.5 w-3.5" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          )}
                          {isAdmin ? "Retirer admin" : "Nommer admin"}
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          aria-label={`Supprimer ${account.email}`}
                          onClick={() => removeAccounts([account], `Supprimer le compte ${account.email} ?`)}
                          className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-sage transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-sage">
        Le dernier administrateur, votre propre compte et les comptes ayant des commandes payées ne peuvent pas être supprimés. Sont « suspects » : les adresses jetables et les comptes sans aucune activité depuis plus de 7 jours.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="surface rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-sage">{label}</p>
        <Icon className="h-4 w-4 text-sage" />
      </div>
      <p className="mt-2 text-2xl font-bold text-ink/90">{value}</p>
    </div>
  );
}
