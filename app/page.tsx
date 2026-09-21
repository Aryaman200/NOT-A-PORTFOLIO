import { ViewTransition } from "react";
import { jsonLd, personSchema, projectListSchema } from "@/lib/structured-data";
import { TerrainBackdrop } from "@/components/lab/terrain-backdrop";
import { Entrance } from "@/components/chrome/entrance";
import { LiquidScroll } from "@/components/chrome/liquid-scroll";
import { SectionSettle } from "@/components/chrome/section-settle";
import { SiteHeader } from "@/components/chrome/site-header";
import { SiteFooter } from "@/components/chrome/site-footer";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { WorkIntro } from "@/components/sections/work-intro";
import { WorkChapters } from "@/components/sections/work-chapters";
import { Capabilities } from "@/components/sections/capabilities";
import { Path } from "@/components/sections/path";
import { Contact } from "@/components/sections/contact";

/**
 * The terrain is a viewport-fixed canvas behind the entire page. It dives with
 * the scroll through the first screen, then settles to a low ambient level and
 * keeps drifting — so the ground under the writing is the same live surface all
 * the way down rather than something that appears once and disappears.
 *
 * Lazy and client-only via TerrainBackdrop, so `three` stays off the critical
 * path. The page reads completely without it.
 */

export default function Home() {
  return (
    <>
      {/* Derived from lib/content.ts and lib/projects.ts, so it cannot drift
          from the visible copy — see lib/structured-data.ts. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(personSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(projectListSchema()) }}
      />

      <TerrainBackdrop />

      {/* Home only. The sequence is built on the terrain and the name, and a
          case study reached by a shared link has neither — nor any business
          putting a gate in front of itself. */}
      <Entrance />

      {/* One position system, not two. A fixed section index in the left
          gutter was built and removed: the rail already answers "how far", the
          command palette already answers "take me there", and a second fixed
          element on the opposite edge only answered "where" — at xl only, for a
          page whose section headings are large enough to answer it themselves.
          The rail's six marker dots stay deleted; they were sub-floor and had
          never painted. */}
      <LiquidScroll />
      <SectionSettle />
      <SiteHeader />

      {/* Directional slides, matching the wrapper on every /work/<slug> page.
          The terrain, the scroll rail and the header sit outside it on purpose:
          the terrain is a fixed backdrop that should not travel, and the header
          is anchored by name so the reader keeps one fixed reference while the
          content moves. See the nav-forward / nav-back rules in globals.css.

          No opaque wrapper inside. The sections are transparent so the terrain
          stays visible behind them; the dark chapters paint their own ground and
          cover it while they are open. */}
      <ViewTransition
        enter={{
          "nav-forward": "nav-forward",
          "nav-back": "nav-back",
          default: "none",
        }}
        exit={{
          "nav-forward": "nav-forward",
          "nav-back": "nav-back",
          default: "none",
        }}
        default="none"
      >
        {/* `id` is the target of the skip link and of the rail's
            `aria-controls`; `tabIndex={-1}` is what makes the skip link actually
            move focus rather than only move the viewport. */}
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          <Hero />
          <About />
          <WorkIntro />
          <WorkChapters />
          <Capabilities />
          <Path />
          <Contact />
        </main>

        <SiteFooter />
      </ViewTransition>
    </>
  );
}
