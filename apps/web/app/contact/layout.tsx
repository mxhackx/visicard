import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez l’équipe Moncode à Cotonou par WhatsApp, téléphone ou e-mail, du lundi au vendredi de 9 h à 18 h. Réponse sous 24 h ouvrées.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact", title: "Contacter Moncode" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
