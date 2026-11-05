"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, LayoutGrid, List, Plus, QrCode, ScanLine, Search } from "lucide-react";
import StyledQr from "@/components/qr/styled-qr";
import AdminEditCardModal from "./AdminEditCardModal";
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
  /** Nombre total de scans de la page publique. */
  scans?: number;
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
type StatusFilter = "all" | "active" | "draft" | "rejected";

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Tous les statuts" },
  { id: "active", label: "Actifs" },
  { id: "draft", label: "En attente de paiement" },
  { id: "rejected", label: "Refusés" },
];

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

  const [status, setStatus] = useState<StatusFilter>("all");
  const [view, setView] = useState<"list" | "grid">("list");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (filter !== "all" && (c.serviceType ?? "page") !== filter) return false;
      if (status !== "all" && (c.status ?? "active") !== status) return false;
      if (!q) return true;
      return [c.title, c.restaurantName, c.clientName, c.userName, c.slug, c.phoneNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [cards, query, filter, status]);

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
      {actionError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {actionError}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="surface rounded-2xl border-dashed p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf text-ambre-deep">
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
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="field !min-h-[2.5rem] w-auto pr-8 text-sm"
                aria-label="Filtrer par statut"
              >
                {statusFilters.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <div className="hidden rounded-xl border border-line bg-white p-1 sm:flex" role="radiogroup" aria-label="Affichage">
                {([
                  ["list", List, "Liste"],
                  ["grid", LayoutGrid, "Grille des QR codes"],
                ] as const).map(([id, Icon, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={view === id}
                    aria-label={label}
                    title={label}
                    onClick={() => setView(id)}
                    className={`rounded-lg p-1.5 ${view === id ? "bg-forest text-white" : "text-sage hover:text-ink"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
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
            view === "grid" ? (
              <QrGrid cards={visible} />
            ) : (
              <AdminTable cards={visible} onEdit={setEditingCard} onDelete={handleDelete} />
            )
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

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-emerald-50 text-emerald-700" },
  draft: { label: "En attente", className: "bg-amber-50 text-amber-700" },
  rejected: { label: "Refusé", className: "bg-red-50 text-red-700" },
};

/** Planche des QR codes, tels qu'ils seront imprimés. */
function QrGrid({ cards }: { cards: CardSummary[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map((card) => {
        const badge = STATUS_BADGE[card.status ?? "active"];
        return (
          <Link
            key={card.id}
            href={`/admin/cartes/${card.slug}`}
            className="surface group flex flex-col items-center p-4 text-center transition-shadow hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)]"
          >
            <StyledQr data={card.cardUrl} style={card.qrStyle} logoUrl={card.serviceType === "page" ? card.logoUrl : null} size={132} />
            <p className="mt-3 w-full truncate text-sm font-semibold text-ink/90 group-hover:text-forest">
              {card.title || card.restaurantName || "Sans titre"}
            </p>
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${badge.className}`}>{badge.label}</span>
              <span className="inline-flex items-center gap-1 text-sage">
                <ScanLine className="h-3 w-3" /> {card.scans ?? 0}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
