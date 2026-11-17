import type { Metadata } from "next";
import Image from "next/image";
import { Check, Minus } from "lucide-react";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/json-ld";
import Header from "@/components/header";
import Footer from "@/components/footer";

export const metadata: Metadata = pageMetadata({
  title: "À propos",
  description: "Moncode est un outil en libre-service pour créer des QR codes et des pages digitales, les modifier à tout moment et suivre les scans.",
  path: "/a-propos",
});

const weHandle = [
  "Un créateur en ligne : lien, Wi-Fi, carte de visite, PDF, image, vidéo ou page digitale",
  "Un QR code net, prêt à imprimer en PNG et SVG, avec vos couleurs et votre logo",
  "L’hébergement de vos contenus et un espace pour les retrouver et les modifier",
  "Des statistiques de scans par QR code : jours, appareils, pays",
];

const youKeep = [
  "Vos contenus, vos prix, vos photos et votre ton",
  "La relation client : commandes, réservations, fidélité",
  "Le choix de modifier le contenu quand vous voulez, en autonomie",
  "Vos données : le contenu vous appartient, aucune revente",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <JsonLd data={breadcrumbJsonLd([["Accueil", "/"], ["À propos", "/a-propos"]])} />
      <Header />
      <div className="header-spacer"></div>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">

          <div className="mt-8 grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div>
          <p className="eyebrow">À propos</p>
          <h1 className="page-title mt-3 max-w-2xl">
            Un outil simple pour vos QR codes
          </h1>

          <div className="mt-7 max-w-2xl space-y-5 text-lg leading-8 text-sage">
            <p>
              Moncode est un outil pensé pour celles et ceux qui partagent un contenu chaque jour :
              un restaurant qui change son menu du jour, une boutique qui présente une nouvelle
              collection, une association qui diffuse un programme. Vous créez, vous modifiez et
              vous suivez tout vous-même, depuis votre compte.
            </p>
            <p>
              La promesse est volontairement simple : un QR code, un contenu. Pas de site vitrine à
              maintenir, pas d’application à faire installer. Vous préparez une fois, le QR code
              suit, et vos clients scannent. Le contenu se met à jour sans réimprimer.
            </p>
            <p>
              Le tarif suit la même logique : les liens sont gratuits, et 100 FCFA donnent accès à
              tout Moncode pendant un an, sans abonnement automatique. Un devis seulement pour des
              besoins sur mesure. Rien n’est facturé sur ce que vous vendez.
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
              alt="Une personne crée son QR code en ligne avec Moncode"
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
            <h2 className="page-title">
              Ce que Moncode vous apporte
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
            <h2 className="page-title">
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

      <Footer />
    </main>
  );
}
