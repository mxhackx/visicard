"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Crown, Loader2 } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import AuthForm from "@/components/account/auth-form";
import FeexpayBadge from "@/components/feexpay-badge";
import VerifyEmailNotice from "@/components/account/verify-email-notice";
import PaymentForm, { type PayState } from "@/components/payment/payment-form";
import { safeNext } from "@/lib/account";
import { PREMIUM_PRICE, fetchPremiumStatus, notifyPremiumChanged, payPremium, usePremium } from "@/lib/premium";

const PERKS = [
  "Tous les contenus : Wi-Fi, carte de visite, PDF, image, vidéo, page digitale",
  "Toutes les couleurs, formes, coins et le logo au centre du QR code",
  "QR code net en PNG et SVG, enregistré dans votre espace",
  "Fichiers (image, vidéo, audio, PDF) jusqu’à 200 Mo et 5 pages digitales",
  "Valable un an, sans abonnement automatique",
];

/**
 * Page de paiement Premium : le compte d'abord (Google ou e-mail), puis le règlement Mobile Money.
 * Rien n'est perdu : la page de création se rouvre telle qu'elle était dès que le paiement est confirmé.
 */
export default function PaymentPage() {
  const router = useRouter();
  const params = useSearchParams();
  const suite = safeNext(params.get("suite"), "/creer");
  // Renouvellement : le compte est déjà Premium, mais peut payer une année de plus.
  const renew = params.get("renouveler") === "1";
  const { authToken, authUser } = useFile();
  const premium = usePremium();

  // Déjà Premium : retour direct là où l'on en était.
  useEffect(() => {
    if (premium.ready && premium.active && !renew) router.replace(suite);
  }, [premium.ready, premium.active, renew, router, suite]);

  // Renouvellement : le compte est déjà actif, le paiement est confirmé quand la date de fin recule.
  const baseUntil = useRef<number | null>(null);
  useEffect(() => {
    if (renew && premium.ready && baseUntil.current === null) baseUntil.current = premium.until ? new Date(premium.until).getTime() : 0;
  }, [renew, premium.ready, premium.until]);

  const check = async (): Promise<PayState> => {
    if (!authToken) return "pending";
    const status = await fetchPremiumStatus(authToken);
    if (renew) {
      const paid = status.until ? new Date(status.until).getTime() > (baseUntil.current ?? 0) : false;
      return paid ? "paid" : status.payment === "failed" ? "failed" : "pending";
    }
    return status.active ? "paid" : status.payment === "failed" ? "failed" : "pending";
  };

  const total = Number(PREMIUM_PRICE.replace(/\s/g, ""));

  const signedIn = premium.signedIn;
  const stepNow = signedIn ? 2 : 1;

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-16">
      <Link href={suite} className="inline-flex items-center gap-1.5 text-sm font-medium text-sage transition-colors hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {renew ? "Retour à Mon espace" : "Retour à ma création"}
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="page-title">{renew ? "Renouveler Premium" : "Paiement"}</h1>
          <p className="mt-1 text-sm text-sage">{renew ? `Une année de plus pour ${PREMIUM_PRICE} FCFA, ajoutée à la fin de votre Premium actuel.` : `Un seul paiement de ${PREMIUM_PRICE} FCFA pour tout débloquer.`}</p>
        </div>
        {/* Où j'en suis : le compte d'abord, puis le règlement. */}
        <ol className="flex items-center gap-3 text-sm font-medium" aria-label="Étapes">
          {[["Compte", 1], ["Paiement", 2]].map(([label, n], i) => {
            const done = stepNow > (n as number);
            const current = stepNow === n;
            return (
              <li key={label as string} className="flex items-center gap-3" aria-current={current ? "step" : undefined}>
                {i > 0 && <span className={`h-px w-8 ${done || current ? "bg-forest" : "bg-line"}`} aria-hidden="true" />}
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-forest text-white" : current ? "bg-forest text-white ring-4 ring-forest/15" : "bg-cream-deep text-sage"}`}>
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : (n as number)}
                </span>
                <span className={current || done ? "text-ink" : "text-sage"}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Récapitulatif compact sur téléphone ; la carte complète est à droite sur grand écran. */}
      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 lg:hidden">
        <div className="min-w-0">
          <span className="premium-pill"><Crown className="h-3 w-3" /> Premium</span>
          <p className="mt-1.5 truncate text-sm font-semibold text-ink">Moncode Premium · 1 an</p>
        </div>
        <p className="shrink-0 text-xl font-semibold tracking-[-0.02em] text-ink">{PREMIUM_PRICE} <span className="text-xs font-medium text-sage">FCFA</span></p>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start">
        <div className="min-w-0">
          {!signedIn ? (
            <div className="surface p-5 sm:p-8">
              <h2 className="text-lg font-semibold text-ink">Créez votre compte ou connectez-vous</h2>
              <p className="mt-1 text-sm leading-6 text-sage">Avec Google ou votre e-mail. Le paiement vient juste après.</p>
              <AuthForm className="mt-6 max-w-md" />
            </div>
          ) : !premium.ready ? (
            <div className="surface flex items-center justify-center gap-2 p-10 text-sm text-sage" role="status">
              <Loader2 className="h-4 w-4 animate-spin" /> Vérification de votre compte…
            </div>
          ) : (
            <div className="surface p-5 sm:p-8">
              <VerifyEmailNotice className="mb-6" />
              <h2 className="text-lg font-semibold text-ink">Payer par Mobile Money</h2>
              <p className="mb-6 mt-1 text-sm leading-6 text-sage">MTN, Moov ou Celtiis : vous validez la demande sur votre téléphone, avec votre code secret.</p>
              <PaymentForm
                amount={total}
                defaults={{ phone: authUser?.phone }}
                sandbox={premium.sandbox}
                pay={async (v) => {
                  if (!authToken) throw new Error("Connectez-vous pour continuer.");
                  await payPremium(authToken, v);
                }}
                check={check}
                onPaid={() => {
                  notifyPremiumChanged();
                  router.replace(suite);
                }}
              />
            </div>
          )}
        </div>

        <aside className="hidden min-w-0 lg:block lg:sticky lg:top-6">
          <div className="premium-bar">
            <div className="rounded-[15px] bg-white p-6">
              <span className="premium-pill"><Crown className="h-3 w-3" /> Premium</span>
              <h2 className="mt-3 text-lg font-semibold text-ink/90">Moncode Premium · 1 an</h2>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-[-0.03em] text-ink">{PREMIUM_PRICE}</span>
                <span className="text-sm font-medium text-sage">FCFA</span>
              </p>
              <ul className="mt-5 space-y-2.5 border-t border-line pt-5">
                {PERKS.map((p) => (
                  <li key={p} className="flex gap-2.5 text-sm leading-6 text-ink/80">
                    <span className="premium-gold mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"><Check className="h-2.5 w-2.5" strokeWidth={3.5} /></span>
                    {p}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-center"><FeexpayBadge /></p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
