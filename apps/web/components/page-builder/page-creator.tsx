"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { useDialogs } from "@/components/account/auth-dialog";
import { useIsSignedIn } from "@/components/account/account-gate";
import ContentPicker from "@/components/qr/content-picker";
import Step from "@/components/qr/step-card";
import PayButton from "@/components/payment/pay-button";
import CreateAction, { useAccountContact } from "@/components/account/create-action";
import { InformationsBody } from "@/components/page-builder/informations-step";
import PreviewPopover from "@/components/page-builder/preview-popover";
import { AppearanceSections, PagePreview } from "@/components/page-builder/apparence-step";
import { createOrder, rememberOrder } from "@/lib/orders";
import { PREMIUM_PRICE, usePremium, useTrial } from "@/lib/premium";

/**
 * Créateur de page digitale, dans le même cadre que les autres contenus : titre, choix du contenu, étapes numérotées
 * (Contenu, Apparence, Création) à gauche et aperçu en direct à droite. Tout tient sur une seule page.
 */
export default function PageCreator() {
  const [trial, startTrial] = useTrial();
  const premium = usePremium();
  const { openPremium } = useDialogs();
  const validate = useRef<() => boolean>(() => true);

  return (
    <section className="mx-auto flex max-w-6xl flex-col px-4 pb-10 pt-8 sm:px-6 lg:h-[calc(100svh-var(--header-h)-1px)] lg:overflow-hidden lg:px-8 lg:pb-4 lg:pt-12">
      <PreviewPopover><PagePreview /></PreviewPopover>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:mt-8 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        {/* Cadre fixe : le contour de la section reste visible pendant que le contenu défile à l'intérieur. */}
        <div className="min-w-0 lg:min-h-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-line lg:bg-cream/50">
        <div className="min-w-0 space-y-6 lg:h-full lg:overflow-y-auto lg:p-3">
          {/* Sur téléphone, le bouton est au-dessus de la carte « Contenu » ; sur grand écran, il est dans son en-tête. */}
          {premium.ready && !premium.active && (
            <button type="button" onClick={() => openPremium({ label: "Débloquer Premium", suite: "/creer?type=page" })} className="premium-gold inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-[0_8px_22px_rgba(185,121,26,0.28)] transition active:scale-[0.98] hover:brightness-105 sm:hidden">
              <Crown className="h-4 w-4" /> Débloquer Premium · {PREMIUM_PRICE} FCFA
            </button>
          )}
          <Step
            title="Contenu"
            aside={premium.ready && !premium.active ? (
              <button type="button" onClick={() => openPremium({ label: "Débloquer Premium", suite: "/creer?type=page" })} className="premium-gold inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-[0_8px_22px_rgba(185,121,26,0.28)] transition active:scale-[0.98] hover:brightness-105 max-sm:hidden">
                <Crown className="h-4 w-4" /> Débloquer Premium · {PREMIUM_PRICE} FCFA
              </button>
            ) : undefined}
          >
            <div className="pb-5 pt-3">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">Créez votre QR code</h1>
              <p className="mt-2 text-sm leading-6 text-sage">Votre page digitale : vos informations, son apparence, puis la création.</p>
            </div>
            <ContentPicker current="page" trial={trial} onTrial={startTrial} />
            <div className="mt-6 space-y-6">
              <InformationsBody mode="client" embedded registerValidate={(fn) => (validate.current = fn)} />
            </div>
          </Step>

          <Step id="qr-style" title="Apparence">
            <AppearanceSections />
          </Step>

          <Step id="qr-final" n={3} title="Créer ma page">
            <PageOrder validate={() => validate.current()} />
          </Step>
        </div>
        </div>

        <aside className="hidden min-w-0 lg:block lg:min-h-0">
          <PagePreview fill />
        </aside>
      </div>
    </section>
  );
}

