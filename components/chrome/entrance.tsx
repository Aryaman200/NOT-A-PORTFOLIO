"use client";

import { useEffect } from "react";
import {
  ENTRANCE_KEY,
  ENTRANCE_MAX,
  ENTRANCE_MIN,
  TERRAIN_READY_EVENT,
} from "@/lib/entrance";

/**
 * Lifts the opening hold.
 *
 * The hold itself is set before paint by the inline script in the root layout —
 * see lib/entrance.ts for why it cannot be done from here. This component only
 * decides when it ends, which is the first moment all of these are true:
 *
 * - the display face has loaded, so the name does not re-flow as it appears
 * - the terrain has drawn a frame, so the writing rises over something
 * - `ENTRANCE_MIN` has passed, so the terrain gets a beat on its own
 *
 * …or `ENTRANCE_MAX` has passed, whichever comes first. The cap is not a
 * fallback for one failure case, it is the guarantee: no combination of blocked
 * fonts, slow WebGL init, missing WebGL, or an event that never fires can hold
 * the writing back longer than that.
 *
 * The curtain and its leading edge are rendered unconditionally and hidden by
 * CSS unless the hold is set. That is deliberate: deciding in JavaScript whether
 * to render them would mean either a hydration branch or a frame where the page
 * is visible before the curtain covers it, and the second one is the flash this
 * whole mechanism exists to avoid.
 *
 * Lifting the hold is a single attribute write rather than a state change, so
 * the hero is never re-rendered on the frame it is trying to animate. The
 * animation itself is entirely in globals.css.
 */
export function Entrance() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.entrance !== "holding") return;

    let done = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const release = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      window.removeEventListener(TERRAIN_READY_EVENT, onTerrain);
      root.dataset.entrance = "ready";
      try {
        sessionStorage.setItem(ENTRANCE_KEY, "1");
      } catch {
        // Storage blocked. The sequence still plays correctly; it will simply
        // play again on the next load, which is a far smaller problem than
        // failing to reveal the page.
      }
    };

    const started = performance.now();
    /** Never before the floor, never after the cap. */
    const releaseWhenSettled = () => {
      const elapsed = performance.now() - started;
      timers.push(setTimeout(release, Math.max(0, ENTRANCE_MIN - elapsed)));
    };

    let terrainReady = false;
    let fontsReady = false;

    const check = () => {
      if (terrainReady && fontsReady) releaseWhenSettled();
    };

    const onTerrain = () => {
      terrainReady = true;
      check();
    };
    window.addEventListener(TERRAIN_READY_EVENT, onTerrain, { once: true });

    // `document.fonts` is universally available in the browsers this site
    // targets, but the promise can reject if a face fails — a rejected font
    // load is not a reason to hold the page, so it resolves either way.
    document.fonts.ready.then(
      () => {
        fontsReady = true;
        check();
      },
      () => {
        fontsReady = true;
        check();
      },
    );

    timers.push(setTimeout(release, ENTRANCE_MAX));

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener(TERRAIN_READY_EVENT, onTerrain);
    };
  }, []);

  return (
    <>
      <div className="entrance-curtain" aria-hidden />
      <div className="entrance-edge" aria-hidden />
    </>
  );
}
