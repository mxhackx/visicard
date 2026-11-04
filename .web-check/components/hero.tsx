import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, QrCode, ReceiptText } from "lucide-react";
import { whatsappUrl, CONTACT } from "@/lib/contact";

// Emplacement de la photo du hero : déposez votre image dans
// apps/web/public/hero-scan.jpg et elle s'affiche automatiquement.
const HERO_IMAGE_PATH = "/hero-scan.jpg";

function heroImageExists(): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", HERO_IMAGE_PATH.slice(1)));
}

export default function Hero() {
  const hasPhoto = heroImageExists();

  return (
    <section id="top" className="border-b border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20 lg:px-8">
        <div>
          <p className="text-sm font-semibold text-blue-600">Menu digital & QR code</p>

          <h1 className="mt-4 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            Votre carte, un scan, zéro papier.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Moncode transforme votre menu en une page digitalisée, publiée en quelques minutes
            et accessible depuis un simple QR code posé sur vos tables.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/connexion"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Créer mon menu
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              Parler à un conseiller
            </Link>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-blue-600" />
              20 000 FCFA, paiement unique
            </li>
            <li className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-blue-600" />
              QR code imprimé offert
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-blue-600" />
              Support sur WhatsApp
            </li>
          </ul>
        </div>

        <HeroPhotoFrame hasPhoto={hasPhoto} />
      </div>
    </section>
  );
}

function HeroPhotoFrame({ hasPhoto }: { hasPhoto: boolean }) {
  return (
    <div className="relative">
      <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:aspect-[4/5]">
        {hasPhoto ? (
          <Image
            src={HERO_IMAGE_PATH}
            alt="Un client scanne le QR code d'un menu digital posé sur une table de restaurant"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 460px"
            className="object-cover"
          />
        ) : (
          <PhotoSlot />
        )}
      </div>

        {/* Bandeau de preuve, posé sur la photo sans la recouvrir */}
      <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Après le scan</p>
          <p className="text-xs text-slate-500">
            Le client voit votre carte à jour, sans télécharger d'application.
          </p>
        </div>
        <a
          href={whatsappUrl(
            "Bonjour Moncode, je souhaite voir un exemple de menu digital.",
          )}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Voir un exemple
        </a>
      </div>

      <p className="sr-only">Contact WhatsApp : {CONTACT.whatsappDisplay}</p>
    </div>
  );
}

// Remplace l'image tant que public/hero-scan.jpg n'est pas déposé.
function PhotoSlot() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600">
        <QrCode className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-slate-700">Photo : un client scanne le QR code</p>
      <p className="max-w-xs text-xs leading-5 text-slate-500">
        Déposez votre visuel dans <code className="text-slate-700">public/hero-scan.jpg</code> —
        le cadre est déjà dimensionné pour une photo verticale 4:5.
      </p>
    </div>
  );
}
