"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Download, FileJson, X } from "lucide-react";
import { parseImport, templateFor, type ImportResult, type PageImport, type QrImport } from "@/lib/json-import";
import type { DirectQrType } from "@/lib/qr-payloads";

const STASH = "moncode_json_import";

export type ImportScreen = DirectQrType | "page" | "media" | "document";

/**
 * Bouton « Charger un JSON » : ouvre une fenêtre pour déposer un fichier ou coller le JSON, le valide, puis remplit le formulaire.
 * Un JSON d'un autre contenu (ex. un Wi-Fi chargé depuis la page « lien ») ouvre le bon formulaire et s'y applique.
 */
export default function JsonImport({
  screen,
  onQr,
  onPage,
}: {
  screen: ImportScreen;
  onQr?: (value: QrImport) => void;
  onPage?: (value: PageImport) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [done, setDone] = useState<string[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const callbacks = useRef({ onQr, onPage });
  useEffect(() => {
    callbacks.current = { onQr, onPage };
  });

  const apply = (r: ImportResult & { ok: true }) => {
    if (r.value.kind === "page") callbacks.current.onPage?.(r.value);
    else callbacks.current.onQr?.(r.value);
  };
  const route = (r: ImportResult & { ok: true }) => (r.value.kind === "page" ? "/creer?type=page" : r.value.type === "url" ? "/creer" : `/creer?type=${r.value.type}`);
  const here = (r: ImportResult & { ok: true }) => (r.value.kind === "page" ? screen === "page" : r.value.type === screen);

  // Un JSON chargé depuis un autre formulaire attend ici : on l'applique à l'arrivée.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STASH);
      if (!saved) return;
      sessionStorage.removeItem(STASH);
      const r = parseImport(saved);
      if (r.ok && here(r)) queueMicrotask(() => apply(r));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const check = (text: string) => {
    setRaw(text);
    setDone(null);
    setResult(text.trim() ? parseImport(text) : null);
  };
  const readFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 200 * 1024) return setResult({ ok: false, errors: ["Fichier trop volumineux (200 Ko au maximum)."] });
    check(await file.text());
  };

  const load = () => {
    if (!result?.ok) return;
    if (here(result)) {
      apply(result);
      setDone(result.warnings);
      if (!result.warnings.length) setOpen(false);
      return;
    }
    try {
      sessionStorage.setItem(STASH, raw);
    } catch {}
    setOpen(false);
    router.push(route(result));
  };

  const download = () => {
    const kind = screen === "page" ? "page" : screen === "media" || screen === "document" ? "url" : screen;
    const url = URL.createObjectURL(new Blob([templateFor(kind)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `moncode-${kind}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const elsewhere = result?.ok && !here(result);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline btn-sm">
        <FileJson className="h-4 w-4" /> Charger un JSON
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="json-title" className="flex max-h-[92svh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 id="json-title" className="text-base font-semibold text-ink">Charger un JSON</h2>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 hover:bg-cream">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-5">
              <p className="text-sm leading-6 text-sage">
                Déposez un fichier ou collez votre JSON : le formulaire se remplit tout seul. Les images (logo, photos) s’ajoutent ensuite à la main.
              </p>
              <div className="flex flex-wrap gap-2">
                <input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = ""; }} />
                <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-outline btn-sm"><FileJson className="h-4 w-4" /> Choisir un fichier</button>
                <button type="button" onClick={download} className="btn btn-outline btn-sm"><Download className="h-4 w-4" /> Télécharger un modèle</button>
              </div>
              <textarea
                aria-label="JSON à charger"
                rows={9}
                spellCheck={false}
                className="field font-mono text-xs leading-5"
                placeholder={'{ "type": "wifi", "data": { "ssid": "Moncode", "password": "…" } }'}
                value={raw}
                onChange={(e) => check(e.target.value)}
              />

              {result && !result.ok && (
                <ul role="alert" className="space-y-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                  {result.errors.map((m) => <li key={m}>{m}</li>)}
                </ul>
              )}
              {result?.ok && (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  JSON valide : {result.value.kind === "page" ? "page digitale" : `QR code « ${result.value.type} »`}.
                  {elsewhere && " Il s’ouvrira dans le bon formulaire."}
                </p>
              )}
              {(done ?? (result?.ok ? result.warnings : [])).length > 0 && (
                <ul className="space-y-1 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
                  {(done ?? (result?.ok ? result.warnings : [])).map((m) => <li key={m} className="flex gap-1.5"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {m}</li>)}
                </ul>
              )}
            </div>

            <div className="flex gap-2 border-t border-line px-5 py-4">
              {done ? (
                <button type="button" onClick={() => setOpen(false)} className="btn btn-primary w-full">Terminé : voir le formulaire</button>
              ) : (
                <button type="button" disabled={!result?.ok} onClick={load} className="btn btn-primary w-full disabled:opacity-50">
                  {elsewhere ? "Charger et ouvrir" : "Charger dans le formulaire"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
