"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Download, Loader2, Trash2, X } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { deleteMyAccount, downloadMyData } from "@/lib/account";

/** « Mes données » : télécharger tout ce que Moncode conserve, ou supprimer définitivement le compte. */
export default function DataPrivacy() {
  const router = useRouter();
  const { authToken, authUser, authRole, logoutSession } = useFile();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const email = authUser?.email ?? "";
  const matches = typed.trim().toLowerCase() === email.toLowerCase() && email !== "";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy]);

  if (!authToken) return null;

  const exportData = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await downloadMyData(authToken);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export impossible.");
    } finally {
      setExporting(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteMyAccount(authToken, typed);
      logoutSession();
      router.replace("/?compte=supprime");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
      setBusy(false);
    }
  };

  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="text-base font-semibold text-ink/90">Mes données</h2>
      <p className="mt-1 text-sm leading-6 text-sage">Vos données vous appartiennent : récupérez-les à tout moment, ou supprimez votre compte.</p>

      <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink/90">Exporter mes données</p>
          <p className="text-xs leading-5 text-sage">Un fichier JSON avec votre profil, vos QR codes, vos commandes et factures, vos paiements et vos clés d’API (sans le secret).</p>
          {exportError && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{exportError}</p>}
        </div>
        <button type="button" onClick={exportData} disabled={exporting} className="btn btn-outline btn-sm shrink-0">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Télécharger
        </button>
      </div>

      {authRole !== "admin" && (
        <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-700">Supprimer mon compte</p>
            <p className="text-xs leading-5 text-sage">Supprime définitivement votre compte, vos QR codes, vos fichiers, vos commandes et vos factures. Les QR codes déjà imprimés cesseront de fonctionner.</p>
          </div>
          <button type="button" onClick={() => { setTyped(""); setError(null); setOpen(true); }} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Supprimer
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="del-title">
          <button type="button" aria-label="Fermer" disabled={busy} onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_30px_80px_rgba(23,23,26,0.35)] sm:p-7">
            <button type="button" onClick={() => setOpen(false)} disabled={busy} aria-label="Fermer" className="absolute right-3 top-3 rounded-full p-2 text-sage transition hover:bg-cream-deep hover:text-ink"><X className="h-5 w-5" /></button>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle className="h-6 w-6" /></span>
            <h2 id="del-title" className="mt-4 text-lg font-semibold text-ink">Supprimer définitivement mon compte ?</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-sage">
              <li>Vos QR codes, pages, fichiers et statistiques seront effacés.</li>
              <li>Vos commandes, factures et paiements Premium seront effacés : <strong className="text-ink">téléchargez vos données avant</strong>.</li>
              <li>Cette action est irréversible et ne rembourse pas un Premium en cours.</li>
            </ul>
            <label htmlFor="del-email" className="mt-5 block text-xs font-semibold text-ink/70">Pour confirmer, saisissez votre adresse e-mail : <span className="font-mono text-ink">{email}</span></label>
            <input id="del-email" className="field mt-1.5" autoComplete="off" autoCapitalize="none" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={email} />
            {error && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{error}</p>}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="btn btn-outline">Annuler</button>
              <button type="button" onClick={remove} disabled={!matches || busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
