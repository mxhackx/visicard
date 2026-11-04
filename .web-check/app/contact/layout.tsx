import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nous Contacter — Support Moncode",
  description: "Contactez notre équipe Moncode par email, téléphone ou WhatsApp. Support disponible lun-ven 9h-18h. Réponse en moins de 24h.",
  keywords: "contact, support, moncode, email, téléphone, whatsapp",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
