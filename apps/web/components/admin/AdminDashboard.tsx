"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus } from "lucide-react";
import AdminCardsList, { CardSummary } from "./AdminCardsList";
import AdminSettingsForm from "./AdminSettingsForm";
import AdminAccounts from "./AdminAccounts";
import AdminOrders from "./AdminOrders";
import AdminShell from "./AdminShell";
import { useAdminFetch } from "./use-admin-fetch";

export type AdminTab = "cards" | "orders" | "accounts" | "settings";

const HEADINGS: Record<AdminTab, { title: string; hint: string }> = {
  cards: { title: "QR codes", hint: "Tous les QR codes : actifs, en attente de paiement ou refusés" },
  orders: { title: "Commandes", hint: "Devis, paiements et factures" },
  accounts: { title: "Utilisateurs", hint: "Comptes et rôles" },
  settings: { title: "Paramètres", hint: "Sécurité du compte" },
};

export default function AdminDashboard({ tab }: { tab: AdminTab }) {
  const heading = HEADINGS[tab];
  return (
    <AdminShell
      active={tab}
      title={heading.title}
      hint={heading.hint}
      actions={
        <Link href="/admin/nouveau" className="btn btn-primary btn-sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouveau QR code</span>
        </Link>
      }
    >
      {(token) => <DashboardBody tab={tab} adminToken={token} />}
    </AdminShell>
  );
}

function DashboardBody({ tab, adminToken }: { tab: AdminTab; adminToken: string }) {
  const router = useRouter();
  const adminFetch = useAdminFetch(adminToken);
  const [cardsList, setCardsList] = useState<CardSummary[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "cards") return;
    let isSubscribed = true;
    (async () => {
      try {
        const res = await adminFetch("/cards");
        if (res.status === 401) throw new Error("SESSION_EXPIRED");
        if (!res.ok) throw new Error("FETCH_FAILED");
        const data: CardSummary[] = await res.json();
        if (isSubscribed) {
          setCardsList(data);
          setErrorMessage(null);
        }
      } catch (err: unknown) {
        if (!isSubscribed) return;
        setErrorMessage(
          err instanceof Error && err.message === "SESSION_EXPIRED"
            ? "Votre session a expiré. Reconnectez-vous."
            : "Impossible de joindre le serveur pour récupérer les QR codes.",
        );
      } finally {
        if (isSubscribed) setIsLoadingCards(false);
      }
    })();
    return () => {
      isSubscribed = false;
    };
  }, [adminFetch, tab]);

  return (
    <>
      {errorMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {tab === "cards" && (
        <AdminCardsList
          cards={cardsList}
          isLoading={isLoadingCards}
          onCreateFirstCard={() => router.push("/admin/nouveau")}
          onCardUpdated={(updated) =>
            setCardsList((prev) => prev.map((c) => (c.slug === updated.slug ? { ...c, ...updated } : c)))
          }
          onCardDeleted={(slug) => setCardsList((prev) => prev.filter((c) => c.slug !== slug))}
          adminToken={adminToken}
        />
      )}

      {tab === "orders" && <AdminOrders adminToken={adminToken} />}

      {tab === "accounts" && (
        <div className="surface rounded-2xl p-5 sm:p-7">
          <AdminAccounts adminToken={adminToken} />
        </div>
      )}

      {tab === "settings" && (
        <div className="surface max-w-2xl rounded-2xl p-6 sm:p-8">
          <AdminSettingsForm adminToken={adminToken} />
        </div>
      )}
    </>
  );
}
