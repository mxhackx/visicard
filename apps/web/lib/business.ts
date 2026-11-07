/** Espace propriétaire : performances, gestion commerciale, demandes, établissements. */
import { API_URL } from "./api-url";

export interface Product {
  id?: string;
  name: string;
  price: number | null;
  description: string;
  image: string | null;
}
export interface Catalog {
  promo: { title: string; text: string; until: string | null } | null;
  products: Product[];
}
export type RequestMode = "none" | "contact" | "booking" | "order";
export type Schedule = Record<string, { isOpen: boolean; open: string; close: string }>;

export interface MyCard {
  slug: string;
  title: string;
  serviceType: "page" | "media" | "document";
  status: string;
  requestMode: RequestMode;
  establishment: { id: string; name: string } | null;
  orderReference: string | null;
  scans: { total: number; last7: number; last30: number };
  newRequests: number;
  createdAt: string;
}
export interface Analytics {
  slug: string;
  title: string;
  periodDays: number;
  total: number;
  inPeriod: number;
  days: { date: string; count: number }[];
  hours: { hour: number; count: number }[];
  peakHour: number | null;
  devices: { label: string; count: number }[];
  countries: { label: string; count: number }[];
  cities: { label: string; count: number }[];
  requests: { total: number; booking?: number; order?: number; contact?: number };
  conversion: number;
}
export interface Summary {
  cards: number;
  scans7: number;
  scansTotal: number;
  newRequests: number;
  establishments: number;
}

export interface LiveState {
  orderReference?: string | null;
  slug: string;
  title: string;
  serviceType: string;
  requestMode: RequestMode;
  establishmentId: string | null;
  schedule: Schedule | null;
  catalog: Catalog;
  phoneNumber: string | null;
}
export interface Establishment {
  id: string;
  name: string;
  city: string | null;
  cardsCount: number;
}
export interface VisitorRequest {
  id: string;
  kind: "booking" | "order" | "contact";
  name: string;
  phone: string;
  message: string | null;
  details: { date?: string; time?: string; people?: number; items?: { name: string; qty: number; price: number | null }[]; total?: number } | null;
  status: "new" | "done" | "cancelled";
  createdAt: string;
  card: { slug: string; title: string };
}

async function call<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
      cache: "no-store",
    });
  } catch {
    throw new Error("Impossible de joindre le serveur.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const m = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new Error(typeof m === "string" ? m : "Une erreur est survenue.");
  }
  return data as T;
}

export const mySummary = (t: string) => call<Summary>("/me/summary", t);

/** Envoie une photo de produit (JPEG, PNG, WebP, 3 Mo) et renvoie son adresse publique. */
export async function uploadProductImage(token: string, slug: string, file: File): Promise<string> {
  const body = new FormData();
  body.append("image", file);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/me/cards/${slug}/images`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
  } catch {
    throw new Error("Impossible de joindre le serveur.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const m = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new Error(typeof m === "string" ? m : "Envoi de l’image impossible.");
  }
  return data.url as string;
}

export const myCards = (t: string) => call<MyCard[]>("/me/cards", t);
export const analytics = (t: string, slug: string, days = 30) => call<Analytics>(`/me/cards/${slug}/analytics?days=${days}`, t);
export const liveState = (t: string, slug: string) => call<LiveState>(`/me/cards/${slug}/live`, t);
export const saveLive = (t: string, slug: string, body: Partial<{ catalog: Catalog; requestMode: RequestMode; schedule: Schedule; establishmentId: string | null }>) =>
  call<LiveState>(`/me/cards/${slug}/live`, t, { method: "PATCH", body: JSON.stringify(body) });
export const myRequests = (t: string, status?: string) => call<VisitorRequest[]>(`/me/requests${status ? `?status=${status}` : ""}`, t);
export const setRequestStatus = (t: string, id: string, status: string) => call<{ id: string }>(`/me/requests/${id}`, t, { method: "PATCH", body: JSON.stringify({ status }) });
export const myEstablishments = (t: string) => call<Establishment[]>("/me/establishments", t);
export const addEstablishment = (t: string, name: string, city: string) => call<Establishment>("/me/establishments", t, { method: "POST", body: JSON.stringify({ name, city }) });
export const renameEstablishment = (t: string, id: string, name: string, city: string) => call<{ success: true }>(`/me/establishments/${id}`, t, { method: "PATCH", body: JSON.stringify({ name, city }) });
export const removeEstablishment = (t: string, id: string) => call<{ success: true }>(`/me/establishments/${id}`, t, { method: "DELETE" });

/** Côté visiteur : envoi d'une réservation, d'une commande ou d'un message. */
export const sendRequest = (slug: string, body: unknown) => call<{ success: true }>(`/cards/${encodeURIComponent(slug)}/requests`, null, { method: "POST", body: JSON.stringify(body) });
