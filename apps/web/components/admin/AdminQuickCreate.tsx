"use client";

import { useRef, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Images, Loader2, QrCode, UploadCloud, X } from "lucide-react";
import QrDesigner from "@/components/qr/qr-designer";
import AdminShell from "./AdminShell";
import { useAdminFetch } from "./use-admin-fetch";

type QuickService = "media" | "document";

const META: Record<QuickService, { title: string; accept: string; field: string; hint: string; icon: typeof Images }> = {
  media: {
    title: "QR image ou vidéo",
    accept: "image/*,video/*",
    field: "media",
    hint: "JPG, PNG, WEBP, MP4, MOV · 32 Mo maximum",
    icon: Images,
  },
  document: {
    title: "QR document PDF",
    accept: "application/pdf",
    field: "document",
    hint: "PDF uniquement · 32 Mo maximum",
    icon: FileText,
  },
};

/** Création admin directe d'un QR média ou document : actif tout de suite, sans paiement. */
export default function AdminQuickCreate({ serviceType }: { serviceType: QuickService }) {
  const meta = META[serviceType];
  return (
    <AdminShell active="new" title={`Nouveau ${meta.title}`} hint="Création admin : QR actif immédiatement, sans devis">
      {(token) => <QuickForm serviceType={serviceType} adminToken={token} />}
    </AdminShell>
  );
}

function QuickForm({ serviceType, adminToken }: { serviceType: QuickService; adminToken: string }) {
  const meta = META[serviceType];
  const router = useRouter();
  const adminFetch = useAdminFetch(adminToken);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: "", clientName: "", userName: "", amountReceived: "", workDone: "" });
  const [qrStyle, setQrStyle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const pick = (next: File | null) => {
    setError(null);
    if (!next) return setFile(null);
    if (next.size > 32 * 1024 * 1024) return setError("Le fichier dépasse 32 Mo.");
    if (serviceType === "document" && next.type !== "application/pdf") return setError("Choisissez un PDF.");
    if (serviceType === "media" && !next.type.startsWith("image/") && !next.type.startsWith("video/")) {
      return setError("Choisissez une image ou une vidéo.");
    }
    setFile(next);
    if (!form.title.trim()) setForm((f) => ({ ...f, title: next.name.replace(/\.[^.]+$/, "").slice(0, 80) }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return setError(serviceType === "document" ? "Choisissez un PDF." : "Choisissez un fichier.");
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("serviceType", serviceType);
    body.append(meta.field, file);
    for (const [key, value] of Object.entries(form)) if (value.trim()) body.append(key, value.trim());
    if (qrStyle) body.append("qrStyle", qrStyle);
    try {
      const res = await adminFetch("/cards", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof data?.message === "string" ? data.message : "Création impossible.");
      router.push(`/admin/cartes/${data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible.");
      setBusy(false);
    }
  };

  const Icon = meta.icon;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/nouveau" className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Choix du parcours
      </Link>

      <form onSubmit={submit} className="surface mt-6 space-y-6 p-6 sm:p-8">
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink/70">Fichier</span>
          <input
            ref={inputRef}
            type="file"
            accept={meta.accept}
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="surface-soft flex items-center gap-4 p-4">
              <span className="icon-tile">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink/90">{file.name}</p>
                <p className="text-xs text-sage">{(file.size / (1024 * 1024)).toFixed(2)} Mo</p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sage hover:bg-white hover:text-ink"
                aria-label="Retirer le fichier"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-ambre/60 bg-leaf/40 px-6 py-10 text-center transition-colors hover:bg-leaf"
            >
              <UploadCloud className="h-6 w-6 text-forest" />
              <span className="text-sm font-semibold text-ink/90">Choisir le fichier</span>
              <span className="text-xs text-sage">{meta.hint}</span>
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-ink/70">Nom du QR code</span>
            <input className="field mt-1.5" value={form.title} onChange={set("title")} maxLength={90} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink/70">Client</span>
            <input className="field mt-1.5" value={form.clientName} onChange={set("clientName")} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink/70">Intervenant</span>
            <input className="field mt-1.5" value={form.userName} onChange={set("userName")} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink/70">Montant reçu (FCFA)</span>
            <input className="field mt-1.5" inputMode="numeric" value={form.amountReceived} onChange={set("amountReceived")} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-ink/70">Note interne</span>
            <textarea rows={2} className="field mt-1.5" value={form.workDone} onChange={set("workDone")} />
          </label>
        </div>

        <div className="border-t border-line pt-6">
          <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink/90">
            <QrCode className="h-4 w-4 text-forest" /> Style du QR code
          </p>
          <QrDesigner value={qrStyle} onChange={setQrStyle} />
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Création…" : "Créer le QR code"}
        </button>
      </form>
    </div>
  );
}
