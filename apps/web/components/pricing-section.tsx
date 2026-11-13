import SectionHeading from "@/components/section-heading";
import Link from "next/link";
import { Check, Crown, MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";
import { CUSTOM_OFFER } from "@/lib/services";

const premiumItems = [
  "Tous les contenus : Wi-Fi, carte de visite, PDF, image, vidéo, page digitale…",
  "Les styles premium : formes élégantes, couleurs et logo",
  "QR code net en PNG et SVG + facture",
  "Modifiable après impression, statistiques de scans",
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
          title="Un seul prix : 5 000 FCFA"
          subtitle="Le QR code gratuit pour un lien reste gratuit. Premium débloque tout le reste."
        />

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-2">
          <div className="premium-bar h-full shadow-[0_22px_50px_rgba(185,121,26,0.18)]">
            <article className="relative flex h-full flex-col rounded-[15px] bg-white p-7 sm:p-8" data-reveal>
              <span className="premium-pill self-start"><Crown className="h-3 w-3" /> Premium</span>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-[-0.03em] text-ink">5 000</span>
                <span className="text-sm font-medium text-sage">FCFA</span>
              </p>
              <ul className="mt-7 space-y-3 border-t border-line pt-7">
                {premiumItems.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-7 text-sage">
                    <span className="premium-gold mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                      <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/creer" className="btn btn-primary mt-8 w-full">
                Créer mon QR code
              </Link>
            </article>
          </div>

        <article
          className="brand-surface h-full overflow-hidden rounded-[var(--radius-card)] shadow-[0_22px_50px_rgba(23,23,26,0.1)]"
          data-reveal
        >
          <div className="flex h-full flex-col gap-8 p-7 sm:p-8">
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

            <ul className="space-y-3 border-t border-white/15 pt-7">
              {customIncluded.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-white/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </article>
        </div>

        <p className="mt-10 border-l-2 border-ambre/60 pl-4 text-[15px] leading-7 text-sage">
          Paiement par Mobile Money (MTN, Moov, Celtiis), sécurisé par FeexPay. Le lien web reste gratuit. Facture établie à votre nom. Un QR code déjà
          imprimé continue de fonctionner même si vous faites évoluer la page.
        </p>
      </div>
    </section>
  );
}
