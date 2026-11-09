/**
 * Compte client : inscription, connexion, liste des commandes.
 * La session (jeton) est gardée par FileContext ; ici seulement les appels API.
 */
import { API_URL } from "./api-url";
import type { OrderStatus } from "./orders";

export interface SessionResult {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string; name?: string | null; picture?: string | null; role: "admin" | "user" };
}

export interface AccountOrder {
  reference: string;
  slug: string | null;
  serviceType: "page" | "media" | "document" | "direct";
  serviceLabel: string;
  status: OrderStatus;
  amount: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  title: string;
  cardStatus: "draft" | "active" | "rejected" | null;
  /** Ouvertures de la page publique ; `null` pour un QR direct (il ne passe pas par Moncode). */
  scans: { total: number; last7: number } | null;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { credentials: "include", ...init });
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion, puis réessayez.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    if (res.status === 429) throw new Error("Trop de tentatives : patientez une minute avant de réessayer.");
    throw new Error(typeof message === "string" ? message : "Une erreur est survenue. Réessayez.");
  }
  return data as T;
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const registerAccount = (name: string, email: string, password: string) =>
  call<SessionResult>("/auth/register", json({ name, email, password }));

export const loginAccount = (email: string, password: string) =>
  call<SessionResult>("/auth/login", json({ email, password }));

export const loginWithGoogle = (credential: string) =>
  call<SessionResult>("/auth/google", json({ credential }));

export const fetchMyOrders = (token: string) =>
  call<AccountOrder[]>("/orders/mine", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });

/** Redirection interne sûre : jamais vers un autre site. */
export function safeNext(next: string | undefined | null, fallback = "/compte"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
