"use client";

import { useEffect, useRef, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import type { Options } from "qr-code-styling";
import { Download, Loader2 } from "lucide-react";
import { parseQrStyle, type QrStyle } from "@/lib/qr-style";

function optionsFor(data: string, style: QrStyle, size: number, logoUrl?: string | null): Partial<Options> {
  const withLogo = Boolean(style.logo && logoUrl);
  return {
    width: size,
    height: size,
    type: "svg",
    data,
    margin: Math.round(size * 0.04),
    image: withLogo ? logoUrl! : undefined,
    qrOptions: { errorCorrectionLevel: withLogo ? "Q" : "M" },
    dotsOptions: { color: style.fg, type: style.dots },
    cornersSquareOptions: { color: style.fg, type: style.corners },
    cornersDotOptions: { color: style.fg, type: style.cornerDots },
    backgroundOptions: { color: style.bg },
    imageOptions: { crossOrigin: "anonymous", margin: Math.round(size * 0.012), imageSize: 0.32, hideBackgroundDots: true },
  };
}

/**
 * QR code stylé, rendu côté navigateur avec le style enregistré de la carte.
 * `downloadName` ajoute les boutons de téléchargement (PNG haute définition et SVG).
 */
export default function StyledQr({
  data,
  style,
  logoUrl,
  size = 220,
  downloadName,
  hideQr = false,
  className = "",
  onDownload,
}: {
  data: string;
  /** Style déjà lu, ou valeur brute de la colonne `qrStyle`. */
  style: QrStyle | string | null | undefined;
  logoUrl?: string | null;
  size?: number;
  downloadName?: string;
  /** N'affiche que les boutons de téléchargement (le QR est déjà visible ailleurs). */
  hideQr?: boolean;
  className?: string;
  /** Appelé au téléchargement (PNG ou SVG) : sert à enregistrer le QR code créé. */
  onDownload?: (extension: "png" | "svg") => void;
}) {
  const resolved = typeof style === "object" && style !== null ? style : parseQrStyle(style);
  const key = JSON.stringify(resolved);
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<QRCodeStyling | null>(null);
  const [busy, setBusy] = useState<"png" | "svg" | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("qr-code-styling").then(({ default: QRCodeStylingClass }) => {
      if (cancelled || !container.current) return;
      const options = optionsFor(data, JSON.parse(key) as QrStyle, size, logoUrl);
      if (instance.current) {
        instance.current.update(options);
      } else {
        instance.current = new QRCodeStylingClass(options);
        container.current.innerHTML = "";
        instance.current.append(container.current);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [data, key, size, logoUrl]);

  const download = async (extension: "png" | "svg") => {
    setBusy(extension);
    try {
      const { default: QRCodeStylingClass } = await import("qr-code-styling");
      // Fichier d'impression : 1200 px, indépendamment de la taille affichée.
      const file = new QRCodeStylingClass({
        ...optionsFor(data, resolved, 1200, logoUrl),
        type: extension === "svg" ? "svg" : "canvas",
      });
      await file.download({ name: downloadName || "qr-code", extension });
      onDownload?.(extension);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={className}>
      {!hideQr && (
        <div
          ref={container}
          className="mx-auto overflow-hidden rounded-xl [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
          style={{ width: size, height: size, backgroundColor: resolved.bg }}
          role="img"
          aria-label={`QR code vers ${data}`}
        />
      )}
      {downloadName && (
        <div className={`${hideQr ? "" : "mt-4 "}grid grid-cols-2 gap-2`}>
          <button type="button" onClick={() => download("svg")} disabled={busy !== null} className="btn btn-outline btn-sm">
            {busy === "svg" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} SVG
          </button>
          <button type="button" onClick={() => download("png")} disabled={busy !== null} className="btn btn-primary btn-sm">
            {busy === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PNG
          </button>
        </div>
      )}
    </div>
  );
}
