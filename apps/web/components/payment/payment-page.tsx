"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Crown, Loader2 } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import AuthForm from "@/components/account/auth-form";
import FeexpayBadge from "@/components/feexpay-badge";
import PaymentForm, { type PayState } from "@/components/payment/payment-form";
import { safeNext } from "@/lib/account";
import { PREMIUM_PRICE, fetchPremiumStatus, notifyPremiumChanged, payPremium, usePremium } from "@/lib/premium";

const PERKS = [
  "Tous les contenus : Wi-Fi, carte de visite, PDF, image, vidéo, page digitale",
  "Toutes les couleurs, formes, coins et le logo au centre du QR code",
  "QR code net en PNG et SVG, enregistré dans votre espace",
  "Valable un an, sans abonnement automatique",
];

/**
 * Page de paiement Premium : le compte d'abord (Google ou e-mail), puis le règlement Mobile Money.
 * Rien n'est perdu : la page de création se rouvre telle qu'elle était dès que le paiement est confirmé.
 */
export default function PaymentPage() {
  const router = useRouter();
  const suite = safeNext(useSearchParams().get("suite"), "/creer");
  const { authToken, authUser } = useFile();
  const premium = usePremium();

  // Déjà Premium : retour direct là où l'on en était.
  useEffect(() => {
    if (premium.ready && premium.active) router.replace(suite);
  }, [premium.ready, premium.active, router, suite]);

  const check = async (): Promise<PayState> => {
    if (!authToken) return "pending";
    const status = await fetchPremiumStatus(authToken);
    return status.active ? "paid" : status.payment === "failed" ? "failed" : "pending";
  };

  const total = Number(PREMIUM_PRICE.replace(/\s/g, ""));

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Link href={suite} className="inline-flex items-center gap-1.5 text-sm font-medium text-sage transition-colors hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Retour à ma création
      </Link>
      <h1 className="page-title mt-4">Paiement</h1>
      <p className="mt-1 text-sm text-sage">Un seul paiement de {PREMIUM_PRICE} FCFA pour tout débloquer.</p>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start">
        <div className="min-w-0">
          {!premium.signedIn ? (
            <div className="surface p-5 sm:p-7">
              <h2 className="flex items-center gap-3 text-base font-semibold text-ink/90">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white">1</span>
                Votre compte
              </h2>
              <p className="mt-2 text-sm leading-6 text-sage">Avec Google ou votre e-mail. Le paiement vient juste après.</p>
              <AuthForm className="mt-5 max-w-md" />
            </div>
          ) : !premium.ready ? (
            <div className="surface flex items-center justify-center gap-2 p-10 text-sm text-sage" role="status">
              <Loader2 className="h-4 w-4 animate-spin" /> Vérification de votre compte…
            </div>
          ) : (
            <div className="surface p-5 sm:p-7">
              <h2 className="flex items-center gap-3 text-base font-semibold text-ink/90">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white">1</span>
                Paiement Mobile Money
              </h2>
              <div className="mt-5 max-w-lg">
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
            </div>
          )}
        </div>

        <aside className="min-w-0">
          <div className="premium-bar">
            <div className="rounded-[15px] bg-white p-5 sm:p-6">
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
