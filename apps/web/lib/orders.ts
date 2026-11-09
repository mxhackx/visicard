/**
 * Commandes client (sans compte) : devis → paiement sur WhatsApp (confirmé par
 * l'admin) → facture.
 * Le jeton du lien privé est gardé dans le navigateur et envoyé dans l'en-tête
 * `X-Order-Key` ; il n'apparaît jamais dans les URL envoyées à l'API.
 */
import { API_URL } from "./api-url";

export { API_URL };

export type OrderStatus = "quote" | "pending" | "paid" | "cancelled";

export interface OrderItem {
  label: string;
  quantity: number;
  unitPrice: number;
}

export interface CardPreview {
  slug: string;
  serviceType?: string;
  title?: string | null;
  contentUrl?: string | null;
  contentType?: string | null;
  fileName?: string | null;
  imageUrl?: string;
  restaurantName?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  phoneNumber?: string | null;
  additionalInfo?: string | null;
  menuImages?: string[];
  placeImages?: string[];
  qrStyle?: string | null;
  themeId?: string | null;
  cardLayout?: string | null;
  [key: string]: unknown;
}

export interface OrderView {
  id: string;
  reference: string;
  kind: "creation" | "modification";
  serviceType: "page" | "media" | "document" | "direct";
  serviceLabel: string;
  status: OrderStatus;
  items: OrderItem[];
  amount: number;
  currency: string;
  quoteNumber: string;
  invoiceNumber: string | null;
  customer: { name: string; phone: string; email: string | null };
  createdAt: string;
  paidAt: string | null;
  card: { slug: string; status: "draft" | "active" | "rejected"; moderationNote: string | null; preview: CardPreview };
  qrCode: string | null;
  cardUrl: string | null;
  lastPayment: { provider: string; status: "pending" | "succeeded" | "failed"; createdAt: string } | null;
  modifications: { reference: string; status: OrderStatus; amount: number; quoteNumber: string; createdAt: string }[];
  pendingChanges: Record<string, unknown> | null;
  /** `online` : le paiement en ligne (FedaPay) est disponible. */
  payment?: { online: boolean };
}

export interface CreatedOrder {
  reference: string;
  accessToken: string;
  amount: number;
  quoteNumber: string;
}

const storageKey = (reference: string) => `moncode:commande:${reference.toUpperCase()}`;

export function rememberOrderKey(reference: string, key: string) {
  try {
    localStorage.setItem(storageKey(reference), key);
  } catch {
    /* navigation privée : le lien reste la seule clé */
  }
}

/** Valeur spéciale : la commande s'ouvre avec le compte connecté, sans lien privé. */
export const ACCOUNT_KEY = "__account__";

function sessionToken(): string | null {
  try {
    return sessionStorage.getItem("moncode_token");
  } catch {
    return null;
  }
}

