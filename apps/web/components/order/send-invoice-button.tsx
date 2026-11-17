"use client";

import { useState } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { emailPremiumInvoice } from "@/lib/account";

/** « Envoyer par e-mail » : la facture Premium part à l'adresse du compte. */
export default function SendInvoiceButton({ id, compact = false, className = "" }: { id: string; compact?: boolean; className?: string }) {
  const { authToken } = useFile();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [info, setInfo] = useState<string | null>(null);
  if (!authToken) return null;
  const send = async () => {
    setState("busy");
    setInfo(null);
    try {
      const r = await emailPremiumInvoice(authToken, id);
      setInfo(`Envoyée à ${r.to}`);
      setState("done");
    } catch (e) {
      setInfo(e instanceof Error ? e.message : "Envoi impossible.");
      setState("error");
    }
  };
  return (
    <span className={`inline-flex flex-col items-start gap-0.5 ${className}`}>
      <button type="button" onClick={send} disabled={state === "busy"} className={compact ? "inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline disabled:opacity-60" : "btn btn-outline btn-sm"}>
        {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : state === "done" ? <Check className="h-4 w-4 text-emerald-600" /> : <Mail className="h-4 w-4" />}
        {state === "done" ? "Envoyée" : "Envoyer par e-mail"}
      </button>
      {info && <span role="status" className={`text-xs ${state === "error" ? "text-red-600" : "text-sage"}`}>{info}</span>}
    </span>
  );
}
