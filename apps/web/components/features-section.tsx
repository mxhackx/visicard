"use client";

import SectionHeading from "@/components/section-heading";

import { Layers, QrCode, RefreshCw, ShieldCheck, Smartphone, UserRound } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Un QR pour chaque besoin",
    description: "Page digitale, image, vidéo, PDF, Wi-Fi, carte de visite, appel : choisissez ce que le téléphone doit faire.",
  },
  {
    icon: QrCode,
    title: "Un QR code stable",
    description: "Le code imprimé ne change pas quand vous mettez le contenu à jour.",
  },
  {
    icon: UserRound,
    title: "Espace client",
    description: "Créez un compte et retrouvez tous vos QR codes, leurs liens et leurs fichiers.",
  },
  {
    icon: RefreshCw,
    title: "Mise à jour directe",
    description: "Les pages digitales se modifient en ligne, sans réimprimer le QR code.",
  },
  {
    icon: Smartphone,
    title: "Pensé mobile",
    description: "Chaque page s'ouvre vite et reste lisible sur tous les téléphones.",
  },
  {
    icon: ShieldCheck,
    title: "Hébergement & support",
    description: "Vos contenus sont hébergés pour vous, avec une personne joignable sur WhatsApp.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="anchor">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          title="Tout ce qu’il faut pour publier et durer"
          subtitle="Ce qui est inclus avec chaque QR code Moncode."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, idx) => (
            <div
              key={title}
              className="surface surface-hover group p-6 hover:-translate-y-1 sm:p-7"
              data-reveal
              style={{ "--d": `${(idx % 3) * 70}ms` } as React.CSSProperties}
            >
              <div className="icon-tile mb-5 transition-colors group-hover:bg-forest group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-sage">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
