"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { useDialogs } from "@/components/account/auth-dialog";
import { useIsSignedIn } from "@/components/account/account-gate";
import ContentPicker from "@/components/qr/content-picker";
import Step from "@/components/qr/step-card";
import FeexpayBadge from "@/components/feexpay-badge";
import CreateAction, { useAccountContact } from "@/components/account/create-action";
import { InformationsBody } from "@/components/page-builder/informations-step";
import { AppearanceSections, PagePreview } from "@/components/page-builder/apparence-step";
import { createOrder, rememberOrder } from "@/lib/orders";
import { PREMIUM_PRICE, usePremium, useTrial } from "@/lib/premium";

/**
 * Créateur de page digitale, dans le même cadre que les autres contenus : titre, choix du contenu, étapes numérotées
 * (Contenu, Apparence, Création) à gauche et aperçu en direct à droite. Tout tient sur une seule page.
 */
export default function PageCreator() {
  const [trial, startTrial] = useTrial();
  const validate = useRef<() => boolean>(() => true);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-leaf text-ambre-deep">
          <Smartphone className="h-7 w-7" />
        </span>
        <div>
          <h1 className="page-title">Créez votre QR code</h1>
          <p className="text-sm text-sage">Votre page digitale : vos informations, son apparence, puis la création.</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Step n={1} title="Contenu">
            <ContentPicker current="page" trial={trial} onTrial={startTrial} />
            <div className="mt-6 space-y-6">
              <InformationsBody mode="client" embedded registerValidate={(fn) => (validate.current = fn)} />
            </div>
          </Step>

          <Step n={2} title="Apparence">
            <AppearanceSections />
          </Step>

          <Step n={3} title="Créer ma page">
            <PageOrder validate={() => validate.current()} />
          </Step>
        </div>

        <aside className="order-first min-w-0 lg:order-none">
          <PagePreview />
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
        <button type="button" onClick={signedIn ? pay : () => (validate() ? pay() : undefined)} className="btn btn-primary mx-auto mt-4 flex w-full max-w-sm justify-center py-3.5 text-base">
          Passer au paiement · {PREMIUM_PRICE} FCFA
        </button>
        {!signedIn && (
          <button type="button" onClick={() => openAuth({ mode: "login" })} className="mx-auto mt-2 block text-sm font-medium text-sage underline-offset-4 hover:text-ink hover:underline">
            J’ai déjà un compte
          </button>
        )}
        <FeexpayBadge className="mt-3 flex justify-center" />
      </div>
    );
  }

  return <CreateAction label="Créer ma page" busyLabel="Création en cours…" busy={busy} error={error} onCreate={create} />;
}
