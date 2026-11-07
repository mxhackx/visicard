"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFile } from "@/app/context/FileContext";

/** Jeton du compte connecté ; renvoie vers la connexion (puis la page voulue) s'il n'y en a pas. */
export function useAccountToken(next: string): string | null {
  const router = useRouter();
  const { authToken } = useFile();
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (ready && !authToken) router.replace(`/connexion?next=${encodeURIComponent(next)}`);
  }, [ready, authToken, router, next]);
  return ready ? authToken : null;
}
