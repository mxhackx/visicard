import type { Metadata } from "next";
import { SITE, SITE_URL } from "@/lib/site";

/**
 * Référencement des pages publiques des clients. La page elle-même est rendue
 * dans le navigateur ; ce layout serveur fournit titre, description, aperçu de
 * partage (WhatsApp, Facebook…) et données structurées « LocalBusiness ».
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";

interface PublicCard {
  slug: string;
  status?: string;
  serviceType?: string;
  title?: string | null;
  restaurantName?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  locationUrl?: string | null;
  additionalInfo?: string | null;
  logoUrl?: string | null;
  menuImages?: string[];
  placeImages?: string[];
  contentUrl?: string | null;
  contentType?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  xUrl?: string | null;
  snapchatUrl?: string | null;
  schedule?: Record<string, { isOpen: boolean; open: string; close: string }> | null;
}

/** Une seule requête par rendu : partagée entre generateMetadata et le layout. */
async function loadCard(slug: string): Promise<PublicCard | null> {
  try {
    const res = await fetch(`${API_URL}/cards/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as PublicCard;
  } catch {
    return null;
  }
}

const isPublished = (card: PublicCard | null): card is PublicCard =>
  Boolean(card) && card!.status !== "draft" && card!.status !== "rejected";

function nameOf(card: PublicCard): string {
  return card.restaurantName || card.title || "Contenu Moncode";
}

function describe(card: PublicCard): string {
  const firstLine = (card.additionalInfo ?? "").split(/\r?\n/).map((l) => l.trim()).find(Boolean);
  if (card.serviceType === "document") return `${nameOf(card)} : document PDF à consulter en ligne.`;
  if (card.serviceType === "media") return `${nameOf(card)} : ${card.contentType?.startsWith("video/") ? "vidéo" : "image"} à voir en ligne.`;
  const base = firstLine || `Menu, horaires et contact de ${nameOf(card)}.`;
  return card.address ? `${base} ${card.address}.`.slice(0, 160) : base.slice(0, 160);
}

function previewImage(card: PublicCard): string | undefined {
  if (card.serviceType === "media" && card.contentType?.startsWith("image/")) return card.contentUrl ?? undefined;
  return card.placeImages?.[0] || card.logoUrl || card.menuImages?.[0] || undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const card = await loadCard(slug);
  if (!isPublished(card)) {
    return { title: "QR code", robots: { index: false, follow: false } };
  }
  const title = nameOf(card);
  const description = describe(card);
  const image = previewImage(card);
  return {
    title: { absolute: `${title} · ${SITE.name}` },
    description,
    alternates: { canonical: `/c/${slug}` },
    openGraph: {
      type: "website",
      url: `/c/${slug}`,
      title,
      description,
      siteName: SITE.name,
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

const DAY_CODES: Record<string, string> = {
  monday: "Mo",
  tuesday: "Tu",
  wednesday: "We",
  thursday: "Th",
  friday: "Fr",
  saturday: "Sa",
  sunday: "Su",
};

function coordinates(url?: string | null) {
  const m = url?.match(/[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ?? url?.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  return m ? { latitude: Number(m[1]), longitude: Number(m[2]) } : null;
}

/** Fiche établissement pour Google : adresse, téléphone, horaires, réseaux. */
function businessJsonLd(card: PublicCard, slug: string) {
  const geo = coordinates(card.locationUrl);
  const hours = Object.entries(card.schedule ?? {})
    .filter(([day, h]) => DAY_CODES[day] && h?.isOpen)
    .map(([day, h]) => `${DAY_CODES[day]} ${h.open}-${h.close}`);
  const sameAs = [card.facebookUrl, card.instagramUrl, card.xUrl, card.snapchatUrl].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: nameOf(card),
    url: `${SITE_URL}/c/${slug}`,
    description: describe(card),
    image: previewImage(card),
    logo: card.logoUrl || undefined,
    telephone: card.phoneNumber || undefined,
    address: card.address ? { "@type": "PostalAddress", streetAddress: card.address } : undefined,
    geo: geo ? { "@type": "GeoCoordinates", ...geo } : undefined,
    hasMap: card.locationUrl || undefined,
    openingHours: hours.length ? hours : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

export default async function PublicCardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = await loadCard(slug);
  const jsonLd =
    isPublished(card) && (card.serviceType ?? "page") === "page"
      ? JSON.stringify(businessJsonLd(card, slug)).replace(/</g, "\\u003c")
      : null;
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
      {children}
    </>
  );
}
