"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Clock, Loader2, Lock, Smartphone, XCircle } from "lucide-react";
import PayButton from "./pay-button";

/** Logos officiels des opérateurs (sites mtn.bj, moov-africa.bj, celtiis.bj), sur le fond qui leur convient. */
export const NETWORKS = [
  { id: "mtn", label: "MTN MoMo", hint: "MTN Bénin", ussd: "*880#", logo: "/payments/mtn.svg", bg: "#ffcb05", pad: "p-1.5" },
  { id: "moov", label: "Moov Money", hint: "Moov Bénin", ussd: "*855#", logo: "/payments/moov.png", bg: "#0b2a5b", pad: "p-1" },
  { id: "celtiis_bj", label: "Celtiis Cash", hint: "Celtiis Bénin", ussd: null, logo: "/payments/celtiis.svg", bg: "transparent", pad: "" },
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
const RESEND_AFTER = 20; // 60 s : le bouton « Renvoyer la demande » apparaît

/** 0197000000 → « 01 97 00 00 00 » (numérotation à 10 chiffres du Bénin) ; l'ancien format à 8 chiffres reste accepté. */
function groupDigits(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  return d.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

/**
 * Paiement Mobile Money dans l'esprit des caisses en ligne béninoises (KkiaPay, FedaPay, FeexPay) :
 * montant en tête, choix du réseau en liste (MTN, Moov, Celtiis), numéro à 10 chiffres avec +229, puis attente de la
 * validation sur le téléphone avec le rappel du code USSD. `check` relit le statut tant que le paiement est en attente.
 */
export default function PaymentForm({
  amount,
  description = "Moncode Premium · 1 an",
  defaults,
  sandbox = false,
  pay,
  check,
  onPaid,
  onCancel,
}: {
  amount: number;
  description?: string;
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
  const [number, setNumber] = useState(() => groupDigits(known.replace(/^\+229/, "")));
  const [errors, setErrors] = useState<{ number?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tries, setTries] = useState(0);
  const [paidAt, setPaidAt] = useState<Date | null>(null);
  const done = useRef(false);
  const [sentValues, setSentValues] = useState<PayValues | null>(null);

  const start = async (values: PayValues) => {
    setBusy(true);
    setError(null);
    try {
      await pay(values);
      setSentValues(values);
      done.current = false;
      setTries(0);
      setStep("waiting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Le paiement n’a pas pu démarrer. Réessayez.");
      setStep("form");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const digits = number.replace(/\D/g, "");
    if (digits.length !== 8 && digits.length !== 10) {
      setErrors({ number: "Numéro invalide : saisissez les 10 chiffres (ex. 01 97 00 00 00)." });
      return;
    }
    setErrors({});
    await start({ network, phone: `+229${digits}` });
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
          setPaidAt(new Date());
          setStep("paid");
          window.setTimeout(onPaid, 2200);
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
  const left = Math.max(0, (POLL_MAX - tries) * (POLL_MS / 1000));
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const maskedNumber = (sentValues?.phone ?? "").replace(/^\+229(\d{2})\d*(\d{2})$/, "+229 $1 •• •• $2");

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dfe3e8] bg-[#f6f7f9] shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
      {/* En-tête de caisse : marchand et montant, comme sur les caisses en ligne locales. */}
      <div className="flex items-center justify-between gap-4 border-b border-[#dfe3e8] bg-white px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">Moncode</p>
          <p className="truncate text-xs text-sage">{description}</p>
        </div>
        <p className="shrink-0 text-right text-[1.35rem] font-bold leading-none tracking-[-0.02em] text-ink">{fcfa(amount)}</p>
      </div>

      {step === "form" && (
        <form onSubmit={submit} noValidate className="space-y-5 p-5">
          {sandbox && (
            <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
              <strong>Mode test</strong> : aucun argent ne circule. Seuls les numéros de test fonctionnent : <button type="button" className="font-semibold underline" onClick={() => setNumber("97 00 00 00")}>97 00 00 00</button> (paiement réussi) ou 97 00 00 01 (refusé).
            </p>
          )}

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-sage">Choisissez votre moyen de paiement</legend>
            <div role="radiogroup" aria-label="Réseau Mobile Money" className="mt-2.5 space-y-2">
              {NETWORKS.map((n) => {
                const on = n.id === network;
                return (
                  <button
                    key={n.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setNetwork(n.id)}
                    className={`flex w-full items-center gap-3.5 rounded-xl border bg-white px-3.5 py-3 text-left transition active:scale-[0.99] ${on ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-[#dfe3e8] hover:border-ink/40"}`}
                  >
                    <span className={`flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg ${n.pad}`} style={{ background: n.bg }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={n.logo} alt="" className="max-h-full max-w-full object-contain" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-ink">{n.label}</span>
                      <span className="block text-xs text-sage">{n.hint}{n.ussd ? ` · ${n.ussd}` : ""}</span>
                    </span>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-ink" : "border-[#c9ced6]"}`} aria-hidden="true">
                      {on && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="momo-number" className="block text-xs font-semibold uppercase tracking-[0.12em] text-sage">Numéro {net.label}</label>
            <div className={`mt-2.5 flex overflow-hidden rounded-xl border bg-white focus-within:border-ink focus-within:shadow-[0_0_0_1px_var(--color-ink)] ${errors.number ? "border-red-400" : "border-[#dfe3e8]"}`}>
              <span className="flex shrink-0 items-center gap-2 border-r border-[#dfe3e8] bg-[#f6f7f9] px-3.5 text-[15px] font-semibold text-ink">
                <span aria-hidden="true">🇧🇯</span> +229
              </span>
              <input
                id="momo-number"
                className="min-w-0 flex-1 bg-transparent px-3.5 py-3.5 text-[17px] font-medium tracking-[0.02em] text-ink outline-none placeholder:font-normal placeholder:text-[#b0b6bf]"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="01 97 00 00 00"
                value={number}
                onChange={(e) => setNumber(groupDigits(e.target.value))}
                aria-invalid={errors.number ? "true" : undefined}
              />
            </div>
            {errors.number ? (
              <span role="alert" className="mt-1.5 block text-xs font-medium text-red-600">{errors.number}</span>
            ) : (
              <span className="mt-1.5 block text-xs text-sage">C’est le numéro du compte {net.label} qui va payer.</span>
            )}
          </div>

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-700">{error}</p>}

          <PayButton type="submit" busy={busy} busyLabel="Envoi de la demande…" label="Confirmer le paiement" note={fcfa(amount)} />
          <p className="flex items-center justify-center gap-1.5 text-xs text-sage"><Lock className="h-3.5 w-3.5" /> Paiement sécurisé · aucun débit sans votre code secret</p>
          {onCancel && (
            <button type="button" onClick={onCancel} className="block w-full text-center text-sm font-medium text-sage transition hover:text-ink">Plus tard</button>
          )}
        </form>
      )}

      {step === "waiting" && (
        <div className="p-5 sm:p-6" role="status">
          <div className="text-center">
            <span className="relative mx-auto flex h-16 w-16 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-ink/10" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white"><Smartphone className="h-7 w-7" /></span>
            </span>
            <h3 className="mt-4 text-lg font-semibold text-ink">Validez sur votre téléphone</h3>
            <p className="mt-1 text-sm leading-6 text-sage">Une demande de <strong className="text-ink">{fcfa(amount)}</strong> a été envoyée au <strong className="text-ink">{maskedNumber || "numéro saisi"}</strong>.</p>
          </div>

          <ol className="mt-5 space-y-3 rounded-xl border border-[#dfe3e8] bg-white p-4 text-sm leading-6 text-ink/85">
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f3f6] text-xs font-bold">1</span> Un message (ou une notification) {net.label} apparaît sur votre téléphone.</li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f3f6] text-xs font-bold">2</span> Saisissez votre <strong>code secret</strong> pour confirmer le paiement.</li>
          </ol>

          <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs leading-5 text-amber-900">
            {net.ussd
              ? <>Rien reçu ? Composez <strong>{net.ussd}</strong> et validez la transaction en attente, ou ouvrez l’application {net.label}.</>
              : <>Rien reçu ? Ouvrez l’application {net.label} et validez la transaction en attente.</>}
          </p>

          {timedOut ? (
            <p className="mt-4 rounded-xl bg-[#f1f3f6] px-3.5 py-2.5 text-sm text-ink/80">Toujours pas de confirmation. Si vous avez validé, patientez une minute ; sinon renvoyez la demande.</p>
          ) : (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-sage"><Loader2 className="h-4 w-4 animate-spin" /> En attente de la confirmation · <Clock className="h-4 w-4" /> {clock}</p>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {(tries >= RESEND_AFTER || timedOut) && sentValues && (
              <button type="button" disabled={busy} onClick={() => void start(sentValues)} className="btn btn-outline btn-sm">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Renvoyer la demande
              </button>
            )}
            <button type="button" onClick={() => { done.current = true; setStep("form"); }} className="btn btn-outline btn-sm">Changer de numéro ou de réseau</button>
          </div>
        </div>
      )}

      {step === "paid" && (
        <div className="p-6 text-center" role="status">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h3 className="mt-3 text-xl font-semibold text-ink">Paiement réussi</h3>
          <dl className="mx-auto mt-4 max-w-xs divide-y divide-[#e6e9ee] rounded-xl border border-[#dfe3e8] bg-white text-left text-sm">
            <div className="flex justify-between gap-3 px-4 py-2.5"><dt className="text-sage">Montant</dt><dd className="font-semibold text-ink">{fcfa(amount)}</dd></div>
            <div className="flex justify-between gap-3 px-4 py-2.5"><dt className="text-sage">Moyen</dt><dd className="font-semibold text-ink">{net.label}</dd></div>
            <div className="flex justify-between gap-3 px-4 py-2.5"><dt className="text-sage">Compte</dt><dd className="font-semibold text-ink">{maskedNumber}</dd></div>
            {paidAt && <div className="flex justify-between gap-3 px-4 py-2.5"><dt className="text-sage">Date</dt><dd className="font-semibold text-ink">{paidAt.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</dd></div>}
          </dl>
          <p className="mt-4 text-sm text-sage">Merci ! Tout est débloqué, nous vous redirigeons…</p>
        </div>
      )}

      {step === "failed" && (
        <div className="p-6" role="alert">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-3 text-lg font-semibold text-ink">Paiement non abouti</h3>
            <p className="mt-1 text-sm text-sage">Aucun montant n’a été débité.</p>
          </div>
          <ul className="mt-4 list-disc space-y-1 rounded-xl border border-[#dfe3e8] bg-white py-3 pl-8 pr-4 text-sm leading-6 text-ink/80">
            <li>Solde insuffisant sur le compte {net.label}</li>
            <li>Code secret erroné ou demande non validée à temps</li>
            <li>Plafond de transaction atteint</li>
          </ul>
          <button type="button" onClick={() => setStep("form")} className="btn btn-primary mt-5 w-full">Réessayer</button>
        </div>
      )}
    </div>
  );
}
