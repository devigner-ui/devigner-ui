import type { MetadataRoute } from "next";
import { SITE_URL, getCatalog } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries = getCatalog();
  const newest = entries[0]?.addedAt;
  return [
    { url: SITE_URL, lastModified: newest },
    { url: `${SITE_URL}/components`, lastModified: newest },
    { url: `${SITE_URL}/requests` },
    ...entries.map((e) => ({ url: `${SITE_URL}/components/${e.slug}`, lastModified: e.addedAt })),
  ];
}
