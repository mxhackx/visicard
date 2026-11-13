"use client";

/**
 * Petit script d'avant-affichage : si l'animation d'accueil a déjà été vue pendant cette session
 * (`?intro` dans l'adresse pour la revoir), la page est marquée `intro-seen` avant le premier rendu (pas de clignotement).
 * Rendu uniquement côté serveur : React 19 refuse les balises <script> rendues côté navigateur.
 */
const CODE =
  "try{if(sessionStorage.getItem('moncode-intro')&&!/[?&]intro\\b/.test(location.search))document.documentElement.classList.add('intro-seen')}catch(e){}";

export default function IntroScript() {
  if (typeof window !== "undefined") return null;
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: CODE }} />;
}
