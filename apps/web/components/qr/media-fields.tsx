"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Images, UploadCloud, X } from "lucide-react";
import { createOrder, rememberOrder } from "@/lib/orders";
import CreateAction, { useAccountContact } from "@/components/account/create-action";

export type MediaKind = "media" | "document";

const MAX_BYTES = 32 * 1024 * 1024;

/** Titre et fichier d'un QR image, vidéo ou PDF (l'état est tenu par la page, pour survivre au changement de type). */
export function MediaFields({
  kind,
  title,
  onTitle,
  file,
  onFile,
}: {
  kind: MediaKind;
  title: string;
  onTitle: (v: string) => void;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreview(null);
    };
  }, [file]);

  const pick = (next: File | null) => {
    setError(null);
    if (!next) return onFile(null);
    if (next.size > MAX_BYTES) return setError("Le fichier dépasse 32 Mo. Contactez-nous pour un envoi plus lourd.");
    if (kind === "document" && next.type !== "application/pdf") return setError("Le service document accepte uniquement un fichier PDF.");
    if (kind === "media" && !next.type.startsWith("image/") && !next.type.startsWith("video/")) {
      return setError("Le service média accepte une image (JPG, PNG, WEBP) ou une vidéo.");
    }
    onFile(next);
    if (!title.trim()) onTitle(next.name.replace(/\.[^.]+$/, "").slice(0, 80));
  };

  return (
    <div>
      <label htmlFor="media-title" className="mb-1.5 block text-sm font-medium text-ink">Nom du QR code</label>
      <input
        id="media-title"
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder={kind === "document" ? "Carte de visite, brochure…" : "Affiche, vidéo de présentation…"}
        className="field"
        maxLength={90}
      />

      <span className="mb-1.5 mt-5 block text-sm font-medium text-ink">{kind === "document" ? "Fichier PDF" : "Image ou vidéo"}</span>
      <input
        ref={input}
        type="file"
        accept={kind === "document" ? "application/pdf" : "image/*,video/*"}
        className="sr-only"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
      {!file ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ambre/50 bg-white px-6 py-9 text-center transition-colors hover:border-ambre/70 hover:bg-white/70"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-forest text-white"><UploadCloud className="h-5 w-5" /></span>
          <span className="text-sm font-semibold text-ink">{kind === "document" ? "Choisir un PDF" : "Choisir une image ou une vidéo"}</span>
          <span className="text-xs text-sage">{kind === "document" ? "PDF uniquement · 32 Mo maximum" : "JPG, PNG, WEBP, MP4, MOV · 32 Mo maximum"}</span>
        </button>
      ) : (
        <div className="surface-soft flex items-start gap-4 p-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Aperçu du fichier sélectionné" className="h-16 w-16 shrink-0 rounded-md border border-line object-cover" />
          ) : (
            <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-line bg-white text-ink">
              {kind === "document" ? <FileText className="h-6 w-6" /> : <Images className="h-6 w-6" />}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
            <p className="mt-0.5 text-xs text-sage">{(file.size / (1024 * 1024)).toFixed(2)} Mo · {file.type || "type inconnu"}</p>
            <button type="button" onClick={() => pick(null)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ink underline-offset-4 hover:underline">
              <X className="h-3.5 w-3.5" /> Remplacer
            </button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-700">{error}</p>}
    </div>
  );
}

/** Étape finale pour un compte Premium : un seul bouton, au nom du compte (la commande est à 0, déjà couverte). */
export function MediaOrder({ kind, title, file, qrStyle }: { kind: MediaKind; title: string; file: File | null; qrStyle: string }) {
  const router = useRouter();
  const contact = useAccountContact();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!file) return setError(kind === "document" ? "Choisissez un fichier PDF à l’étape 1." : "Choisissez une image ou une vidéo à l’étape 1.");
    setError(null);
    setBusy(true);
    const body = new FormData();
    body.append("serviceType", kind);
    body.append("title", title.trim() || file.name);
    body.append(kind === "document" ? "document" : "media", file);
    body.append("customerName", contact.name || contact.email);
    body.append("customerPhone", contact.phone);
    if (contact.email) body.append("customerEmail", contact.email);
    if (qrStyle) body.append("qrStyle", qrStyle);
    try {
      const order = await createOrder(body);
      // Couverte par Premium : la commande est déjà payée, on ouvre sa page.
      rememberOrder(order);
      router.push(`/commande/${order.reference}?cle=${encodeURIComponent(order.accessToken)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setBusy(false);
    }
  };

  return <CreateAction label="Créer mon QR code" busyLabel="Création en cours…" busy={busy} error={error} onCreate={create} />;
}
