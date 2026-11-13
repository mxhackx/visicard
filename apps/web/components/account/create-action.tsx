"use client";

import { Loader2 } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { formatPhone } from "./auth-form";

/** Nom, e-mail et téléphone du compte connecté : ils servent aux commandes et aux factures, sans les redemander. */
export function useAccountContact() {
  const { authUser } = useFile();
  const name = (authUser?.name ?? "").trim();
  const phone = authUser?.phone ?? "";
  return { name, email: authUser?.email ?? "", phone, complete: name.length >= 2 && Boolean(phone) };
}

/** Dernière étape d'un contenu Premium : un seul bouton, au nom du compte. */
export default function CreateAction({ label, busyLabel, busy, error, onCreate }: { label: string; busyLabel: string; busy: boolean; error: string | null; onCreate: () => void }) {
  const c = useAccountContact();
  return (
    <>
      <div className="text-center">
      <p className="mx-auto max-w-xl text-sm leading-6 text-sage">
        Créé au nom de <strong className="font-semibold text-ink/90">{c.name || c.email}</strong>
        {c.phone ? <> · {formatPhone(c.phone)}</> : null}. Le QR code est prêt tout de suite, en PNG et SVG.
      </p>
      {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-700">{error}</p>}
      <button type="button" onClick={onCreate} disabled={busy} className="btn btn-primary mx-auto mt-4 flex w-full max-w-sm justify-center py-3.5 text-base">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? busyLabel : label}
      </button>
      </div>
    </>
  );
}
