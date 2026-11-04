import Link from "next/link";
import { MessageCircle, QrCode } from "lucide-react";
import { CONTACT, whatsappUrl } from "@/lib/contact";

const columns = [
  {
    title: "Le produit",
    links: [
      { href: "/#fonctionnement", label: "Comment ça marche" },
      { href: "/#tarifs", label: "Tarifs" },
      { href: "/#avis", label: "Avis" },
      { href: "/#contact", label: "Contact" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { href: "/about", label: "À propos" },
      { href: "/qr-studio", label: "Studio QR" },
      { href: "/restaurant", label: "Exemple de carte" },
      { href: "/connexion", label: "Se connecter" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.9fr_0.9fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <QrCode className="h-4 w-4" />
              </span>
              <span className="text-base font-semibold">{CONTACT.brand}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
              Menus digitaux et QR codes pour restaurants, commerces et cabinets.
            </p>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-blue-300"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp {CONTACT.whatsappDisplay}
            </a>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-white">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {CONTACT.brand}. Tous droits réservés.
          </p>
          <p>{CONTACT.hours}</p>
        </div>
      </div>
    </footer>
  );
}
