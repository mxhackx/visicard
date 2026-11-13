import Link from "next/link";
import { MessageCircle } from "lucide-react";
import Logo from "@/components/logo";
import { CONTACT, whatsappUrl } from "@/lib/contact";

/* Footer volontairement court : l'essentiel, sur le fond noir de marque avec filet rouge. */

const liens = [
  { href: "/#fonctionnement", label: "Comment ça marche" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/manuel", label: "Manuel d’utilisation" },
  { href: "/a-propos", label: "À propos" },
  { href: "/creer", label: "QR code gratuit (lien)" },
  { href: "/developpeurs", label: "API développeurs" },
  { href: "/contact", label: "Contact" },
];

const legal = [
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/conditions", label: "Conditions d’utilisation" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

export default function Footer() {
  return (
    <footer className="footer-surface relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 border-b border-line py-14 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm" data-reveal>
            <Link href="/" aria-label="Moncode — accueil" className="inline-flex">
              <Logo variant="dark" />
            </Link>
            <p className="mt-5 text-base leading-7 text-sage">
              Une page, une image, une vidéo ou un PDF derrière un QR code unique.
            </p>
          </div>

          <nav aria-label="Liens du pied de page" data-reveal style={{ "--d": "80ms" } as React.CSSProperties}>
            <ul className="grid grid-cols-2 gap-x-10 gap-y-3">
              {liens.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[15px] text-ink/70 transition-colors hover:text-forest">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="space-y-3" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>
            <li>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 text-[15px] text-ink/85 transition-colors hover:text-forest"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream-deep text-forest ring-1 ring-line">
                  <MessageCircle className="h-4 w-4" />
                </span>
                {CONTACT.whatsappDisplay}
              </a>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 py-6 text-sm text-sage sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {CONTACT.brand}. Tous droits réservés.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {legal.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-forest">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
