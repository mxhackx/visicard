import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import DirectQrGenerator from "@/components/qr/direct-qr-generator";

export const metadata: Metadata = {
  title: "QR code gratuit : lien, Wi-Fi, vCard, appel, SMS, événement",
  description:
    "Générez gratuitement un QR code pour un lien, un texte, une carte de visite, un numéro, un SMS, un e-mail, un Wi-Fi, un événement ou une position GPS. Sans compte, téléchargement PNG et SVG.",
  alternates: { canonical: "/qr-gratuit" },
  openGraph: { url: "/qr-gratuit", title: "QR code gratuit avec Moncode" },
};

export default function QrGratuitPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-sage transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Accueil
        </Link>

        <p className="eyebrow mt-8">QR code gratuit</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.02em] text-ink/90 sm:text-4xl lg:text-5xl">
          Un QR code simple, prêt en quelques secondes
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-sage">
          Lien, texte, carte de visite, appel, SMS, e-mail, Wi-Fi, événement ou position : choisissez, remplissez,
          téléchargez. Sans compte et sans paiement.
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-[15px] text-sage">
          {["100 % gratuit", "Sans compte", "PNG et SVG pour l’impression"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-forest" />
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <DirectQrGenerator />
        </div>

        <aside className="surface mt-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-lg font-semibold text-ink/90">Besoin de plus qu’un QR simple ?</h2>
            <p className="mt-1 text-sm leading-6 text-sage">
              Page digitale (menu, horaires, photos), image, vidéo ou PDF hébergés par Moncode, modifiables sans
              réimprimer le code. À partir de 5 000 FCFA.
            </p>
          </div>
          <Link href="/creer" className="btn btn-primary shrink-0">
            Voir les services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </section>

      <Footer />
    </main>
  );
}
