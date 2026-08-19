"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { sections } from "@/lib/content";

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
 * which crosses 0.46 at `d ≈ 2r + 4.8`. With `r` between 3.6 and 6.2 that puts
 * the neck break at a 12–18px gap: under ~20px of total chain spread the three
 * read as one body, and past ~35px all three are visibly separate. Every
 * constant below was tuned against those two numbers rather than by eye.
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
const BASE_R = 6.2;
const MIN_R = 3.6;
/** px of chain spread at which droplets reach their smallest radius */
const FULL_SPREAD = 46;
/** Frames of quiet after a splash before another can fire. */
const SPLASH_COOLDOWN = 26;

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

    const blobs = group.querySelectorAll<SVGCircleElement>("[data-blob]");
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
        const share = 1 - (i / droplets.length) * 0.45 * openness;
        // Ambient swell, on a slower period than the drift so the two never
        // line up into an obvious loop.
        const calm = 1 - Math.min(1, Math.abs(d.vy) / 2.5);
        const swell = 1 + Math.sin(t * IDLE_HZ_2 + i * 1.3) * IDLE_SWELL * calm;
        d.r = (BASE_R - (BASE_R - MIN_R) * openness) * share * swell;
      }

      for (let i = 0; i < blobs.length; i++) {
        const d = droplets[i];
        // Squash across the axis of travel, so a moving droplet reads as
        // deforming rather than merely sliding. Same sqrt response as the sway,
        // and for the same reason: an earlier linear `|vy| / 46` was tuned
        // against page-scroll velocity rather than droplet velocity, so ordinary
        // scrolling produced a few percent of stretch and looked like nothing.
        const squash = 0.45 * Math.min(1, Math.sqrt(Math.abs(d.vy) / VREF));
        const sx = (1 - squash).toFixed(3);
        const sy = (1 + squash * 1.6).toFixed(3);
        const x = CX + d.x;
        const y = d.y;
        blobs[i].setAttribute("cx", x.toFixed(2));
        blobs[i].setAttribute("cy", y.toFixed(2));
        blobs[i].setAttribute("r", d.r.toFixed(2));
        blobs[i].setAttribute(
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
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: clamped * max, behavior: "instant" });
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

  const span = height * (1 - RAIL_PAD * 2);
  const top = height * RAIL_PAD;
  const nodes = sections.map((section, i) => ({
    id: section.id,
    y: top + (i / (sections.length - 1)) * span,
  }));

  return (
    <div
      ref={railRef}
      aria-hidden
      onPointerDown={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      className="fixed top-1/2 right-1 z-40 hidden h-[42vh] w-7 -translate-y-1/2 cursor-grab touch-none active:cursor-grabbing sm:block"
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
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.4" result="b" />
            <feColorMatrix
              in="b"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 26 -12"
            />
          </filter>
        </defs>

        <line
          x1={CX}
          x2={CX}
          y1={top}
          y2={top + span}
          stroke="var(--hairline)"
          strokeWidth="1"
        />

        <g ref={groupRef} filter="url(#liquid-goo)">
          {nodes.map((node) => (
            <circle
              key={node.id}
              cx={CX}
              cy={node.y}
              r="3"
              fill="var(--signal)"
              opacity="0.6"
            />
          ))}

          {/* Tail first, so the lead paints over it where they overlap. */}
          {[2, 1, 0].map((i) => (
            <circle
              key={i}
              data-blob={i}
              cx={CX}
              cy={top}
              r={BASE_R}
              fill="var(--signal)"
            />
          ))}

          {[0, 1, 2].map((i) => (
            <circle
              key={`spark-${i}`}
              data-spark={i}
              cx={CX}
              cy={top}
              r="0"
              fill="var(--signal)"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
