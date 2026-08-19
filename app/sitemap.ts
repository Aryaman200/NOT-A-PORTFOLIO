import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * One page.
 *
 * The projects live at fragments (`#gods-eye`) rather than routes, and sitemaps
 * do not address fragments, so listing them would be noise. If a project ever
 * gets its own route, it belongs here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date("2026-08-19"),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
