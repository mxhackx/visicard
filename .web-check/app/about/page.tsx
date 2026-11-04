import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Minus } from "lucide-react";
import Header from "@/components/header";
import ContactSection from "@/components/contact-section";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "À propos — Moncode",
  description:
    "Moncode digitalise les cartes de restaurants et de commerces avec un QR code : une équipe qui installe, forme et reste joignable.",
  openGraph: {
    title: "À propos — Moncode",
    description:
      "Nous digitalisons la carte, pas votre métier : menu en ligne, QR code unique, accompagnement humain.",
    url: "https://moncode-web.vercel.app/about",
  },
};

const weHandle = [
  "La mise en ligne de votre première carte, avec vous",
  "La planche de QR codes prête à imprimer (tables, comptoir, vitrine)",
  "Les ajustements de charte graphique et de traductions",
  "La reprise en main de votre équipe en un appel",
];

const youKeep = [
  "Vos plats, vos prix, vos photos et votre ton",
  "La relation client : commandes, réservations, fidélité",
  "Le choix de modifier la carte quand vous voulez, sans nous",
  "Vos données : la page vous appartient, aucune revente",
];

const faq = [
  {
    q: "Faut-il une compétence technique ?",
    a: "Non. Le formulaire de carte reprend les champs d'une fiche produit : nom, description, prix, photo.",
  },
  {
    q: "Que se passe-t-il si je change de carte un jour ?",
    a: "On remplace la page, pas le code. Les QR codes déjà imprimés continuent de fonctionner.",
  },
  {
    q: "Et si je veux équiper plusieurs établissements ?",
    a: "Chaque établissement a sa carte et ses codes. Le volume se chiffre sur devis.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="h-16"></div>

      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>

          <p className="mt-8 text-sm font-semibold text-blue-600">À propos</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Nous digitalisons la carte, pas votre métier
          </h1>

          <div className="mt-6 space-y-5 text-lg leading-8 text-slate-600">
            <p>
              Moncode est un outil pensé pour les établissements qui reçoivent chaque jour : un
              restaurant qui change son menu du jour entre deux services, une boutique qui ajoute une
              gamme, un cabinet qui doit afficher ses horaires sans refaire son vitrine.
            </p>
            <p>
              Nous avons volontairement limité la promesse à une chose : la carte. Pas de site vitrine
              à maintenir, pas d'application à faire installer, pas de formation à programmer. Vous
              remplissez une fois, le QR code suit, et vos clients scannent.
            </p>
            <p>
              Le modèle économique suit la même logique : vingt mille FCFA payés une fois pour un
              établissement, et un devis seulement quand le périmètre dépasse ce cadre. Rien n'est
              facturé sur ce que vous vendez.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-4xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Ce que nous prenons en charge</h2>
            <ul className="mt-5 space-y-3">
              {weHandle.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Ce qui reste chez vous</h2>
            <ul className="mt-5 space-y-3">
              {youKeep.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <Minus className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Questions fréquentes</h2>
          <dl className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {faq.map((item) => (
              <div key={item.q} className="py-6">
                <dt className="text-base font-semibold text-slate-900">{item.q}</dt>
                <dd className="mt-2 text-sm leading-7 text-slate-600">{item.a}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/#tarifs"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Voir les tarifs
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-sm text-slate-500">
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
