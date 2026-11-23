"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Crown, Download, FileSpreadsheet, Loader2, Save, X } from "lucide-react";
import { API_URL } from "@/lib/api-url";
import { useFile } from "@/app/context/FileContext";
import { useDialogs } from "@/components/account/auth-dialog";
import { usePremium } from "@/lib/premium";
import { BULK_MAX, bulkTemplate, fileNames, readBulk } from "@/lib/bulk-qr";
import { makeZip } from "@/lib/zip";
import { DIRECT_QR_TYPES, type DirectQrType } from "@/lib/qr-payloads";
import { renderQrPng } from "./styled-qr";

/**
 * « Charger un CSV » : un fichier, une ligne par QR code. Le résultat se télécharge en ZIP de PNG (avec un récapitulatif),
 * ou s'enregistre dans le compte (QR codes modifiables ensuite). Le lien web est gratuit ; les autres contenus demandent Premium.
 */
export default function CsvImport({ defaultType = "url", qrStyle = "" }: { defaultType?: DirectQrType; qrStyle?: string }) {
  const { authToken } = useFile();
  const { openPremium, openAuth } = useDialogs();
  const premium = usePremium();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DirectQrType>(defaultType);
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState<null | "zip" | "save">(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const parsed = useMemo(() => (raw.trim() ? readBulk(type, raw) : null), [raw, type]);
  const good = parsed?.rows.filter((r) => !r.error) ?? [];
  const bad = parsed?.rows.filter((r) => r.error) ?? [];
  const locked = type !== "url" && !premium.active;

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && setOpen(false);
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy]);

  const change = (next: string) => {
    setRaw(next);
    setMessage(null);
  };
  const readFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 500 * 1024) return setMessage({ tone: "error", text: "Fichier trop volumineux (500 Ko au maximum)." });
    change(await file.text());
  };
  const save = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };
  const template = () => save(new Blob(["﻿" + bulkTemplate(type)], { type: "text/csv;charset=utf-8" }), `moncode-${type}.csv`);

  const makeZipFile = async () => {
    setBusy("zip");
    setProgress(0);
    setMessage(null);
    try {
      const names = fileNames(good);
      const enc = new TextEncoder();
      const files: { name: string; data: Uint8Array }[] = [];
      for (const [i, row] of good.entries()) {
        const png = await renderQrPng(row.payload, qrStyle);
        files.push({ name: names[i], data: new Uint8Array(await png.arrayBuffer()) });
        setProgress(i + 1);
      }
      const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
      files.push({ name: "liste.csv", data: enc.encode("﻿" + ["fichier,titre,contenu", ...good.map((r, i) => [names[i], r.title, r.payload].map(q).join(","))].join("\n")) });
      save(makeZip(files), `moncode-${type}-${good.length}-qr.zip`);
      setMessage({ tone: "ok", text: `${good.length} QR code${good.length > 1 ? "s" : ""} téléchargé${good.length > 1 ? "s" : ""} (PNG 1200 px).` });
    } catch {
      setMessage({ tone: "error", text: "La génération a échoué. Réessayez avec moins de lignes." });
    } finally {
      setBusy(null);
    }
  };

  const saveAccount = async () => {
    if (!authToken) return openAuth({ mode: "login" });
    setBusy("save");
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/cards/direct/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ items: good.map((r) => ({ payload: r.payload, title: r.title })), qrStyle }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((Array.isArray(body?.message) ? body.message[0] : body?.message) || "Enregistrement impossible.");
      const results = (body.results ?? []) as { error?: string }[];
      const failed = results.filter((r) => r.error);
      setMessage({
        tone: failed.length ? "error" : "ok",
        text: `${results.length - failed.length} QR code${results.length - failed.length > 1 ? "s" : ""} enregistré${results.length - failed.length > 1 ? "s" : ""} dans votre espace.${failed.length ? ` ${failed.length} refusé${failed.length > 1 ? "s" : ""} : ${failed[0].error}` : ""}`,
      });
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Enregistrement impossible." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <button type="button" onClick={() => { setType(defaultType); setOpen(true); }} className="btn btn-outline btn-sm">
        <FileSpreadsheet className="h-4 w-4" /> Charger un CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && !busy && setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="csv-title" className="flex max-h-[92svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 id="csv-title" className="text-base font-semibold text-ink">Plusieurs QR codes depuis un CSV</h2>
              <button ref={closeRef} type="button" disabled={Boolean(busy)} onClick={() => setOpen(false)} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 hover:bg-cream"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-5">
              <p className="text-sm leading-6 text-sage">
                Une ligne par QR code, {BULK_MAX} au maximum. La première ligne donne les colonnes (les champs du type, plus <code>titre</code>). Les virgules, points-virgules (Excel) et tabulations sont acceptés.
              </p>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <label htmlFor="csv-type" className="mb-1.5 block text-xs font-semibold text-ink/70">Type de QR code</label>
                  <select id="csv-type" className="field" value={type} onChange={(e) => { setType(e.target.value as DirectQrType); setMessage(null); }}>
                    {DIRECT_QR_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}{t.id === "url" ? " (gratuit)" : ""}</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = ""; }} />
                  <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-outline btn-sm"><FileSpreadsheet className="h-4 w-4" /> Choisir un fichier</button>
                  <button type="button" onClick={template} className="btn btn-outline btn-sm"><Download className="h-4 w-4" /> Modèle</button>
                </div>
              </div>

              <textarea aria-label="Contenu du CSV" rows={6} spellCheck={false} className="field font-mono text-xs leading-5" placeholder={`titre,${type === "url" ? "url" : "…"}\nBoutique 1,https://exemple.com/1`} value={raw} onChange={(e) => change(e.target.value)} />

              {parsed?.fatal && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{parsed.fatal}</p>}

              {parsed && !parsed.fatal && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-ink">
                    <span className="text-emerald-700">{good.length} QR code{good.length > 1 ? "s" : ""} valide{good.length > 1 ? "s" : ""}</span>
                    {bad.length > 0 && <span className="text-red-700"> · {bad.length} à corriger</span>}
                  </p>
                  {bad.length > 0 && (
                    <ul role="alert" className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                      {bad.slice(0, 20).map((r) => <li key={r.line}>Ligne {r.line} ({r.title}) : {r.error}</li>)}
                      {bad.length > 20 && <li>… et {bad.length - 20} autres.</li>}
                    </ul>
                  )}
                  {good.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-line">
                      <table className="w-full min-w-[22rem] text-left text-xs">
                        <thead className="bg-cream text-sage"><tr><th className="px-3 py-2 font-semibold">Ligne</th><th className="px-3 py-2 font-semibold">Titre</th><th className="px-3 py-2 font-semibold">Contenu du QR code</th></tr></thead>
                        <tbody className="divide-y divide-line">
                          {good.slice(0, 5).map((r) => (
                            <tr key={r.line}><td className="px-3 py-2 tabular-nums text-sage">{r.line}</td><td className="px-3 py-2 font-medium text-ink">{r.title}</td><td className="max-w-[16rem] truncate px-3 py-2 text-ink/70">{r.payload.replace(/\n/g, " ")}</td></tr>
                          ))}
                        </tbody>
                      </table>
                      {good.length > 5 && <p className="border-t border-line px-3 py-2 text-xs text-sage">… et {good.length - 5} autres lignes.</p>}
                    </div>
                  )}
                  {parsed.ignored.length > 0 && (
                    <p className="flex items-start gap-1.5 text-xs text-amber-800"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Colonnes ignorées : {parsed.ignored.join(", ")}.</p>
                  )}
                </div>
              )}

              {message && (
                <p role="status" className={`rounded-xl px-4 py-3 text-sm ${message.tone === "ok" ? "bg-emerald-50 text-emerald-800" : "border border-red-200 bg-red-50 text-red-700"}`}>
                  {message.text} {message.tone === "ok" && message.text.includes("espace") && <Link href="/compte" className="font-semibold underline">Voir mes QR codes</Link>}
                </p>
              )}
              {qrStyle && <p className="text-xs text-sage">Le style que vous avez choisi dans le créateur est appliqué à tous les QR codes.</p>}
            </div>

            <div className="flex flex-col gap-2 border-t border-line px-5 py-4 sm:flex-row">
              {locked ? (
                <button type="button" onClick={() => openPremium({ label: "Plusieurs QR codes", suite: "/creer" })} className="premium-gold inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold">
                  <Crown className="h-4 w-4" /> Ce contenu demande Premium
                </button>
              ) : (
                <>
                  <button type="button" disabled={!good.length || bad.length > 0 || Boolean(busy)} onClick={() => void makeZipFile()} className="btn btn-primary flex-1 disabled:opacity-50">
                    {busy === "zip" ? <><Loader2 className="h-4 w-4 animate-spin" /> {progress} / {good.length}</> : <><Download className="h-4 w-4" /> Télécharger le ZIP (PNG)</>}
                  </button>
                  <button type="button" disabled={!good.length || bad.length > 0 || Boolean(busy)} onClick={() => void saveAccount()} className="btn btn-outline flex-1 disabled:opacity-50">
                    {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer dans mon espace
                  </button>
                </>
              )}
            </div>
            {bad.length > 0 && !locked && <p className="px-5 pb-4 text-xs text-red-700">Corrigez les lignes en erreur pour continuer.</p>}
          </div>
        </div>
      )}
    </>
  );
}
