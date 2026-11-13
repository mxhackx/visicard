"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react";
import FeexpayBadge from "@/components/feexpay-badge";
import { formatPhone } from "@/components/account/auth-form";

/** Logos officiels des opérateurs (sites mtn.bj, moov-africa.bj, celtiis.bj), sur le fond qui leur convient. */
export const NETWORKS = [
  { id: "mtn", label: "MTN MoMo", hint: "MTN Bénin", logo: "/payments/mtn.svg", bg: "#ffcb05", pad: "p-1.5" },
  { id: "moov", label: "Moov Money", hint: "Moov Bénin", logo: "/payments/moov.png", bg: "#0b2a5b", pad: "p-1" },
  { id: "celtiis_bj", label: "Celtiis Cash", hint: "Celtiis Bénin", logo: "/payments/celtiis.svg", bg: "transparent", pad: "" },
] as const;
export type NetworkId = (typeof NETWORKS)[number]["id"];

export interface PayValues {
  network: NetworkId;
  /** Numéro du compte Mobile Money, avec l'indicatif (+229…). */
  phone: string;
}

export type PayState = "paid" | "failed" | "pending";

const fcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)} FCFA`;
const POLL_MS = 3000;
const POLL_MAX = 60; // 3 minutes

/**
 * Formulaire de paiement Mobile Money (FeexPay), dans la page : réseau, nom, prénom, e-mail pour le reçu, numéro.
 * Après l'envoi, le client valide sur son téléphone ; `check` relit le statut tant que le paiement est en attente.
 */
export default function PaymentForm({
  amount,
  defaults,
  sandbox = false,
  pay,
  check,
  onPaid,
  onCancel,
}: {
  amount: number;
  /** Téléphone du compte (+indicatif) : le paiement part de ce numéro, modifiable. */
  defaults?: { phone?: string | null };
  /** Mode test de FeexPay : un encadré explique les numéros de test. */
  sandbox?: boolean;
  /** Lance la demande de paiement ; lève une erreur lisible si elle est refusée. */
  pay: (values: PayValues) => Promise<void>;
  /** Relit le statut (jamais décidé par le navigateur). */
  check: () => Promise<PayState>;
  onPaid: () => void;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState<"form" | "waiting" | "paid" | "failed">("form");
  const [network, setNetwork] = useState<NetworkId>("mtn");
  const known = defaults?.phone ?? "";
  const [editing, setEditing] = useState(!known);
  const [number, setNumber] = useState(() => known.replace(/^\+229/, ""));
  const [errors, setErrors] = useState<{ number?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tries, setTries] = useState(0);
  const done = useRef(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const digits = number.replace(/\D/g, "");
    if (digits.length !== 8 && digits.length !== 10) {
      setErrors({ number: "Numéro invalide : 8 ou 10 chiffres." });
      setEditing(true);
      return;
    }
    setErrors({});
    setBusy(true);
    setError(null);
    try {
      await pay({ network, phone: `+229${digits}` });
      done.current = false;
      setTries(0);
      setStep("waiting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Le paiement n’a pas pu démarrer. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  // Attente de la validation sur le téléphone : on relit le statut toutes les 3 secondes.
  useEffect(() => {
    if (step !== "waiting") return;
    const id = window.setTimeout(async () => {
      try {
        const state = await check();
        if (done.current) return;
        if (state === "paid") {
          done.current = true;
          setStep("paid");
          window.setTimeout(onPaid, 1200);
          return;
        }
        if (state === "failed") {
          done.current = true;
          setStep("failed");
          return;
        }
      } catch {
        /* réseau instable : on réessaie */
      }
      setTries((n) => n + 1);
    }, POLL_MS);
    return () => window.clearTimeout(id);
  }, [step, tries, check, onPaid]);

  const timedOut = step === "waiting" && tries >= POLL_MAX;
  const net = NETWORKS.find((n) => n.id === network)!;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="bg-ink px-5 py-4 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Total à payer</p>
        <p className="mt-1 text-2xl font-bold tracking-[-0.02em]">{fcfa(amount)}</p>
      </div>

      {step === "form" && (
        <form onSubmit={submit} noValidate className="space-y-5 p-5">
          {sandbox && (
            <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
              <strong>Mode test</strong> : aucun argent ne circule. Seuls les numéros de test fonctionnent : <button type="button" className="font-semibold underline" onClick={() => { setNumber("97000000"); setEditing(true); }}>97000000</button> (paiement réussi) ou 97000001 (refusé).
            </p>
          )}
          <div role="radiogroup" aria-label="Réseau Mobile Money" className="grid grid-cols-3 gap-2">
            {NETWORKS.map((n) => {
              const on = n.id === network;
              return (
                <button
                  key={n.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setNetwork(n.id)}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border bg-white p-3 text-center transition active:scale-[0.97] ${on ? "border-emerald-500 ring-2 ring-emerald-500/25" : "border-line hover:border-ink/30"}`}
                >
                  <span className={`flex h-12 w-[4.5rem] items-center justify-center overflow-hidden rounded-lg ${n.pad}`} style={{ background: n.bg }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.logo} alt="" className="max-h-full max-w-full object-contain" />
                  </span>
                  <span className="text-xs font-semibold leading-4 text-ink/85">{n.label}</span>
                  {on && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div>
            <label htmlFor="momo-number" className="block text-sm font-semibold text-ink/85">Compte Mobile Money · {net.hint}</label>
            {editing ? (
              <div className="mt-1.5 flex overflow-hidden rounded-xl border border-line bg-white focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/20">
                <span className="flex shrink-0 items-center gap-2 border-r border-line bg-cream px-3 text-sm font-medium text-ink/80">
                  <span aria-hidden="true">🇧🇯</span> +229
                </span>
                <input
                  id="momo-number"
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="01 97 00 00 00"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  aria-invalid={errors.number ? "true" : undefined}
                />
              </div>
            ) : (
              <div className="mt-1.5 flex items-center justify-between gap-3 rounded-xl border border-line bg-cream px-4 py-3">
                <span className="text-base font-semibold text-ink/90">🇧🇯 {formatPhone(`+229${number.replace(/\D/g, "")}`)}</span>
                <button type="button" onClick={() => setEditing(true)} className="text-sm font-semibold text-forest underline-offset-4 hover:underline">Changer</button>
              </div>
            )}
            {errors.number && <span className="mt-1 block text-xs font-medium text-red-600">{errors.number}</span>}
          </div>

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-700">{error}</p>}

          <button type="submit" disabled={busy} className="btn btn-primary w-full justify-center py-3.5 text-base">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "Envoi de la demande…" : `Payer ${fcfa(amount)}`}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="block w-full text-center text-sm font-medium text-sage transition hover:text-ink">Plus tard</button>
          )}
          <p className="text-center"><FeexpayBadge /></p>
        </form>
      )}

      {step === "waiting" && (
        <div className="p-6 text-center" role="status">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-leaf text-ambre-deep"><Smartphone className="h-7 w-7" /></span>
          <h3 className="mt-4 text-lg font-semibold text-ink/90">Validez le paiement sur votre téléphone</h3>
          <p className="mt-1 text-sm leading-6 text-sage">
            {net.label} vous envoie une demande de {fcfa(amount)}. Saisissez votre code secret pour confirmer.
          </p>
          {timedOut ? (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">Toujours pas de confirmation. Si vous avez validé, patientez une minute ; sinon recommencez.</p>
          ) : (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-sage"><Loader2 className="h-4 w-4 animate-spin" /> En attente de la confirmation…</p>
          )}
          <button type="button" onClick={() => { done.current = true; setStep("form"); }} className="mt-4 text-sm font-semibold text-forest underline-offset-4 hover:underline">Modifier le numéro</button>
        </div>
      )}

      {step === "paid" && (
        <div className="p-6 text-center" role="status">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h3 className="mt-3 text-lg font-semibold text-ink/90">Paiement confirmé</h3>
          <p className="mt-1 text-sm text-sage">Merci ! Tout est débloqué.</p>
        </div>
      )}

      {step === "failed" && (
        <div className="p-6 text-center" role="alert">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-3 text-lg font-semibold text-ink/90">Paiement non abouti</h3>
          <p className="mt-1 text-sm leading-6 text-sage">Le paiement a été refusé ou a expiré. Vérifiez votre solde et votre numéro, puis réessayez.</p>
          <button type="button" onClick={() => setStep("form")} className="btn btn-primary mt-5">Réessayer</button>
        </div>
      )}
    </div>
  );
}
