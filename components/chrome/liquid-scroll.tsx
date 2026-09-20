"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useReducedMotion } from "motion/react";
import { gooFloor, gooMatrix, type GooFilter } from "@/lib/goo";

/**
 * The scrollbar, replaced by a small liquid.
 *
 * Three droplets run a chain: the first chases the scroll position, and each
 * one after it chases the droplet ahead. Under a slow scroll they sit on top of
 * one another and read as a single body. Under a fast one the chain strings out
 * into two or three distinct blobs, then they catch up, collide, overshoot and
 * merge back — and the collision throws a short splash of satellites.
 *
 * All of it is drawn into one SVG group under `feGaussianBlur` plus a
 * high-contrast `feColorMatrix`. The blur spreads each shape's alpha and the
 * matrix slams the midtones to 0 or 1, so overlapping falloffs weld into a
 * single form with a tapered neck while separated ones cleanly break apart. The
 * shapes are only circles; every bit of the surface tension is the filter.
 *
 * The filter is also what sets the tuning targets, and those can be solved for
 * rather than guessed at. The matrix maps alpha `a` to `26a - 12`, so the
 * rendered surface is the `a ≈ 0.46` isocontour. For two blurred discs of
 * radius `r` at centre distance `d`, midpoint alpha is `erfc((d/2 - r) / (σ√2))`,
 * which crosses 0.46 at `d ≈ 2r + 4.8`. With `r` between 4.3 and 6.2 that puts
 * the neck break at a 13–17px gap: under ~20px of total chain spread the three
 * read as one body, and past ~35px all three are visibly separate. Every
 * constant below was tuned against those two numbers rather than by eye.
 *
 * That derivation answered where two discs *weld*. It never asked where one
 * disc stops rendering at all, and the answer — 3.78px here — sat above the old
 * `MIN_R` of 3.6. So the tail was being drawn under the threshold and silently
 * disappearing during any quick scroll, which looked like a dropped frame
 * rather than the arithmetic error it was. `FLOOR_R` below closes that, and
 * lib/goo.ts derives it from this same filter so the two cannot drift apart.
 *
 * Why a hand-rolled loop rather than springs: two `useSpring`s tuned to
 * different stiffnesses look like they should diverge, but they converge within
 * a frame or two of each other — measured, the gap never exceeded a single
 * pixel, so there was no visible liquid at all. A chain with explicit
 * per-droplet pull, low damping and mass transfer gives separation, catch-up
 * and overshoot, none of which a spring on a shared source can express.
 *
 * Volume is roughly conserved: as the chain strings out each droplet shrinks,
 * and they return to full radius as it closes. Hiding a native scrollbar costs
 * drag-to-scrub, so the rail takes pointer input and scrubs.
 */

const RAIL_PAD = 0.08;
const CX = 14;

/**
 * Per-droplet pull toward the one ahead. Lower = laggier = more separation.
 *
 * These are deliberately weak. The rail is ~340px against a ~13,000px page, so
 * the lead droplet only moves a couple of pixels per frame even during a hard
 * flick; the spread has to come from the tail lagging many frames behind the
 * lead, not from anything moving fast. A pull of 0.026 is a ~38-frame time
 * constant, which turns 2px/frame of lead motion into tens of pixels of chain.
 *
 * An earlier version instead injected the scroll delta into the lead as an
 * amplified impulse. That is what made the effect read as broken: nothing
 * bounded how many frames of impulse could accumulate, so a sustained flick
 * integrated to a measured 267px of spread on a 340px rail — the droplets
 * simply hit the ends and rattled, and even a gentle scroll opened to 30px.
 * Position-chasing with a laggy tail needs no amplification at all.
 */
const PULL = [0.12, 0.038, 0.02];
/** Low damping keeps it runny and lets it overshoot on catch-up. */
const DAMPING = 0.88;

/**
 * Lateral sway. Liquid running down a surface does not travel a straight line,
 * and a chain locked to one axis reads as beads on a wire however well the
 * vertical physics behaves. Each droplet swings off-axis as it moves, with the
 * sign alternating by index so the chain snakes rather than drifting bodily to
 * one side. Its own spring returns it to centre at rest.
 */
