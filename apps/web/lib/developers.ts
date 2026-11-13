/** Clés d'API développeur : gestion par leur propriétaire connecté. */
import { API_URL } from "./api-url";

export interface DevKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  perMinute: number | null;
  perMonth: number | null;
  usedThisMonth: number;
}

export interface DevKeysResponse {
  limits: { unlimited: boolean; maxKeys: number; perMinute?: number; perMonth?: number; premium?: boolean };
  keys: DevKey[];
}

export interface NewKey {
  id: string;
  name: string;
  prefix: string;
  key: string;
}

async function call<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
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

export const listKeys = (token: string) => call<DevKeysResponse>("/developers/keys", token);
export const createKey = (token: string, name: string) => call<NewKey>("/developers/keys", token, { method: "POST", body: JSON.stringify({ name }) });
export const revokeKey = (token: string, id: string) => call<{ success: true }>(`/developers/keys/${id}`, token, { method: "DELETE" });
