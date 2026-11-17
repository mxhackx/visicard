"use client";

import { useSyncExternalStore } from "react";

/**
 * Choix sur les cookies et services tiers. Les cookies indispensables (connexion, panier de création) n'ont pas
 * besoin d'accord ; les services de Google (connexion en un clic) et les cartes intégrées, eux, n'apparaissent
 * qu'avec l'accord du visiteur. Le choix est conservé 12 mois dans ce navigateur.
 */
export type Consent = "all" | "essential" | null;

const KEY = "moncode_consent";
const EVENT = "moncode:consent";
const YEAR = 365 * 24 * 3600 * 1000;

function read(): Consent {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { v, t } = JSON.parse(raw) as { v?: string; t?: number };
    if (!t || Date.now() - t > YEAR) return null;
    return v === "all" || v === "essential" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Consent) {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify({ v: value, t: Date.now() }));
    else localStorage.removeItem(KEY);
  } catch {
    /* navigateur sans stockage : le choix vaut pour cette visite seulement */
  }
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

/** Choix actuel ; `undefined` avant l'hydratation (rien ne s'affiche ni ne se charge à ce moment-là). */
export function useConsent(): Consent | undefined {
  return useSyncExternalStore<Consent | undefined>(subscribe, read, () => undefined);
}
