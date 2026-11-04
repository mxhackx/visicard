"use client";

/* =====================================================================
   PAGE D'ACCUEIL MONCODE — TOUT EN UN SEUL FICHIER

   Assemblage fidèle de ce qui existe, dans l'arbre de travail, réparti
   sur douze fichiers :

     app/page.tsx                     -> PageAccueil (export par défaut, en bas)
     components/header.tsx            -> Header
     components/hero.tsx              -> Hero, HeroPhotoFrame, MenuPreview
     components/how-it-works.tsx      -> HowItWorks, Track
     components/features-section.tsx  -> FeaturesSection
     components/pricing-section.tsx   -> PricingSection
     components/testimonials.tsx      -> Testimonials
     components/about-section.tsx     -> AboutSection
     components/contact-section.tsx   -> ContactSection, Field
     components/footer.tsx            -> Footer
     components/logo.tsx              -> Logo, LogoMark
     components/whatsapp-button.tsx   -> WhatsAppButton (monté dans layout.tsx)
     lib/contact.ts                   -> CONTACT, WHATSAPP_MESSAGE, whatsappUrl

   CE QUI CHANGE par rapport aux douze fichiers, et seulement cela :

   1. "use client" en tête : le menu mobile et le formulaire exigent un
      état React, donc tout le module est client. Conséquence, le hero ne
      peut plus lire le disque (fs.existsSync était un code serveur) : la
      présence de la photo devient la constante HERO_HAS_PHOTO ci-dessous.
      Pour retrouver la détection automatique, il faut rendre Hero dans un
      fichier serveur séparé.

   2. Les trois règles CSS portées par app/globals.css ne sont pas ici.
      Sans elles, le header fixe mange le haut des sections :

        :root { --header-h: 4rem; }
        .header-spacer { height: calc(var(--header-h) + 1px); }
        .anchor { scroll-margin-top: calc(var(--header-h) + 1rem); }

   3. WhatsAppButton est rendu à la fin : dans l'application il vit dans
      app/layout.tsx et apparait donc sur toutes les pages, pas seulement
      sur celle-ci.
===================================================================== */

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Check,
  Clock,
  Globe,
  Mail,
  Menu,
  MessageCircle,
  Palette,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Star,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";

/* =====================================================================
   COORDONNÉES (lib/contact.ts)
   Un seul endroit à modifier pour tout le site.
===================================================================== */

export const CONTACT = {
  brand: "Moncode",
  email: "contact@moncode.app",
  whatsappNumber: "33123456789", // affiché tel quel, sans espaces
  whatsappDisplay: "+33 1 23 45 67 89",
  hours: "Lundi — vendredi, 9h — 18h",
} as const;

export const WHATSAPP_MESSAGE =
  "Bonjour Moncode, je souhaite des informations sur votre solution de menu digital.";

export function whatsappUrl(message: string = WHATSAPP_MESSAGE): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/* =====================================================================
   LOGO (components/logo.tsx)
===================================================================== */

type Variant = "dark" | "light";

const WORD_TEXT: Record<Variant, string> = {
  dark: "text-slate-900",
  light: "text-white",
};

/** Le sigle seul : un QR code vu de près, avec sa ligne de scan. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="8" fill="#2563eb" />
      <g fill="none" stroke="#ffffff" strokeWidth="2">
        <rect x="6" y="6" width="7" height="7" rx="1" />
        <rect x="19" y="6" width="7" height="7" rx="1" />
        <rect x="6" y="19" width="7" height="7" rx="1" />
      </g>
      <g fill="#ffffff">
        <rect x="8.5" y="8.5" width="2" height="2" />
        <rect x="21.5" y="8.5" width="2" height="2" />
        <rect x="8.5" y="21.5" width="2" height="2" />
        <rect x="18.5" y="21.75" width="9" height="2.5" rx="1.25" />
      </g>
    </svg>
  );
}

/** Logo complet : sigle + nom de la marque.
    (Nommé et non `export default` ici : le défaut du fichier est la page.) */
