"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  Loader2,
  RefreshCw,
  ShieldCheck,
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
  createdAt: string;
}

export default function AdminAccounts({ adminToken }: { adminToken: string }) {
  const { refreshAccessToken } = useFile();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";

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
    loadAccounts();
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

  const admins = accounts.filter((account) => account.role === "admin").length;
  const clients = accounts.length - admins;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-ink/90">
            <Users className="h-5 w-5 text-forest" />
            Utilisateurs
          </h2>
          <p className="mt-1 max-w-xl text-sm text-sage">
            Tous les comptes créés depuis le site. Nommez un client administrateur pour lui donner
            accès à ce tableau de bord, ou retirez ce rôle à tout moment.
          </p>
        </div>

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

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Comptes" value={accounts.length} icon={Users} />
        <Stat label="Administrateurs" value={admins} icon={ShieldCheck} />
        <Stat label="Clients" value={clients} icon={UserRound} />
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
                  <th className="h-12 px-4 font-medium">QR codes</th>
                  <th className="h-12 px-4 font-medium">Inscription</th>
                  <th className="h-12 px-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => {
                  const isAdmin = account.role === "admin";
                  const isUpdating = updatingId === account.id;

                  return (
                    <tr key={account.id} className="border-b border-line last:border-0 hover:bg-cream-deep/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                              isAdmin
                                ? "bg-leaf text-forest"
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
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isAdmin
                              ? "bg-leaf text-forest"
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
                      <td className="px-4 py-3 text-ink/70">{account.cardsCount}</td>
                      <td className="px-4 py-3 text-ink/70">
                        {new Intl.DateTimeFormat("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(account.createdAt))}
                      </td>
                      <td className="px-4 py-3 text-right">
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
        Le dernier administrateur ne peut pas être retiré : nommez d’abord une autre personne.
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
