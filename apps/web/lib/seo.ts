import type { Metadata } from "next";
import { SITE, SITE_URL } from "./site";

export const OG_IMAGE = { url: "/og-image.png", width: 1200, height: 630, alt: "Moncode — pages digitales et QR codes" };

/**
 * Métadonnées complètes d'une page publique. Next ne fusionne pas `openGraph` d'une page
 * avec celui du layout : sans l'image ici, WhatsApp et Facebook n'afficheraient pas de visuel.
 */
export function pageMetadata({ title, description, path, noindex = false }: { title: string; description: string; path: string; noindex?: boolean }): Metadata {
  const fullTitle = `${title} · ${SITE.name}`;
  return {
    title,
    description,
    alternates: { canonical: path, languages: { "fr": path, "x-default": path } },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: { type: "website", locale: SITE.locale, siteName: SITE.name, url: path, title: fullTitle, description, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [OG_IMAGE.url] },
  };
}

/** Fil d'Ariane pour Google : [nom, chemin] de l'accueil à la page courante. */
export function breadcrumbJsonLd(items: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE_URL}${path === "/" ? "" : path}` })),
  };
}

export function faqJsonLd(faq: readonly (readonly [string, string])[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

/** Sérialisation sûre pour une balise script JSON-LD. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
