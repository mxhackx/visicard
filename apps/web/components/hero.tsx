import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Check } from "lucide-react";

// Photo : Unsplash (licence libre, usage commercial autorisé), stockée dans public/images.
/** Illustration unDraw (licence libre, sans attribution), recolorée au rouge du site. */
const HERO_IMAGE = "/illustrations/menu-telephone.svg";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden text-ink">
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-14 lg:px-8 lg:pb-24 lg:pt-20">
        <div data-reveal>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-ink/90 sm:text-5xl lg:text-[3.5rem]">
            Vos contenus en ligne,
            <br />
            <span className="text-forest">en un seul scan</span>
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-8 text-sage">
            Une page complète, une image, une vidéo ou un PDF : Moncode les publie et vous remet un
            QR code unique, prêt à imprimer. Le contenu évolue, le code ne change jamais.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/creer" className="btn btn-primary px-7">
              Choisir mon service
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/#tarifs" className="btn btn-outline px-7">
              Voir les tarifs
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-[15px] text-sage">
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-forest" />
              À partir de 5 000 FCFA
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-forest" />
              Espace client inclus
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-forest" />
              Support WhatsApp
            </li>
          </ul>
        </div>

        <HeroPhoto />
      </div>
    </section>
  );
}

function HeroPhoto() {
  return (
    <div className="relative" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[calc(var(--radius-card)+0.5rem)] border border-line bg-cream shadow-[0_24px_60px_rgba(23,23,26,0.1)]">
        <Image
          src={HERO_IMAGE}
          alt="Un menu de restaurant ouvert sur un téléphone, prêt à commander"
          fill
          priority
          unoptimized
          sizes="(max-width: 1024px) 100vw, 560px"
          className="object-contain p-8 sm:p-12"
        />
      </div>

      <div className="absolute -bottom-5 left-4 flex items-center gap-2.5 rounded-xl border border-line bg-cream px-3.5 py-2.5 shadow-[0_14px_34px_rgba(23,23,26,0.1)] sm:-left-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white">
          <Check className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink/90">Scan réussi</span>
          <span className="block text-xs text-sage">Page ouverte, sans application</span>
        </span>
      </div>

    </div>
  );
}
