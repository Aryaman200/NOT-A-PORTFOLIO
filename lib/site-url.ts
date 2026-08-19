/**
 * Canonical origin, in one place.
 *
 * `NEXT_PUBLIC_SITE_URL` should be set in the deploy environment. The fallback
 * only matters for local builds; if it ships to production the sitemap and OG
 * tags would point at the wrong host, which is why it is a single constant
 * rather than repeated at each call site.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://aryamanbhardwaj.vercel.app";
