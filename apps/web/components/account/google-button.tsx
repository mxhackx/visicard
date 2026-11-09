"use client";

import { useEffect, useRef, useState } from "react";
import { loginWithGoogle } from "@/lib/account";
import { useFile } from "@/app/context/FileContext";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

interface GoogleId {
  initialize: (o: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

/** Bouton « Continuer avec Google ». Absent tant que NEXT_PUBLIC_GOOGLE_CLIENT_ID n'est pas défini. */
export default function GoogleButton({ onDone, onError }: { onDone?: () => void; onError?: (message: string) => void }) {
  const { loginSession } = useFile();
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const cb = useRef({ loginSession, onDone, onError });
  useEffect(() => {
    cb.current = { loginSession, onDone, onError };
  });

  useEffect(() => {
    if (!CLIENT_ID) return;
    const init = () => {
      const g = window.google?.accounts.id;
      if (!g || !box.current) return;
      g.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }) => {
          try {
            const s = await loginWithGoogle(credential);
            cb.current.loginSession(s.access_token, s.user.role, { id: s.user.id, email: s.user.email, name: s.user.name, picture: s.user.picture }, s.refresh_token);
            cb.current.onDone?.();
          } catch (err) {
            cb.current.onError?.(err instanceof Error ? err.message : "Connexion Google impossible.");
          }
        },
      });
      box.current.innerHTML = "";
      g.renderButton(box.current, { theme: "outline", size: "large", text: "continue_with", shape: "pill", locale: "fr", width: Math.min(360, box.current.clientWidth || 320) });
      setReady(true);
    };
    if (window.google?.accounts) return init();
    const existing = document.querySelector<HTMLScriptElement>('script[data-gsi]');
    const script = existing ?? Object.assign(document.createElement("script"), { src: "https://accounts.google.com/gsi/client", async: true, defer: true });
    script.dataset.gsi = "1";
    script.addEventListener("load", init);
    if (!existing) document.head.appendChild(script);
    return () => script.removeEventListener("load", init);
  }, []);

  if (!CLIENT_ID) return null;
  return (
    <div className="mt-5">
      <div ref={box} className={`flex min-h-11 justify-center ${ready ? "" : "opacity-0"}`} />
      <div className="my-4 flex items-center gap-3 text-xs text-sage" aria-hidden="true">
        <span className="h-px flex-1 bg-line" /> ou avec votre e-mail <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