/** Preuve d'accès envoyée à l'API : lien privé (`X-Order-Key`) ou compte connecté (Bearer). */
function accessHeaders(key: string): Record<string, string> {
  if (key === ACCOUNT_KEY) {
    const token = sessionToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  return { "X-Order-Key": key };
}

/** Lien privé mémorisé, sinon le compte connecté, sinon rien. */
export function recallAccess(reference: string): string | null {
  return recallOrderKey(reference) ?? (sessionToken() ? ACCOUNT_KEY : null);
}

export function recallOrderKey(reference: string): string | null {
  try {
    return localStorage.getItem(storageKey(reference));
  } catch {
    return null;
  }
}

/** Lien privé à conserver : il donne accès au devis, à la facture et au QR code. */
export function privateOrderUrl(reference: string, key: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/commande/${reference}?cle=${encodeURIComponent(key)}`;
}

/** fetch avec un message compréhensible quand le serveur ne répond pas. */
async function send(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion, puis réessayez.");
  }
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    if (res.status === 429) throw new Error("Trop de tentatives : patientez une minute avant de réessayer.");
    if (res.status >= 500 && typeof message !== "string") throw new Error("Le serveur a rencontré une erreur. Réessayez dans un instant.");
    throw new Error(typeof message === "string" ? message : "Une erreur est survenue. Réessayez.");
  }
  return data as T;
}

export async function createOrder(body: FormData): Promise<CreatedOrder> {
  // Connecté : la commande est rattachée au compte (obligatoire pour page, image, vidéo, PDF).
  const token = sessionToken();
  return parse(
    await send(`${API_URL}/orders`, {
      method: "POST",
      body,
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
  );
}

export async function fetchOrder(reference: string, key: string): Promise<OrderView> {
  return parse(await send(`${API_URL}/orders/${reference}`, { headers: accessHeaders(key), cache: "no-store" }));
}

/** Vue admin d'une commande (sans lien privé). */
export async function fetchOrderAsAdmin(reference: string, adminToken: string): Promise<OrderView> {
  return parse(
    await send(`${API_URL}/orders/admin/${reference}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      credentials: "include",
      cache: "no-store",
    }),
  );
}

export async function adminOrderAction(orderId: string, action: "mark-paid" | "cancel", adminToken: string) {
  return parse(
    await send(`${API_URL}/orders/admin/${orderId}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      credentials: "include",
    }),
  );
}

/** Crée la transaction FedaPay et renvoie l'adresse de sa page de paiement. */
export async function startPayment(reference: string, key: string): Promise<{ paymentUrl: string }> {
  return parse(await send(`${API_URL}/orders/${reference}/payments`, { method: "POST", headers: accessHeaders(key) }));
}

/** Relit le paiement chez FedaPay, puis renvoie la commande à jour. */
export async function refreshOrder(reference: string, key: string): Promise<OrderView> {
  return parse(await send(`${API_URL}/orders/${reference}/payments/refresh`, { method: "POST", headers: accessHeaders(key) }));
}

/**
 * Parcours « un seul bouton » : mémorise la commande puis envoie le client sur la page de
 * paiement FedaPay. Renvoie `false` si le paiement en ligne n'est pas disponible : l'appelant
 * ouvre alors la page de commande, où le paiement FedaPay peut être relancé.
 */
export async function payOrder(order: CreatedOrder): Promise<boolean> {
  rememberOrderKey(order.reference, order.accessToken);
  try {
    const { paymentUrl } = await startPayment(order.reference, order.accessToken);
    window.location.assign(paymentUrl);
    return true;
  } catch {
    return false;
  }
}

export async function requestModification(reference: string, key: string, body: FormData): Promise<CreatedOrder> {
  return parse(
    await send(`${API_URL}/orders/${reference}/modifications`, {
      method: "POST",
      headers: accessHeaders(key),
      body,
    }),
  );
}

const fcfaFormat = new Intl.NumberFormat("fr-FR");
export const fcfa = (amount: number) => `${fcfaFormat.format(amount)} FCFA`;

export const formatDate = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso))
    : "—";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  quote: "Devis à régler",
  pending: "Paiement en cours",
  paid: "Payée",
  cancelled: "Annulée",
};

/** Validation partagée des coordonnées client. */
export function validateCustomer(c: { name: string; phone: string; email: string }) {
  const errors: Partial<Record<"name" | "phone" | "email", string>> = {};
  const digits = c.phone.replace(/\D/g, "").length;
  if (c.name.trim().length < 2) errors.name = "Indiquez votre nom.";
  else if (c.name.trim().length > 120) errors.name = "120 caractères au maximum.";
  if (digits < 8) errors.phone = "Numéro trop court : indiquez l’indicatif et le numéro.";
  else if (digits > 15) errors.phone = "Numéro trop long.";
  if (c.email.trim() && !/^\S+@\S+\.\S+$/.test(c.email.trim())) errors.email = "Adresse e-mail invalide.";
  return errors;
}
