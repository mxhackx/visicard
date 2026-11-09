import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, SITE, SITE_URL } from "@/lib/site";
import { EXAMPLE_IDS } from "@/lib/examples";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(SITE.updated);
  const url = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;
  return [
    ...PUBLIC_ROUTES.map((r) => ({ url: url(r.path), lastModified, changeFrequency: r.changeFrequency, priority: r.priority })),
    ...EXAMPLE_IDS.map((id) => ({ url: url(`/exemples/${id}`), lastModified, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
