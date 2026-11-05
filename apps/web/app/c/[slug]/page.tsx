"use client";
import RestaurantCardLayout from "../../../components/RestaurantCardLayout";
import type { ScheduleDay } from "@/components/card-themes/kit";
import MediaCardView from "../../../components/media-card-view";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CardData {
  slug: string;
  imageUrl: string;
  cardUrl: string;
  serviceType?: "page" | "media" | "document" | string | null;
  title?: string | null;
  contentUrl?: string | null;
  contentType?: string | null;
  fileName?: string | null;
  restaurantName?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  locationUrl?: string | null;
  phoneNumber?: string | null;
  menuImages?: string[];
  placeImages?: string[];
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  xUrl?: string | null;
  snapchatUrl?: string | null;
  additionalInfo?: string | null;
  schedule?: Record<string, ScheduleDay>;
  themeId?: string | null;
  cardLayout?: string | null;
  qrStyle?: string | null;
  createdAt: string;
  status?: "draft" | "active" | "rejected";
}

export default function CardViewPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";

    fetch(`${apiUrl}/cards/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Ce QR code est introuvable.");
        }
        return res.json();
      })
      .then((data: CardData) => {
        if (data.status !== "draft" && data.status !== "rejected") recordScan(apiUrl, slug);
        if (isMounted) {
          setCard(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Erreur de récupération de la carte :", err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-line border-t-ink rounded-full animate-spin"></div>
          <p className="text-sage font-medium">Chargement du contenu…</p>
        </div>
      </div>
    );
  }

  // Commande pas encore payée : le contenu n'est pas publié.
  if (card?.status === "draft" || card?.status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans p-6 text-center">
        <div className="surface max-w-md w-full p-8">
          <div className="w-14 h-14 bg-leaf text-ambre-deep rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-ink/90 mb-2">
            {card.status === "rejected" ? "QR code désactivé" : "QR code pas encore activé"}
          </h1>
          <p className="text-sage mb-6">
            {card.status === "rejected"
              ? "Ce contenu n’est pas disponible pour le moment."
              : "Ce contenu sera visible dès que la commande associée aura été réglée."}
          </p>
          <Link href="/" className="btn btn-primary">
            Découvrir Moncode
          </Link>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-line">
          <div className="w-14 h-14 bg-leaf text-ambre-deep rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M12 7v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="16" r="0.8" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-ink mb-2">QR code introuvable</h1>
          <p className="text-sage mb-6">{error || "Ce contenu n'existe plus ou a été supprimé."}</p>
          <Link href="/" className="btn btn-primary">
            Créer mon QR code
          </Link>
        </div>
      </div>
    );
  }

  const serviceType = (card.serviceType ?? "page") as "page" | "media" | "document";

  if (serviceType === "media" || serviceType === "document") {
    return (
      <MediaCardView
        card={{
          slug: card.slug,
          serviceType,
          title: card.title,
          contentUrl: card.contentUrl,
          contentType: card.contentType,
          fileName: card.fileName,
          restaurantName: card.restaurantName,
        }}
      />
    );
  }

  const safeLocationUrl =
    card.locationUrl && (card.locationUrl.startsWith("http://") || card.locationUrl.startsWith("https://"))
      ? card.locationUrl
      : card.locationUrl
        ? `https://${card.locationUrl}`
        : null;

  return (
    <div className="min-h-screen w-full font-sans [overflow-x:clip]">
      <main className="relative min-h-[100dvh] w-full">
        <RestaurantCardLayout
          restaurantName={card.restaurantName || ""}
          address={card.address || undefined}
          logoUrl={card.logoUrl || undefined}
          locationUrl={safeLocationUrl || undefined}
          phoneNumber={card.phoneNumber || undefined}
          facebookUrl={card.facebookUrl || undefined}
          instagramUrl={card.instagramUrl || undefined}
          xUrl={card.xUrl || undefined}
          snapchatUrl={card.snapchatUrl || undefined}
          additionalInfo={card.additionalInfo || undefined}
          schedule={card.schedule}
          menuImages={card.menuImages || []}
          placeImages={card.placeImages || []}
          layout={card.cardLayout || "classic"}
          tagline={card.title || undefined}
          themeId={card.themeId || undefined}
        />
      </main>
    </div>
  );
}

/** Une visite = un scan, compté une fois par session de navigation. */
function recordScan(apiUrl: string, slug: string) {
  try {
    const key = `moncode-scan-${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Stockage indisponible (navigation privée stricte) : on compte quand même.
  }
  fetch(`${apiUrl}/cards/${encodeURIComponent(slug)}/scan`, { method: "POST", keepalive: true }).catch(() => {});
}
