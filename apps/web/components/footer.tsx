import Link from "next/link";
import { ArrowRight, Mail, MapPin, MessageCircle } from "lucide-react";
import Logo from "@/components/logo";
import { CONTACT, whatsappUrl } from "@/lib/contact";

/* Pied de page : même fond blanc et même gabarit que l'en-tête ; marque et appel à l'action, trois colonnes, mentions. */

const colonnes = [
  {
    titre: "Produit",
    liens: [
      { href: "/creer", label: "Créer un QR code" },
      { href: "/#fonctionnement", label: "Comment ça marche" },
      { href: "/#tarifs", label: "Tarifs" },
      { href: "/manuel", label: "Manuel d’utilisation" },
    ],
  },
  {
    titre: "Ressources",
    liens: [
      { href: "/developpeurs", label: "API développeurs" },
      { href: "/a-propos", label: "À propos" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

const legal = [
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/conditions", label: "Conditions d’utilisation" },
];

const lien = "py-1 text-sm text-ink/70 transition-colors hover:text-forest md:py-0 md:text-[15px]";

export default function Footer() {
  const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;
  return (
    <footer className="footer-surface relative overflow-hidden pt-10 md:pt-24">
      {/* L'espace blanc est au-dessus de la ligne : celle-ci sépare le pied de page du contenu. */}
      <div className="border-t border-line bg-white">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 border-b border-line py-7 text-center md:grid-cols-2 md:gap-12 md:py-14 md:text-left lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-10">
          <div className="col-span-2 flex flex-col items-center md:col-span-1 md:items-start" data-reveal>
            <Link href="/" aria-label="Moncode — accueil" className="inline-flex">
              <Logo variant="dark" />
            </Link>
            <p className="mt-2.5 max-w-xs text-sm leading-6 text-sage md:mt-5 md:text-base md:leading-7">
              Une page, une image, une vidéo ou un PDF derrière un QR code unique.
            </p>
            <Link href="/creer" className="btn btn-primary btn-sm mt-6 max-md:hidden">
              Créer un QR code <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {colonnes.map((col, i) => (
            <nav key={col.titre} aria-label={col.titre} data-reveal style={delay(80 * (i + 1))}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">{col.titre}</h2>
              <ul className="mt-1.5 md:mt-4 md:space-y-3">
                {col.liens.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={`${lien} block md:inline`}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 md:col-span-1" data-reveal style={delay(240)}>
            <h2 className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-ink md:block">Nous joindre</h2>
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-0 md:mt-4 md:flex-col md:items-start md:gap-3">
              <li>
                <a href={whatsappUrl()} target="_blank" rel="noreferrer" className={`${lien} inline-flex items-center gap-2.5`}>
                  <MessageCircle className="h-4 w-4 text-forest" /> {CONTACT.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className={`${lien} inline-flex items-center gap-2.5`}>
                  <Mail className="h-4 w-4 text-forest" /> {CONTACT.email}
                </a>
              </li>
              <li className="hidden items-center gap-2.5 text-[15px] text-ink/70 md:inline-flex">
                <MapPin className="h-4 w-4 text-forest" /> {CONTACT.address}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 py-4 pb-20 text-center text-xs text-sage sm:flex-row sm:justify-between sm:pb-6 sm:text-sm">
          <p>© {new Date().getFullYear()} {CONTACT.brand}. Tous droits réservés.</p>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            {legal.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-forest">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </div>
    </footer>
  );
}
