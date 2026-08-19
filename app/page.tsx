import { TerrainBackdrop } from "@/components/lab/terrain-backdrop";
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

      <LiquidScroll />
      <SectionSettle />
      <SiteHeader />

      {/* No opaque wrapper. The sections are transparent so the terrain stays
          visible behind them; the dark chapters paint their own ground and
          cover it while they are open. */}
      <main className="flex-1">
        <Hero />
        <About />
        <WorkIntro />
        <WorkChapters />
        <Capabilities />
        <Path />
        <Contact />
      </main>

      <SiteFooter />
    </>
  );
}
