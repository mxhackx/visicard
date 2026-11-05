"use client";

import { useOrderKey } from "@/lib/use-order-key";
import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, UploadCloud } from "lucide-react";
import {
  fcfa,
  fetchOrder,
  rememberOrderKey,
  requestModification,
  type OrderView,
} from "@/lib/orders";

/** À garder aligné avec MODIFICATION_PRICES côté API (affichage indicatif). */
const MODIFICATION_PRICE: Record<OrderView["serviceType"], number> = { page: 5000, media: 2500, document: 2500 };

type PageFields = "restaurantName" | "phoneNumber" | "address" | "additionalInfo" | "facebookUrl" | "instagramUrl";

const PAGE_FIELDS: { name: PageFields; label: string; multiline?: boolean }[] = [
  { name: "restaurantName", label: "Nom de l’établissement" },
  { name: "phoneNumber", label: "Téléphone / WhatsApp" },
  { name: "address", label: "Adresse" },
  { name: "facebookUrl", label: "Lien Facebook" },
  { name: "instagramUrl", label: "Lien Instagram" },
  { name: "additionalInfo", label: "Description", multiline: true },
];

export default function ModificationForm({ reference }: { reference: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderView | null>(null);
  const key = useOrderKey(reference);
  const [fetchError, setError] = useState<string | null>(null);
  const error = key === null ? "Ouvrez d’abord votre lien privé de commande sur cet appareil." : fetchError;
  const [values, setValues] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [menu, setMenu] = useState<File[]>([]);
  const [place, setPlace] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!key) return;
    fetchOrder(reference, key)
      .then((o) => {
        setOrder(o);
        const p = o.card.preview;
        setTitle(String(p.title ?? ""));
        setValues(Object.fromEntries(PAGE_FIELDS.map((f) => [f.name, String(p[f.name] ?? "")])));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Commande introuvable."));
  }, [reference, key]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!order || !key) return;
    const p = order.card.preview;
    const body = new FormData();

    if (order.serviceType === "page") {
      for (const f of PAGE_FIELDS) {
        if ((values[f.name] ?? "") !== String(p[f.name] ?? "")) body.append(f.name, values[f.name] ?? "");
      }
      if (logo) body.append("logo", logo);
      menu.forEach((m) => body.append("menu", m));
      place.forEach((m) => body.append("place", m));
    } else {
      if (title !== String(p.title ?? "")) body.append("title", title);
      if (file) body.append(order.serviceType === "document" ? "document" : "media", file);
    }

    if ([...body.keys()].length === 0) {
      setError("Aucun changement à envoyer.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await requestModification(reference, key, body);
      rememberOrderKey(created.reference, created.accessToken);
      router.push(`/commande/${created.reference}?cle=${encodeURIComponent(created.accessToken)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "La demande a échoué.");
      setSubmitting(false);
    }
  };

  if (!order) {
    return (
      <section className="mx-auto max-w-lg px-4 py-24 text-center">
        {error ? (
          <>
            <p className="text-sm text-sage">{error}</p>
            <Link href={`/commande/${reference}`} className="btn btn-outline mt-6">
              Retour à la commande
            </Link>
          </>
        ) : (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-sage" />
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <Link
        href={`/commande/${reference}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Commande {reference}
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-[-0.02em] text-ink/90 sm:text-4xl">Modifier le contenu</h1>
      <p className="mt-3 text-base leading-7 text-sage">
        Changez ce qui doit l’être : un nouveau devis de {fcfa(MODIFICATION_PRICE[order.serviceType])} est émis, et les
        changements sont mis en ligne dès son paiement. Le QR code imprimé ne change pas.
      </p>

      <form onSubmit={submit} className="surface mt-8 space-y-6 p-6 sm:p-8">
        {order.serviceType === "page" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {PAGE_FIELDS.map((f) => (
                <label key={f.name} className={`block ${f.multiline ? "sm:col-span-2" : ""}`}>
                  <span className="text-xs font-semibold text-ink/70">{f.label}</span>
                  {f.multiline ? (
                    <textarea
                      rows={3}
                      className="field mt-1.5"
                      value={values[f.name] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    />
                  ) : (
                    <input
                      className="field mt-1.5"
                      value={values[f.name] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <FilePick label="Nouveau logo" files={logo ? [logo] : []} onPick={(f) => setLogo(f[0] ?? null)} />
              <FilePick label="Remplacer les photos du menu" multiple files={menu} onPick={setMenu} />
              <FilePick label="Remplacer les photos du lieu" multiple files={place} onPick={setPlace} />
            </div>
          </>
        ) : (
          <>
            <label className="block">
              <span className="text-xs font-semibold text-ink/70">Nom du QR code</span>
              <input className="field mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <FilePick
              label={order.serviceType === "document" ? "Nouveau PDF" : "Nouvelle image ou vidéo"}
              accept={order.serviceType === "document" ? "application/pdf" : "image/*,video/*"}
              files={file ? [file] : []}
              onPick={(f) => setFile(f[0] ?? null)}
              icon={UploadCloud}
            />
          </>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn btn-primary w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Création du devis…" : "Obtenir le devis de modification"}
          {!submitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>
    </section>
  );
}

function FilePick({
  label,
  files,
  onPick,
  multiple,
  accept = "image/*",
  icon: Icon = ImagePlus,
}: {
  label: string;
  files: File[];
  onPick: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  icon?: typeof ImagePlus;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ambre/60 bg-leaf/40 px-4 py-6 text-center transition-colors hover:bg-leaf">
      <Icon className="h-5 w-5 text-forest" />
      <span className="text-sm font-semibold text-ink/85">{label}</span>
      <span className="text-xs text-sage">
        {files.length ? `${files.length} fichier${files.length > 1 ? "s" : ""} choisi${files.length > 1 ? "s" : ""}` : "Aucun fichier"}
      </span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => onPick(Array.from(e.target.files ?? []))}
      />
    </label>
  );
}
