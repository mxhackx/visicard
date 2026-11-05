import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import Logo from "@/components/logo";
import { CONTACT, whatsappUrl } from "@/lib/contact";

/* Footer volontairement court : l'essentiel, sur le même fond gris clair que le header. */

const liens = [
  { href: "/#services", label: "Services" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="chrome-surface relative overflow-hidden border-t border-line">
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
                  <Link href={item.href} className="text-[15px] text-ink/75 transition-colors hover:text-forest">
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
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-forest ring-1 ring-line">
                  <MessageCircle className="h-4 w-4" />
                </span>
                {CONTACT.whatsappDisplay}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CONTACT.email}`}
                className="inline-flex items-center gap-3 text-[15px] text-ink/85 transition-colors hover:text-forest"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-forest ring-1 ring-line">
                  <Mail className="h-4 w-4" />
                </span>
                {CONTACT.email}
              </a>
            </li>
          </ul>
        </div>

        <p className="py-6 text-sm text-sage">
          © {new Date().getFullYear()} {CONTACT.brand}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
