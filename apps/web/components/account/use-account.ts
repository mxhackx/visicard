"use client";

import { useEffect, useState } from "react";
import { useDialogs } from "@/components/account/auth-dialog";
import { useFile } from "@/app/context/FileContext";

/** Jeton du compte connecté ; ouvre la fenêtre de connexion s'il n'y en a pas. */
export function useAccountToken(): string | null {
  const { openAuth } = useDialogs();
  const { authToken } = useFile();
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (ready && !authToken) openAuth({ mode: "login" });
  }, [ready, authToken, openAuth]);
  return ready ? authToken : null;
}