export function Logo({
  variant = "dark",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-8 w-8 shrink-0" />
      <span
        className={`text-lg font-bold tracking-tight ${
          variant === "light" ? WORD_TEXT.light : WORD_TEXT.dark
        }`}
      >
        Moncode
      </span>
    </span>
  );
}

/* =====================================================================
   HEADER (components/header.tsx)
   Une seule rangée de 64 px : le logo à gauche, la navigation en texte
   simple à droite, un bouton rond en dessous de `md`.
===================================================================== */

const navLinks = [
  { href: "/#fonctionnement", label: "Fonctionnement" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/#avis", label: "Avis" },
  { href: "/about", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Moncode — accueil">
          <Logo />
        </Link>

        <nav aria-label="Sections du site" className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/connexion"
            className="text-[13px] font-semibold text-slate-900 transition-colors hover:text-blue-700"
          >
            Se connecter
          </Link>
        </nav>

        <button
          type="button"
          aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 md:hidden"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <nav aria-label="Sections du site" className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block border-b border-slate-50 py-3 text-sm font-medium text-slate-700 last:border-0"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/connexion"
              onClick={() => setIsOpen(false)}
              className="block py-3 text-sm font-semibold text-slate-900"
            >
              Se connecter
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

/* =====================================================================
   HERO (components/hero.tsx)
===================================================================== */

// Emplacement de la photo du hero : déposez votre image dans
// apps/web/public/hero-scan.jpg (vertical 4:5, au moins 1200x1500).
const HERO_IMAGE_PATH = "/hero-scan.jpg";

// Dans l'application, ce booléen est calculé côté serveur par
// fs.existsSync(process.cwd()/public/hero-scan.jpg). Un module "use client"
// ne peut pas lire le disque : passez la valeur à true une fois l'image
// déposée, ou remontez Hero dans un fichier serveur pour la détection auto.
const HERO_HAS_PHOTO = false;

function Hero() {
  const hasPhoto = HERO_HAS_PHOTO;

  return (
    <section id="top" className="bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20 lg:px-8">
        <div>
          <p className="text-sm font-semibold text-blue-600">Menu digital & QR code</p>

          <h1 className="mt-4 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            Votre carte, un scan, zéro papier.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Moncode transforme votre menu en une page digitalisée, publiée en quelques minutes et
            accessible depuis un simple QR code posé sur vos tables.
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
      <div
        className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 ${
          hasPhoto ? "aspect-[4/3] sm:aspect-[4/5]" : ""
        }`}
      >
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
          <MenuPreview />
        )}
      </div>

      {/* Bandeau de preuve, posé sous le visuel sans le recouvrir */}
      <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Après le scan</p>
          <p className="text-xs text-slate-500">
            Le client voit votre carte à jour, sans télécharger d'application.
          </p>
        </div>
        <a
          href={whatsappUrl("Bonjour Moncode, je souhaite voir un exemple de menu digital.")}
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

// Sert de visuel tant que public/hero-scan.jpg n'est pas déposé :
// une prévisualisation de la carte, telle que le client la voit après le scan.
const previewMenu = [
  {
    group: "Entrées",
    items: [
      { name: "Chakchouka, œuf poché", price: "2 500" },
      { name: "Salade de papaye, cacahuètes", price: "2 000" },
    ],
  },
  {
    group: "Plats",
    items: [
      { name: "Poulet braisé, attiéké", price: "5 000" },
      { name: "Poisson grillé, riz au gras", price: "6 500" },
    ],
  },
  {
    group: "Desserts",
    items: [{ name: "Ananas rôti, noix de coco", price: "1 800" }],
  },
];

function MenuPreview() {
  return (
    <div className="p-5 sm:p-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Le Comptoir</p>
            <p className="text-[11px] text-slate-500">Carte du jour · Table 12</p>
          </div>
          <LogoMark className="h-7 w-7" />
        </div>

        <div className="px-5 py-4">
          {previewMenu.map((section) => (
            <div key={section.group} className="mb-4 last:mb-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                {section.group}
              </p>
              <ul className="mt-2 space-y-2">
                {section.items.map((item) => (
                  <li key={item.name} className="flex items-baseline justify-between gap-4">
                    <span className="text-[13px] leading-5 text-slate-700">{item.name}</span>
                    <span className="shrink-0 text-[13px] font-semibold text-slate-900">
                      {item.price}
                      <span className="ml-1 text-[10px] font-normal text-slate-500">FCFA</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-[11px] text-slate-500">Prix affichés en FCFA, service compris.</p>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   COMMENT ÇA MARCHE (components/how-it-works.tsx)
===================================================================== */

const ownerSteps = [
  {
    title: "Vous créez votre carte",
    text: "Nom, plats, prix, photos, horaires : vous remplissez un formulaire, sans écrire une ligne de code.",
  },
  {
    title: "Vous générez votre QR code",
    text: "Un QR code unique est attribué à votre établissement, prêt à télécharger et à imprimer.",
  },
  {
    title: "Vous publiez et vous ajustez",
    text: "Chaque modification est en ligne immédiatement. Le QR code, lui, ne change jamais.",
  },
];

const guestSteps = [
  {
    title: "Il scanne",
    text: "L'appareil photo du téléphone suffit. Aucune application à installer.",
  },
  {
    title: "Il consulte, puis vous appelle",
    text: "La carte s'affiche à jour, avec le bouton WhatsApp pour commander ou réserver.",
  },
];

function HowItWorks() {
  return (
    <section id="fonctionnement" className="anchor border-b border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-600">Comment ça marche</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Deux côtés, un seul scan
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Moncode se pense comme un aller-retour très court : vous préparez votre carte une fois,
            vos clients la consultent à chaque visite.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <Track
            label="Côté établissement"
            meta="Environ 20 minutes, une seule fois"
            icon={UtensilsCrossed}
            items={ownerSteps}
          />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <Track
              label="Côté client"
              meta="Instantané, à table"
              icon={Smartphone}
              items={guestSteps}
              compact
            />
            <div className="mt-7 flex items-start gap-3 border-t border-slate-200 pt-6">
              <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-sm leading-6 text-slate-600">
                Un QR code par table, par comptoir ou par vitrine : vous savez d'où viennent vos
                scans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Track({
  label,
  meta,
  icon: Icon,
  items,
  compact = false,
}: {
  label: string;
  meta: string;
  icon: typeof UtensilsCrossed;
  items: { title: string; text: string }[];
  compact?: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">
          <Icon className="h-4 w-4 text-blue-600" />
          {label}
        </h3>
        <p className="text-xs text-slate-500">{meta}</p>
      </div>

      <ol className="mt-6 space-y-6">
        {items.map((item, idx) => (
          <li key={item.title} className="flex gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-xs font-semibold text-blue-700">
              {idx + 1}
            </span>
            <div>
              <h4 className="text-base font-semibold text-slate-900">{item.title}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>

      {!compact && (
        <p className="mt-6 border-l-2 border-blue-200 pl-4 text-sm leading-6 text-slate-600">
          Rien à installer sur place : tout se pilote depuis votre compte en ligne.
        </p>
      )}
    </div>
  );
}

/* =====================================================================
   FONCTIONNALITÉS (components/features-section.tsx)
===================================================================== */

const features = [
  {
    icon: Palette,
    title: "Personnalisation complète",
    description: "Adaptez votre menu à votre identité visuelle et à votre style de restauration.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    description: "Une expérience fluide sur smartphone, tablette et écran desktop.",
  },
  {
    icon: Zap,
    title: "Rapidité",
    description: "Un chargement rapide et une navigation simple pour fidéliser vos clients.",
  },
  {
    icon: BarChart3,
    title: "Suivi des performances",
    description: "Comprenez les scans, les tendances et les interactions de vos clients.",
  },
  {
    icon: Globe,
    title: "Accessible partout",
    description: "Vos menus restent disponibles en ligne à tout moment, pour tout le monde.",
  },
  {
    icon: ShieldCheck,
    title: "Confiance & sécurité",
    description: "Des données et un accès gérés avec sérieux et fiabilité.",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="anchor border-b border-slate-100 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-600">Fonctionnalités</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Tout ce qu’il faut pour moderniser votre service
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300"
            >
              <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   TARIFS (components/pricing-section.tsx)
===================================================================== */

const essentialIncluded = [
  "1 établissement, menu illimité (plats, photos, prix, horaires)",
  "Page publique accessible par QR code, sans application",
  "QR code vectoriel + planche prête à imprimer",
  "Modifications à volonté, en direct",
  "Bouton WhatsApp sur la carte",
  "Hébergement et support inclus la première année",
];

const customIncluded = [
  "Plusieurs établissements, enseignes ou points de vente",
  "Charte graphique avancée et reprise de votre domaine",
  "Cartes événement, menus nominatifs, langues multiples",
  "Intégrations (caisse, réservation, Google Maps)",
  "Formation de votre équipe et accompagnement dans la durée",
];

function PricingSection() {
  return (
    <section id="tarifs" className="anchor border-b border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-600">Tarifs</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Une offre claire, une offre sur devis
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Vous choisissez selon votre périmètre : un seul établissement, ou un groupe à équiper.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-slate-900">Carte digitale</h3>
            <p className="mt-1 text-sm text-slate-600">
              Pour un restaurant, un salon, une boutique ou un cabinet.
            </p>

            <p className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-slate-900">20 000</span>
              <span className="text-lg font-semibold text-slate-900">FCFA</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Paiement unique. Pas d'abonnement, pas de commission sur vos ventes.
            </p>

            <ul className="mt-7 space-y-3 border-t border-slate-100 pt-7">
              {essentialIncluded.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
              <Link
                href="/connexion"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Créer ma carte
              </Link>
              <a
                href={whatsappUrl("Bonjour Moncode, je souhaite la carte digitale à 20 000 FCFA.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <MessageCircle className="h-4 w-4" />
                Poser une question
              </a>
            </div>
          </article>

          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-slate-900">Sur mesure</h3>
            <p className="mt-1 text-sm text-slate-600">
              Pour les groupes, franchises, agences et événements.
            </p>

            <p className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-slate-900">Sur devis</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Chiffré après un échange de 15 minutes sur vos besoins réels.
            </p>

            <ul className="mt-7 space-y-3 border-t border-slate-100 pt-7">
              {customIncluded.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Demander un devis
              </Link>
              <a
                href={whatsappUrl(
                  "Bonjour Moncode, nous voulons équiper plusieurs établissements. Pouvons-nous parler d'un devis ?",
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp pro
              </a>
            </div>
          </article>
        </div>

        <p className="mt-8 text-sm leading-6 text-slate-500">
          Paiement par Mobile Money ou virement. Facture établie à votre nom. Le passage d'une offre
          à l'autre se fait sans perdre vos QR codes déjà imprimés.
        </p>
      </div>
    </section>
  );
}

/* =====================================================================
   AVIS (components/testimonials.tsx)
===================================================================== */

// Textes d'exemple à remplacer par des retours réels avant la mise en ligne.
const reviews = [
  {
    quote:
      "Nous avons imprimé les QR codes sur les tables un lundi, le menu était en ligne le soir. Les clients ne demandent plus le papier.",
    name: "Awa K.",
    role: "Gérante, Le Comptoir des Halles",
    initials: "AK",
  },
  {
    quote:
      "Changer un prix ou un plat du jour prend une minute, et c'est visible immédiatement. C'est ce qui m'a convaincu.",
    name: "Yann D.",
    role: "Chef-propriétaire, Maison Braise",
    initials: "YD",
  },
  {
    quote:
      "Nos trois points de vente ont chacun leur carte, avec la même charte graphique. L'équipe a été reprise en main en un appel.",
    name: "Sarah M.",
    role: "Directrice d'enseigne, Groupe Ambre",
    initials: "SM",
  },
];

function Testimonials() {
  return (
    <section id="avis" className="anchor border-b border-slate-100 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-600">Avis</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Ce qu'en disent les établissements
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((review) => (
            <figure
              key={review.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex gap-0.5" aria-label="Note : 5 sur 5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-blue-600 text-blue-600" />
                ))}
              </div>

              <blockquote className="mt-5 flex-1 text-sm leading-7 text-slate-700">
                “{review.quote}”
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700"
                >
                  {review.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{review.name}</p>
                  <p className="text-xs text-slate-500">{review.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   À PROPOS (components/about-section.tsx)
===================================================================== */

const principles = [
  {
    title: "Le numérique ne doit pas compliquer le service",
    text: "Une carte se met à jour entre deux services, pas après une formation de trois jours.",
  },
  {
    title: "Un prix annoncé est un prix tenu",
    text: "Vingt mille FCFA, une fois. Pas de commission cachée sur ce que vous vendez.",
  },
  {
    title: "Un humain répond",
    text: "Vous écrivez sur WhatsApp, une personne de l'équipe vous répond et, si besoin, fait la mise à jour avec vous.",
  },
];

function AboutSection() {
  return (
    <section id="a-propos" className="anchor border-b border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
        <div>
          <p className="text-sm font-semibold text-blue-600">À propos</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Nous digitalisons la carte, pas votre métier
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Moncode est né d'un constat simple : les établissements que nous équipons n'ont ni le
            temps ni l'envie de gérer un site web. Ils ont besoin d'une carte lisible, modifiable en
            deux minutes, et d'un QR code qui ne casse jamais.
          </p>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Nous prenons en charge la mise en ligne, l'impression des codes et la reprise en main de
            votre équipe. Le reste — vos plats, vos prix, votre style — vous appartient.
          </p>

          <Link
            href="/about"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Notre approche en détail
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50 px-6 sm:px-8">
          {principles.map((principle) => (
            <li key={principle.title} className="py-6 first:pt-8 last:pb-8">
              <h3 className="text-base font-semibold text-slate-900">{principle.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{principle.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* =====================================================================
   CONTACT (components/contact-section.tsx)
   Le formulaire ne poste rien : il compose une demande, et l'envoi se
   fait sur WhatsApp ou par email, au choix du visiteur.
===================================================================== */

type Draft = {
  name: string;
  business: string;
  email: string;
  phone: string;
  kind: string;
  message: string;
};

const emptyDraft: Draft = {
  name: "",
  business: "",
  email: "",
  phone: "",
  kind: "Restaurant",
  message: "",
};

const kinds = ["Restaurant", "Commerce", "Cabinet / service", "Hôtel", "Groupe ou enseigne"];

function ContactSection() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [ready, setReady] = useState(false);

  function update(field: keyof Draft, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof Draft, string>> = {};
    if (draft.name.trim().length < 2) nextErrors.name = "Indiquez votre nom.";
    if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) nextErrors.email = "Email invalide.";
    if (draft.phone.trim().replace(/\D/g, "").length < 8)
      nextErrors.phone = "Numéro trop court pour être joint.";
    if (draft.message.trim().length < 10)
      nextErrors.message = "Décrivez votre besoin en quelques mots.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setReady(true);
  }

  const summary = `Demande Moncode
Nom : ${draft.name}
Établissement : ${draft.business || "—"}
Activité : ${draft.kind}
Email : ${draft.email}
Téléphone : ${draft.phone}

${draft.message}`;

  if (ready) {
    return (
      <section id="contact" className="anchor bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Votre demande est prête
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Elle est pré-remplie ci-dessous. Choisissez le canal sur lequel vous voulez être
              rappelé — nous répondons sous 24 heures ouvrées.
            </p>

            <pre className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
              {summary}
            </pre>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappUrl(summary)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <MessageCircle className="h-4 w-4" />
                Envoyer sur WhatsApp
              </a>
              <a
                href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(
                  `Demande Moncode — ${draft.business.trim() || draft.name}`,
                )}&body=${encodeURIComponent(summary)}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <Mail className="h-4 w-4" />
                Envoyer par email
              </a>
              <button
                type="button"
                onClick={() => {
                  setReady(false);
                  setDraft(emptyDraft);
                }}
                className="inline-flex items-center justify-center rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="anchor bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
        <div>
          <p className="text-sm font-semibold text-blue-600">Contact</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Parlons de votre établissement
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Une question sur le déploiement, un groupe à équiper, un devis à établir ? Décrivez
            votre situation, nous revenons vers vous avec une proposition concrète.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="name"
                label="Nom"
                value={draft.name}
                error={errors.name}
                onChange={(v) => update("name", v)}
                autoComplete="name"
                placeholder="Awa Kouassi"
              />
              <Field
                id="business"
                label="Établissement"
                value={draft.business}
                onChange={(v) => update("business", v)}
                autoComplete="organization"
                placeholder="Le Comptoir des Halles"
                optional
              />
              <Field
                id="email"
                label="Email"
                type="email"
                value={draft.email}
                error={errors.email}
                onChange={(v) => update("email", v)}
                autoComplete="email"
                placeholder="vous@exemple.com"
              />
              <Field
                id="phone"
                label="Téléphone / WhatsApp"
                type="tel"
                value={draft.phone}
                error={errors.phone}
                onChange={(v) => update("phone", v)}
                autoComplete="tel"
                placeholder="+225 07 00 00 00"
              />
            </div>

            <div>
              <label htmlFor="kind" className="text-sm font-semibold text-slate-900">
                Activité
              </label>
              <select
                id="kind"
                value={draft.kind}
                onChange={(event) => update("kind", event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {kinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="text-sm font-semibold text-slate-900">
                Votre besoin
              </label>
              <textarea
                id="message"
                rows={5}
                value={draft.message}
                onChange={(event) => update("message", event.target.value)}
                placeholder="Deux salles à équiper, carte changée chaque semaine, devis pour trois points de vente…"
                aria-invalid={errors.message ? "true" : undefined}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 aria-invalid:border-red-300"
              />
              {errors.message && <p className="mt-2 text-sm text-red-600">{errors.message}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Préparer ma demande
              </button>
              <p className="text-xs leading-5 text-slate-500">
                Vos informations restent sur votre appareil jusqu'à ce que vous choisissiez un canal
                d'envoi.
              </p>
            </div>
          </form>
        </div>

        <aside className="lg:pt-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">
              Autres canaux
            </h3>

            <ul className="mt-5 space-y-4 text-sm">
              <li>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 text-slate-700 hover:text-blue-700"
                >
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <span>
                    WhatsApp {CONTACT.whatsappDisplay}
                    <span className="block text-xs text-slate-500">Réponse la plus rapide</span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-start gap-3 text-slate-700 hover:text-blue-700"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <span>{CONTACT.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-slate-700">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span>{CONTACT.hours}</span>
              </li>
            </ul>

            <p className="mt-6 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-600">
              Vous voulez juste voir avant de parler ? Demandez un exemple de carte en ligne, nous
              vous envoyons un lien public.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  optional,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-slate-900">
        {label}
        {optional && <span className="ml-1 text-xs font-normal text-slate-400">(optionnel)</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? "true" : undefined}
        className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 aria-invalid:border-red-300"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

/* =====================================================================
   FOOTER (components/footer.tsx)
   Trois bandes : les informations en trois colonnes, le nom en grand
   avec l'offre, puis la ligne légale.
===================================================================== */

const produit = [
  { href: "/#fonctionnement", label: "Fonctionnement" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/#avis", label: "Avis" },
  { href: "/about", label: "À propos" },
  { href: "/restaurant", label: "Exemple de carte" },
  { href: "/qr-studio", label: "Studio QR" },
];

const coordonnées = [
  {
    term: "WhatsApp",
    value: CONTACT.whatsappDisplay,
    href: whatsappUrl("Bonjour Moncode, j'ai une question sur la carte digitale."),
  },
  { term: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { term: "Horaires", value: CONTACT.hours },
  { term: "Paiement", value: "Mobile Money, virement" },
];

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Bande 1 — les informations */}
        <div className="grid gap-x-14 gap-y-12 border-b border-slate-100 py-14 md:grid-cols-[1.3fr_0.8fr_1.1fr] lg:py-16">
          <section>
            <Link href="/" aria-label="Moncode — accueil" className="inline-flex">
              <Logo />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-600">
              Une page de carte en ligne, un QR code posé sur vos tables, et une personne joignable
              directement.
            </p>
            <Link
              href="/contact"
              className="group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 transition-colors hover:text-blue-700"
            >
              Parler à un conseiller
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Le produit
            </p>
            <ul className="mt-5 space-y-3.5">
              {produit.map((item) => (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    className="text-[13px] text-slate-600 transition-colors hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Coordonnées
            </p>
            <dl className="mt-5 border-t border-slate-100 text-[13px]">
              {coordonnées.map((item) => (
                <div
                  key={item.term}
                  className="grid grid-cols-[auto_1fr] items-baseline gap-4 border-b border-slate-100 py-3"
                >
                  <dt className="text-slate-500">{item.term}</dt>
                  <dd className="text-right text-slate-900">
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel="noreferrer"
                        className="transition-colors hover:text-blue-700"
                      >
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* Bande 2 — le nom et l'offre */}
        <div className="flex flex-col gap-8 border-b border-slate-100 py-12 lg:flex-row lg:items-end lg:justify-between lg:gap-16 lg:py-14">
          <p className="text-[clamp(3rem,11vw,6.5rem)] font-bold leading-[0.85] tracking-tight text-slate-900">
            Moncode
          </p>
          <p className="max-w-sm text-base leading-7 text-slate-600 lg:text-right">
            Carte digitale —{" "}
            <span className="font-semibold text-slate-900">20 000 FCFA, paiement unique</span>. Sur
            mesure — <span className="font-semibold text-slate-900">sur devis</span>.
          </p>
        </div>

        {/* Bande 3 — ligne légale */}
        <div className="flex flex-col gap-2 py-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {CONTACT.brand}. Tous droits réservés.
          </p>
          <p className="text-xs text-slate-500">Sans abonnement, sans commission sur vos ventes.</p>
        </div>
      </div>
    </footer>
  );
}

/* =====================================================================
   BOUTON WHATSAPP (components/whatsapp-button.tsx)
   Dans l'application, il est monté par app/layout.tsx : il flotte donc
   sur toutes les pages, pas seulement sur l'accueil.
===================================================================== */

function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label={`Écrire sur WhatsApp au ${CONTACT.whatsappDisplay}`}
      className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-slate-900/20 transition-colors hover:bg-[#1fb355] sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="sr-only">WhatsApp</span>
    </a>
  );
}

/* =====================================================================
   LA PAGE (app/page.tsx)
===================================================================== */

export function PageAccueil() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* Spacer pour le header fixe */}
      <div className="header-spacer"></div>

      <Hero />
      <HowItWorks />
      <FeaturesSection />
      <PricingSection />
      <Testimonials />
      <AboutSection />
      <ContactSection />
      <Footer />

      <WhatsAppButton />
    </main>
  );
}

export default PageAccueil;
