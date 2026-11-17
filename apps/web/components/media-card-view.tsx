"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Download, Expand, FileText, Music, QrCode, Share2 } from "lucide-react";
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
 * Page publique d'un QR code média (image, vidéo, audio) ou document (PDF) : légère, pensée pour le téléphone
 * (c'est là qu'on scanne), avec les gestes attendus : agrandir, télécharger, partager.
 */
export default function MediaCardView({ card }: { card: MediaCardData }) {
  const type = card.contentType ?? "";
  const isVideo = type.startsWith("video/");
  const isImage = type.startsWith("image/");
  const isAudio = type.startsWith("audio/");
  const isPdf = type === "application/pdf" || Boolean(card.fileName?.toLowerCase().endsWith(".pdf"));
  const title = card.title || card.restaurantName || "Contenu Moncode";
  const url = card.contentUrl ?? "";
  const kind = isPdf ? "Document PDF" : isVideo ? "Vidéo" : isAudio ? "Audio" : isImage ? "Image" : serviceLabel(card.serviceType);

  return (
    <div className="flex min-h-[100svh] flex-col bg-[linear-gradient(#fff,#fbf5f5)] text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link href="/" aria-label="Moncode — accueil" className="inline-flex">
            <Logo variant="dark" />
          </Link>
          <ShareButton title={title} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-10 pt-6 sm:px-6 sm:pt-10">
        <div className="mb-5 sm:mb-7">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">
            <QrCode className="h-3 w-3 text-forest" />
            {kind}
          </span>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">{title}</h1>
          {card.fileName && !isImage && !isPdf && <p className="mt-1.5 truncate text-sm text-sage">{card.fileName}</p>}
        </div>

        {!url ? (
          <div className="surface p-10 text-center">
            <p className="text-sm text-sage">Le contenu de ce QR code n’est pas disponible.</p>
          </div>
        ) : isImage ? (
          <figure className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_44px_rgba(23,23,26,0.1)]">
            <div className="flex items-center justify-center bg-cream-deep p-2 sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={title} className="h-auto max-h-[78vh] w-auto max-w-full rounded-lg object-contain" />
            </div>
            <figcaption className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-white px-3 py-2.5">
              <a href={url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline"><Expand className="h-3.5 w-3.5" /> Agrandir</a>
              <a href={url} download={card.fileName || undefined} className="btn btn-sm btn-primary"><Download className="h-3.5 w-3.5" /> Télécharger</a>
            </figcaption>
          </figure>
        ) : isVideo ? (
          <div className="overflow-hidden rounded-2xl border border-line bg-black shadow-[0_18px_44px_rgba(23,23,26,0.18)]">
            <video src={url} controls playsInline preload="metadata" className="mx-auto max-h-[78vh] w-full">
              Votre navigateur ne prend pas en charge la lecture vidéo.
            </video>
          </div>
        ) : isAudio ? (
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-line bg-white p-8 text-center shadow-[0_18px_44px_rgba(23,23,26,0.1)] sm:p-12">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-forest text-white shadow-[0_18px_40px_rgba(227,5,29,0.28)]">
              <Music className="h-10 w-10" />
            </span>
            <audio src={url} controls preload="metadata" className="w-full max-w-xl">
              Votre navigateur ne prend pas en charge la lecture audio.
            </audio>
            <a href={url} download={card.fileName || undefined} className="btn btn-sm btn-outline"><Download className="h-3.5 w-3.5" /> Télécharger l’audio</a>
          </div>
        ) : isPdf ? (
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_44px_rgba(23,23,26,0.1)]">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-forest text-white shadow-[0_10px_24px_rgba(227,5,29,0.25)]">
                  <FileText className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-ink">{card.fileName || "Document PDF"}</p>
                  <p className="mt-0.5 text-sm text-sage">Consultable en ligne, téléchargeable</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row">
                <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary max-sm:w-full">
                  Ouvrir le PDF <ArrowUpRight className="h-4 w-4" />
                </a>
                <a href={url} download={card.fileName || `${card.slug}.pdf`} className="btn btn-outline max-sm:w-full">
                  <Download className="h-4 w-4" /> Télécharger
                </a>
              </div>
            </div>
            {/* L'aperçu intégré n'est pas fiable sur téléphone : il n'est proposé que sur grand écran. */}
            <div className="hidden border-t border-line bg-cream-deep sm:block">
              <object data={`${url}#view=FitH`} type="application/pdf" className="h-[78vh] w-full" aria-label={title}>
                <p className="p-6 text-sm text-sage">
                  L’aperçu du PDF n’est pas disponible sur cet appareil.{" "}
                  <a href={url} className="font-semibold text-forest underline">Ouvrir le document</a>.
                </p>
              </object>
            </div>
          </div>
        ) : (
          <div className="surface p-8 text-center">
            <p className="text-sm text-sage">
              Ce contenu ne peut pas être affiché directement.{" "}
              <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-forest underline">L’ouvrir dans un nouvel onglet</a>.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 px-4 py-5 pb-24 text-center sm:flex-row sm:px-6 sm:pb-5 sm:text-left">
          <p className="text-sm text-sage">Ce QR code a été créé avec <strong className="font-semibold text-ink">Moncode</strong>.</p>
          <Link href="/creer" className="btn btn-primary btn-sm">Créer le mien <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
      </footer>
    </div>
  );
}

/** Partage natif du téléphone ; à défaut, copie le lien de la page. */
function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const href = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url: href });
        return;
      }
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* partage annulé : rien à faire */
    }
  };
  return (
    <button type="button" onClick={share} className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-white px-3.5 text-sm font-medium text-ink/80 transition hover:border-forest hover:text-forest active:scale-95">
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Lien copié" : "Partager"}
    </button>
  );
}
