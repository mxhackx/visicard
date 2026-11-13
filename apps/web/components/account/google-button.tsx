"use client";

import { useEffect, useRef, useState } from "react";
import { loginWithGoogle } from "@/lib/account";
import { GOOGLE_CLIENT_ID, loadGoogle, onGoogleCredential } from "@/lib/google-gsi";
import { useFile } from "@/app/context/FileContext";

/** Bouton « Continuer avec Google ». Absent tant que NEXT_PUBLIC_GOOGLE_CLIENT_ID n'est pas défini. */
export default function GoogleButton({ onDone, onError }: { onDone?: (info: { token: string; role: "admin" | "user"; user: { name?: string | null; phone?: string | null } }) => void; onError?: (message: string) => void }) {
  const { loginSession } = useFile();
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const cb = useRef({ loginSession, onDone, onError });
  useEffect(() => {
    cb.current = { loginSession, onDone, onError };
  });

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let alive = true;
    const off = onGoogleCredential(async (credential) => {
      try {
        const s = await loginWithGoogle(credential);
        cb.current.loginSession(s.access_token, s.user.role, { id: s.user.id, email: s.user.email, name: s.user.name, picture: s.user.picture, phone: s.user.phone }, s.refresh_token);
        cb.current.onDone?.({ token: s.access_token, role: s.user.role, user: { name: s.user.name, phone: s.user.phone } });
      } catch (err) {
        cb.current.onError?.(err instanceof Error ? err.message : "Connexion Google impossible.");
      }
    });
    loadGoogle().then((g) => {
      if (!alive || !g || !box.current) return;
      box.current.innerHTML = "";
      g.renderButton(box.current, { theme: "outline", size: "large", text: "continue_with", shape: "pill", locale: "fr", width: Math.min(360, box.current.clientWidth || 320) });
      setReady(true);
    });
    return () => {
      alive = false;
      off();
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;
  return (
    <div className="mt-5">
      <div ref={box} className={`flex min-h-11 justify-center ${ready ? "" : "opacity-0"}`} />
      <div className="my-4 flex items-center gap-3 text-xs text-sage" aria-hidden="true">
        <span className="h-px flex-1 bg-line" /> ou avec votre e-mail <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