/** Dernière étape : sans Premium, fenêtre de paiement Mobile Money (la page et ses photos restent en place) ; avec Premium, création directe. */
function PageOrder({ validate }: { validate: () => boolean }) {
  const router = useRouter();
  const { restaurantInfo, customization, resetAll } = useFile();
  const signedIn = useIsSignedIn();
  const premium = usePremium();
  const contact = useAccountContact();
  const { openPremium, openAuth } = useDialogs();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = () => {
    if (!validate()) return;
    openPremium({ label: "Créer ma page", suite: "/creer?type=page" });
  };

  const create = async () => {
    if (!validate()) return;
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("serviceType", "page");
    body.append("customerName", contact.name || contact.email);
    body.append("customerPhone", contact.phone);
    if (contact.email) body.append("customerEmail", contact.email);
    body.append("restaurantName", restaurantInfo.restaurantName);
    body.append("address", restaurantInfo.address || "");
    body.append("locationUrl", restaurantInfo.locationUrl);
    body.append("phoneNumber", restaurantInfo.phoneNumber);
    for (const key of ["facebookUrl", "instagramUrl", "xUrl", "snapchatUrl", "additionalInfo"] as const) {
      if (restaurantInfo[key]) body.append(key, restaurantInfo[key]);
    }
    body.append("schedule", JSON.stringify(restaurantInfo.schedule));
    body.append("themeId", customization.themeId);
    if (customization.cardLayout) body.append("cardLayout", customization.cardLayout);
    if (customization.qrStyle) body.append("qrStyle", customization.qrStyle);
    if (restaurantInfo.logoFile) body.append("logo", restaurantInfo.logoFile);
    restaurantInfo.menuFiles.forEach((f) => body.append("menu", f));
    restaurantInfo.placeFiles.forEach((f) => body.append("place", f));
    try {
      const order = await createOrder(body);
      // Couverte par Premium : la commande est déjà payée, on ouvre sa page.
      rememberOrder(order);
      router.push(`/commande/${order.reference}?cle=${encodeURIComponent(order.accessToken)}`);
      resetAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "La création a échoué. Réessayez.");
      setBusy(false);
    }
  };

  if (!signedIn || !premium.active) {
    return (
      <div className="text-center">
        <p className="mx-auto max-w-xl text-sm leading-6 text-sage">
          La création de votre page fait partie de Premium ({PREMIUM_PRICE} FCFA). Connectez-vous, puis réglez par Mobile Money : le paiement se fait dans une fenêtre, cette page et tout ce que vous avez saisi restent ici.
        </p>
        <PayButton onClick={signedIn ? pay : () => (validate() ? pay() : undefined)} label="Publier ma page" note={`${PREMIUM_PRICE} FCFA · 5 pages · valable 1 an`} className="mx-auto mt-4 max-w-sm" />
        {!signedIn && (
          <button type="button" onClick={() => openAuth({ mode: "login" })} className="mx-auto mt-2 block text-sm font-medium text-sage underline-offset-4 hover:text-ink hover:underline">
            J’ai déjà un compte
          </button>
        )}
      </div>
    );
  }

  // Les 5 pages du paiement sont toutes utilisées : un nouveau paiement de 5 000 FCFA en ajoute 5.
  const quota = premium.pages;
  if (quota && quota.limit !== null && quota.used >= quota.limit) {
    return (
      <div className="text-center">
        <p className="mx-auto max-w-xl text-sm leading-6 text-sage">
          Vous avez utilisé vos <strong className="text-ink">{quota.limit} pages digitales</strong>. Payez {PREMIUM_PRICE} FCFA de plus pour en créer {quota.limit > 0 ? "5 autres" : "5"} : cette page et tout ce que vous avez saisi restent ici.
        </p>
        <PayButton onClick={() => openPremium({ label: "5 pages de plus", suite: "/creer?type=page", renew: true })} label="Ajouter 5 pages" note={`${PREMIUM_PRICE} FCFA`} className="mx-auto mt-4 max-w-sm" />
      </div>
    );
  }

  return <CreateAction label="Créer ma page" busyLabel="Création en cours…" busy={busy} error={error} onCreate={create} />;
}
