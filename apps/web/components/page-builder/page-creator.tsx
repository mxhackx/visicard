"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Smartphone } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { useDialogs } from "@/components/account/auth-dialog";
import { useIsSignedIn } from "@/components/account/account-gate";
import ContentPicker from "@/components/qr/content-picker";
import Step from "@/components/qr/step-card";
import FedapayBadge from "@/components/fedapay-badge";
import CustomerFields, { emptyCustomer, type CustomerDraft } from "@/components/order/customer-fields";
import { InformationsBody } from "@/components/page-builder/informations-step";
import { AppearanceSections, PagePreview } from "@/components/page-builder/apparence-step";
import { createOrder, payOrder, validateCustomer } from "@/lib/orders";
import { PREMIUM_PRICE, usePremium, useTrial } from "@/lib/premium";
import { useEffect } from "react";

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

        <aside className="order-first min-w-0 lg:sticky lg:top-24 lg:order-none">
          <PagePreview />
        </aside>
      </div>
    </section>
  );
}

/** Dernière étape : sans Premium, paiement FedaPay (dans un autre onglet pour garder la page) ; avec Premium, création directe. */
function PageOrder({ validate }: { validate: () => boolean }) {
  const router = useRouter();
  const { restaurantInfo, customization, resetAll, authUser } = useFile();
  const signedIn = useIsSignedIn();
  const premium = usePremium();
  const { openPremium, openAuth } = useDialogs();
  const [customer, setCustomer] = useState<CustomerDraft>(emptyCustomer);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDraft, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = authUser?.email;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (email) setCustomer((c) => (c.email ? c : { ...c, email }));
  }, [email]);

  const pay = () => {
    if (!validate()) return;
    openPremium({ label: "Créer ma page", suite: "/creer?type=page", newTab: true });
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const found = validateCustomer(customer);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("serviceType", "page");
    body.append("customerName", customer.name.trim());
    body.append("customerPhone", customer.phone.trim());
    if (customer.email.trim()) body.append("customerEmail", customer.email.trim());
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
      // Déjà couvert par Premium : « déjà payé » côté paiement, on ouvre la commande.
      await payOrder(order);
      router.push(`/commande/${order.reference}?cle=${encodeURIComponent(order.accessToken)}`);
      resetAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "La création a échoué. Réessayez.");
      setBusy(false);
    }
  };

  if (!signedIn || !premium.active) {
    return (
      <div>
        <p className="text-sm leading-6 text-sage">
          La création de votre page fait partie de Premium ({PREMIUM_PRICE} FCFA). Connectez-vous, puis réglez par FedaPay : le paiement s’ouvre dans un autre onglet et cette page, avec tout ce que vous avez saisi, reste ici.
        </p>
        <button type="button" onClick={signedIn ? pay : () => (validate() ? pay() : undefined)} className="btn btn-primary mt-4 w-full max-w-sm justify-center py-3.5 text-base">
          Passer au paiement · {PREMIUM_PRICE} FCFA
        </button>
        {!signedIn && (
          <button type="button" onClick={() => openAuth({ mode: "login" })} className="mt-2 block text-sm font-medium text-sage underline-offset-4 hover:text-ink hover:underline">
            J’ai déjà un compte
          </button>
        )}
        <FedapayBadge className="mt-3 flex" />
      </div>
    );
  }

  return (
    <form onSubmit={create} noValidate>
      <h3 className="text-sm font-semibold text-ink/90">Vos coordonnées</h3>
      <p className="mt-1 text-xs text-sage">Elles figurent sur votre facture.</p>
      <div className="mt-4"><CustomerFields value={customer} onChange={setCustomer} errors={errors} /></div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary mt-5 w-full max-w-sm justify-center py-3.5 text-base">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? "Création en cours…" : "Créer ma page"}
      </button>
    </form>
  );
}
