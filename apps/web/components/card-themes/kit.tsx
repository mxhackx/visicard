"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, FileImage, X } from "lucide-react";

/* ------------------------------------------------------------------
   Kit commun aux dispositions de page digitale : données dérivées,
   icônes de marques, horaires, visionneuse de menu, carte.
   Les couleurs viennent des variables `--pg-*` (voir lib/palette).
------------------------------------------------------------------ */

export interface ScheduleDay {
  isOpen: boolean;
  open: string;
  close: string;
}

export interface CardThemeProps {
  restaurantName: string;
  logoUrl?: string;
  address?: string;
  locationUrl?: string;
  phoneNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  snapchatUrl?: string;
  additionalInfo?: string;
  schedule?: Record<string, ScheduleDay>;
  menuImages: string[];
  placeImages?: string[];
  inPreview?: boolean;
  tagline?: string;
}

export const DAYS = [
  { id: "monday", label: "Lundi", js: 1 },
  { id: "tuesday", label: "Mardi", js: 2 },
  { id: "wednesday", label: "Mercredi", js: 3 },
  { id: "thursday", label: "Jeudi", js: 4 },
  { id: "friday", label: "Vendredi", js: 5 },
  { id: "saturday", label: "Samedi", js: 6 },
  { id: "sunday", label: "Dimanche", js: 0 },
] as const;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export interface OpenStatus {
  open: boolean;
  label: string;
}

/** « Ouvert · ferme à 22:00 » / « Fermé · ouvre demain à 09:00 ». Gère les horaires après minuit. */
export function openStatus(schedule?: Record<string, ScheduleDay>, now = new Date()): OpenStatus | null {
  if (!schedule || !DAYS.some((d) => schedule[d.id]?.isOpen)) return null;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = DAYS.find((d) => d.js === now.getDay())!;
  const yesterday = DAYS.find((d) => d.js === (now.getDay() + 6) % 7)!;

  const y = schedule[yesterday.id];
  if (y?.isOpen && toMinutes(y.close) < toMinutes(y.open) && minutes < toMinutes(y.close)) {
    return { open: true, label: `Ouvert · ferme à ${y.close}` };
  }
  const t = schedule[today.id];
  if (t?.isOpen) {
    const [o, c] = [toMinutes(t.open), toMinutes(t.close)];
    const overnight = c <= o;
    if (minutes >= o && (overnight || minutes < c)) return { open: true, label: `Ouvert · ferme à ${t.close}` };
    if (minutes < o) return { open: false, label: `Fermé · ouvre à ${t.open}` };
  }
  for (let i = 1; i <= 7; i++) {
    const day = DAYS.find((d) => d.js === (now.getDay() + i) % 7)!;
    const h = schedule[day.id];
    if (h?.isOpen) return { open: false, label: `Fermé · ouvre ${i === 1 ? "demain" : day.label.toLowerCase()} à ${h.open}` };
  }
  return { open: false, label: "Fermé" };
}

