import { FileText } from "lucide-react";
import type { CardPreview } from "@/lib/orders";

/**
 * Aperçu d'un contenu Moncode (page, image / vidéo, PDF), partagé par la page
 * de commande du client et la fiche admin. `watermark` superpose « Aperçu ».
 */
export default function ContentPreview({
  serviceType,
  preview: p,
  watermark,
}: {
  serviceType: string;
  preview: CardPreview;
  watermark?: string | null;
}) {
  const images = [...(p.menuImages ?? []), ...(p.placeImages ?? [])];

  return (
    <div className="relative p-5">
      {serviceType === "page" ? (
        <div>
          <div className="flex items-center gap-4">
            {p.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logoUrl} alt="" className="h-20 w-20 rounded-full border border-line object-cover" />
            ) : (
              <span className="icon-tile h-20 w-20 rounded-full">
                <FileText className="h-7 w-7" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold text-ink/90">{p.restaurantName || "Établissement"}</p>
              {p.address && <p className="truncate text-sm text-sage">{p.address}</p>}
              {p.phoneNumber && <p className="text-sm text-ink/70">{p.phoneNumber}</p>}
            </div>
          </div>
          {p.additionalInfo && <p className="mt-4 text-sm leading-6 text-ink/75">{p.additionalInfo}</p>}
          {images.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-1.5">
              {images.slice(0, 12).map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>
      ) : p.contentType?.startsWith("image/") && p.contentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.contentUrl} alt={p.title ?? ""} className="max-h-[420px] w-full rounded-xl object-contain" />
      ) : p.contentType?.startsWith("video/") && p.contentUrl ? (
        <video src={p.contentUrl} controls className="max-h-[420px] w-full rounded-xl bg-ink" />
      ) : (
        <div className="flex items-center gap-4 rounded-xl border border-line bg-cream-deep p-5">
          <span className="icon-tile">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink/90">{p.title || p.fileName || "Document"}</p>
            <p className="truncate text-sm text-sage">{p.fileName}</p>
          </div>
          {p.contentUrl && (
            <a href={p.contentUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm shrink-0">
              Ouvrir
            </a>
          )}
        </div>
      )}

      {watermark && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="rotate-[-18deg] rounded-xl border-2 border-forest/25 px-5 py-2 text-2xl font-bold uppercase tracking-[0.2em] text-forest/25">
            {watermark}
          </span>
        </div>
      )}
    </div>
  );
}
