"use client";

import { useState, useEffect } from "react";
import AdminCardsList, { CardSummary } from "./AdminCardsList";
import AdminSettingsForm from "./AdminSettingsForm";
import { useFile } from "../../app/context/FileContext";
import { LogOut, LayoutDashboard, Settings } from "lucide-react";

interface AdminDashboardProps {
  adminToken: string;
  onLogout: () => void;
  onNavigateToUser: () => void;
}

export default function AdminDashboard({ adminToken, onLogout, onNavigateToUser }: AdminDashboardProps) {
  const { refreshAccessToken } = useFile();
  const [adminTab, setAdminTab] = useState<"cards" | "settings">("cards");
  const [cardsList, setCardsList] = useState<CardSummary[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";

    const fetchCards = async () => {
      try {
        let token = adminToken;
        let res = await fetch(`${apiUrl}/cards`, {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            token = newToken;
            res = await fetch(`${apiUrl}/cards`, {
              credentials: 'include',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          }
        }

        if (res.status === 401) throw new Error("SESSION_EXPIRED");
        if (!res.ok) throw new Error("FETCH_FAILED");

        const data: CardSummary[] = await res.json();
        if (isSubscribed) {
          setCardsList(data);
          setIsLoadingCards(false);
          setErrorMessage(null);
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setIsLoadingCards(false);
          const message = err instanceof Error ? err.message : "";
          if (message === "SESSION_EXPIRED") {
            setErrorMessage("Votre session a expiré. Déconnexion automatique...");
            setTimeout(() => onLogout(), 2000);
          } else {
            setErrorMessage("Impossible de joindre le serveur pour récupérer les cartes.");
          }
        }
      }
    };

    fetchCards();
    return () => { isSubscribed = false; };
  }, [adminToken, onLogout, refreshAccessToken]);

  const handleCardUpdated = (updatedCard: CardSummary) => {
    setCardsList(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Header Admin */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-xl tracking-tight text-slate-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">MC</span>
              Admin
            </span>
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Session active
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium mb-6">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl mb-8 w-max">
          <button
            onClick={() => setAdminTab("cards")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              adminTab === "cards" 
                ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-900/5" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Tableau de bord
          </button>
          <button
            onClick={() => setAdminTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              adminTab === "settings" 
                ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-900/5" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </button>
        </div>

        {/* Dynamic Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {adminTab === "cards" ? (
            <AdminCardsList
              cards={cardsList}
              isLoading={isLoadingCards}
              onCreateFirstCard={onNavigateToUser}
              onCardUpdated={handleCardUpdated}
              adminToken={adminToken}
            />
          ) : (
            <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <AdminSettingsForm adminToken={adminToken} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
