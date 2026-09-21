import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { projectSlugs } from "@/lib/projects";

/**
 * The home page plus one route per case study.
 *
 * The chapters still have fragments (`#gods-eye`) and sitemaps do not address
 * fragments, so those are not listed — the route is the addressable thing now.
 * Cases sit below the home page in priority because the home page is the
 * argument and they are its evidence, but they are the pages worth indexing
 * individually: they are the only ones with enough prose to rank on anything.
 *
 * `lastModified` is the build time, not a written-down date. It used to be a
 * hardcoded `new Date("2026-08-19")`, which was false the day after it was
 * typed and stayed false — a date that only moves when someone remembers to
 * move it is worse than no date, because a crawler believes it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...projectSlugs.map((slug) => ({
      url: `${SITE_URL}/work/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
