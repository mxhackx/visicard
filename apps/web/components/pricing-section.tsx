import SectionHeading from "@/components/section-heading";
import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";
import { CUSTOM_OFFER } from "@/lib/services";

const offers = [
  {
    title: "QR direct",
    subtitle: "Wi-Fi, carte de visite, appel, SMS, e-mail, événement, GPS",
    price: "5 000",
    priceNote: "FCFA · par QR code",
    items: [
      "Tout est inscrit dans le QR code : aucune page à charger",
      "Enregistre un contact, rejoint un Wi-Fi, lance un appel",
      "Style et logo personnalisés",
      "PNG et SVG + facture",
    ],
    cta: { label: "Créer un QR direct", href: "/creer/qr" },
  },
  {
    title: "Image, vidéo ou PDF",
    subtitle: "Un média ou un document à partager",
    price: "5 000",
    priceNote: "FCFA · par QR code",
    items: [
      "1 QR code pour 1 image, 1 vidéo ou 1 PDF",
      "Page de lecture mobile optimisée",
      "Modifiable après impression",
      "PNG et SVG + facture",
    ],
    cta: { label: "Créer un QR média", href: "/creer" },
  },
  {
    title: "Page digitale",
    subtitle: "Restaurant, salon, boutique ou cabinet",
    price: "20 000",
    priceNote: "FCFA · paiement unique",
    highlight: true,
    items: [
      "Menu, photos, horaires, adresse et réseaux",
      "Bouton WhatsApp et appel",
      "Modifications en ligne",
      "Statistiques de scans",
    ],
    cta: { label: "Créer ma page", href: "/creer?service=page" },
  },
];

const customIncluded = [
  "Plusieurs QR codes, plusieurs établissements ou points de vente",
  "Charte graphique avancée et reprise de votre domaine",
  "Changements particuliers ou intégrations (caisse, réservation)",
  "Accompagnement et formation de votre équipe",
  "Devis clair après un échange de 15 minutes",
];

export default function PricingSection() {
  return (
    <section id="tarifs" className="anchor">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          title="Des prix simples, sans abonnement"
          subtitle="Un paiement unique par QR code, annoncé avant de payer."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer, index) => (
            <article
              key={offer.title}
              className={`surface surface-hover relative flex flex-col p-6 ${offer.highlight ? "ring-2 ring-forest" : ""}`}
              data-reveal
              style={{ "--d": `${index * 80}ms` } as React.CSSProperties}
            >
              {offer.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-forest px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  Le plus complet
                </span>
              )}
              <h3 className="text-lg font-semibold text-ink">{offer.title}</h3>
              <p className="mt-1 text-sm text-sage">{offer.subtitle}</p>

              <p className="mt-7 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-[-0.03em] text-ink">
                  {offer.price}
                </span>
                <span className="text-xs font-medium text-sage">
                  {offer.priceNote}
                </span>
              </p>

              <ul className="mt-8 space-y-3 border-t border-line pt-7">
                {offer.items.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-7 text-sage">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-col gap-3 pt-8">
                <Link href={offer.cta.href} className={`btn w-full ${offer.highlight ? "btn-primary" : "btn-outline"}`}>
                  {offer.cta.label}
                </Link>
              </div>
            </article>
          ))}

        </div>

        <article
          className="brand-surface mt-6 overflow-hidden rounded-[var(--radius-card)] shadow-[0_22px_50px_rgba(23,23,26,0.1)]"
          data-reveal
        >
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:p-10">
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-white/55">
                Plusieurs QR codes · besoin particulier
              </p>
              <h3 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-white sm:text-3xl">
                Sur devis
              </h3>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
                {CUSTOM_OFFER.description}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href={CUSTOM_OFFER.href} className="btn btn-light">
                  Demander un devis
                </Link>
                <a
                  href={whatsappUrl(
                    "Bonjour Moncode, nous avons un projet avec plusieurs QR codes. Pouvons-nous en parler ?",
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost-light"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp pro
                </a>
              </div>
            </div>

            <ul className="grid gap-x-8 gap-y-3 border-t border-white/15 pt-7 sm:grid-cols-2 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
              {customIncluded.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-white/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </article>

        <p className="mt-10 border-l-2 border-ambre/60 pl-4 text-[15px] leading-7 text-sage">
          Paiement en ligne par Mobile Money ou carte, via FedaPay. Facture établie à votre nom. Un QR code déjà
          imprimé continue de fonctionner même si vous faites évoluer la page.
        </p>
      </div>
    </section>
  );
}
