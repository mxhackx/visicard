"use client";
import RestaurantCardLayout from "../../../components/RestaurantCardLayout";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CardData {
  slug: string;
  imageUrl: string;
  cardUrl: string;
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
  schedule?: any;
  themeId?: string | null;
  cardLayout?: string | null;
  qrStyle?: string | null;
  createdAt: string;
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
          throw new Error("Cette carte ou ce restaurant est introuvable.");
        }
        return res.json();
      })
      .then((data: CardData) => {
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Chargement du menu...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            😕
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Oops !</h1>
          <p className="text-slate-500 mb-6">{error || "Carte introuvable."}</p>
          <Link href="/" className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-blue-700 transition-colors">
            Créer ma carte Visicard
          </Link>
        </div>
      </div>
    );
  }

  const cleanPhone = card.phoneNumber ? card.phoneNumber.replace(/\D/g, '') : null;
  const safeLocationUrl = card.locationUrl && (card.locationUrl.startsWith("http://") || card.locationUrl.startsWith("https://"))
    ? card.locationUrl
    : card.locationUrl 
      ? `https://${card.locationUrl}`
      : null;

  const themeClass = `restaurant-${card.themeId || "theme-1"}`;

  return (
    <div className={`min-h-screen w-full bg-slate-100 flex items-center justify-center font-sans ${themeClass}`}>
      <main className="w-full sm:max-w-[420px] min-h-screen sm:min-h-[100dvh] relative bg-white sm:shadow-2xl sm:border-x border-slate-200 overflow-x-hidden" style={{ backgroundColor: "var(--theme-bg)" }}>
        <RestaurantCardLayout 
          restaurantName={card.restaurantName || ""}
          address={card.address || undefined}
          logoUrl={card.logoUrl || undefined}
          locationUrl={safeLocationUrl || undefined}
          phoneNumber={cleanPhone || undefined}
          facebookUrl={card.facebookUrl || undefined}
          instagramUrl={card.instagramUrl || undefined}
          xUrl={card.xUrl || undefined}
          snapchatUrl={card.snapchatUrl || undefined}
          additionalInfo={card.additionalInfo || undefined}
          schedule={card.schedule}
          menuImages={card.menuImages || []}
          placeImages={card.placeImages || []}
          layout={card.cardLayout || "classic"}
        />
      </main>
    </div>
  );
}
