"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Révèle les éléments portant `data-reveal` à l'entrée dans le viewport.
 *
 * Il se relance à chaque changement de page (navigation sans rechargement) et
 * surveille aussi les blocs ajoutés après coup (sections chargées côté client) :
 * sans cela, un bloc inséré après le premier chargement resterait invisible.
 * Le contenu reste visible si le JavaScript ne prend pas le relais.
 */
export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("js");

    const show = (element: Element) => element.classList.add("in");
    const seen = new WeakSet<Element>();
    let observer: IntersectionObserver | null = null;

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              show(entry.target);
              observer?.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
      );
    }

    /** Prend en charge tout `[data-reveal]` pas encore traité. */
    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.in)").forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        if (element.getBoundingClientRect().top < window.innerHeight * 0.94) show(element);
        else observer?.observe(element);
      });
    };

    scan();

    let frame = 0;
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    // Filet de sécurité : rien ne doit rester invisible si l'observateur ne se déclenche pas.
    const fallback = window.setTimeout(() => {
      document.querySelectorAll("[data-reveal]:not(.in)").forEach(show);
    }, 2500);

    return () => {
      observer?.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
    };
  }, [pathname]);

  return null;
}
