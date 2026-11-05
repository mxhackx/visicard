/**
 * Règles de saisie communes aux formulaires. Elles reprennent celles de l'API
 * (apps/api/src/orders/content-rules.ts et cards/card-files.ts) : une erreur
 * est signalée dans le formulaire, jamais découverte après l'envoi.
 */

export const LIMITS = {
  name: 90,
  address: 200,
  info: 2000,
  title: 90,
  menuPhotos: 8,
  placePhotos: 8,
  /** Logo + menu + lieu, par envoi. */
  totalFiles: 12,
  /** Images de page (converties en WebP côté serveur). */
  imageMb: 15,
  /** Image, vidéo ou PDF des QR médias / documents. */
  fileMb: 32,
};

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

const HTTP = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export function isHttpUrl(value: string): boolean {
  return HTTP.test(value.trim());
}

/** « instagram.com/moncode » → « https://instagram.com/moncode » ; le reste est laissé tel quel. */
export function normalizeUrl(value: string): string {
  const v = value.trim();
  if (!v || /^https?:\/\//i.test(v)) return v;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(v) || v.startsWith("www.")) return `https://${v}`;
  return v;
}

export function phoneDigits(value: string): number {
  return value.replace(/\D/g, "").length;
}

/** Message d'erreur pour une image, ou null si elle est acceptée. */
export function imageError(file: File): string | null {
  if (file.type === "image/heic" || file.type === "image/heif" || /\.hei[cf]$/i.test(file.name)) {
    return `« ${file.name} » est au format HEIC (iPhone) : exportez-la en JPG ou PNG.`;
  }
  if (!IMAGE_TYPES.includes(file.type)) return `« ${file.name} » n’est pas une image JPG, PNG ou WEBP.`;
  if (file.size > LIMITS.imageMb * 1024 * 1024) return `« ${file.name} » dépasse ${LIMITS.imageMb} Mo.`;
  return null;
}

/**
 * Filtre une sélection d'images : formats, poids, nombre maximum par groupe et
 * par envoi. Renvoie les fichiers retenus et un message pour les autres.
 */
export function pickImages(
  files: File[],
  { already, max, totalUsed }: { already: number; max: number; totalUsed: number },
): { accepted: File[]; message: string | null } {
  const messages: string[] = [];
  const valid = files.filter((f) => {
    const error = imageError(f);
    if (error) messages.push(error);
    return !error;
  });
  const room = Math.max(0, Math.min(max - already, LIMITS.totalFiles - totalUsed));
  const accepted = valid.slice(0, room);
  if (valid.length > room) {
    messages.push(
      room === 0
        ? `Limite atteinte : ${max} photos maximum ici, ${LIMITS.totalFiles} fichiers au total.`
        : `${valid.length - room} photo(s) non ajoutée(s) : ${max} maximum ici, ${LIMITS.totalFiles} fichiers au total.`,
    );
  }
  return { accepted, message: messages.length ? messages.join(" ") : null };
}
