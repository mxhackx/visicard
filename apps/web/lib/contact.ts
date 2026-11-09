// Coordonnées centralisées : un seul endroit à modifier pour tout le site.
export const CONTACT = {
  brand: "Moncode",
  email: "contact@moncode.bj",
  whatsappNumber: "22999389202", // format wa.me : indicatif + numéro, sans espaces ni +
  whatsappDisplay: "+229 99 38 92 02",
  hours: "Lundi — vendredi, 9h — 18h",
  // À REMPLACER par l'adresse réelle : elle alimente la carte de la page contact.
  address: "Cotonou — Bénin",
  latitude: 6.3654,
  longitude: 2.4183,
} as const;


/** Carte OpenStreetMap intégrable, centrée sur les coordonnées ci-dessus (sans clé d'API). */
export function mapEmbedUrl(delta = 0.012): string {
  const { latitude: lat, longitude: lon } = CONTACT;
  const bbox = [lon - delta, lat - delta * 0.6, lon + delta, lat + delta * 0.6].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

/** Itinéraire dans l'application de cartes du visiteur. */
export function directionsUrl(): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${CONTACT.latitude},${CONTACT.longitude}`;
}

export const WHATSAPP_MESSAGE =
  "Bonjour Moncode, je souhaite des informations sur votre solution de QR codes.";

/** Nom lisible du moyen de paiement enregistré (les anciens prestataires restent dans l'historique). */
export function providerLabel(provider: string): string {
  return provider === "manuel" ? "WhatsApp" : provider;
}

export function whatsappUrl(message: string = WHATSAPP_MESSAGE): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
