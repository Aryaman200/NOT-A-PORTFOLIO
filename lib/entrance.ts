/**
 * The opening sequence's shared vocabulary.
 *
 * The page opens behind a bone curtain with the name already set behind it, and
 * a signal-coloured edge sweeps the curtain away to the right. Two pieces have
 * to agree on when that happens — the terrain, which knows when it has actually
 * drawn something, and the entrance controller, which lifts the hold — so the
 * contract lives here rather than in either of them.
 *
 * **Why this shape costs nothing at load.** The name is the LCP element. It is
 * covered during the hold, not hidden: a covered element has painted, so LCP
 * lands at first paint exactly as it did before the opening existed. A version
 * that faded the name in would not have painted it, and would have moved the
 * metric by the full length of the hold. The curtain is the version that buys
 * the sequence for free.
 *
 * `ENTRANCE_MAX` is still the guarantee that matters: whatever fails to load,
 * the curtain lifts by then. The floor and the cap are the whole safety
 * argument, so neither should grow without a reason.
 */

/** Fired on `window` by terrain-field the first time it renders a frame. */
export const TERRAIN_READY_EVENT = "terrain:first-frame";

/** ms — the curtain holds at least this long, so the lift is a gesture rather
 *  than a flicker on a fast connection. */
export const ENTRANCE_MIN = 650;

/**
 * ms — hard ceiling. A blocked font, a slow WebGL init or no WebGL at all must
 * never leave a reader looking at a blank bone screen.
 */
export const ENTRANCE_MAX = 1200;

/** sessionStorage key. Session rather than local so it replays for a returning
 *  visitor on a new visit, but not on every reload while they are reading. */
export const ENTRANCE_KEY = "entrance-played";

/**
 * Runs before first paint, inlined into the document head.
 *
 * It has to be a blocking inline script: setting the hold from a React effect
 * would paint the writing first and then hide it, which is a flash rather than
 * an entrance. Stringified rather than imported because it must not wait for a
 * bundle.
 *
 * Every condition here is a reason NOT to play it — off the home page, already
 * played this session, reduced motion, or storage unavailable. The hold is only
 * ever set when all of them pass, so the failure mode in every direction is a
 * page that simply shows its content.
 */
export const ENTRANCE_INLINE_SCRIPT = `
try {
  if (
    location.pathname === "/" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !sessionStorage.getItem(${JSON.stringify(ENTRANCE_KEY)})
  ) {
    document.documentElement.dataset.entrance = "holding";
  }
} catch (e) {}
`.trim();
