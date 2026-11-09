"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Crown, Loader2, X } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import AuthForm from "@/components/account/auth-form";
import { useIsSignedIn } from "@/components/account/account-gate";
import { PREMIUM_SUITE_KEY, startPremiumCheckout, usePremium } from "@/lib/premium";
import FedapayBadge from "@/components/fedapay-badge";

export interface PremiumOffer {
  /** Ce que la personne a voulu utiliser (« Wi-Fi », « Élégant »…). */
  label: string;
  /** Page de commande qui débloque la fonctionnalité. */
  href: string;
  /** Prix affiché, en FCFA. */
  price: string;
  /** Option à essayer : la fenêtre prévient, puis débloque ; le paiement n'est demandé qu'à la fin. */
  onTry?: () => void;
  /** Saute la présentation : compte (si besoin), puis paiement FedaPay. */
  direct?: boolean;
  /** Page où revenir après le paiement (par défaut `href`). */
  suite?: string;
}

const PERKS = [
  "QR code net, prêt à imprimer en PNG et SVG",
  "Tous les contenus : Wi-Fi, carte de visite, PDF, image, vidéo…",
  "Les styles premium : formes élégantes et couleurs",
  "5 000 FCFA, paiement en ligne sécurisé",
];

/** Fenêtre d'offre Premium, style SaaS : titre, bénéfices, prix, un seul bouton. */
export default function PremiumModal({ offer, onClose }: { offer: PremiumOffer | null; onClose: () => void }) {
  // Une clé par offre : chaque ouverture repart de l'étape « offre ».
  return <ModalBody key={offer ? `${offer.label}|${offer.href}` : "closed"} offer={offer} onClose={onClose} />;
}

function ModalBody({ offer, onClose }: { offer: PremiumOffer | null; onClose: () => void }) {
  const router = useRouter();
  const signedIn = useIsSignedIn();
  const premium = usePremium();
  const { authToken } = useFile();
  const [step, setStep] = useState<"offer" | "account" | "pay">(offer?.direct ? (signedIn ? "pay" : "account") : "offer");
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (!offer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [offer, onClose]);

  if (!offer) return null;

  const suiteTo = offer.suite ?? offer.href;
  /** Compte (Google ou e-mail) d'abord, puis paiement FedaPay, le tout dans cette fenêtre. */
  const start = () => {
    if (premium.active) {
      router.push(offer.href);
      onClose();
    } else setStep(signedIn ? "pay" : "account");
  };
  const pay = async () => {
    if (!authToken) return;
    setBusy(true);
    setPayError(null);
    try {
      sessionStorage.setItem(PREMIUM_SUITE_KEY, suiteTo);
    } catch {}
    try {
      const { paymentUrl } = await startPremiumCheckout(authToken);
      window.location.assign(paymentUrl);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Le paiement FedaPay est momentanément indisponible. Réessayez dans un instant.");
      setBusy(false);
    }
  };

  if (offer.onTry) {
    const tryIt = () => {
      offer.onTry?.();
      onClose();
    };
    return (
      <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="premium-title">
        <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" />
        <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_80px_rgba(23,23,26,0.35)] sm:rounded-3xl">
          <div className="premium-gold px-6 pb-6 pt-7 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]">
              <Crown className="h-6 w-6" />
            </span>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] opacity-75">Option Premium</p>
            <h2 id="premium-title" className="mt-1 text-xl font-bold tracking-[-0.02em]">« {offer.label} »</h2>
          </div>
          <div className="px-6 pb-6 pt-5">
            <p className="text-sm leading-6 text-ink/80">
              Cette option fait partie de Premium. Vous pouvez l’essayer tout de suite.
            </p>
            <button type="button" onClick={tryIt} className="btn btn-primary mt-5 w-full justify-center py-3.5 text-base">
              Essayer maintenant <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} className="mt-1 w-full py-2.5 text-sm font-medium text-sage transition hover:text-ink">
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="premium-title">
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" />
      <div className="relative max-h-[94svh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-[0_30px_80px_rgba(23,23,26,0.35)] sm:rounded-3xl">
        <div className="premium-gold relative px-6 pb-7 pt-8 text-center">
          <button type="button" onClick={onClose} aria-label="Fermer" className="absolute right-3 top-3 rounded-full p-2 text-[#3b2300]/70 transition hover:bg-white/30">
            <X className="h-5 w-5" />
          </button>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]">
            <Crown className="h-7 w-7" />
          </span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] opacity-75">Premium</p>
          <h2 id="premium-title" className="mt-1 text-2xl font-bold tracking-[-0.02em]">
            Débloquez « {offer.label} »
          </h2>
        </div>

        {step === "account" && !signedIn ? (
          <div className="px-6 pb-6 pt-5">
            {!offer.direct && (
              <button type="button" onClick={() => setStep("offer")} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-ink">
                <ArrowLeft className="h-4 w-4" /> Retour
              </button>
            )}
            <h3 className="text-lg font-semibold text-ink/90">Créez votre compte</h3>
            <p className="mt-1 text-sm leading-6 text-sage">Avec Google ou votre e-mail. Ensuite, vous réglez {offer.price} FCFA par FedaPay.</p>
            <AuthForm className="mt-4" onDone={() => setStep("pay")} />
          </div>
        ) : step === "pay" ? (
          <div className="px-6 pb-6 pt-5">
            <h3 className="text-lg font-semibold text-ink/90">Réglez {offer.price} FCFA par FedaPay</h3>
            <p className="mt-1 text-sm leading-6 text-sage">Mobile Money ou carte. Tout est débloqué dès la confirmation du paiement.</p>
            {payError && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{payError}</p>}
            <button type="button" onClick={pay} disabled={busy || !authToken} className="btn btn-primary mt-5 w-full justify-center py-3.5 text-base">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Redirection vers FedaPay…" : `Payer ${offer.price} FCFA`}
            </button>
            <FedapayBadge className="mt-3 flex justify-center" />
            <button type="button" onClick={onClose} className="mt-1 w-full py-2.5 text-sm font-medium text-sage transition hover:text-ink">Plus tard</button>
          </div>
        ) : (
        <div className="px-6 pb-6 pt-5">
          <ul className="space-y-2.5">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm leading-6 text-ink/80">
                <span className="premium-gold mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                  <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-baseline justify-between rounded-2xl border border-line bg-cream px-4 py-3">
            <span className="text-sm text-sage">Premium · un seul prix</span>
            <span className="text-xl font-bold text-ink">
              {offer.price} <span className="text-sm font-medium text-sage">FCFA</span>
            </span>
          </div>

          <button type="button" onClick={start} className="btn btn-primary mt-4 w-full justify-center py-3.5 text-base">
            Passer en Premium <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-3 text-center text-xs leading-5 text-sage">1. Créez un compte (Google ou e-mail) · 2. Payez par FedaPay</p>
          <FedapayBadge className="mt-2 flex justify-center" />
          <button type="button" onClick={onClose} className="mt-1 w-full py-2.5 text-sm font-medium text-sage transition hover:text-ink">
            Continuer avec la version gratuite
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
