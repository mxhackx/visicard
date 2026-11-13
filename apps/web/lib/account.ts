/**
 * Compte client : inscription, connexion, liste des commandes.
 * La session (jeton) est gardée par FileContext ; ici seulement les appels API.
 */
import { API_URL } from "./api-url";
import type { OrderStatus } from "./orders";

export interface SessionResult {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string; name?: string | null; picture?: string | null; phone?: string | null; role: "admin" | "user" };
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
  /** QR code créé sans commande (lien gratuit) : pas de page de commande, téléchargement direct. */
  free?: boolean;
  invoiceNumber?: string | null;
  payload?: string | null;
  qrStyle?: string | null;
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

export const registerAccount = (name: string, email: string, password: string, phone: string) =>
  call<SessionResult>("/auth/register", json({ name, email, password, phone }));

/** Mot de passe oublié : envoie un lien par e-mail (la réponse ne dit pas si l'adresse existe). */
export const forgotPassword = (email: string) => call<{ sent: true }>("/auth/forgot", json({ email }));

/** Choisit un nouveau mot de passe avec le lien reçu par e-mail. */
export const resetPassword = (token: string, password: string) => call<{ success: true }>("/auth/reset", json({ token, password }));

/** Complète le profil du compte connecté (nom et téléphone), par exemple après une connexion Google. */
export const updateProfile = (token: string, body: { name?: string; phone?: string }) =>
  call<{ id: string; email: string; name: string | null; phone: string | null }>("/auth/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

export const loginAccount = (email: string, password: string) =>
  call<SessionResult>("/auth/login", json({ email, password }));

export const loginWithGoogle = (credential: string) =>
  call<SessionResult>("/auth/google", json({ credential }));

export const fetchMyOrders = (token: string) =>
  call<AccountOrder[]>("/orders/mine", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });

export interface PremiumReceipt {
  id: string;
  amount: number;
  paidAt: string | null;
  expiresAt: string | null;
  reference: string;
}

/** Paiements Premium du compte (reçus). */
export const fetchPremiumHistory = (token: string) =>
  call<PremiumReceipt[]>("/premium/history", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });

/** Envoie à l'adresse du compte le QR code d'une de ses cartes (PNG en pièce jointe). */
export const sendQrToMe = (token: string, slug: string) =>
  call<{ sent: true; to: string }>(`/cards/${encodeURIComponent(slug)}/send-me`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });

/** Redirection interne sûre : jamais vers un autre site. */
export function safeNext(next: string | undefined | null, fallback = "/compte"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
