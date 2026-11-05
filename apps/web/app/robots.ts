import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Espaces privés exclus du référencement ; les pages publiques des clients (/c/…) restent indexables. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/commande", "/creer/page"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
