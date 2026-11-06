"use client";

import Link from "next/link";
import { ArrowUpRight, Download, FileText, QrCode } from "lucide-react";
import Logo from "@/components/logo";
import { serviceLabel, type ServiceType } from "@/lib/services";

export interface MediaCardData {
  slug: string;
  serviceType: ServiceType;
  title?: string | null;
  contentUrl?: string | null;
  contentType?: string | null;
  fileName?: string | null;
  restaurantName?: string | null;
}

/**
 * Page publique d'un QR code média (image / vidéo) ou document (PDF).
 * Volontairement légère, plein écran et sans navigation superflue.
 */
export default function MediaCardView({ card }: { card: MediaCardData }) {
  const isVideo = card.contentType?.startsWith("video/") ?? false;
  const isImage = card.contentType?.startsWith("image/") ?? false;
  const isPdf =
    card.contentType === "application/pdf" ||
    Boolean(card.fileName?.toLowerCase().endsWith(".pdf"));
  const title = card.title || card.restaurantName || "Contenu Moncode";

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Moncode — accueil" className="inline-flex">
            <Logo variant="dark" />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sage">
            <QrCode className="h-3 w-3 text-ink" />
            {serviceLabel(card.serviceType)}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6">

          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink/90 sm:text-3xl">{title}</h1>
          {card.fileName && (
            <p className="mt-2 truncate text-xs text-sage">{card.fileName}</p>
          )}
        </div>

        {!card.contentUrl ? (
          <div className="surface p-10 text-center">
            <p className="text-sm text-sage">Le contenu de ce QR code n’est pas disponible.</p>
          </div>
        ) : isImage ? (
          <figure className="overflow-hidden surface p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.contentUrl}
              alt={title}
              className="mx-auto h-auto max-h-[80vh] w-auto max-w-full rounded-md object-contain"
            />
          </figure>
        ) : isVideo ? (
          <div className="overflow-hidden rounded-lg border border-line bg-black shadow-sm">
            <video
              src={card.contentUrl}
              controls
              playsInline
              preload="metadata"
              className="mx-auto max-h-[80vh] w-full"
            >
              Votre navigateur ne prend pas en charge la lecture vidéo.
            </video>
          </div>
        ) : isPdf ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 surface p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest text-white">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {card.fileName || "Document PDF"}
                  </p>
                  <p className="mt-0.5 text-xs text-sage">Document consultable et téléchargeable</p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <a
                  href={card.contentUrl}
                  download={card.fileName || `${card.slug}.pdf`}
                  className="btn btn-sm btn-outline"
                >
                  <Download className="h-3.5 w-3.5" />
                  Télécharger
                </a>
                <a
                  href={card.contentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-primary"
                >
                  Ouvrir le PDF
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="hidden overflow-hidden surface sm:block">
              <object
                data={card.contentUrl}
                type="application/pdf"
                className="h-[75vh] w-full"
                aria-label={title}
              >
                <p className="p-6 text-sm text-sage">
                  L’aperçu du PDF n’est pas disponible sur cet appareil.{" "}
                  <a href={card.contentUrl} className="font-semibold text-ink underline">
                    Ouvrir le document
                  </a>
                  .
                </p>
              </object>
            </div>
          </div>
        ) : (
          <div className="surface p-8">
            <p className="text-sm text-sage">
              Ce contenu ne peut pas être affiché directement.{" "}
              <a
                href={card.contentUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-ink underline"
              >
                L’ouvrir dans un nouvel onglet
              </a>
              .
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-8 text-xs text-sage sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Un QR code <span className="font-semibold text-ink">Moncode</span> — contenu hébergé et
            maintenu pour vous.
          </p>
          <Link
            href="/creer"
            className="inline-flex items-center gap-1.5 font-semibold text-ink underline-offset-4 hover:underline"
          >
            Créer le mien
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