/** Ne calcule l'état qu'après montage (l'heure du serveur n'est pas celle du visiteur). */
export function useOpenStatus(schedule?: Record<string, ScheduleDay>) {
  const [status, setStatus] = useState<OpenStatus | null>(null);
  useEffect(() => {
    const update = () => setStatus(openStatus(schedule));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [schedule]);
  return status;
}

export function todayId(): string {
  return DAYS.find((d) => d.js === new Date().getDay())!.id;
}

export interface Social {
  id: "instagram" | "facebook" | "x" | "snapchat";
  label: string;
  href: string;
}

/** Données prêtes à afficher, communes à toutes les dispositions. */
export function useCardData(p: CardThemeProps) {
  const name = p.restaurantName?.trim() || "Votre établissement";
  const digits = (p.phoneNumber ?? "").replace(/\D/g, "");
  const lines = (p.additionalInfo ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const candidates: { id: Social["id"]; label: string; href?: string }[] = [
    { id: "instagram", label: "Instagram", href: p.instagramUrl },
    { id: "facebook", label: "Facebook", href: p.facebookUrl },
    { id: "x", label: "X", href: p.xUrl },
    { id: "snapchat", label: "Snapchat", href: p.snapchatUrl },
  ];
  const socials = candidates.filter((s): s is Social => Boolean(s.href));
  const photos = p.placeImages ?? [];
  return {
    name,
    initial: name.charAt(0).toUpperCase(),
    tagline: p.tagline && p.tagline !== p.restaurantName ? p.tagline : undefined,
    lines,
    whatsapp: digits ? `https://wa.me/${digits}` : undefined,
    tel: digits ? `tel:+${digits}` : undefined,
    phoneLabel: p.phoneNumber ? formatPhone(p.phoneNumber) : undefined,
    socials,
    photos,
    cover: photos[0] ?? p.menuImages[0],
    coords: coordsFromUrl(p.locationUrl),
    /** En aperçu, aucun lien ne quitte l'éditeur. */
    href: (url?: string) => (p.inPreview ? undefined : url),
    target: p.inPreview ? undefined : "_blank",
  };
}

export function formatPhone(raw: string): string {
  const m = raw.match(/^\+(\d{3})(\d+)$/);
  if (!m) return raw;
  return `+${m[1]} ${m[2].replace(/(\d{2})(?=\d)/g, "$1 ")}`;
}

export function coordsFromUrl(url?: string): { lat: number; lng: number } | null {
  if (!url) return null;
  const m = url.match(/[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ?? url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/* ---------- Icônes de marques ---------- */

export function BrandIcon({ id, className = "h-4 w-4" }: { id: Social["id"] | "whatsapp"; className?: string }) {
  const paths: Record<string, ReactNode> = {
    whatsapp: (
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.9 9.9 0 0 0 12.04 2Zm5.8 14.03c-.25.69-1.44 1.32-1.98 1.37-.5.05-1.13.07-1.83-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-2.99s.75-2.12 1.01-2.41c.27-.29.58-.36.78-.36h.56c.18 0 .42-.07.66.5.25.6.84 2.05.91 2.2.08.15.12.32.03.51-.1.2-.15.32-.29.49-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.29.14.46.12.63-.08.17-.19.73-.85.92-1.15.19-.29.39-.24.65-.14.27.1 1.7.8 1.99.95.29.14.49.22.56.34.07.12.07.71-.18 1.4Z" />
    ),
    instagram: (
      <path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 4.86a4.94 4.94 0 1 0 0 9.88 4.94 4.94 0 0 0 0-9.88Zm0 8.15a3.21 3.21 0 1 1 0-6.42 3.21 3.21 0 0 1 0 6.42Zm6.29-8.35a1.15 1.15 0 1 1-2.31 0 1.15 1.15 0 0 1 2.31 0Z" />
    ),
    facebook: (
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.91h-2.33V22c4.78-.76 8.43-4.92 8.43-9.94Z" />
    ),
    x: <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45Z" />,
    snapchat: (
      <path d="M12.06 2c2.3 0 4.27 1.33 5.2 3.4.32.72.34 1.6.3 2.54l-.05.98c.27.15.6.22.95.13.47-.12.9.12 1.02.5.13.45-.2.82-.66 1-.36.14-.78.25-1.07.43-.24.15-.3.38-.2.62.82 1.86 2.12 3.07 3.87 3.6.33.1.47.42.33.72-.28.6-1.37.9-2.16 1.04-.1.13-.14.5-.22.84-.06.27-.27.42-.56.41-.4-.02-.94-.17-1.67-.06-.98.15-1.63.86-2.6 1.4-.75.43-1.53.65-2.36.65h-.12c-.83 0-1.62-.22-2.36-.65-.98-.54-1.62-1.25-2.6-1.4-.73-.11-1.28.04-1.68.06-.28.01-.5-.14-.55-.41-.08-.34-.13-.7-.22-.84-.8-.13-1.88-.44-2.16-1.04-.14-.3 0-.62.33-.72 1.75-.53 3.05-1.74 3.87-3.6.1-.24.04-.47-.2-.62-.29-.18-.71-.29-1.07-.43-.46-.18-.79-.55-.66-1 .12-.38.55-.62 1.02-.5.35.09.68.02.95-.13l-.05-.98c-.04-.94-.02-1.82.3-2.54C7.79 3.33 9.76 2 12.06 2Z" />
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      {paths[id]}
    </svg>
  );
}

/* ---------- Visionneuse plein écran ---------- */

export function Lightbox({ images, index, onClose }: { images: string[]; index: number | null; onClose: () => void }) {
  const [current, setCurrent] = useState(index ?? 0);
  const [shown, setShown] = useState(index);
  if (shown !== index) {
    setShown(index);
    if (index !== null) setCurrent(index);
  }
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((c) => (c + 1) % images.length);
      if (e.key === "ArrowLeft") setCurrent((c) => (c - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose]);

  if (index === null || images.length === 0) return null;
  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/92" role="dialog" aria-modal="true" aria-label="Menu en plein écran">
      <div className="flex items-center justify-between px-4 py-3 text-sm text-white/80">
        <span>
          {current + 1} / {images.length}
        </span>
        <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Fermer">
          <X className="h-5 w-5 text-white" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[current]} alt={`Page ${current + 1}`} className="max-h-full max-w-full rounded-lg object-contain" />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25"
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrent((c) => (c + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25"
              aria-label="Page suivante"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Emplacement vide (aperçu sans photo). */
export function EmptyImage({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 border border-dashed border-[var(--pg-line)] bg-[var(--pg-soft)] text-[var(--pg-muted)] ${className}`}>
      <FileImage className="h-6 w-6 opacity-70" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

/** Carte OpenStreetMap intégrée (sans clé d'API). */
export function MapFrame({ coords, className = "" }: { coords: { lat: number; lng: number }; className?: string }) {
  const d = 0.006;
  const bbox = [coords.lng - d, coords.lat - d / 1.6, coords.lng + d, coords.lat + d / 1.6].join(",");
  return (
    <iframe
      title="Carte"
      loading="lazy"
      className={`block w-full border-0 ${className}`}
      src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lng}`}
    />
  );
}