const SWAY = 3.2;
const SWAY_PULL = 0.16;
const SWAY_DAMP = 0.86;
/**
 * Velocity that counts as "full" deformation, for both sway and squash.
 *
 * Both are driven through `sqrt(v / VREF)` rather than `v / VREF`. A linear
 * response is dominated by the top of the range: the lead droplet moves ~7px
 * per frame during a flick but only ~0.5px during an ordinary scroll, so linear
 * scaling gave everyday scrolling 7% of the available deformation — arithmetically
 * present, visually nothing. The square root lifts that to ~27% while leaving
 * the top of the range untouched.
 */
const VREF = 7;

/**
 * Ambient surface motion, in px and radians/sec.
 *
 * Standing still, a real body of liquid is not geometrically static. Without
 * this the blob is a perfectly circular dot whenever the page is not moving,
 * which is the single biggest tell that it is a widget rather than a substance.
 * The amplitudes are deliberately near the threshold of notice, and they fade
 * out as the droplet picks up speed so they never fight the physics.
 */
const IDLE_SWAY = 0.9;
const IDLE_SWELL = 0.05;
const IDLE_HZ = 1.1;
const IDLE_HZ_2 = 0.7;
/**
 * Surface tension. Past `KNEE` of stretch an extra restoring force ramps in, so
 * the chain resists opening further the more it is already open.
 */
const TENSION = 0.04;
const KNEE = 26;
/**
 * Hard ceiling on the gap between consecutive droplets — a ligament that cannot
 * stretch past its break length. This is the runaway guard: total spread can
 * never exceed `2 × LINK` whatever the input. Holding a key to scroll to the
 * bottom opens the chain to ~115px without it, 56px with it.
 */
const LINK = 28;

/**
 * This liquid's filter — thin and runny, where the pointer's is thick.
 *
 * The header's isocontour maths is the same maths lib/goo.ts derives the
 * visibility floor from, so the two are now one source rather than a comment
 * and a separately-tuned literal.
 */
const GOO: GooFilter = { sigma: 3.4, slope: 26, offset: 12 };

/**
 * The radius below which a droplet does not render at all.
 *
 * This file's header works out where two blurred discs weld; it never worked
 * out where a *single* disc stops being visible. It is 3.78px here, and `MIN_R`
 * was 3.6 — under the floor. With the mass shift and the squash on top, the
 * tail reached an effective 1.4px, so the chain silently lost droplets during
 * any fast scroll. Everything below is clamped to this.
 */
const FLOOR_R = gooFloor(GOO);

const BASE_R = 6.2;
/** Was 3.6, which was beneath `FLOOR_R`. Raised to sit just clear of it. */
const MIN_R = Math.max(4.3, FLOOR_R);
/**
 * How much mass shifts to the lead as the chain opens. Was 0.45, which took the
 * tail another 30% under an already-marginal radius.
 */
const MASS_SHIFT = 0.2;
/** px of chain spread at which droplets reach their smallest radius */
const FULL_SPREAD = 46;
/** Frames of quiet after a splash before another can fire. */
const SPLASH_COOLDOWN = 26;

/**
 * Fired by the rail when a key scrubs the page.
 *
 * SectionSettle aborts on any `keydown` and then re-arms 120ms later, so
 * without this an arrow press on the rail would be cancelled *and then dragged
 * back* to the nearest section start — the scrub silently undone rather than
 * merely interrupted. The settle listens for this and stands down instead.
 */
export const RAIL_SCRUB_EVENT = "rail:scrub";

const scrollMax = () =>
  document.documentElement.scrollHeight - window.innerHeight;

type Droplet = { y: number; vy: number; r: number; x: number; vx: number };
type Splash = { y: number; dir: number; life: number };

