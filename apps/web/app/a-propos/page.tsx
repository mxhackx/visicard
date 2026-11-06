import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import Header from "@/components/header";
import ContactSection from "@/components/contact-section";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Moncode publie une page digitale, une image/vidéo ou un PDF derrière un QR code unique : une équipe qui installe, forme et reste joignable.",
  openGraph: {
    title: "À propos de Moncode",
    description:
      "Nous publions le contenu, pas votre métier : page digitale, média ou PDF, QR code unique, accompagnement humain.",
    url: "/a-propos",
  },
  alternates: { canonical: "/a-propos" },
};

const weHandle = [
  "La mise en ligne de votre page, de votre média ou de votre document, avec vous",
  "Le QR code prêt à imprimer (tables, comptoir, vitrine)",
  "Les ajustements de charte graphique et de contenu",
  "La reprise en main de votre équipe en un appel",
];

const youKeep = [
  "Vos contenus, vos prix, vos photos et votre ton",
  "La relation client : commandes, réservations, fidélité",
  "Le choix de modifier le contenu quand vous voulez, sans nous",
  "Vos données : le contenu vous appartient, aucune revente",
];

const faq = [
  {
    q: "Faut-il une compétence technique ?",
    a: "Non. La page reprend des champs simples ; pour un média ou un PDF, il suffit d’envoyer le fichier.",
  },
  {
    q: "Que se passe-t-il si je change de contenu un jour ?",
    a: "On remplace le contenu, pas le code. Les QR codes déjà imprimés continuent de fonctionner.",
  },
  {
    q: "Et si je veux équiper plusieurs établissements ?",
    a: "Chaque contenu a son QR code. Le volume et les besoins particuliers se chiffrent sur devis.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">

          <div className="mt-8 grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div>
          <p className="eyebrow">À propos</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-ink/90 sm:text-4xl lg:text-5xl">
            Nous publions le contenu, pas votre métier
          </h1>

          <div className="mt-7 max-w-2xl space-y-5 text-lg leading-8 text-sage">
            <p>
              Moncode est un outil pensé pour celles et ceux qui partagent un contenu chaque jour :
              un restaurant qui change son menu du jour, une boutique qui présente une nouvelle
              collection, une association qui diffuse un programme.
            </p>
            <p>
              Nous avons volontairement limité la promesse : un QR code, un contenu. Pas de site
              vitrine à maintenir, pas d’application à faire installer, pas de formation à
              programmer. Vous préparez une fois, le QR code suit, et vos clients scannent.
            </p>
            <p>
              Le modèle économique suit la même logique : vingt mille FCFA pour une page digitale
              complète, cinq mille pour une image, une vidéo ou un PDF. Un devis seulement quand le
              périmètre dépasse ce cadre. Rien n’est facturé sur ce que vous vendez.
            </p>
          </div>
          </div>

          {/* Illustration unDraw (licence libre), stockée dans public/illustrations. */}
          <div
            className="relative aspect-[4/5] overflow-hidden rounded-[calc(var(--radius-card)+0.5rem)] border border-line bg-cream shadow-[0_24px_60px_rgba(23,23,26,0.12)]"
            data-reveal
          >
            <Image
              src="/illustrations/accompagnement.svg"
              alt="Un conseiller Moncode accompagne un client en visioconférence"
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 100vw, 480px"
              className="object-contain p-10"
            />
          </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pb-24">
          <div className="surface p-6 sm:p-8" data-reveal>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink/90">
              Ce que nous prenons en charge
            </h2>
            <ul className="mt-6 space-y-3 border-t border-line pt-6">
              {weHandle.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-sage">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="surface p-6 sm:p-8" data-reveal style={{ "--d": "100ms" } as React.CSSProperties}>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink/90">
              Ce qui reste chez vous
            </h2>
            <ul className="mt-6 space-y-3 border-t border-line pt-6">
              {youKeep.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-sage">
                  <Minus className="mt-0.5 h-4 w-4 shrink-0 text-sage/60" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">

          <p className="eyebrow">Questions fréquentes</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink/90 sm:text-4xl">
            Questions fréquentes
          </h2>
          <dl className="mt-8 divide-y divide-line border-y border-line">
            {faq.map((item) => (
              <div key={item.q} className="py-6">
                <dt className="text-base font-semibold text-ink">{item.q}</dt>
                <dd className="mt-2 text-sm leading-7 text-sage">{item.a}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/#tarifs" className="btn btn-primary">
              Voir les tarifs
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-sm text-sage">
              Une situation particulière ? La page contact répond en moins de 24 heures ouvrées.
            </p>
          </div>
        </div>
      </section>

      <ContactSection />
      <Footer />
    </main>
  );
}
