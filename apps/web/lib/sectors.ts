import {
  Beer, BedDouble, Briefcase, Hammer, IdCard, Scissors, ShoppingBag, Stethoscope, UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { LayoutId } from "./palette";

/**
 * Un secteur règle ce que le formulaire demande (libellés, exemples, modèle de texte)
 * et le style de page proposé par défaut. Le client peut changer de style ensuite.
 */
export interface SectorCopy {
  nameLabel: string;
  namePlaceholder: string;
  addressPlaceholder: string;
  infoLabel: string;
  infoHint: string;
  infoPlaceholder: string;
  /** Texte de départ, une ligne par élément : la 1re ligne sert d'accroche. */
  infoTemplate: string;
  menuLabel: string;
  menuHint: string;
  placeLabel: string;
  placeHint: string;
  scheduleHint: string;
}

export interface Sector {
  id: string;
  label: string;
  icon: LucideIcon;
  layout: LayoutId;
  copy: SectorCopy;
}

export const SECTORS: Sector[] = [
  {
    id: "restaurant", label: "Restaurant", icon: UtensilsCrossed, layout: "classic",
    copy: {
      nameLabel: "Nom du restaurant", namePlaceholder: "Moncode", addressPlaceholder: "Haie Vive, rue 12.075, face à la pharmacie",
      infoLabel: "Spécialités et services", infoHint: "Spécialités, livraison, moyens de paiement. La 1re ligne sert d’accroche.",
      infoPlaceholder: "Cuisine béninoise et grillades\nLivraison à Cotonou\nPaiement MoMo accepté",
      infoTemplate: "Cuisine maison, fraîche tous les jours\nLivraison à domicile\nPaiement MoMo accepté\nRéservation par WhatsApp",
      menuLabel: "Photos du menu", menuHint: "Une photo par page de la carte.",
      placeLabel: "Photos du lieu", placeHint: "Salle, terrasse, plats : ça donne envie.", scheduleHint: "Jours et heures de service.",
    },
  },
  {
    id: "maquis", label: "Maquis et bar", icon: Beer, layout: "maquis",
    copy: {
      nameLabel: "Nom du maquis", namePlaceholder: "Moncode", addressPlaceholder: "Rue des Cocotiers, Cotonou",
      infoLabel: "Au menu", infoHint: "Une ligne par plat ou boisson phare. La 1re ligne sert d’accroche.",
      infoPlaceholder: "Poisson braisé\nPoulet bicyclette\nAttiéké et alloco\nBoissons fraîches",
      infoTemplate: "Poisson braisé\nPoulet bicyclette\nAttiéké et alloco\nBoissons fraîches",
      menuLabel: "Photos de l’ardoise ou du menu", menuHint: "Photographiez l’ardoise ou la carte.",
      placeLabel: "Photos de l’ambiance", placeHint: "Terrasse, plats, soirées.", scheduleHint: "Heures d’ouverture, soirs et week-ends compris.",
    },
  },
  {
    id: "beaute", label: "Salon et beauté", icon: Scissors, layout: "beaute",
    copy: {
      nameLabel: "Nom du salon", namePlaceholder: "Moncode", addressPlaceholder: "Quartier Haie Vive, Cotonou",
      infoLabel: "Prestations", infoHint: "Une ligne par soin ou prestation. La 1re ligne sert d’accroche.",
      infoPlaceholder: "Soin du visage\nCoiffure et tresses\nManucure et pose d’ongles",
      infoTemplate: "Sur rendez-vous, par WhatsApp\nSoin du visage\nCoiffure et tresses\nManucure et pose d’ongles\nMaquillage",
      menuLabel: "Photos des tarifs", menuHint: "La carte des soins et des prix.",
      placeLabel: "Photos des réalisations", placeHint: "Coiffures, ongles, avant / après.", scheduleHint: "Horaires d’accueil sur rendez-vous.",
    },
  },
  {
    id: "boutique", label: "Boutique et mode", icon: ShoppingBag, layout: "boutique",
    copy: {
      nameLabel: "Nom de la boutique", namePlaceholder: "Moncode", addressPlaceholder: "Marché Dantokpa, allée B",
      infoLabel: "Produits et services", infoHint: "Ce que vous vendez, livraison, retours. La 1re ligne sert d’accroche.",
      infoPlaceholder: "Robes et ensembles en wax\nAccessoires\nLivraison possible",
      infoTemplate: "Mode africaine contemporaine\nRobes et ensembles\nAccessoires\nSur mesure\nLivraison possible",
      menuLabel: "Photos de la collection", menuHint: "Vos meilleurs produits, une photo chacun.",
      placeLabel: "Photos de la boutique", placeHint: "Vitrine, intérieur, équipe.", scheduleHint: "Heures d’ouverture de la boutique.",
    },
  },
  {
    id: "hotel", label: "Hôtel et résidence", icon: BedDouble, layout: "hotel",
    copy: {
      nameLabel: "Nom de l’établissement", namePlaceholder: "Moncode", addressPlaceholder: "Route de l’aéroport, Cotonou",
      infoLabel: "Services et équipements", infoHint: "Une ligne par service. La 1re ligne sert d’accroche.",
      infoPlaceholder: "Climatisation et Wi-Fi\nPetit-déjeuner inclus\nParking sécurisé",
      infoTemplate: "Chambres calmes, réservation en direct\nClimatisation et Wi-Fi\nPetit-déjeuner inclus\nParking sécurisé\nNavette aéroport",
      menuLabel: "Photos des chambres et tarifs", menuHint: "Chambres, suites et grille des prix.",
      placeLabel: "Photos de l’établissement", placeHint: "Façade, piscine, restaurant.", scheduleHint: "Horaires de la réception.",
    },
  },
  {
    id: "clinique", label: "Clinique et cabinet", icon: Stethoscope, layout: "clinique",
    copy: {
      nameLabel: "Nom de la structure", namePlaceholder: "Moncode", addressPlaceholder: "Avenue Steinmetz, Cotonou",
      infoLabel: "Spécialités et services", infoHint: "Une ligne par spécialité ou service. La 1re ligne sert d’accroche.",
      infoPlaceholder: "Médecine générale\nPédiatrie\nLaboratoire d’analyses",
      infoTemplate: "Prise de rendez-vous rapide par WhatsApp\nMédecine générale\nPédiatrie\nLaboratoire d’analyses\nUrgences 24 h/24",
      menuLabel: "Photos des tarifs", menuHint: "Tarifs de consultation, documents à apporter.",
      placeLabel: "Photos des locaux", placeHint: "Accueil, salles de soins.", scheduleHint: "Horaires de consultation.",
    },
  },
  {
    id: "chantier", label: "Quincaillerie et artisan", icon: Hammer, layout: "chantier",
    copy: {
      nameLabel: "Nom du magasin", namePlaceholder: "Moncode", addressPlaceholder: "Zone industrielle, Porto-Novo",
      infoLabel: "Rayons et produits", infoHint: "Une ligne par rayon. Chaque ligne devient une « allée » numérotée.",
      infoPlaceholder: "Ciment et sable\nFer à béton\nPeinture et enduits",
      infoTemplate: "Livraison sur chantier\nCiment et sable\nFer à béton\nPeinture et enduits\nOutillage et plomberie",
      menuLabel: "Photos du catalogue", menuHint: "Pages du catalogue ou liste de prix.",
      placeLabel: "Photos du magasin", placeHint: "Rayons, stock, camion de livraison.", scheduleHint: "Heures d’ouverture du magasin.",
    },
  },
  {
    id: "pro", label: "Profil professionnel", icon: IdCard, layout: "carte",
    copy: {
      nameLabel: "Votre nom", namePlaceholder: "Moncode", addressPlaceholder: "Cotonou, Bénin",
      infoLabel: "Votre métier et vos liens", infoHint: "La 1re ligne est votre fonction. Les suivantes s'affichent comme des lignes d'information (e-mail, site…).",
      infoPlaceholder: "Consultant en marketing digital\ncontact@exemple.com",
      infoTemplate: "Votre fonction ou métier\ncontact@exemple.com\nDisponible sur rendez-vous",
      menuLabel: "Documents (facultatif)", menuHint: "Plaquette, tarifs, portfolio.",
      placeLabel: "Photo de profil", placeHint: "Un visage ou un logo : la 1re photo sert d'avatar.", scheduleHint: "Quand êtes-vous joignable ?",
    },
  },
  {
    id: "services", label: "Autre activité", icon: Briefcase, layout: "saas",
    copy: {
      nameLabel: "Nom de l’activité", namePlaceholder: "Moncode", addressPlaceholder: "Cotonou, Akpakpa",
      infoLabel: "Ce que vous proposez", infoHint: "Une ligne par service. La 1re ligne sert d’accroche.",
      infoPlaceholder: "Conseil et accompagnement\nDevis gratuit\nIntervention rapide",
      infoTemplate: "Devis gratuit en 24 h\nConseil et accompagnement\nIntervention rapide\nPaiement MoMo accepté",
      menuLabel: "Photos des offres ou tarifs", menuHint: "Brochure, catalogue, grille de prix.",
      placeLabel: "Photos de vos réalisations", placeHint: "Facultatif, mais ça rassure.", scheduleHint: "Quand peut-on vous joindre ?",
    },
  },
];

export const DEFAULT_SECTOR = SECTORS[0];

export function sectorById(id: string | undefined | null): Sector {
  return SECTORS.find((s) => s.id === id) ?? DEFAULT_SECTOR;
}