export function LiquidScroll() {
  const reduceMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const [height, setHeight] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const measure = () => setHeight(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const group = groupRef.current;
    if (!group || !height || reduceMotion) return;

    const span = height * (1 - RAIL_PAD * 2);
    const top = height * RAIL_PAD;

    // Selected by index rather than taken in document order. The circles are
    // emitted tail-first so the lead paints on top, which makes document order
    // the reverse of droplet order — indexing the NodeList wrote droplet 0's
    // physics into the circle labelled 2. They are the same colour and merge
    // under the filter, so it never looked wrong; it was only wrong, and it
    // made every `data-blob` value a lie to anyone debugging this.
    const blobs = PULL.map((_, i) =>
      group.querySelector<SVGCircleElement>(`[data-blob="${i}"]`),
    );
    if (blobs.some((b) => !b)) return;
    const sparks = group.querySelectorAll<SVGCircleElement>("[data-spark]");

    const droplets: Droplet[] = PULL.map(() => ({
      y: top,
      vy: 0,
      r: BASE_R,
      x: 0,
      vx: 0,
    }));
    let splashes: Splash[] = [];
    let previousSpread = 0;
    let cooldown = 0;
    let frame = 0;

    const targetY = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      return top + progress * span;
    };

    // Seed at the current position so it does not fly in from the top on load.
    const seed = targetY();
    for (const d of droplets) d.y = seed;

    const tick = (now: number) => {
      const target = targetY();
      const t = now / 1000;

      for (let i = 0; i < droplets.length; i++) {
        const d = droplets[i];
        const goal = i === 0 ? target : droplets[i - 1].y;
        const gap = goal - d.y;

        // Linear pull, plus tension that only engages once already stretched.
        const over = Math.max(0, Math.abs(gap) - KNEE);
        d.vy += gap * PULL[i] + Math.sign(gap) * over * TENSION;
        d.vy *= DAMPING;
        d.y += d.vy;

        // The ligament cannot exceed its break length.
        const after = goal - d.y;
        if (Math.abs(after) > LINK) d.y = goal - Math.sign(after) * LINK;

        // Soft walls, so a hard flick cannot throw a droplet off the rail.
        const lo = top - 8;
        const hi = top + span + 8;
        if (d.y < lo) {
          d.y = lo;
          d.vy *= -0.35;
        } else if (d.y > hi) {
          d.y = hi;
          d.vy *= -0.35;
        }

        // Lateral. `speed` is the shared sqrt-shaped 0..1 response; `calm` is
        // its complement, so ambient motion owns the droplet at rest and hands
        // over to the physics as it accelerates.
        const speed = Math.min(1, Math.sqrt(Math.abs(d.vy) / VREF));
        const calm = 1 - Math.min(1, Math.abs(d.vy) / 2.5);
        const swing = (i % 2 ? -1 : 1) * SWAY * speed;
        const drift = Math.sin(t * IDLE_HZ + i * 2.1) * IDLE_SWAY * calm;
        d.vx += (swing + drift - d.x) * SWAY_PULL;
        d.vx *= SWAY_DAMP;
        d.x += d.vx;
      }

      const spread = Math.abs(droplets[droplets.length - 1].y - droplets[0].y);

      // A collapse of the chain after it had opened up is an impact — splash.
      // The cooldown keeps the rebound oscillations from each firing their own;
      // without it a single flick threw four separate splashes as it rang down.
      const closing = previousSpread - spread;
      if (cooldown > 0) cooldown--;
      if (spread < 18 && closing > 2.4 && cooldown === 0) {
        const at = (droplets[0].y + droplets[1].y) / 2;
        splashes = [
          { y: at, dir: -1, life: 1 },
          { y: at, dir: 1, life: 1 },
        ];
        cooldown = SPLASH_COOLDOWN;
      }
      previousSpread = spread;

      const openness = Math.min(1, spread / FULL_SPREAD);
      for (let i = 0; i < droplets.length; i++) {
        const d = droplets[i];
        // Mass shifts to the lead as the chain opens, so the tail thins first.
        const share = 1 - (i / droplets.length) * MASS_SHIFT * openness;
        // Ambient swell, on a slower period than the drift so the two never
        // line up into an obvious loop.
        const calm = 1 - Math.min(1, Math.abs(d.vy) / 2.5);
        const swell = 1 + Math.sin(t * IDLE_HZ_2 + i * 1.3) * IDLE_SWELL * calm;
        // Floored: no combination of openness, mass shift and swell may take a
        // droplet under the filter's visibility threshold.
        d.r = Math.max(
          FLOOR_R,
          (BASE_R - (BASE_R - MIN_R) * openness) * share * swell,
        );
      }

      for (let i = 0; i < blobs.length; i++) {
        // Non-null: the guard above returned early if any were missing.
        const blob = blobs[i]!;
        const d = droplets[i];
        // Squash across the axis of travel, so a moving droplet reads as
        // deforming rather than merely sliding. Same sqrt response as the sway,
        // and for the same reason: an earlier linear `|vy| / 46` was tuned
        // against page-scroll velocity rather than droplet velocity, so ordinary
        // scrolling produced a few percent of stretch and looked like nothing.
        // Clamped: the across-axis may not take the droplet under `FLOOR_R`.
        // Unclamped, `1 - squash` reached 0.55 and flattened even a full-size
        // droplet to 3.4px — below the 3.78px this filter can render.
        const squash = 0.45 * Math.min(1, Math.sqrt(Math.abs(d.vy) / VREF));
        const across = Math.max(1 - squash, FLOOR_R / d.r);
        const sx = across.toFixed(3);
        const sy = (1 + (1 - across) * 1.6).toFixed(3);
        const x = CX + d.x;
        const y = d.y;
        blob.setAttribute("cx", x.toFixed(2));
        blob.setAttribute("cy", y.toFixed(2));
        blob.setAttribute("r", d.r.toFixed(2));
        blob.setAttribute(
          "transform",
          `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${sx} ${sy}) translate(${(-x).toFixed(2)} ${(-y).toFixed(2)})`,
        );
      }

      splashes = splashes.filter((s) => s.life > 0);
      for (let i = 0; i < sparks.length; i++) {
        const s = splashes[i];
        if (!s) {
          sparks[i].setAttribute("r", "0");
          continue;
        }
        s.life -= 0.06;
        const out = (1 - s.life) * 7;
        sparks[i].setAttribute("cx", (CX + s.dir * out).toFixed(2));
        sparks[i].setAttribute("cy", (s.y - out * 0.5).toFixed(2));
        sparks[i].setAttribute("r", (2.5 * Math.max(0, s.life)).toFixed(2));
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [height, reduceMotion]);

  /**
   * Keep the reported position current.
   *
   * Written straight to the DOM rather than held in state: a re-render resets
   * every circle to the `cx`/`cy`/`r` in the JSX, and the droplet loop only
   * repairs that on the next frame — so a state update per scroll percent would
   * strobe the liquid a hundred times down the page. This runs regardless of
   * `reduceMotion`, because the value has to be right even when the droplets
   * are not moving.
   */
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    let frame = 0;
    const report = () => {
      frame = 0;
      const max = scrollMax();
      const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
      el.setAttribute("aria-valuenow", String(pct));
      el.setAttribute("aria-valuetext", `${pct}% through the page`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(report);
    };

    report();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const el = railRef.current;
    if (!el) return;

    const scrubTo = (clientY: number) => {
      const rect = el.getBoundingClientRect();
      const raw =
        (clientY - rect.top - rect.height * RAIL_PAD) /
        (rect.height * (1 - RAIL_PAD * 2));
      const clamped = Math.max(0, Math.min(1, raw));
      window.scrollTo({ top: clamped * scrollMax(), behavior: "instant" });
    };

    const onMove = (event: PointerEvent) => scrubTo(event.clientY);
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging]);

  /**
   * Keyboard scrubbing.
   *
   * Dragging was the only way to operate this rail, which fails WCAG 2.2
   * SC 2.5.7 (Dragging Movements) outright — the criterion asks for a
   * single-pointer or keyboard alternative to every drag, and there was none.
   *
   * `data-rail-key` is set on the event so SectionSettle can tell a rail scrub
   * from an ordinary key press. Without it the settle aborts on keydown and then
   * re-arms 120ms later, so every arrow press would be quietly dragged back to
   * the nearest section start — not merely cancelled, actively undone.
   */
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const max = scrollMax();
    if (max <= 0) return;

    const page = window.innerHeight * 0.9;
    const step = window.innerHeight * 0.15;
    const moves: Record<string, number | "start" | "end"> = {
      ArrowDown: step,
      ArrowUp: -step,
      PageDown: page,
      PageUp: -page,
      Home: "start",
      End: "end",
    };
    const move = moves[event.key];
    if (move === undefined) return;

    event.preventDefault();
    const target =
      move === "start"
        ? 0
        : move === "end"
          ? max
          : Math.max(0, Math.min(max, window.scrollY + move));
    window.dispatchEvent(new CustomEvent(RAIL_SCRUB_EVENT));
    window.scrollTo({ top: target, behavior: "instant" });
  };

  // Geometry for the static parts of the rail. `railTop` is spelled out rather
  // than named `top`: a bare `top` resolves to `window.top` at module scope, so
  // deleting the local silently type-checks against the wrong thing.
  const span = height * (1 - RAIL_PAD * 2);
  const railTop = height * RAIL_PAD;


  return (
    <div
      ref={railRef}
      // A real control, not decoration. It was `aria-hidden` while being the
      // page's only scroll affordance, so assistive tech was told to ignore the
      // one thing that could move the document.
      role="scrollbar"
      aria-label="Page scroll"
      aria-orientation="vertical"
      aria-controls="main"
      aria-valuemin={0}
      aria-valuemax={100}
      // Both kept current imperatively — see the effect above.
      aria-valuenow={0}
      tabIndex={0}
      onKeyDown={onKeyDown}
      // The rail is the least discoverable control on the page — a shape with
      // no affordance until you happen to press it. The label is the fix.
      data-cursor="Drag"
      onPointerDown={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      className="rail fixed top-1/2 right-1 z-40 hidden h-[42vh] w-7 -translate-y-1/2 cursor-grab touch-none active:cursor-grabbing sm:block"
    >
      <svg
        width="28"
        height={height || 1}
        viewBox={`0 0 28 ${height || 1}`}
        className="overflow-visible"
      >
        <defs>
          <filter id="liquid-goo" x="-80%" y="-25%" width="260%" height="150%">
            {/* Runnier than a classic goo: less blur and a harder alpha ramp, so
                necks break sooner and the droplets read as low-viscosity. */}
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={GOO.sigma}
              result="b"
            />
            <feColorMatrix in="b" type="matrix" values={gooMatrix(GOO)} />
          </filter>
        </defs>

        <line
          x1={CX}
          x2={CX}
          y1={railTop}
          y2={railTop + span}
          stroke="var(--hairline)"
          strokeWidth="1"
        />

        <g ref={groupRef} filter="url(#liquid-goo)">
          {/* There used to be six section markers here — `r="3"` at `opacity="0.6"`,
              inside this filtered group. They never rendered, in any browser, since
              the day they were written: a 3px disc blurred by sigma 3.4 peaks at
              alpha 0.32, 0.19 after the opacity, against an isocontour of 0.46. The
              file's own header derives that threshold and the code twelve lines
              below now imports it, which makes their absence the more embarrassing.

              They are deleted rather than fixed because they could not have been
              placed honestly either: `sections` holds six ids, but the four chapters
              are their own sections (`gods-eye`, `nyay`, …) and none of them is in
              that list — so real offsets would bunch five dots into the top third
              above a ~9,600px void. The rail is a progress body; naming and jumping
              belong to the spine in the left gutter. */}

          {/* Tail first, so the lead paints over it where they overlap. */}
          {[2, 1, 0].map((i) => (
            <circle
              key={i}
              data-blob={i}
              cx={CX}
              cy={railTop}
              r={BASE_R}
              fill="var(--signal)"
            />
          ))}

          {[0, 1, 2].map((i) => (
            <circle
              key={`spark-${i}`}
              data-spark={i}
              cx={CX}
              cy={railTop}
              r="0"
              fill="var(--signal)"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
