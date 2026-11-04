import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Check, RefreshCw } from "lucide-react";

// Photo : Unsplash (licence libre, usage commercial autorisé), stockée dans public/images.
const HERO_IMAGE = "/images/hero-comptoir.jpg";

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
      <div className="relative aspect-[4/3] overflow-hidden rounded-[calc(var(--radius-card)+0.5rem)] border border-line bg-white shadow-[0_24px_60px_rgba(37,99,235,0.14)]">
        <Image
          src={HERO_IMAGE}
          alt="Une cliente présente son téléphone au comptoir d'une boutique"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 560px"
          className="object-cover"
        />
      </div>

      <div className="absolute -bottom-5 left-4 flex items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-[0_14px_34px_rgba(37,99,235,0.16)] sm:-left-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink/90">Scan réussi</span>
          <span className="block text-xs text-sage">Page ouverte, sans application</span>
        </span>
      </div>

      <div className="absolute -top-5 right-4 hidden items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-[0_14px_34px_rgba(37,99,235,0.16)] sm:flex sm:-right-4">
        <span className="icon-tile h-8 w-8">
          <RefreshCw className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink/90">Contenu mis à jour</span>
          <span className="block text-xs text-sage">Le QR code reste le même</span>
        </span>
      </div>
    </div>
  );
}
