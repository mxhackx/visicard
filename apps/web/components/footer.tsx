import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import Logo from "@/components/logo";
import { CONTACT, whatsappUrl } from "@/lib/contact";

/* Footer volontairement court : l'essentiel, sur le fond noir de marque avec filet rouge. */

const liens = [
  { href: "/#fonctionnement", label: "Comment ça marche" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/manuel", label: "Manuel d’utilisation" },
  { href: "/a-propos", label: "À propos" },
  { href: "/qr-gratuit", label: "QR code gratuit (lien)" },
  { href: "/developpeurs", label: "API développeurs" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="footer-surface relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 border-b border-white/10 py-14 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm" data-reveal>
            <Link href="/" aria-label="Moncode — accueil" className="inline-flex">
              <Logo variant="light" />
            </Link>
            <p className="mt-5 text-base leading-7 text-white/65">
              Une page, une image, une vidéo ou un PDF derrière un QR code unique.
            </p>
          </div>

          <nav aria-label="Liens du pied de page" data-reveal style={{ "--d": "80ms" } as React.CSSProperties}>
            <ul className="grid grid-cols-2 gap-x-10 gap-y-3">
              {liens.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[15px] text-white/70 transition-colors hover:text-white">
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
                className="inline-flex items-center gap-3 text-[15px] text-white/85 transition-colors hover:text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  <MessageCircle className="h-4 w-4" />
                </span>
                {CONTACT.whatsappDisplay}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CONTACT.email}`}
                className="inline-flex items-center gap-3 text-[15px] text-white/85 transition-colors hover:text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  <Mail className="h-4 w-4" />
                </span>
                {CONTACT.email}
              </a>
            </li>
          </ul>
        </div>

        <p className="py-6 text-sm text-white/50">
          © {new Date().getFullYear()} {CONTACT.brand}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
