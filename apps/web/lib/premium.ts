"use client";

/**
 * Premium : 5 000 FCFA payés par Mobile Money (FeexPay), valables un an. Tant qu'il n'est pas actif,
 * un compte ne peut rien créer. L'état vient toujours de l'API (jamais du navigateur).
 */
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "./api-url";
import { useFile } from "@/app/context/FileContext";

export const PREMIUM_PRICE = "5 000";
export const PREMIUM_EVENT = "moncode:premium";
export const notifyPremiumChanged = () => window.dispatchEvent(new Event(PREMIUM_EVENT));

export interface PremiumStatus {
  active: boolean;
  until: string | null;
  admin: boolean;
  /** Dernier paiement récent : `pending`, `failed` ou `paid`. */
  payment?: string | null;
  /** Mode test de FeexPay : seuls les numéros de test fonctionnent. */
  sandbox?: boolean;
}

async function api<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers: { ...(init?.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` }, cache: "no-store" });
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion, puis réessayez.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new Error(typeof message === "string" ? message : "Une erreur est survenue. Réessayez.");
  }
  return data as T;
}

export const fetchPremiumStatus = (token: string) => api<PremiumStatus>("/premium/status", token);

/** Lance le paiement Mobile Money : le client valide ensuite sur son téléphone (FeexPay). */
export const payPremium = (token: string, body: { network: string; phone: string }) =>
  api<{ reference: string; status: string }>("/premium/pay", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

/** État Premium du compte connecté. `status` vaut `null` tant que la réponse n'est pas arrivée. */
export function usePremium() {
  const { authToken, authRole } = useFile();
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    if (!authToken) return null;
    try {
      const next = await fetchPremiumStatus(authToken);
      setStatus(next);
      setFailed(false);
      return next;
    } catch {
      setFailed(true);
      return null;
    }
  }, [authToken]);

  // Un paiement confirmé ailleurs (autre onglet, fenêtre) : tous les écrans se relisent.
  useEffect(() => {
    const on = () => void refresh();
    window.addEventListener(PREMIUM_EVENT, on);
    return () => window.removeEventListener(PREMIUM_EVENT, on);
  }, [refresh]);

  useEffect(() => {
    if (!authToken) return;
    let alive = true;
    fetchPremiumStatus(authToken)
      .then((s) => alive && (setStatus(s), setFailed(false)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [authToken]);

  const signedIn = Boolean(authToken && authRole);
  return {
    signedIn,
    admin: authRole === "admin",
    sandbox: Boolean(status?.sandbox),
    /** Réponse reçue (ou pas de session). */
    ready: !signedIn || status !== null || failed,
    active: authRole === "admin" || Boolean(status?.active),
    until: status?.until ?? null,
    refresh,
  };
}


const TRIAL_KEY = "moncode_premium_trial";

/** « J'essaie Premium » : l'avertissement ne s'affiche qu'une fois par session, tout reste ensuite débloqué. */
export function useTrial(): [boolean, () => void] {
  const [trial, setTrial] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(TRIAL_KEY)) queueMicrotask(() => setTrial(true));
    } catch {}
  }, []);
  const start = useCallback(() => {
    setTrial(true);
    try {
      sessionStorage.setItem(TRIAL_KEY, "1");
    } catch {}
  }, []);
  return [trial, start];
}
