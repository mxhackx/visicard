"use client";

import { useState } from "react";
import { AlertCircle, ImagePlus, Loader2, Save, X } from "lucide-react";
import { CardSummary, cardAmount } from "./AdminCardsList";
import { useAdminFetch } from "./use-admin-fetch";

interface AdminEditCardModalProps {
  card: CardSummary;
  adminToken: string;
  onClose: () => void;
  onSuccess: (updatedCard: CardSummary) => void;
}

const textFields = [
  { name: "title", label: "Titre", placeholder: "Carte du midi" },
  { name: "restaurantName", label: "Établissement", placeholder: "Le Comptoir" },
  { name: "clientName", label: "Client", placeholder: "Awa Kouassi" },
  { name: "phoneNumber", label: "Téléphone", placeholder: "+229 01 00 00 00 00" },
  { name: "address", label: "Adresse", placeholder: "Cotonou, Haie Vive" },
  { name: "userName", label: "Intervenant", placeholder: "Nom de l'intervenant" },
  { name: "amountReceived", label: "Montant reçu (FCFA)", placeholder: "20000" },
] as const;

type FieldName = (typeof textFields)[number]["name"] | "workDone" | "additionalInfo";

/** L'API renvoie la ligne brute : on la remet au format de la liste. */
function normalize(raw: Record<string, unknown>, previous: CardSummary): CardSummary {
  let menuImages = raw.menuImages as unknown;
  if (typeof menuImages === "string") {
    try {
      menuImages = JSON.parse(menuImages);
    } catch {
      menuImages = [menuImages];
    }
  }
  return {
    ...previous,
    ...(raw as Partial<CardSummary>),
    id: String(raw.id ?? previous.id),
    menuImages: Array.isArray(menuImages) ? (menuImages as string[]) : previous.menuImages,
  };
}

export default function AdminEditCardModal({ card, adminToken, onClose, onSuccess }: AdminEditCardModalProps) {
  const adminFetch = useAdminFetch(adminToken);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Record<FieldName, string>>({
    title: card.title ?? "",
    restaurantName: card.restaurantName ?? "",
    clientName: card.clientName ?? "",
    phoneNumber: card.phoneNumber ?? "",
    userName: card.userName ?? "",
    amountReceived: cardAmount(card) ? String(cardAmount(card)) : "",
    workDone: card.workDone ?? "",
    address: card.address ?? "",
    additionalInfo: card.additionalInfo ?? "",
  });
  const [contentFile, setContentFile] = useState<File | null>(null);

  const [existingMenu, setExistingMenu] = useState<string[]>(card.menuImages ?? []);
  const [file, setFile] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [menu, setMenu] = useState<File[]>([]);

  const isPage = (card.serviceType ?? "page") === "page";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const body = new FormData();
    for (const [key, value] of Object.entries(form)) body.append(key, value.trim());
    if (isPage) body.append("existingMenuUrls", JSON.stringify(existingMenu));
    if (file) body.append("file", file);
    if (logo) body.append("logo", logo);
    menu.forEach((m) => body.append("menu", m));
    if (!isPage && contentFile) body.append(card.serviceType === "document" ? "document" : "media", contentFile);

    try {
      const res = await adminFetch(`/cards/${card.slug}`, { method: "PATCH", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(typeof data?.message === "string" ? data.message : "Échec de la mise à jour.");
      }
      onSuccess(normalize(data ?? {}, card));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-title"
      onMouseDown={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 id="edit-title" className="text-lg font-semibold text-ink/90">
              Modifier le QR code
            </h2>
            <p className="text-sm text-sage">/c/{card.slug}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sage transition-colors hover:bg-cream-deep hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-6 overflow-y-auto px-6 py-5">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {textFields.map((f) => (
                <label key={f.name} className="block">
                  <span className="text-xs font-semibold text-ink/70">{f.label}</span>
                  <input
                    name={f.name}
                    value={form[f.name]}
                    inputMode={f.name === "amountReceived" ? "numeric" : undefined}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                    className="field mt-1.5"
                  />
                </label>
              ))}
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink/70">Description affichée</span>
                <textarea
                  name="additionalInfo"
                  rows={2}
                  value={form.additionalInfo}
                  onChange={(e) => setForm((p) => ({ ...p, additionalInfo: e.target.value }))}
                  className="field mt-1.5"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink/70">Travail réalisé (interne)</span>
                <textarea
                  name="workDone"
                  rows={2}
                  value={form.workDone}
                  onChange={(e) => setForm((p) => ({ ...p, workDone: e.target.value }))}
                  className="field mt-1.5"
                />
              </label>
            </div>

            {!isPage && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-forest/40 bg-leaf/40 p-4 transition-colors hover:bg-leaf">
                <ImagePlus className="h-5 w-5 shrink-0 text-forest" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink/85">
                    {card.serviceType === "document" ? "Remplacer le PDF" : "Remplacer l’image ou la vidéo"}
                  </span>
                  <span className="block truncate text-xs text-sage">{contentFile ? contentFile.name : "Aucun nouveau fichier"}</span>
                </span>
                <input
                  type="file"
                  accept={card.serviceType === "document" ? "application/pdf" : "image/*,video/*"}
                  className="sr-only"
                  onChange={(e) => setContentFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}

            {isPage && (
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageInput label="Image principale" current={card.imageUrl} file={file} onChange={setFile} />
                <ImageInput label="Logo" current={card.logoUrl ?? undefined} file={logo} onChange={setLogo} />
              </div>
            )}

            {isPage && (
              <div>
                <p className="text-xs font-semibold text-ink/70">Images du menu</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {existingMenu.map((url) => (
                    <div key={url} className="group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-16 w-16 rounded-lg border border-line object-cover" />
                      <button
                        type="button"
                        aria-label="Retirer cette image"
                        onClick={() => setExistingMenu((prev) => prev.filter((u) => u !== url))}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-forest/40 bg-leaf/60 text-forest transition-colors hover:bg-leaf">
                    <ImagePlus className="h-5 w-5" />
                    <span className="sr-only">Ajouter des images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => setMenu(Array.from(e.target.files ?? []))}
                    />
                  </label>
                </div>
                {menu.length > 0 && (
                  <p className="mt-2 text-xs text-sage">
                    {menu.length} nouvelle{menu.length > 1 ? "s" : ""} image{menu.length > 1 ? "s" : ""} à ajouter
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-line bg-cream-deep/60 px-6 py-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn-outline bg-white">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImageInput({
  label,
  current,
  file,
  onChange,
}: {
  label: string;
  current?: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const preview = file ? URL.createObjectURL(file) : current;
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:border-forest/40">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-line object-cover" />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-leaf text-forest">
          <ImagePlus className="h-5 w-5" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink/85">{label}</span>
        <span className="block truncate text-xs text-sage">{file ? file.name : "Cliquer pour remplacer"}</span>
      </span>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
