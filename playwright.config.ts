import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against a production build, not `next dev`.
 *
 * Dev recompiles per request, so timings are meaningless and the entrance cap
 * assertion in particular would be measuring Turbopack rather than the site.
 * `reuseExistingServer` keeps local runs fast; CI always builds fresh.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      // The site gates nearly every custom affordance on pointer and width, so
      // the phone case has to be exercised separately or it is never exercised.
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
    {
      // Reduced motion is not a variant of the desktop run — it takes different
      // code paths in eleven components, including ones that return early.
      name: "reduced-motion",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        reducedMotion: "reduce",
      },
    },
  ],

  webServer: {
    command: "npm run build && npx next start -p 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
