"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFile } from "../context/FileContext";
import AdminDashboard from "../../components/admin/AdminDashboard";

export default function AdminPage() {
  const router = useRouter();
  const { authToken, authRole, isAuthLoading, logoutSession } = useFile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!authToken || authRole !== "admin") {
        router.replace("/connexion");
      }
    }
  }, [authToken, authRole, isAuthLoading, router]);

  const handleLogout = () => {
    logoutSession();
    router.replace("/connexion");
  };

  if (!mounted || isAuthLoading || !authToken || authRole !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Vérification de l'accès administrateur...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboard
      adminToken={authToken}
      onLogout={handleLogout}
      onNavigateToUser={() => router.push("/intervenant")}
    />
  );
}
