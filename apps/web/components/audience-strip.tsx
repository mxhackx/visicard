import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  Scissors,
  ShoppingBag,
  Stethoscope,
  UtensilsCrossed,
} from "lucide-react";
import SectionHeading from "@/components/section-heading";

type Tag = "Page" | "Image / vidéo" | "PDF";

// Photos : Unsplash (licence libre), stockées dans public/images.
const audiences: { icon: typeof ShoppingBag; label: string; use: string; tags: Tag[]; photo: string }[] = [
  { icon: UtensilsCrossed, label: "Restaurants", use: "Menu du jour, carte des vins, horaires", tags: ["Page", "PDF"], photo: "/illustrations/secteur-restaurant.svg" },
  { icon: BedDouble, label: "Hôtels", use: "Livret d’accueil, services en chambre", tags: ["Page", "PDF"], photo: "/illustrations/secteur-hotel.svg" },
  { icon: ShoppingBag, label: "Boutiques", use: "Catalogue, nouveautés, vidéo produit", tags: ["Page", "Image / vidéo"], photo: "/illustrations/secteur-boutique.svg" },
  { icon: Scissors, label: "Salons", use: "Prestations, tarifs, prise de rendez-vous", tags: ["Page"], photo: "/illustrations/secteur-salon.svg" },
  { icon: Stethoscope, label: "Cabinets", use: "Fiche d’information, consignes patients", tags: ["PDF"], photo: "/illustrations/secteur-cabinet.svg" },
  { icon: CalendarDays, label: "Événements", use: "Programme, plan du site, teaser vidéo", tags: ["PDF", "Image / vidéo"], photo: "/illustrations/secteur-evenement.svg" },
  { icon: GraduationCap, label: "Écoles", use: "Brochure, emploi du temps, inscriptions", tags: ["PDF", "Page"], photo: "/illustrations/secteur-ecole.svg" },
  { icon: HeartHandshake, label: "Associations", use: "Présentation, campagne, appel aux dons", tags: ["Page", "Image / vidéo"], photo: "/illustrations/secteur-association.svg" },
];

const stats = [
  { value: "12", label: "types de QR code" },
  { value: "1", label: "QR code par contenu" },
  { value: "0", label: "application à installer" },
  { value: "24 h", label: "pour une réponse (jours ouvrés)" },
];

/** Pour qui : un usage concret par métier, plutôt qu'une simple rangée d'icônes. */
export default function AudienceStrip() {
  return (
    <section className="relative">
      {/* Bande de chiffres, à cheval sur le hero */}
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <dl
          className="surface -mt-8 grid grid-cols-2 divide-line overflow-hidden rounded-2xl sm:grid-cols-4 sm:divide-x"
          data-reveal
        >
          {stats.map((stat) => (
            <div key={stat.label} className="px-5 py-5 text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-2xl font-semibold text-forest sm:text-3xl">{stat.value}</dd>
              <dd className="mt-1 text-sm text-sage">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 lg:pb-24 sm:px-6 lg:px-8">
        <SectionHeading
          title="Pour tous les établissements"
          subtitle="Un même principe, des usages très différents. Voici ce que nos clients mettent derrière leur QR code."
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map(({ icon: Icon, label, use, tags, photo }, idx) => (
            <li
              key={label}
              className="surface surface-hover group relative flex flex-col overflow-hidden hover:-translate-y-1"
              data-reveal
              style={{ "--d": `${(idx % 4) * 60}ms` } as React.CSSProperties}
            >
              <div className="relative aspect-[3/2] overflow-hidden bg-cream">
                <Image
                  src={photo}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                  className="object-contain p-5 pb-8 transition-transform duration-500 group-hover:scale-105"
                />
                <span className="icon-tile absolute bottom-3 left-3 h-10 w-10 bg-white shadow-sm transition-colors duration-300 group-hover:bg-forest group-hover:text-white">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
              <h3 className="relative text-base font-semibold text-ink/90">{label}</h3>
              <p className="relative mt-1 text-[15px] leading-6 text-sage">{use}</p>
              <div className="relative mt-4 flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line px-2 py-0.5 text-[12.5px] font-medium text-ink/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-sm text-sage" data-reveal>
          Votre activité n’est pas listée ?{" "}
          <Link
            href="/contact"
            className="group inline-flex items-center gap-1 font-semibold text-forest hover:text-forest-dark"
          >
            Parlons-en
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </p>
      </div>
    </section>
  );
}
