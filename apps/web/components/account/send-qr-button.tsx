"use client";

import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { sendQrToMe } from "@/lib/account";

/** « M'envoyer par e-mail » : la personne reçoit elle-même son QR code (PNG) à l'adresse de son compte. */
export default function SendQrButton({ slug }: { slug: string }) {
  const { authToken, authUser } = useFile();
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!authToken) return;
    setState("busy");
    setError(null);
    try {
      await sendQrToMe(authToken, slug);
      setState("sent");
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    }
  };

  return (
    <div className="mt-2">
      <button type="button" onClick={send} disabled={state === "busy"} className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline disabled:opacity-60">
        {state === "busy" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : state === "sent" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Send className="h-3.5 w-3.5" />}
        {state === "sent" ? `Envoyé à ${authUser?.email ?? "votre adresse"}` : "M’envoyer par e-mail"}
      </button>
      {error && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
