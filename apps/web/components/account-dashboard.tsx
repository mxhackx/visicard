"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  FileText,
  Images,
  Loader2,
  LogOut,
  PanelsTopLeft,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { serviceLabel, type ServiceType } from "@/lib/services";

interface AccountCard {
  id: string;
  slug: string;
  title: string;
  serviceType: ServiceType;
  imageUrl: string;
  contentUrl: string | null;
  contentType: string | null;
  fileName: string | null;
  restaurantName: string | null;
  cardUrl: string;
  qrCode: string;
  createdAt: string;
}

const serviceIcons = {
  page: PanelsTopLeft,
  media: Images,
  document: FileText,
} satisfies Record<ServiceType, typeof PanelsTopLeft>;

export default function AccountDashboard() {
  const router = useRouter();
  const { authToken, authRole, authUser, isAuthLoading, refreshAccessToken, logoutSession } =
    useFile();

  const [cards, setCards] = useState<AccountCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const isAuthed = Boolean(authToken || authRole);

  useEffect(() => {
    if (isAuthLoading || isAuthed) return;
    router.replace("/connexion?next=%2Fcompte");
  }, [isAuthLoading, isAuthed, router]);

  const loadCards = useCallback(async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";

    const request = (token: string | null) =>
      fetch(`${apiUrl}/cards/mine`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

    let res = await request(authToken);

    if (res.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        res = await request(refreshed);
      }
    }

    if (res.status === 401) {
      logoutSession();
      router.replace("/connexion?next=%2Fcompte");
      return;
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        typeof data?.message === "string"
          ? data.message
          : "Impossible de charger vos QR codes pour le moment.",
      );
    }

    setCards(Array.isArray(data) ? (data as AccountCard[]) : []);
  }, [authToken, refreshAccessToken, logoutSession, router]);

  useEffect(() => {
    if (!isAuthed) return;

    let active = true;
    setIsLoading(true);

    loadCards()
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Une erreur est survenue.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthed, loadCards]);

  const counts = useMemo(
    () => ({
      page: cards.filter((card) => card.serviceType === "page").length,
      media: cards.filter((card) => card.serviceType === "media").length,
      document: cards.filter((card) => card.serviceType === "document").length,
    }),
    [cards],
  );

  const handleDelete = async (card: AccountCard) => {
    const confirmed = window.confirm(
      `Supprimer « ${card.title || card.slug} » ? Le QR code déjà imprimé cessera de fonctionner.`,
    );
    if (!confirmed) return;

    setDeleting(card.slug);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";

    const request = (token: string | null) =>
      fetch(`${apiUrl}/cards/${card.slug}`, {
        method: "DELETE",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

    try {
      let res = await request(authToken);

      if (res.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          res = await request(refreshed);
        }
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data?.message === "string" ? data.message : "Suppression impossible.",
        );
      }

      setCards((current) => current.filter((item) => item.slug !== card.slug));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // La session locale est effacée de toute façon.
    }
    logoutSession();
    router.replace("/");
  };

  if (!isAuthed && !isAuthLoading) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4 py-20 text-center">
        <div>
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-ink" />
          <p className="mt-4 text-sm text-sage">Redirection vers la connexion…</p>
        </div>
      </section>
    );
  }

  const summary = [
    { id: "page" as ServiceType, label: "Pages digitales", value: counts.page },
    { id: "media" as ServiceType, label: "Images / vidéos", value: counts.media },
    { id: "document" as ServiceType, label: "Documents PDF", value: counts.document },
  ];

  return (
    <div>
      {/* En-tête de l'espace client */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>

              <p className="eyebrow">Espace client</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink/90 sm:text-4xl lg:text-5xl">
                Vos QR codes.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-sage">
                Retrouvez chaque QR code généré, ouvrez son contenu, téléchargez l’image ou
                supprimez-le. {authUser?.email ? `Compte : ${authUser.email}.` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/creer" className="btn btn-primary">
                <Plus className="h-4 w-4" />
                Nouveau QR code
              </Link>
              <button type="button" onClick={handleLogout} className="btn btn-outline">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>

          <dl className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {summary.map(({ id, label, value }) => {
              const Icon = serviceIcons[id];
              return (
                <div key={id} className="bg-white px-5 py-5">
                  <dt className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-sage">
                    <Icon className="h-3.5 w-3.5 text-ink" />
                    {label}
                  </dt>
                  <dd className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink/90">{value}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {/* Liste des QR codes */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-[#e7c8c2] bg-[#fbf1ef] px-4 py-3 text-sm text-[#8b3a2d] sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsLoading(true);
                loadCards()
                  .catch((err: unknown) =>
                    setError(err instanceof Error ? err.message : "Une erreur est survenue."),
                  )
                  .finally(() => setIsLoading(false));
              }}
              className="inline-flex shrink-0 items-center gap-1.5 font-semibold underline-offset-4 hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Réessayer
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 surface-soft py-20">
            <Loader2 className="h-6 w-6 animate-spin text-ink" />
            <p className="text-sm text-sage">Chargement de vos QR codes…</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-forest/30 bg-white px-6 py-16 text-center">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-xl bg-forest text-white">
              <QrCode className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-ink">Aucun QR code pour l’instant.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-sage">
              Choisissez un service pour créer votre premier code : page digitale, image / vidéo ou
              document PDF.
            </p>
            <Link href="/creer" className="btn btn-primary mt-6">
              Créer mon premier QR code
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = serviceIcons[card.serviceType] ?? QrCode;
              const isDeleting = deleting === card.slug;

              return (
                <article key={card.id} className="surface flex flex-col overflow-hidden">
                  <div className="flex items-start gap-4 border-b border-line p-5">
                    <div className="shrink-0 rounded-md border border-line bg-white p-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.qrCode}
                        alt={`QR code ${card.title}`}
                        width={88}
                        height={88}
                        className="h-[72px] w-[72px]"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-sage">
                        <Icon className="h-3.5 w-3.5 text-ink" />
                        {serviceLabel(card.serviceType)}
                      </p>
                      <h2 className="mt-1.5 truncate text-base font-semibold text-ink">
                        {card.title || card.restaurantName || card.slug}
                      </h2>
                      {card.fileName && (
                        <p className="mt-0.5 truncate text-xs text-sage">{card.fileName}</p>
                      )}
                      <p className="mt-1 text-xs text-sage">
                        {new Intl.DateTimeFormat("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(card.createdAt))}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="break-all text-xs leading-5 text-sage">{card.cardUrl}</p>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <a
                        href={card.qrCode}
                        download={`moncode-${card.slug}.png`}
                        className="btn btn-sm btn-primary"
                      >
                        <Download className="h-3.5 w-3.5" />
                        QR
                      </a>
                      <Link
                        href={card.cardUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline"
                      >
                        Ouvrir
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(card)}
                      disabled={isDeleting}
                      className="mt-auto inline-flex items-center justify-center gap-1.5 border-t border-line pt-4 text-xs font-semibold text-sage transition-colors hover:text-[#8b3a2d] disabled:opacity-60"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      {isDeleting ? "Suppression…" : "Supprimer ce QR code"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-10 flex flex-col gap-4 surface-soft p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Besoin de plusieurs QR codes ?</p>
            <p className="mt-1 text-sm leading-6 text-sage">
              Plusieurs points de vente, une charte dédiée ou un changement particulier : parlons-en.
            </p>
          </div>
          <Link href="/contact" className="btn btn-outline shrink-0">
            Demander un devis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
