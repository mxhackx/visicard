"use client";

import { useDialogs } from "./auth-dialog";

/** Bouton qui ouvre la fenêtre de création de compte ou de connexion. */
export default function AuthButton({ mode, label, className = "btn btn-outline btn-sm" }: { mode: "register" | "login"; label: string; className?: string }) {
  const { openAuth } = useDialogs();
  return (
    <button type="button" onClick={() => openAuth({ mode })} className={className}>
      {label}
    </button>
  );
}
