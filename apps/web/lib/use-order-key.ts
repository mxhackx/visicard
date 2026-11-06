"use client";

import { useSyncExternalStore } from "react";
import { recallAccess } from "./orders";

const noopSubscribe = () => () => {};

/**
 * Accès à une commande depuis ce navigateur : lien privé mémorisé, ou compte connecté.
 * `undefined` tant que la page n'est pas hydratée (rendu serveur), puis la clé ou `null`.
 */
export function useOrderKey(reference: string): string | null | undefined {
  return useSyncExternalStore(
    noopSubscribe,
    () => recallAccess(reference),
    () => undefined,
  );
}
