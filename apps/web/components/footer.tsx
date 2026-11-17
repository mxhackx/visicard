import Link from "next/link";
import { ArrowRight, Mail, MapPin, MessageCircle } from "lucide-react";
import Logo from "@/components/logo";
import { CONTACT, whatsappUrl } from "@/lib/contact";
import CookieSettingsLink from "@/components/cookie-settings-link";

/* Pied de page : centré sur mobile, aligné à gauche dès tablette ; marque et appel à l'action, trois colonnes, mentions. */

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

const lien = "py-1 text-sm text-ink/70 transition-colors hover:text-forest md:py-0 md:text-[15px]";

export default function Footer() {
  const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;
  return (
    <footer className="footer-surface relative overflow-hidden pt-10 md:pt-24">
      {/* Sans fond propre : le pied de page continue le fond du hero de la page ; la ligne le sépare du contenu. */}
      <div className="border-t border-line">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Mobile : une colonne, tout aligné à gauche ; les deux colonnes de liens côte à côte dès 40rem. */}
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 border-b border-line py-8 max-sm:text-center sm:grid-cols-2 sm:text-left md:gap-12 md:py-14 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-10">
          <div className="flex flex-col max-sm:items-center sm:col-span-2 md:col-span-1" data-reveal>
            <Link href="/" aria-label="Moncode — accueil" className="inline-flex">
              <Logo variant="dark" />
            </Link>
            <p className="mt-2.5 max-w-xs text-sm leading-6 text-sage md:mt-5 md:text-base md:leading-7">
              Une page, une image, une vidéo ou un PDF derrière un QR code unique.
            </p>
            <Link href="/creer" className="btn btn-primary btn-sm mt-5">
              Créer un QR code <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {colonnes.map((col, i) => (
            <nav key={col.titre} aria-label={col.titre} data-reveal style={delay(80 * (i + 1))}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">{col.titre}</h2>
              <ul className="mt-2 md:mt-4 md:space-y-3">
                {col.liens.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={lien}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="sm:col-span-2 md:col-span-1" data-reveal style={delay(240)}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">Nous joindre</h2>
            <ul className="mt-2 flex flex-col max-sm:items-center gap-y-2.5 sm:items-start md:mt-4 md:gap-3">
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
              <li className="inline-flex items-center gap-2.5 text-[15px] text-ink/70">
                <MapPin className="h-4 w-4 text-forest" /> {CONTACT.address}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 py-5 pb-20 max-sm:items-center max-sm:text-center text-xs text-sage sm:flex-row sm:items-center sm:justify-between sm:pb-6 sm:text-sm">
          <p>© {new Date().getFullYear()} {CONTACT.brand}. Tous droits réservés.</p>
          <CookieSettingsLink className="font-medium transition-colors hover:text-forest" />
        </div>
      </div>
      </div>
    </footer>
  );
}
