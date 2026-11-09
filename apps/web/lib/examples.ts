import type { LayoutId } from "./palette";

/** Contenu de démonstration (marque Moncode) pour montrer chaque style de page digitale. */
export interface ExampleContent {
  restaurantName: string;
  tagline: string;
  address: string;
  phoneNumber: string;
  additionalInfo: string;
  schedule: Record<string, { isOpen: boolean; open: string; close: string }>;
  tones: [string, string];
  menuLabels: string[];
}

const week = (open: string, close: string, sunday = false) =>
  Object.fromEntries(
    ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((d) => [
      d,
      { isOpen: d !== "sunday" || sunday, open, close },
    ]),
  );

export const EXAMPLES: Partial<Record<LayoutId, ExampleContent>> = {
  maquis: {
    restaurantName: "Moncode",
    tagline: "Votre carte, vos horaires et votre contact, en une seule page.",
    address: "Cotonou, Bénin",
    phoneNumber: "+22999389202",
    additionalInfo: "Poisson braisé\nPoulet bicyclette\nAttiéké et alloco\nBoissons fraîches",
    schedule: week("11:00", "23:30", true),
    tones: ["#c81d25", "#f6c200"],
    menuLabels: ["Grillades", "Boissons"],
  },
  beaute: {
    restaurantName: "Moncode",
    tagline: "Vos prestations, vos tarifs et la prise de rendez-vous.",
    address: "Cotonou, Bénin",
    phoneNumber: "+22999389202",
    additionalInfo: "Soin du visage\nCoiffure et tresses\nManucure et pose d’ongles\nMaquillage",
    schedule: week("09:00", "19:00"),
    tones: ["#b88a4a", "#f3e3dd"],
    menuLabels: ["Tarifs soins", "Tarifs coiffure"],
  },
  boutique: {
    restaurantName: "Moncode",
    tagline: "Votre collection, vos nouveautés et vos contacts.",
    address: "Cotonou, Bénin",
    phoneNumber: "+22999389202",
    additionalInfo: "Robes et ensembles\nChemises en wax\nAccessoires\nSur mesure",
    schedule: week("08:30", "19:30"),
    tones: ["#f05a28", "#111111"],
    menuLabels: ["Collection", "Nouveautés", "Accessoires"],
  },
  hotel: {
    restaurantName: "Moncode",
    tagline: "Vos chambres, vos services et votre réception, en un scan.",
    address: "Cotonou, Bénin",
    phoneNumber: "+22999389202",
    additionalInfo: "Climatisation et Wi-Fi\nPetit-déjeuner inclus\nParking sécurisé\nNavette aéroport",
    schedule: week("00:00", "23:59", true),
    tones: ["#23403a", "#a88a5a"],
    menuLabels: ["Chambre standard", "Suite"],
  },
  clinique: {
    restaurantName: "Moncode",
    tagline: "Vos consultations, vos horaires et vos consignes patients.",
    address: "Cotonou, Bénin",
    phoneNumber: "+22999389202",
    additionalInfo: "Médecine générale\nPédiatrie\nLaboratoire d’analyses\nUrgences 24 h/24",
    schedule: week("07:30", "20:00", true),
    tones: ["#00796b", "#2dd4bf"],
    menuLabels: ["Tarifs consultations"],
  },
  carte: {
    restaurantName: "Moncode",
    tagline: "Votre carte de visite numérique.",
    address: "Cotonou, Bénin",
    phoneNumber: "+22999389202",
    additionalInfo: "Votre fonction ou métier\ncontact@moncode.bj\nDisponible sur rendez-vous",
    schedule: week("09:00", "18:00"),
    tones: ["#c81d25", "#17171a"],
    menuLabels: ["Plaquette"],
  },
  chantier: {
    restaurantName: "Moncode",
    tagline: "Vos produits, vos prix et vos coordonnées, en une page.",
    address: "Cotonou, Bénin",
    phoneNumber: "+22999389202",
    additionalInfo: "Ciment et sable\nFer à béton\nPeinture et enduits\nOutillage et plomberie",
    schedule: week("07:30", "18:00"),
    tones: ["#ff6b00", "#2c3036"],
    menuLabels: ["Prix ciment", "Outillage", "Plomberie"],
  },
};

/** Image de substitution (dégradé + libellé) : aucun fichier à héberger. */
export function sampleImage(label: string, [a, b]: [string, string], w = 600, h = 800, seed = ""): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><!--${seed}--><text x="50%" y="50%" fill="#fff" fill-opacity=".85" font-family="sans-serif" font-size="${Math.round(w / 12)}" font-weight="700" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const EXAMPLE_IDS = Object.keys(EXAMPLES) as LayoutId[];
