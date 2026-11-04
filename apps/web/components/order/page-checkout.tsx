"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ImageIcon, Loader2, MapPin, Palette, Phone, ShieldCheck } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { SERVICES } from "@/lib/services";
import { createOrder, rememberOrderKey, validateCustomer } from "@/lib/orders";
import Stepper from "@/components/order/stepper";
import CustomerFields, { emptyCustomer, type CustomerDraft } from "@/components/order/customer-fields";

const offer = SERVICES.find((s) => s.id === "page")!;

/** Dernière étape client de la page digitale : récapitulatif, coordonnées, puis devis. */
export default function PageCheckout() {
  const router = useRouter();
  const { restaurantInfo, customization, resetAll } = useFile();
  const [customer, setCustomer] = useState<CustomerDraft>(emptyCustomer);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDraft, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Arrivée directe sans contenu préparé : retour à la première étape.
  useEffect(() => {
    if (!restaurantInfo.restaurantName.trim()) router.replace("/creer/page/informations");
  }, [restaurantInfo.restaurantName, router]);

  const logoPreview = useMemo(
    () => (restaurantInfo.logoFile ? URL.createObjectURL(restaurantInfo.logoFile) : null),
    [restaurantInfo.logoFile],
  );
  useEffect(() => () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  const photos = restaurantInfo.menuFiles.length + restaurantInfo.placeFiles.length;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validateCustomer(customer);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
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
      rememberOrderKey(order.reference, order.accessToken);
      router.push(`/commande/${order.reference}?cle=${encodeURIComponent(order.accessToken)}`);
      resetAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "La création du devis a échoué.");
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <Link
        href="/creer/page/apparence"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-sage transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Apparence
      </Link>

      <div className="mt-6 max-w-3xl">
        <Stepper current={1} />
      </div>

      <h1 className="mt-10 text-3xl font-semibold tracking-[-0.02em] text-ink/90 sm:text-4xl">
        Votre page est prête. Voici votre devis.
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-sage">
        Indiquez à qui adresser le devis. Vous verrez ensuite l’aperçu de votre page et pourrez payer par
        Mobile Money ou carte. Le QR code s’active dès le paiement confirmé.
      </p>

      <form onSubmit={submit} className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="surface p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-ink/90">Récapitulatif du contenu</h2>
            <div className="mt-5 flex items-center gap-4">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="" className="h-16 w-16 rounded-2xl border border-line object-cover" />
              ) : (
                <span className="icon-tile h-16 w-16">
                  <ImageIcon className="h-6 w-6" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-ink/90">{restaurantInfo.restaurantName}</p>
                <p className="truncate text-sm text-sage">{restaurantInfo.address || "Adresse non renseignée"}</p>
              </div>
            </div>
            <dl className="mt-6 grid gap-3 sm:grid-cols-3">
              <Fact icon={Phone} label="Contact" value={restaurantInfo.phoneNumber || "—"} />
              <Fact icon={ImageIcon} label="Photos" value={`${photos} photo${photos > 1 ? "s" : ""}`} />
              <Fact icon={Palette} label="Thème" value={customization.themeId.replace("theme-", "Thème ")} />
            </dl>
            <Link
              href="/creer/page/informations"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-dark"
            >
              <MapPin className="h-4 w-4" />
              Modifier le contenu
            </Link>
          </div>

          <div className="surface p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-ink/90">Vos coordonnées</h2>
            <p className="mt-1 text-sm text-sage">Elles figurent sur le devis et la facture. Aucun compte n’est créé.</p>
            <div className="mt-5">
              <CustomerFields value={customer} onChange={setCustomer} errors={errors} />
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface overflow-hidden">
            <div className="brand-surface px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Devis estimatif</p>
              <p className="mt-2 text-3xl font-semibold">{offer.price} FCFA</p>
              <p className="mt-1 text-sm text-white/75">Paiement unique, sans abonnement</p>
            </div>
            <div className="p-6">
              <ul className="space-y-2.5">
                {offer.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm text-ink/80">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                    {f}
                  </li>
                ))}
              </ul>
              {error && (
                <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </p>
              )}
              <button type="submit" disabled={submitting} className="btn btn-primary mt-6 w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? "Création du devis…" : "Obtenir mon devis"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-sage">
                Aucun paiement à cette étape. Le montant définitif figure sur le devis.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </section>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="surface-soft px-4 py-3">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-sage">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-ink/90">{value}</dd>
    </div>
  );
}
