"use client";

import { useCallback, useEffect, useState } from "react";
import { useFile } from "@/app/context/FileContext";
import { fetchMe } from "./account";

export const EMAIL_EVENT = "moncode:email";
export const notifyEmailChanged = () => window.dispatchEvent(new Event(EMAIL_EVENT));

/** Adresse e-mail du compte confirmée ou non (`null` tant que l'état n'est pas connu). Les administrateurs et les comptes Google le sont d'office. */
export function useEmailVerified() {
  const { authToken, authRole } = useFile();
  const [verified, setVerified] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    if (!authToken || authRole === "admin") return;
    try {
      const me = await fetchMe(authToken);
      setVerified(me.user.emailVerified !== false);
    } catch {
      /* état inconnu : on n'affiche rien */
    }
  }, [authToken, authRole]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    window.addEventListener(EMAIL_EVENT, refresh);
    return () => window.removeEventListener(EMAIL_EVENT, refresh);
  }, [refresh]);

  return { verified: !authToken || authRole === "admin" ? true : verified, refresh };
}
