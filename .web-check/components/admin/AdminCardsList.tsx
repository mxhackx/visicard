"use client";

import { useState } from "react";
import AdminEditCardModal from "./AdminEditCardModal";
import { AdminOverview } from "./AdminOverview";
import { AdminTable } from "./AdminTable";

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
  amountReceived?: string | null;
  restaurantName?: string | null;
  phoneNumber?: string | null;
  themeId?: string | null;
  qrStyle?: string | null;
  createdAt: string;
}

interface AdminCardsListProps {
  cards: CardSummary[];
  isLoading: boolean;
  onCreateFirstCard: () => void;
  onCardUpdated?: (updatedCard: CardSummary) => void;
  adminToken: string;
}

export default function AdminCardsList({ cards, isLoading, onCreateFirstCard, onCardUpdated, adminToken }: AdminCardsListProps) {
  const [editingCard, setEditingCard] = useState<CardSummary | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  // Calculate some basic stats
  const totalRevenue = cards.reduce((acc, card) => {
    if (!card.amountReceived) return acc;
    // Extract numbers from something like "50000 FCFA"
    const amount = parseInt(card.amountReceived.replace(/\\D/g, ''), 10);
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <div className="space-y-6">
      <AdminOverview cardsCount={cards.length} totalRevenue={totalRevenue} />

      {cards.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
          <p className="text-slate-500 mb-6 font-medium">Aucune carte n'a encore été enregistrée.</p>
          <button 
            type="button" 
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors" 
            onClick={onCreateFirstCard}
          >
            Créer ma première carte
          </button>
        </div>
      ) : (
        <AdminTable 
  cards={cards} 
  onEdit={setEditingCard} 
  onDelete={async (slug) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";
      const res = await fetch(`${apiUrl}/cards/${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        // We'll rely on the parent component reloading, or we can just trigger a local state update if we had access to setCards
        // Since setCards is in AdminDashboard, we should ideally pass onDeleteCard to AdminCardsList.
        // For now, let's just reload the page to refresh the list cleanly.
        window.location.reload();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (e) {
      alert("Erreur de connexion");
    }
  }} 
/>
      )}

      {editingCard && (
        <AdminEditCardModal
          card={editingCard}
          adminToken={adminToken}
          onClose={() => setEditingCard(null)}
          onSuccess={(updatedCard) => {
            setEditingCard(null);
            if (onCardUpdated) onCardUpdated(updatedCard);
          }}
        />
      )}
    </div>
  );
}
