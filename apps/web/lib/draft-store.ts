/**
 * Brouillon conservé en mémoire entre la page de création et la page de paiement : une navigation interne ne recharge pas le site,
 * donc un fichier choisi (image, vidéo, PDF) reste disponible au retour. Un rechargement complet l'efface.
 */
export const draftStore: { mediaFile: File | null; mediaTitle: string } = { mediaFile: null, mediaTitle: "" };
