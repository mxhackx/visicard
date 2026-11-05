/**
 * Adresse du backend (API NestJS), lue depuis NEXT_PUBLIC_API_URL.
 *
 * Variable « NEXT_PUBLIC » : elle est figée dans le code au moment du build.
 * Après l'avoir changée en production, il faut donc rebâtir le site.
 * Sans valeur, on retombe sur l'API locale (développement uniquement).
 */
const LOCAL_API = "http://localhost:5500";

const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!fromEnv && process.env.NODE_ENV === "production") {
  console.warn("NEXT_PUBLIC_API_URL n'est pas définie : le site appelle " + LOCAL_API + ".");
}

/** Sans barre finale : `${API_URL}/cards` ne produit jamais `//cards`. */
const withScheme = (url: string) =>
  /^https?:\/\//i.test(url) ? url : `${url.startsWith("localhost") ? "http" : "https"}://${url}`;

export const API_URL = withScheme(fromEnv || LOCAL_API).replace(/\/+$/, "");
