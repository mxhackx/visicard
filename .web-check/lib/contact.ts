// Coordonnées centralisées : un seul endroit à modifier pour tout le site.
export const CONTACT = {
  brand: "Moncode",
  email: "contact@moncode.app",
  whatsappNumber: "33123456789", // affiché tel quel, sans espaces
  whatsappDisplay: "+33 1 23 45 67 89",
  hours: "Lundi — vendredi, 9h — 18h",
} as const;

export const WHATSAPP_MESSAGE =
  "Bonjour Moncode, je souhaite des informations sur votre solution de menu digital.";

export function whatsappUrl(message: string = WHATSAPP_MESSAGE): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
