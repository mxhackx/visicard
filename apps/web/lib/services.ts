export type ServiceType = "page" | "media" | "document";

export interface ServiceOffer {
  id: ServiceType;
  index: string;
  name: string;
  shortName: string;
  price: string;
  priceNote: string;
  tagline: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
}

export const SERVICES: ServiceOffer[] = [
  {
    id: "page",
    index: "01",
    name: "Page digitale",
    shortName: "Page",
    price: "20 000",
    priceNote: "FCFA · un seul QR code",
    tagline: "Votre page en ligne, accessible en un scan.",
    description:
      "Un QR code unique ouvre une page complète : présentation, menu, horaires, photos, réseaux et contact. La page reste modifiable après impression du code.",
    features: [
      "1 QR code pour 1 page",
      "Menu, photos, horaires et réseaux",
      "Modifications en ligne incluses",
      "QR code prêt à imprimer",
    ],
    cta: "Créer ma page",
    href: "/creer?service=page",
  },
  {
    id: "media",
    index: "02",
    name: "QR image ou vidéo",
    shortName: "Image / vidéo",
    price: "5 000",
    priceNote: "FCFA · un seul QR code",
    tagline: "Une image ou une vidéo, sans application.",
    description:
      "Envoyez une image ou une courte vidéo. Nous la publions sur une page de lecture légère et vous recevez un QR code à scanner, partager ou imprimer.",
    features: [
      "1 QR code pour 1 média",
      "Image ou vidéo prise en charge",
      "Page de lecture mobile",
      "Lien et fichier QR téléchargeables",
    ],
    cta: "Créer mon QR média",
    href: "/creer?service=media",
  },
  {
    id: "document",
    index: "03",
    name: "QR document",
    shortName: "Document",
    price: "5 000",
    priceNote: "FCFA · un seul QR code",
    tagline: "Un PDF consultable au premier scan.",
    description:
      "Envoyez un document PDF : carte, brochure, fiche technique ou programme. Le QR code ouvre une page de consultation avec téléchargement.",
    features: [
      "1 QR code pour 1 document PDF",
      "Consultation et téléchargement",
      "Page de lecture mobile",
      "Lien et fichier QR téléchargeables",
    ],
    cta: "Créer mon QR document",
    href: "/creer?service=document",
  },
];

export const CUSTOM_OFFER = {
  name: "Sur mesure",
  description:
    "Plusieurs QR codes, plusieurs établissements, charte graphique avancée, changements particuliers ou intégrations : nous chiffrons après un échange court.",
  features: [
    "Plusieurs QR codes ou plusieurs points de vente",
    "Charte graphique et nom de domaine",
    "Changements particuliers et intégrations",
    "Accompagnement dans la durée",
  ],
  href: "/contact",
};

export const SERVICE_LABELS: Record<ServiceType, string> = {
  page: "Page digitale",
  media: "Image / vidéo",
  document: "Document PDF",
};

export function isServiceType(value: string | null | undefined): value is ServiceType {
  return value === "page" || value === "media" || value === "document";
}

export function serviceLabel(value: string | null | undefined): string {
  return isServiceType(value) ? SERVICE_LABELS[value] : "QR code";
}
