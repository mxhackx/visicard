"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { addEstablishment, myEstablishments, removeEstablishment, renameEstablishment, type Establishment } from "@/lib/business";
import { useAccountToken } from "./use-account";
import AccountNav from "./account-nav";

/** Un compte, plusieurs établissements : chacun regroupe ses propres QR codes. */
export default function Establishments() {
  const token = useAccountToken();
  const [rows, setRows] = useState<Establishment[] | null>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setRows(await myEstablishments(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }, [token]);
  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await addEstablishment(token, name, city);
      setName("");
      setCity("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  };

  const rename = async (e: Establishment) => {
    const n = window.prompt("Nom de l’établissement", e.name);
    if (!token || !n || n === e.name) return;
    try {
      await renameEstablishment(token, e.id, n, e.city ?? "");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Modification impossible.");
    }
  };

  const remove = async (e: Establishment) => {
    if (!token || !window.confirm(`Supprimer « ${e.name} » ? Ses QR codes sont conservés, simplement détachés.`)) return;
    try {
      await removeEstablishment(token, e.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="page-title">Établissements</h1>
      <p className="mt-2 text-sm text-sage">Gérez plusieurs restaurants, boutiques ou agences depuis un seul compte. Rattachez ensuite chaque QR code à son établissement.</p>
      <div className="mt-6"><AccountNav /></div>

      <form onSubmit={add} className="surface mt-6 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-5">
        <label className="block"><span className="mb-1.5 block text-sm font-medium text-ink/80">Nom</span><input className="field" required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Moncode Cotonou" /></label>
        <label className="block"><span className="mb-1.5 block text-sm font-medium text-ink/80">Ville (facultatif)</span><input className="field" maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cotonou" /></label>
        <button type="submit" disabled={busy} className="btn btn-primary">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Ajouter</button>
      </form>

      {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      {!rows && !error && <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-forest" /></div>}
      {rows && rows.length === 0 && <div className="surface mt-6 px-6 py-12 text-center"><Building2 className="mx-auto h-8 w-8 text-line" /><p className="mt-3 text-sm text-sage">Aucun établissement. Vos QR codes restent utilisables sans.</p></div>}

      <ul className="mt-6 space-y-3">
        {rows?.map((e) => (
          <li key={e.id} className="surface flex items-center gap-4 p-4">
            <span className="icon-tile h-11 w-11 shrink-0"><Building2 className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{e.name}</p>
              <p className="text-xs text-sage">{e.city ? `${e.city} · ` : ""}{e.cardsCount} QR code{e.cardsCount > 1 ? "s" : ""}</p>
            </div>
            <button type="button" aria-label={`Renommer ${e.name}`} onClick={() => rename(e)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-sage hover:text-ink"><Pencil className="h-4 w-4" /></button>
            <button type="button" aria-label={`Supprimer ${e.name}`} onClick={() => remove(e)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-sage hover:border-red-200 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}
