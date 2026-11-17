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

/** Première étape d'une connexion protégée par la vérification en deux étapes : un code vient d'être envoyé par e-mail. */
export interface CodeChallenge {
  requiresCode: true;
  challenge: string;
  sentTo: string;
}

export const loginAccount = (email: string, password: string) =>
  call<SessionResult | CodeChallenge>("/auth/login", json({ email, password }));

/** Seconde étape : le code à 6 chiffres reçu par e-mail ouvre la session. */
export const loginWithCode = (challenge: string, code: string) => call<SessionResult>("/auth/login/code", json({ challenge, code }));

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

export interface ScanStats {
  days: number;
  total: number;
  last7: number;
  previous7: number;
  byDay: { date: string; count: number }[];
  devices: Record<string, number>;
  countries: { country: string; count: number }[];
  cards: { slug: string; title: string; serviceType: "page" | "media" | "document" | "direct"; total: number; last7: number }[];
}

/** Statistiques de scans du compte (pages, images, vidéos, PDF) sur les derniers jours. */
export const fetchScanStats = (token: string, days = 30) =>
  call<ScanStats>(`/cards/stats/mine?days=${days}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });

/* ---------- Adresse e-mail confirmée, export et suppression du compte ---------- */

/** Confirme l'adresse e-mail avec le lien reçu (/?verifier=…). */
export const confirmEmail = (linkToken: string) => call<{ success: true; email: string }>("/auth/verify", json({ token: linkToken }));

/** Renvoie le lien de confirmation au compte connecté. */
export const resendVerification = (token: string) =>
  call<{ success: true; alreadyVerified: boolean }>("/auth/verify/resend", { method: "POST", headers: { Authorization: `Bearer ${token}` } });

/** État du compte connecté (adresse confirmée ou non). */
export const fetchMe = (token: string) =>
  call<{ user: { email?: string; emailVerified?: boolean } }>("/auth/me", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });

/** Télécharge toutes les données du compte dans un fichier JSON. */
export async function downloadMyData(token: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/me/export`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion, puis réessayez.");
  }
  if (!res.ok) throw new Error(res.status === 429 ? "Trop de tentatives : patientez une minute." : "Export impossible pour le moment. Réessayez.");
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "moncode-mes-donnees.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Supprime définitivement le compte et ses données ; l'adresse e-mail saisie sert de confirmation. */
export const deleteMyAccount = (token: string, confirmEmailText: string) =>
  call<{ success: true }>("/me", { method: "DELETE", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ confirmEmail: confirmEmailText }) });
