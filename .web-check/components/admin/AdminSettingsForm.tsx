"use client";

import { useState, FormEvent } from "react";
import { Lock, Mail, Save, AlertCircle, CheckCircle2 } from "lucide-react";

interface AdminSettingsFormProps {
  adminToken: string;
}

export default function AdminSettingsForm({ adminToken }: AdminSettingsFormProps) {
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false);
  const [credSuccess, setCredSuccess] = useState<string | null>(null);
  const [credError, setCredError] = useState<string | null>(null);

  const handleUpdateCredentials = async (e: FormEvent) => {
    e.preventDefault();
    setCredError(null);
    setCredSuccess(null);

    if (newPassword && newPassword !== confirmPassword) {
      setCredError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!newEmail.trim() && !newPassword.trim()) {
      setCredError("Veuillez renseigner au moins un champ à modifier.");
      return;
    }

    setIsUpdatingCreds(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";

    try {
      const res = await fetch(`${apiUrl}/auth/admin/credentials`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          newEmail: newEmail.trim() || undefined,
          newPassword: newPassword.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur lors de la mise à jour");
      }

      setCredSuccess("Identifiants mis à jour avec succès !");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCredError(err.message);
      } else {
        setCredError("Erreur inconnue");
      }
    } finally {
      setIsUpdatingCreds(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-600" /> Sécurité du compte
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Modifiez l'adresse e-mail de connexion ou le mot de passe administrateur.
        </p>
      </div>

      <form onSubmit={handleUpdateCredentials} className="space-y-4">
        
        {credSuccess && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{credSuccess}</p>
          </div>
        )}

        {credError && (
          <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{credError}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 block" htmlFor="new-email">
            Nouvel E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="new-email"
              type="email"
              placeholder="admin@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="text-sm font-medium text-slate-700 block" htmlFor="new-pass">
            Nouveau Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="new-pass"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 block" htmlFor="confirm-pass">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="confirm-pass"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isUpdatingCreds || (!newEmail && !newPassword)}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdatingCreds ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Sauvegarder les modifications
          </button>
        </div>
      </form>
    </div>
  );
}
