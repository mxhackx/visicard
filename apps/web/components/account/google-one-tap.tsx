"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { loginWithGoogle } from "@/lib/account";
import { GOOGLE_CLIENT_ID, loadGoogle, onGoogleCredential } from "@/lib/google-gsi";
import { useFile } from "@/app/context/FileContext";

/**
 * Fenêtre contextuelle « Se connecter avec Google » de Chrome (One Tap), proposée aux visiteurs non connectés.
 * Jamais sur l'administration ni sur les pages de connexion (qui ont déjà leur bouton). Google gère lui-même
 * le délai de réapparition après un refus.
 */
export default function GoogleOneTap() {
  const { authToken, loginSession } = useFile();
  const pathname = usePathname();
  const login = useRef(loginSession);
  const prompted = useRef(false);
  useEffect(() => {
    login.current = loginSession;
  });

  const blocked = pathname.startsWith("/admin") || pathname.startsWith("/connexion") || pathname.startsWith("/c/");

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || authToken || blocked) return;
    let alive = true;
    let timer = 0;
    const off = onGoogleCredential(async (credential) => {
      try {
        const s = await loginWithGoogle(credential);
        login.current(s.access_token, s.user.role, { id: s.user.id, email: s.user.email, name: s.user.name, picture: s.user.picture, phone: s.user.phone }, s.refresh_token);
      } catch {
        /* la personne peut réessayer avec le bouton de la page de connexion */
      }
    });
    // Après l'animation d'accueil et le premier affichage : la fenêtre ne doit pas voler la vedette.
    timer = window.setTimeout(() => {
      loadGoogle().then((g) => {
        if (!alive || !g) return;
        prompted.current = true;
        g.prompt();
      });
    }, 3200);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      off();
    };
  }, [authToken, blocked]);

  // La fenêtre n'est retirée que lorsqu'elle n'a plus lieu d'être (connecté, ou page sans One Tap) : annuler à chaque
  // changement de page interrompait la requête FedCM de Chrome (erreur « AbortError » dans la console).
  useEffect(() => {
    if ((authToken || blocked) && prompted.current) {
      prompted.current = false;
      window.google?.accounts?.id.cancel();
    }
  }, [authToken, blocked]);

  return null;
}
