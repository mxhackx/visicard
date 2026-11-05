import SectionHeading from "@/components/section-heading";
import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";
import { CUSTOM_OFFER } from "@/lib/services";

const offers = [
  {
    title: "Page digitale",
    subtitle: "Pour un restaurant, salon, boutique ou cabinet",
    price: "20 000",
    priceNote: "FCFA · paiement unique",
    items: [
      "1 QR code pour 1 page complète",
      "Menu, photos, horaires, adresse et réseaux",
      "Bouton de contact / WhatsApp",
      "Modifications en ligne à volonté",
      "QR code prêt à imprimer",
    ],
    cta: { label: "Créer ma page", href: "/creer?service=page" },
  },
  {
    title: "Image / vidéo ou document PDF",
    subtitle: "Pour un média ou un document à partager",
    price: "5 000",
    priceNote: "FCFA · paiement unique",
    items: [
      "1 QR code pour 1 image, 1 vidéo ou 1 PDF",
      "Page de lecture mobile optimisée",
      "Lien direct et fichier QR téléchargeables",
      "Idéal pour une affiche, une brochure ou un menu ponctuel",
      "Rapide, sans page complète",
    ],
    cta: { label: "Créer un QR média / document", href: "/creer" },
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
          title="Un tarif clair, un sur-mesure quand ça dépasse"
          subtitle="Paiement unique, sans abonnement, sans commission sur vos ventes."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {offers.map((offer, index) => (
            <article
              key={offer.title}
              className="surface surface-hover flex flex-col p-6 sm:p-8"
              data-reveal
              style={{ "--d": `${index * 80}ms` } as React.CSSProperties}
            >
              <h3 className="text-lg font-semibold text-ink">{offer.title}</h3>
              <p className="mt-1 text-sm text-sage">{offer.subtitle}</p>

              <p className="mt-7 flex items-baseline gap-2">
                <span className="text-4xl font-medium tracking-[-0.03em] text-ink sm:text-5xl">
                  {offer.price}
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.12em] text-sage">
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

              <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
                <Link href={offer.cta.href} className="btn btn-primary">
                  {offer.cta.label}
                </Link>
                <a
                  href={whatsappUrl(
                    "Bonjour Moncode, j'ai une question sur le tarif de ce service.",
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                >
                  <MessageCircle className="h-4 w-4" />
                  Poser une question
                </a>
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
          Paiement avec notre équipe sur WhatsApp. Facture établie à votre nom. Un QR code déjà
          imprimé continue de fonctionner même si vous faites évoluer la page.
        </p>
      </div>
    </section>
  );
}
