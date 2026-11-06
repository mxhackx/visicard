import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import TypeArt from "@/components/qr/type-art";
import { DIRECT_QR_TYPES } from "@/lib/qr-payloads";

export const metadata: Metadata = {
  title: "QR code Wi-Fi, carte de visite, appel, SMS : choisissez le type",
  description: "Wi-Fi, carte de visite, téléphone, SMS, e-mail, texte, événement ou position GPS : choisissez le contenu de votre QR code.",
  alternates: { canonical: "/creer/qr" },
};

const PAID = DIRECT_QR_TYPES.filter((t) => t.id !== "url");

export default function ChooseQrType() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
          Que doit faire le téléphone au scan ?
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-sage">
          Choisissez le type. Vous personnalisez ensuite le style et voyez le résultat sur téléphone, iPad et Mac.
        </p>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {PAID.map((t) => (
            <li key={t.id}>
              <Link
                href={`/creer/qr/${t.id}`}
                className="surface surface-hover group flex h-full flex-col items-center p-5 text-center transition hover:-translate-y-1 active:scale-[0.98]"
              >
                <TypeArt type={t.id} className="h-20 w-20 transition-transform duration-300 group-hover:scale-110" />
                <span className="mt-4 text-base font-semibold text-ink">{t.label}</span>
                <span className="mt-1 text-xs leading-5 text-sage">{t.hint}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-sm text-sage">
          Un simple lien web ?{" "}
          <Link href="/qr-gratuit" className="inline-flex items-center gap-1 font-semibold text-forest underline-offset-4 hover:underline">
            Générateur gratuit <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      </section>
      <Footer />
    </main>
  );
}
