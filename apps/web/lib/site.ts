import { CONTACT } from "./contact";

/**
 * Identité du site pour le référencement : adresse canonique, titres, données
 * structurées. L'adresse publique vient de NEXT_PUBLIC_SITE_URL (à définir en
 * production) ; à défaut, l'URL de déploiement actuelle.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://moncode-web.vercel.app").replace(/\/$/, "");

export const SITE = {
  name: CONTACT.brand,
  title: "Moncode — Menu digital, page, image, vidéo ou PDF derrière un QR code",
  description:
    "Créez le QR code de votre restaurant, hôtel ou boutique au Bénin : menu digital, page d’établissement, image, vidéo ou PDF. Sans compte, paiement simple sur WhatsApp, actif dès le paiement.",
  locale: "fr_BJ",
  keywords: [
    "QR code",
    "menu digital",
    "menu QR code restaurant",
    "page digitale",
    "QR code Bénin",
    "QR code Cotonou",
    "QR code PDF",
    "QR code vidéo",
    "carte digitale restaurant",
  ],
};

/** Chemins publics à référencer (le reste est privé : admin, commandes, étapes de création). */
export const PUBLIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/creer", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/qr-gratuit", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/a-propos", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" as const },
];

/** Données structurées (schema.org) : l'entreprise et ses offres. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organisation`,
        name: SITE.name,
        url: SITE_URL,
        logo: `${SITE_URL}/icon-512.png`,
        email: CONTACT.email,
        telephone: `+${CONTACT.whatsappNumber}`,
        address: { "@type": "PostalAddress", addressLocality: "Cotonou", addressCountry: "BJ" },
        areaServed: { "@type": "Country", name: "Bénin" },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: `+${CONTACT.whatsappNumber}`,
          contactType: "customer service",
          availableLanguage: ["French"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#site`,
        url: SITE_URL,
        name: SITE.name,
        inLanguage: "fr",
        publisher: { "@id": `${SITE_URL}/#organisation` },
      },
      {
        "@type": "Service",
        name: "QR codes pour pages digitales, images, vidéos et documents",
        provider: { "@id": `${SITE_URL}/#organisation` },
        areaServed: "BJ",
        offers: [
          { "@type": "Offer", name: "Page digitale (menu, établissement)", price: "20000", priceCurrency: "XOF" },
          { "@type": "Offer", name: "QR code image ou vidéo", price: "5000", priceCurrency: "XOF" },
          { "@type": "Offer", name: "QR code document PDF", price: "5000", priceCurrency: "XOF" },
        ],
      },
    ],
  };
}
