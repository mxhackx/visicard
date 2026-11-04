"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Plus, QrCode, Search } from "lucide-react";
import AdminEditCardModal from "./AdminEditCardModal";
import { AdminOverview, type OverviewStats } from "./AdminOverview";
import { AdminTable } from "./AdminTable";
import { useAdminFetch } from "./use-admin-fetch";

export interface CardSummary {
  id: string;
  slug: string;
  imageUrl: string;
  logoUrl?: string | null;
  menuImages?: string[] | null;
  cardUrl: string;
  userName?: string | null;
  clientName?: string | null;
  workDone?: string | null;
  /** L'API renvoie un nombre ; d'anciennes données peuvent contenir du texte. */
  amountReceived?: number | string | null;
  restaurantName?: string | null;
  phoneNumber?: string | null;
  themeId?: string | null;
  qrStyle?: string | null;
  serviceType?: "page" | "media" | "document" | string | null;
  title?: string | null;
  status?: "draft" | "active" | "rejected";
  address?: string | null;
  additionalInfo?: string | null;
  createdAt: string;
}

/** Montant encaissé en nombre, quel que soit le format stocké. */
export function cardAmount(card: CardSummary): number {
  const raw = card.amountReceived;
  if (raw === null || raw === undefined || raw === "") return 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const n = Number(raw.replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

type Filter = "all" | "page" | "media" | "document";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "page", label: "Pages" },
  { id: "media", label: "Images / vidéos" },
  { id: "document", label: "PDF" },
];

interface AdminCardsListProps {
  cards: CardSummary[];
  isLoading: boolean;
  onCreateFirstCard: () => void;
  onCardUpdated?: (updatedCard: CardSummary) => void;
  onCardDeleted?: (slug: string) => void;
  adminToken: string;
}

export default function AdminCardsList({
  cards,
  isLoading,
  onCreateFirstCard,
  onCardUpdated,
  onCardDeleted,
  adminToken,
}: AdminCardsListProps) {
  const adminFetch = useAdminFetch(adminToken);
  const [editingCard, setEditingCard] = useState<CardSummary | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [actionError, setActionError] = useState<string | null>(null);

  const stats: OverviewStats = useMemo(() => {
    const now = new Date();
    const typeOf = (c: CardSummary) => c.serviceType ?? "page";
    return {
      total: cards.length,
      revenue: cards.reduce((sum, c) => sum + cardAmount(c), 0),
      pages: cards.filter((c) => typeOf(c) === "page").length,
      media: cards.filter((c) => typeOf(c) === "media").length,
      documents: cards.filter((c) => typeOf(c) === "document").length,
      thisMonth: cards.filter((c) => {
        const d = new Date(c.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length,
    };
  }, [cards]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (filter !== "all" && (c.serviceType ?? "page") !== filter) return false;
      if (!q) return true;
      return [c.title, c.restaurantName, c.clientName, c.userName, c.slug, c.phoneNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [cards, query, filter]);

  const handleDelete = async (slug: string): Promise<boolean> => {
    setActionError(null);
    try {
      const res = await adminFetch(`/cards/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setActionError(typeof data?.message === "string" ? data.message : "La suppression a échoué.");
        return false;
      }
      onCardDeleted?.(slug);
      return true;
    } catch {
      setActionError("Impossible de joindre le serveur.");
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-sage">
        <div className="mb-4 h-9 w-9 animate-spin rounded-full border-4 border-leaf border-t-forest" />
        <p>Chargement des données…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminOverview stats={stats} />

      {actionError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {actionError}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="surface rounded-2xl border-dashed p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf text-forest">
            <QrCode className="h-7 w-7" />
          </span>
          <p className="mt-4 text-base font-semibold text-ink/90">Aucun QR code pour le moment</p>
          <p className="mt-1 text-sm text-sage">Les QR codes créés depuis le site apparaîtront ici.</p>
          <button type="button" className="btn btn-primary mt-6" onClick={onCreateFirstCard}>
            <Plus className="h-4 w-4" />
            Créer un premier QR code
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-[0_2px_4px_rgba(171,190,209,0.2)]">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    filter === f.id ? "bg-forest text-white" : "text-ink/70 hover:bg-cream-deep"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label className="relative block sm:w-72">
                <span className="sr-only">Rechercher</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-sage" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nom, client, lien…"
                  className="field !min-h-[2.5rem] pl-9"
                />
              </label>
              <button type="button" onClick={onCreateFirstCard} className="btn btn-primary btn-sm shrink-0">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouveau</span>
              </button>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="surface rounded-2xl p-10 text-center text-sm text-sage">
              Aucun QR code ne correspond à cette recherche.
            </p>
          ) : (
            <AdminTable cards={visible} onEdit={setEditingCard} onDelete={handleDelete} />
          )}
          <p className="text-xs text-sage">
            {visible.length} sur {cards.length} QR code{cards.length > 1 ? "s" : ""}
          </p>
        </>
      )}

      {editingCard && (
        <AdminEditCardModal
          card={editingCard}
          adminToken={adminToken}
          onClose={() => setEditingCard(null)}
          onSuccess={(updatedCard) => {
            setEditingCard(null);
            onCardUpdated?.(updatedCard);
          }}
        />
      )}
    </div>
  );
}
