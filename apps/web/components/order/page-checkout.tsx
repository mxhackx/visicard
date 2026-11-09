"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ImageIcon, Loader2, MapPin, Palette, Phone, QrCode, ShieldCheck } from "lucide-react";
import FedapayBadge from "@/components/fedapay-badge";
import QrDesigner from "@/components/qr/qr-designer";
import { paletteFor } from "@/lib/palette";
import { useFile } from "@/app/context/FileContext";
import { SERVICES } from "@/lib/services";
import { createOrder, fcfa, payOrder, validateCustomer } from "@/lib/orders";
import AccountGate, { useIsSignedIn } from "@/components/account/account-gate";
import CustomerFields, { emptyCustomer, type CustomerDraft } from "@/components/order/customer-fields";

const offer = SERVICES.find((s) => s.id === "page")!;

/** Dernière étape client de la page digitale : récapitulatif, coordonnées, puis devis. */
export default function PageCheckout() {
  const router = useRouter();
  const { restaurantInfo, customization, setQrStyle, resetAll, authUser } = useFile();
  const signedIn = useIsSignedIn();
  const [customer, setCustomer] = useState<CustomerDraft>(emptyCustomer);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDraft, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connecté : l'e-mail du compte est repris dans la facture.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (authUser?.email) setCustomer((c) => (c.email ? c : { ...c, email: authUser.email! }));
  }, [authUser?.email]);

  // Arrivée directe sans contenu préparé : retour à la première étape.
  useEffect(() => {
    if (!restaurantInfo.restaurantName.trim()) router.replace("/creer?type=page&etape=informations");
  }, [restaurantInfo.restaurantName, router]);

  const logoPreview = restaurantInfo.logoPreview;

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
      if (!(await payOrder(order))) {
        // Paiement en ligne indisponible : la page de commande propose de contacter l’équipe.
        router.push(`/commande/${order.reference}?cle=${encodeURIComponent(order.accessToken)}`);
        resetAll();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "La commande a échoué. Réessayez.");
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <Link
        href="/creer?type=page&etape=apparence"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-sage transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Apparence
      </Link>

      <h1 className="page-title mt-10">
        Votre page est prête. Dernière étape.
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-sage">
        Indiquez votre nom et votre numéro, puis réglez en ligne. Votre QR code est activé dès la
        confirmation du paiement.
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
              <Fact icon={Palette} label="Thème" value={customization.themeId.startsWith("custom#") ? "Couleurs personnalisées" : "Couleurs d’origine"} />
            </dl>
            <Link
              href="/creer?type=page&etape=informations"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-dark"
            >
              <MapPin className="h-4 w-4" />
              Modifier le contenu
            </Link>
          </div>

          <div className="surface p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink/90">
              <QrCode className="h-5 w-5 text-forest" /> Votre QR code
            </h2>
            <p className="mt-1 text-sm text-sage">Le motif à imprimer. Il sera actif dès le paiement confirmé.</p>
            <div className="mt-5">
              <QrDesigner
                value={customization.qrStyle}
                onChange={setQrStyle}
                logoUrl={restaurantInfo.logoPreview}
                brandColor={paletteFor(customization.themeId, customization.cardLayout).brand}
              />
            </div>
          </div>

          <AccountGate>
            <div className="surface p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-ink/90">Vos coordonnées</h2>
              <p className="mt-1 text-sm text-sage">Elles figurent sur votre facture.</p>
              <div className="mt-5">
                <CustomerFields value={customer} onChange={setCustomer} errors={errors} />
              </div>
            </div>
          </AccountGate>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface overflow-hidden">
            <div className="brand-surface px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Total à payer</p>
              <p className="mt-2 text-3xl font-semibold">{fcfa(Number(offer.price.replace(/\s/g, "")))}</p>
              <p className="mt-1 text-sm text-white/75">5 000 FCFA, tout inclus</p>
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
              <button type="submit" disabled={submitting || !signedIn} className="btn btn-primary mt-6 w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? "Redirection vers le paiement…" : `Payer ${fcfa(Number(offer.price.replace(/\s/g, "")))}`}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>
              {signedIn && <FedapayBadge className="mt-3 flex justify-center" />}
              <p className="mt-2 text-center text-xs leading-5 text-sage">
                {signedIn
                  ? "Mobile Money ou carte. Facture envoyée après paiement."
                  : "Créez votre compte à gauche pour continuer vers le paiement."}
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
