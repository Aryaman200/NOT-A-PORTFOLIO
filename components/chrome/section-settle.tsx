"use client";

import { useEffect } from "react";
import { useReducedMotion } from "motion/react";
import { RAIL_SCRUB_EVENT } from "./liquid-scroll";

/**
 * Light settling onto section starts.
 *
 * CSS `scroll-snap-type: y proximity` was tried first and removed: the
 * proximity threshold is chosen by the browser and is not author-adjustable,
 * and measured from 100px out it pulled the page a total of four pixels. Real
 * but imperceptible.
 *
 * This is the same intent, made tunable — and deliberately built so it cannot
 * become scroll-jacking:
 *
 * - It only runs **after** the reader has already stopped (120ms of quiet).
 *   Nothing is intercepted while a scroll is in progress; no wheel, touch or
 *   key handler ever calls preventDefault.
 * - It only acts within `REACH` of a section start. Stop anywhere else and
 *   nothing happens at all.
 * - Any new input — wheel, touch, key, or a pointer press on the scroll rail —
 *   abandons the settle immediately, mid-flight.
 * - Under `prefers-reduced-motion` it does not run.
 *
 * The result is that the page comes to rest on a section edge when you were
 * nearly there anyway, and never fights you when you were not.
 */

/** px — how near a section start the reader must stop for settling to engage */
const REACH = 150;
/** px — below this the correction is not worth animating */
const DEADZONE = 3;
/** ms of no scrolling before settling begins */
const QUIET = 120;
const DURATION = 460;
/**
 * ms the settle stands down for after a scroll-rail keypress. Comfortably
 * longer than `QUIET`, so the scroll caused by the scrub cannot re-arm it.
 */
const SUPPRESS = 600;

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function SectionSettle() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    let quietTimer: ReturnType<typeof setTimeout>;
    let frame = 0;
    let animating = false;
    /** performance.now() before which settling is refused — see `standDown`. */
    let suppressUntil = 0;

    const cancel = () => {
      if (!animating) return;
      animating = false;
      cancelAnimationFrame(frame);
    };

    const settle = () => {
      if (animating) return;
      if (performance.now() < suppressUntil) return;

      // scroll-mt on the sections is 3rem; match it so the settle lands where a
      // jump from the header or the palette would.
      const offset = 48;
      const sections = [
        ...document.querySelectorAll<HTMLElement>("main > section[id]"),
      ];
      if (!sections.length) return;

      // Anchors are clamped into the reachable scroll range before they are
      // measured against. The first section starts at offsetTop 0, so its raw
      // anchor is -48 — a position that cannot be scrolled to. Unclamped, that
      // read as a 48px correction whenever the reader was resting at the top of
      // the page, so every stop there started a full 460ms animation toward an
      // impossible target: invisible, because the browser clamps each write back
      // to 0, but it still ran rAF and still overrode any other scrolling for
      // the duration. The last section has the same problem against the bottom.
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const current = window.scrollY;
      let best = Infinity;
      for (const section of sections) {
        const anchor = Math.max(
          0,
          Math.min(maxScroll, section.offsetTop - offset),
        );
        const delta = anchor - current;
        if (Math.abs(delta) < Math.abs(best)) best = delta;
      }

      if (Math.abs(best) > REACH || Math.abs(best) < DEADZONE) return;

      const from = current;
      const start = performance.now();
      animating = true;

      const step = (now: number) => {
        if (!animating) return;
        const t = Math.min(1, (now - start) / DURATION);
        // `behavior: "instant"` is load-bearing, not a default being spelled
        // out. `html` carries `scroll-behavior: smooth` for anchor navigation,
        // and the two-argument `window.scrollTo(x, y)` obeys that property — it
        // hands the movement to the browser's own smooth animator rather than
        // jumping. Called once per frame, each call restarted that animator from
        // zero progress, so the easing below never actually ran and the page
        // moved a measured 0px per frame. Opting this loop out lets it own the
        // motion; anchor links keep their smooth scroll.
        window.scrollTo({
          top: from + best * easeOutExpo(t),
          behavior: "instant",
        });
        if (t < 1) frame = requestAnimationFrame(step);
        else animating = false;
      };
      frame = requestAnimationFrame(step);
    };

    const onScroll = () => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(settle, QUIET);
    };

    const abort = () => {
      cancel();
      clearTimeout(quietTimer);
      quietTimer = setTimeout(settle, QUIET);
    };

    /**
     * A scroll-rail keypress suppresses the settle for a window.
     *
     * Clearing the pending timer is not enough, and measurably so: an arrow
     * press scrolled 2px and was pulled straight back to 0, because the scroll
     * the scrub *itself* causes fires `onScroll`, which arms a fresh settle
     * 120ms later. The scrub was being undone by its own side effect, and a
     * second press then did nothing at all because it was already at the
     * section edge being dragged to.
     *
     * So the rail marks a deadline instead, and each keypress extends it — which
     * also covers a held arrow key, where scroll events arrive continuously.
     */
    const standDown = () => {
      suppressUntil = performance.now() + SUPPRESS;
      cancel();
      clearTimeout(quietTimer);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", abort, { passive: true });
    window.addEventListener("touchstart", abort, { passive: true });
    window.addEventListener("keydown", abort);
    window.addEventListener("pointerdown", abort);
    window.addEventListener(RAIL_SCRUB_EVENT, standDown);

    return () => {
      cancel();
      clearTimeout(quietTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", abort);
      window.removeEventListener("touchstart", abort);
      window.removeEventListener("keydown", abort);
      window.removeEventListener("pointerdown", abort);
      window.removeEventListener(RAIL_SCRUB_EVENT, standDown);
    };
  }, [reduceMotion]);

  return null;
}
