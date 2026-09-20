import { ViewTransition } from "react";
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
      <TerrainBackdrop />

      {/* Home only. The sequence is built on the terrain and the name, and a
          case study reached by a shared link has neither — nor any business
          putting a gate in front of itself. */}
      <Entrance />

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
