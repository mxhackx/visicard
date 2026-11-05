import Image from "next/image";
import Link from "next/link";
import { ArrowRight, HandCoins, MessageCircle, RefreshCw } from "lucide-react";
import SectionHeading from "@/components/section-heading";

const principles = [
  {
    icon: RefreshCw,
    title: "Le numérique ne doit pas compliquer le partage",
    text: "Une page, une image, une vidéo ou un PDF se met à jour en quelques minutes, sans réimprimer le QR code.",
  },
  {
    icon: HandCoins,
    title: "Un prix annoncé est un prix tenu",
    text: "Vingt mille FCFA pour une page complète, cinq mille pour un média ou un PDF. Pas de commission cachée sur ce que vous vendez.",
  },
  {
    icon: MessageCircle,
    title: "Un humain répond",
    text: "Vous écrivez sur WhatsApp, une personne de l'équipe vous répond et, si besoin, fait la mise à jour avec vous.",
  },
];

export default function AboutSection() {
  return (
    <section id="a-propos" className="anchor">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading align="left" title="Nous publions le contenu, pas votre métier" />
            <p className="mt-6 text-lg leading-8 text-sage">
              Moncode est né d’un constat simple : les établissements que nous équipons n’ont ni le
              temps ni l’envie de gérer un site web. Ils ont besoin d’un contenu lisible, modifiable en
              deux minutes, et d’un QR code qui ne casse jamais.
            </p>
            <p className="mt-4 text-base leading-7 text-sage">
              Nous prenons en charge la mise en ligne, l’hébergement et l’accompagnement de votre
              équipe. Le reste — vos contenus, vos prix, votre style — vous appartient.
            </p>

            <Link
              href="/a-propos"
              data-reveal
              className="group mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-forest transition-colors hover:text-forest-dark"
            >
              Notre approche en détail
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Illustration unDraw (licence libre), stockée dans public/illustrations. */}
          <div className="relative" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            <div className="relative aspect-[5/4] overflow-hidden rounded-[calc(var(--radius-card)+0.5rem)] border border-line bg-cream shadow-[0_24px_60px_rgba(23,23,26,0.1)]">
              <Image
                src="/illustrations/equipe.svg"
                alt="L’équipe Moncode prépare les contenus de ses clients"
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-contain p-8 sm:p-12"
              />
            </div>
            <div className="absolute -bottom-6 left-6 rounded-xl border border-line bg-cream px-4 py-3 shadow-[0_14px_34px_rgba(23,23,26,0.1)]">
              <p className="text-2xl font-semibold text-forest">24 h</p>
              <p className="text-xs text-sage">pour une réponse, jours ouvrés</p>
            </div>
          </div>
        </div>

        <ul className="mt-16 grid gap-5 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, text }, idx) => (
            <li
              key={title}
              className="surface p-6"
              data-reveal
              style={{ "--d": `${idx * 80}ms` } as React.CSSProperties}
            >
              <span className="icon-tile">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink/90">{title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-sage">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
