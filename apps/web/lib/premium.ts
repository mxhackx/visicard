"use client";

/**
 * Premium : 5 000 FCFA payés par FedaPay, valables un an. Tant qu'il n'est pas actif,
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
}

async function api<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
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

/** Crée la transaction FedaPay et renvoie l'adresse de la page de paiement. */
export const startPremiumCheckout = (token: string) => api<{ paymentUrl: string }>("/premium/checkout", token, { method: "POST" });

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
    /** Réponse reçue (ou pas de session). */
    ready: !signedIn || status !== null || failed,
    active: authRole === "admin" || Boolean(status?.active),
    until: status?.until ?? null,
    refresh,
  };
}

/** Page où revenir après le paiement FedaPay (gardée le temps de la redirection). */
export const PREMIUM_SUITE_KEY = "moncode_premium_suite";

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
