"use client";

import { useEffect } from "react";

/**
 * Révèle les éléments portant `data-reveal` à l'entrée dans le viewport.
 * Le contenu reste visible si le JavaScript ne prend pas le relais.
 */
export default function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const show = (element: Element) => element.classList.add("in");
    const showVisible = () =>
      targets.forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight * 0.94) {
          show(element);
        }
      });

    showVisible();

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

      targets.forEach((element) => observer?.observe(element));
    }

    const fallback = window.setTimeout(() => targets.forEach(show), 2500);

    return () => {
      observer?.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}
