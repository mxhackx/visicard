"use client";

import { useEffect, useMemo, useRef, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Images,
  Loader2,
  PanelsTopLeft,
  UploadCloud,
  X,
} from "lucide-react";
import { createOrder, rememberOrderKey, validateCustomer } from "@/lib/orders";
import Stepper from "@/components/order/stepper";
import QrDesigner from "@/components/qr/qr-designer";
import CustomerFields, { emptyCustomer, type CustomerDraft } from "@/components/order/customer-fields";
import { SERVICES, type ServiceType } from "@/lib/services";

const icons = {
  page: PanelsTopLeft,
  media: Images,
  document: FileText,
} satisfies Record<ServiceType, typeof PanelsTopLeft>;


const pagePath = [
  "Vous remplissez la présentation, les photos, les horaires et les contacts.",
  "Vous choisissez un thème : l’aperçu se met à jour en direct.",
  "Vous recevez un devis et payez par Mobile Money ou carte : le QR code s’active aussitôt.",
];

export default function CreateFlow({ initialService }: { initialService: ServiceType | null }) {
  const router = useRouter();

  const [service, setService] = useState<ServiceType | null>(initialService);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [customer, setCustomer] = useState<CustomerDraft>(emptyCustomer);
  const [qrStyle, setQrStyle] = useState("");
  const [customerErrors, setCustomerErrors] = useState<Partial<Record<keyof CustomerDraft, string>>>({});

  // Aperçu d'image : créé au choix du fichier, libéré au remplacement et au démontage.
  const previewRef = useRef<string | null>(null);
  const selectFile = (next: File | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next && next.type.startsWith("image/") ? URL.createObjectURL(next) : null;
    setPreviewUrl(previewRef.current);
    setFile(next);
  };
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const selectedOffer = useMemo(
    () => SERVICES.find((offer) => offer.id === service) ?? null,
    [service],
  );

  const accept =
    service === "document" ? "application/pdf" : service === "media" ? "image/*,video/*" : undefined;

  const pickService = (nextService: ServiceType) => {
    setService(nextService);
    setError(null);
    selectFile(null);
    setTitle("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("service", nextService);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const handleFile = (nextFile: File | null) => {
    if (!nextFile) {
      selectFile(null);
      return;
    }

    setError(null);

    if (nextFile.size > 32 * 1024 * 1024) {
      setError("Le fichier dépasse 32 Mo. Contactez-nous pour un envoi plus lourd.");
      return;
    }

    if (service === "document" && nextFile.type !== "application/pdf") {
      setError("Le service document accepte uniquement un fichier PDF.");
      return;
    }

    if (
      service === "media" &&
      !nextFile.type.startsWith("image/") &&
      !nextFile.type.startsWith("video/")
    ) {
      setError("Le service média accepte une image (JPG, PNG, WEBP) ou une vidéo.");
      return;
    }

    selectFile(nextFile);
    if (!title.trim()) {
      setTitle(nextFile.name.replace(/\.[^.]+$/, "").slice(0, 80));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!service || service === "page") return;

    if (!file) {
      setError(service === "document" ? "Choisissez un fichier PDF." : "Choisissez une image ou une vidéo.");
      return;
    }

    const found = validateCustomer(customer);
    setCustomerErrors(found);
    if (Object.keys(found).length) return;

    setError(null);
    setIsSubmitting(true);

    const body = new FormData();
    body.append("serviceType", service);
    body.append("title", title.trim() || file.name);
    body.append(service === "document" ? "document" : "media", file);
    body.append("customerName", customer.name.trim());
    body.append("customerPhone", customer.phone.trim());
    if (customer.email.trim()) body.append("customerEmail", customer.email.trim());
    if (qrStyle) body.append("qrStyle", qrStyle);

    try {
      const order = await createOrder(body);
      rememberOrderKey(order.reference, order.accessToken);
      router.push(`/commande/${order.reference}?cle=${encodeURIComponent(order.accessToken)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative overflow-hidden">

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-sage transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Accueil
          </Link>

          <div className="mt-6 max-w-3xl">
            <Stepper current={0} />
          </div>

          <p className="eyebrow mt-10">Créer un QR code</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink/90 sm:text-4xl lg:text-5xl">
            Quel contenu voulez-vous mettre derrière le code ?
          </h1>
          <p className="mt-5 text-base leading-7 text-sage">
            Choisissez un service : un QR code correspond à un seul contenu. Pas besoin de compte :
            vous recevez un devis, puis votre QR code dès le paiement.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {SERVICES.map((offer) => {
            const Icon = icons[offer.id];
            const active = service === offer.id;
            return (
              <button
                key={offer.id}
                type="button"
                onClick={() => pickService(offer.id)}
                aria-pressed={active}
                className={`group flex flex-col gap-3 rounded-lg border p-5 text-left transition-all duration-300 ${
                  active
                    ? "border-forest bg-forest text-white shadow-[0_18px_40px_rgba(23,23,26,0.3)]"
                    : "surface text-ink hover:-translate-y-0.5 hover:border-ambre/60"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${
                      active ? "border-white/20 bg-white/10" : "border-white/70 bg-leaf text-ambre-deep"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span
                    className={`text-[11.5px] font-semibold uppercase tracking-[0.14em] ${
                      active ? "text-white/60" : "text-sage"
                    }`}
                  >
                    {offer.price} FCFA
                  </span>
                </span>
                <span className="text-sm font-semibold">{offer.name}</span>
                <span
                  className={`text-xs leading-5 ${active ? "text-white/65" : "text-sage"}`}
                >
                  {offer.tagline}
                </span>
              </button>
            );
          })}
        </div>

        {!service && (
          <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-ambre/50 bg-white p-8 text-center">
            <p className="text-sm text-sage">
              Sélectionnez l’un des trois services ci-dessus pour continuer.
            </p>
          </div>
        )}

        {service === "page" && selectedOffer && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="surface p-6 sm:p-8">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-sage">
                Service {selectedOffer.index} · {selectedOffer.price} FCFA
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink/90">
                {selectedOffer.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-sage">{selectedOffer.description}</p>

              <ol className="mt-7 space-y-5 border-t border-line pt-6">
                {pagePath.map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span className="text-lg font-semibold leading-none text-forest">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm leading-6 text-ink">{step}</p>
                  </li>
                ))}
              </ol>

              <button
                type="button"
                onClick={() => router.push("/creer/page/informations")}
                className="btn btn-primary mt-8 w-full sm:w-auto"
              >
                Commencer ma page
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="brand-surface rounded-[var(--radius-card)] p-6 sm:p-8">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Compris dans l’offre
              </p>
              <ul className="mt-5 space-y-3">
                {selectedOffer.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6 text-white/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="mt-7 border-t border-white/15 pt-5 text-xs leading-5 text-white/55">
                Vous gardez la main sur le contenu : chaque modification est en ligne immédiatement,
                sans réimprimer le QR code.
              </p>
            </div>
          </div>
        )}

        {(service === "media" || service === "document") && selectedOffer && (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="surface p-6 sm:p-8">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-sage">
                Service {selectedOffer.index} · {selectedOffer.price} FCFA
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink/90">
                {selectedOffer.name}
              </h2>

              <div className="mt-6">
                <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-ink">
                  Nom du QR code
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={
                    service === "document" ? "Carte de visite, brochure…" : "Affiche, vidéo de présentation…"
                  }
                  className="field"
                  maxLength={90}
                />
                <p className="mt-1.5 text-xs text-sage">
                  Ce nom figure sur votre devis et votre facture.
                </p>
              </div>

              <div className="mt-6">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  {service === "document" ? "Fichier PDF" : "Image ou vidéo"}
                </span>

                <input
                  ref={inputRef}
                  type="file"
                  accept={accept}
                  className="sr-only"
                  onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                />

                {!file ? (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-ambre/50 bg-white px-6 py-10 text-center transition-colors hover:border-ambre/70 hover:bg-white/70"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-forest text-white">
                      <UploadCloud className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-ink">
                      {service === "document" ? "Choisir un PDF" : "Choisir une image ou une vidéo"}
                    </span>
                    <span className="text-xs text-sage">
                      {service === "document"
                        ? "PDF uniquement · 32 Mo maximum"
                        : "JPG, PNG, WEBP, MP4, MOV · 32 Mo maximum"}
                    </span>
                  </button>
                ) : (
                  <div className="surface-soft p-4">
                    <div className="flex items-start gap-4">
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt="Aperçu du fichier sélectionné"
                          className="h-16 w-16 shrink-0 rounded-md border border-line object-cover"
                        />
                      ) : (
                        <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-line bg-white text-ink">
                          {service === "document" ? (
                            <FileText className="h-6 w-6" />
                          ) : (
                            <Images className="h-6 w-6" />
                          )}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
                        <p className="mt-0.5 text-xs text-sage">
                          {(file.size / (1024 * 1024)).toFixed(2)} Mo ·{" "}
                          {file.type || "type inconnu"}
                        </p>
                        <button
                          type="button"
                          onClick={() => selectFile(null)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ink underline-offset-4 hover:underline"
                        >
                          <X className="h-3.5 w-3.5" />
                          Remplacer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 border-t border-line pt-6">
                <h3 className="text-sm font-semibold text-ink/90">Votre QR code</h3>
                <p className="mt-1 mb-4 text-xs text-sage">Le motif à imprimer ou partager. Il sera actif dès le paiement confirmé.</p>
                <QrDesigner value={qrStyle} onChange={setQrStyle} />
              </div>

              <div className="mt-8 border-t border-line pt-6">
                <h3 className="text-sm font-semibold text-ink/90">Vos coordonnées</h3>
                <p className="mt-1 text-xs text-sage">Pour le devis et la facture. Aucun compte n’est créé.</p>
                <div className="mt-4">
                  <CustomerFields value={customer} onChange={setCustomer} errors={customerErrors} />
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary mt-6 w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création du devis…
                  </>
                ) : (
                  <>
                    Obtenir mon devis
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs leading-5 text-sage">
                Aucun paiement à cette étape : vous verrez l’aperçu et le devis de {selectedOffer.price} FCFA.
              </p>
            </div>

            <div className="brand-surface rounded-[var(--radius-card)] p-6 sm:p-8">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Ce que vous obtenez
              </p>
              <ul className="mt-5 space-y-3">
                {selectedOffer.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6 text-white/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="mt-7 border-t border-white/15 pt-5 text-xs leading-5 text-white/55">
                Le fichier est hébergé sur une page de lecture légère. Le QR code pointe vers cette
                page, pas directement vers le fichier.
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
