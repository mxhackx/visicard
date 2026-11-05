"use client";

import { useSyncExternalStore } from "react";
import { recallOrderKey } from "./orders";

const noopSubscribe = () => () => {};

/**
 * Jeton privé d'une commande mémorisé dans ce navigateur.
 * `undefined` tant que la page n'est pas hydratée (rendu serveur), puis la clé ou `null`.
 */
export function useOrderKey(reference: string): string | null | undefined {
  return useSyncExternalStore(
    noopSubscribe,
    () => recallOrderKey(reference),
    () => undefined,
  );
}
