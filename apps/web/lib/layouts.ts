import type { LayoutId } from "./palette";

export interface LayoutOption {
  id: LayoutId;
  name: string;
  desc: string;
  /** Univers pour lequel le style a été pensé (affiché dans les exemples). */
  sector: string;
}

/** Les dispositions de page digitale, de la plus polyvalente à la plus spécialisée. */
export const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: "classic", name: "Classique", desc: "En-tête coloré, actions rapides, menu en grille", sector: "Polyvalent" },
  { id: "saas", name: "SaaS", desc: "Page produit : accroche, vitrine, appel à l’action", sector: "Services" },
  { id: "maps", name: "Couverture", desc: "Grande photo, logo rond, onglets", sector: "Polyvalent" },
  { id: "minimal", name: "Minimaliste", desc: "Typographique, centré, le menu avant tout", sector: "Polyvalent" },
  { id: "premium", name: "Avant-garde", desc: "Éditorial, grandes capitales, sections numérotées", sector: "Création" },
  { id: "exoticas", name: "Exoticas", desc: "Hero plein, galerie en verre, contact et carte", sector: "Restauration" },
  { id: "maquis", name: "Maquis", desc: "Enseigne jaune, ardoise de menu, ambiance conviviale", sector: "Restaurants et bars" },
  { id: "beaute", name: "Beauté", desc: "Arche, tons poudrés, lignes dorées", sector: "Salons et instituts" },
  { id: "boutique", name: "Boutique", desc: "Titre géant, mosaïque de photos, grille produits", sector: "Mode et boutiques" },
  { id: "hotel", name: "Hôtel", desc: "Vert profond, laiton, sobriété d’un établissement calme", sector: "Hôtels et résidences" },
  { id: "clinique", name: "Santé", desc: "Clair et rassurant, urgence en tête, repères nets", sector: "Cliniques et cabinets" },
  { id: "chantier", name: "Chantier", desc: "Acier, bandes de chantier, numéros d’allées", sector: "Quincailleries et artisans" },
  { id: "carte", name: "Carte de visite", desc: "Profil, appel, WhatsApp, contact à enregistrer et partage", sector: "Indépendants et équipes" },
];
