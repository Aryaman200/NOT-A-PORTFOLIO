"use client";

import { useEffect, useRef, useState } from "react";
import { gooFloor, gooMatrix, type GooFilter } from "@/lib/goo";

/**
 * The pointer, replaced by a small liquid.
 *
 * Same substance as the scroll rail, and deliberately the same construction: a
 * chain of droplets drawn into one group under `feGaussianBlur` plus a
 * high-contrast `feColorMatrix`. The blur spreads each circle's alpha and the
 * matrix slams the midtones to 0 or 1, so overlapping falloffs weld into a
 * single form with a tapered neck and separated ones cleanly break apart. The
 * shapes are only ever circles; all of the surface tension is the filter.
 *
 * The *mechanism* is the rail's; the constants are not. This runs a wider blur
 * and a shallower threshold — a thicker, more viscous body with longer necks,
 * where the rail is a thin runny one. See liquid-scroll.tsx for the isocontour
 * derivation, which applies to both.
 *
 * What differs is the input. The rail chases a scroll position that moves a
 * couple of pixels per frame; this chases a pointer that can cross 120px in one
 * frame. So the pulls are roughly an order of magnitude stronger and `VREF` is
 * far higher — the tuning does not transfer, only the mechanism.
 *
 * **This replaces the system cursor rather than accompanying it.** That has
 * consequences the component has to own:
 *
 * - `cursor: none` is applied by *this component, on mount*, never statically in
 *   the stylesheet. If the bundle fails, the component throws, or scripting is
 *   off, the rule is never applied and the reader keeps their real pointer.
 *   Hiding it from CSS would mean a page with no pointer at all whenever the
 *   JavaScript did not arrive.
 * - Text fields get a caret mode — the chain draws up into a bar — because a
 *   blob sitting over an input with no I-beam is the one place hiding the native
 *   cursor genuinely loses information. It is a fat bar, not a hairline one:
 *   `FLOOR_R` is the narrowest shape this filter can render at all.
 * - Under reduced motion, and on coarse pointers, the whole thing is off and the
 *   native cursor is left alone. Nothing here is load-bearing.
 *
 * Nothing re-renders on movement: positions are written straight to SVG
 * attributes from the rAF loop. React state changes only when the mode under
 * the pointer changes, which is a handful of times a session.
 */

/**
 * Per-droplet pull toward the one ahead. The lead chases the pointer.
 *
 * Much stiffer than the rail's `[0.12, 0.038, 0.02]`. A pointer flick moves the
 * target by 80–120px in a single frame, so a 38-frame time constant would leave
 * the chain hundreds of pixels behind — it would read as a bug, not a liquid.
 * These give a tail that lags by a few frames: enough to string out visibly on a
 * fast move and close again almost immediately.
 */
const PULL = [0.42, 0.2, 0.12];
/** Low enough to stay runny and overshoot slightly on catch-up. */
const DAMPING = 0.7;

/**
 * Hard ceiling on the gap between consecutive droplets — a ligament that cannot
 * stretch past its break length. Total spread can never exceed `2 × LINK`
 * whatever the input, which is what stops a fast flick across the viewport from
 * smearing the chain over several hundred pixels.
 */
const LINK = 30;
/** Past `KNEE` of stretch, an extra restoring force ramps in. */
const TENSION = 0.05;
const KNEE = 20;

/**
 * This liquid's filter. Thicker and more viscous than the rail's: a wider blur
 * holds necks together over a longer gap, and a shallower threshold slope makes
 * those necks thick rather than snapping them.
 *
 * `FLOOR_R` is derived from exactly these numbers, and the markup below builds
 * the filter from them too — see lib/goo.ts for why that single source matters
 * and what goes wrong when a droplet is drawn under the floor.
 */
const GOO: GooFilter = { sigma: 6, slope: 14, offset: 6 };
const FLOOR_R = gooFloor(GOO);

/** Resting radius. Deliberately fat — this is a body of liquid, not a dot. */
const BASE_R = 13;
/** The thinnest a droplet gets when the chain is fully strung out. */
const MIN_R = 10.5;
/**
 * How much mass shifts to the lead as the chain opens, so the tail thins first.
 * Kept low: at the old 0.45 the tail lost nearly a third of its radius, which
 * with a floor this high is most of the way to vanishing.
 */
const MASS_SHIFT = 0.18;
/** px of chain spread at which droplets reach their smallest radius */
const FULL_SPREAD = 58;
/**
 * px/frame that counts as "full" deformation. Driven through `sqrt(v / VREF)`
 * for the reason given on the rail: a linear response spends the whole range on
 * flicks and leaves ordinary movement with a few percent of squash.
 */
const VREF = 34;

/**
 * Peak squash, as a fraction. Applied area-preserving — the droplet stretches
 * along its path and narrows across it by the reciprocal, so it deforms without
 * losing mass.
 */
const MAX_SQUASH = 0.3;

/**
 * The caret.
 *
 * `CARET_R` is sized so that squeezing it still clears the floor: the narrow
 * axis works out at `CARET_R * CARET_SQUEEZE`, which is held just above
 * `FLOOR_R`. Anything narrower is not a thin caret, it is no caret.
 */
const CARET_R = 11;
const CARET_SQUEEZE = (FLOOR_R * 1.02) / CARET_R;

/** Ambient surface motion — a still liquid is not a geometric circle. */
const IDLE_SWELL = 0.06;
const IDLE_HZ = 1.1;

/** Radius the lead swells to when it is holding a label. */
const LABEL_R = 38;
/** px — half the label disc plus a margin, for keeping it inside the viewport. */
const LABEL_EDGE = LABEL_R + 6;

/** px — how far a `.press-strong` control leans toward a nearby pointer. */
const MAGNET_PULL = 4;
/** px — the radius around such a control within which it starts leaning. */
const MAGNET_RADIUS = 78;

/**
 * Where the liquid becomes a caret.
 *
 * Hiding the system cursor costs the I-beam, and the I-beam is the only thing
 * telling a reader that a region accepts typing or can be selected. These are
 * the elements where that matters.
 */
const TEXT_TARGETS =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="submit"]), textarea, [contenteditable="true"]';

type Droplet = { x: number; y: number; vx: number; vy: number; r: number };

/** What the pointer is currently over. */
type Mode =
  { kind: "idle" } | { kind: "label"; text: string } | { kind: "text" };

export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [seen, setSeen] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const groupRef = useRef<SVGGElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  // Read by the rAF loop, which must not be re-subscribed on every mode change.
  const modeRef = useRef<Mode>({ kind: "idle" });

  // Gate on a fine pointer and on motion preference, resolved in an effect so
  // the server and the first client render agree on rendering nothing.
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setEnabled(fine.matches && !still.matches);
    apply();
    fine.addEventListener("change", apply);
    still.addEventListener("change", apply);
    return () => {
      fine.removeEventListener("change", apply);
      still.removeEventListener("change", apply);
    };
  }, []);

  // The viewBox has to track the viewport, because the droplets are positioned
  // in client coordinates.
  useEffect(() => {
    if (!enabled) return;
    const measure = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [enabled]);

  /**
   * Hide the system cursor — from here, on mount, so that a page which never
   * runs this code keeps its pointer. See the note at the top of the file.
   */
  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("liquid-cursor");
    return () => document.documentElement.classList.remove("liquid-cursor");
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const group = groupRef.current;
    const labelEl = labelRef.current;
    if (!group) return;

    // Selected by index rather than taken in document order. The circles are
    // emitted tail-first so the lead paints on top, which means document order
    // is the reverse of droplet order — indexing a NodeList here would quietly
    // write the lead's physics into the tail's circle and make every `data-drop`
    // value a lie. It merges into the same shape either way, so nothing looks
    // wrong; it is only wrong.
    const blobs = PULL.map((_, i) =>
      group.querySelector<SVGCircleElement>(`[data-drop="${i}"]`),
    );
    if (blobs.some((b) => !b)) return;

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let placed = false;
    let frame = 0;

    const droplets: Droplet[] = PULL.map(() => ({
      x: pointerX,
      y: pointerY,
      vx: 0,
      vy: 0,
      r: BASE_R,
    }));

    const tick = (now: number) => {
      const t = now / 1000;
      const current = modeRef.current;
      const labelled = current.kind === "label";
      const caret = current.kind === "text";

      // Swollen into a label disc the body is 76px across, so at a viewport
      // edge half of it would be cut off — and the scroll rail, which carries
      // the most valuable label on the page, sits hard against that edge.
      //
      // The clamp is applied to the lead droplet's *target*, not to the drawn
      // position. Clamping the drawing would slide the shape away from the
      // physics and leave the label, which rides the lead, sitting off the
      // centre of its own disc. Clamping the goal lets the chain genuinely
      // settle at the clamped point, so the disc and the word stay one object.
      const goalPointerX = labelled
        ? Math.min(
            Math.max(pointerX, LABEL_EDGE),
            window.innerWidth - LABEL_EDGE,
          )
        : pointerX;
      const goalPointerY = labelled
        ? Math.min(
            Math.max(pointerY, LABEL_EDGE),
            window.innerHeight - LABEL_EDGE,
          )
        : pointerY;

      for (let i = 0; i < droplets.length; i++) {
        const d = droplets[i];
        const goalX = i === 0 ? goalPointerX : droplets[i - 1].x;
        const goalY = i === 0 ? goalPointerY : droplets[i - 1].y;

        // While labelled or in caret mode the chain is a single body, so the
        // tail is pulled hard onto the lead instead of trailing behind it.
        const pull = labelled || caret ? 0.5 : PULL[i];

        const gx = goalX - d.x;
        const gy = goalY - d.y;
        const gap = Math.hypot(gx, gy);

        // Linear pull, plus tension that only engages once already stretched.
        const over = Math.max(0, gap - KNEE);
        const push = gap > 0 ? (over * TENSION) / gap : 0;
        d.vx += gx * pull + gx * push;
        d.vy += gy * pull + gy * push;
        d.vx *= DAMPING;
        d.vy *= DAMPING;
        d.x += d.vx;
        d.y += d.vy;

        // The ligament cannot exceed its break length.
        const ax = goalX - d.x;
        const ay = goalY - d.y;
        const after = Math.hypot(ax, ay);
        if (after > LINK) {
          d.x = goalX - (ax / after) * LINK;
          d.y = goalY - (ay / after) * LINK;
        }
      }

      const lead = droplets[0];
      const tail = droplets[droplets.length - 1];
      const spread = Math.hypot(tail.x - lead.x, tail.y - lead.y);
      const openness = Math.min(1, spread / FULL_SPREAD);

      for (let i = 0; i < droplets.length; i++) {
        const d = droplets[i];
        const speed = Math.hypot(d.vx, d.vy);
        const calm = 1 - Math.min(1, speed / 3);
        const swell = 1 + Math.sin(t * IDLE_HZ + i * 1.3) * IDLE_SWELL * calm;

        if (labelled) {
          // The lead carries the disc; the others tuck inside it so the goo
          // reads as one body rather than a disc with lumps on it.
          d.r = i === 0 ? LABEL_R : LABEL_R * 0.52;
        } else if (caret) {
          // The caret is a stack, not one squashed circle — see the transform
          // below for why a thin scaled circle cannot survive this filter.
          d.r = i === 0 ? CARET_R : CARET_R * 0.86;
        } else {
          const share = 1 - (i / droplets.length) * MASS_SHIFT * openness;
          d.r = (BASE_R - (BASE_R - MIN_R) * openness) * share * swell;
        }

        // The guarantee. Whatever the physics asked for, nothing is ever drawn
        // thin enough to fall through the filter's threshold and disappear.
        d.r = Math.max(FLOOR_R, d.r);

        // Squash across the axis of travel. In two dimensions that means
        // rotating into the velocity frame, scaling, and rotating back — a
        // droplet moving diagonally should stretch along its own path, not
        // along x. Suppressed while labelled: a deforming word-holder reads as
        // a rendering glitch rather than as liquid.
        //
        // Area-preserving, and then floored: the minor axis is never allowed to
        // take the droplet under `FLOOR_R`. A squash that thins one axis through
        // the threshold makes the blob vanish just as surely as shrinking it,
        // and the old `1 - squash` did exactly that on a hard flick.
        const squash = labelled
          ? 0
          : MAX_SQUASH * Math.min(1, Math.sqrt(speed / VREF));
        const angle = (Math.atan2(d.vy, d.vx) * 180) / Math.PI;
        const minor = Math.max(1 / (1 + squash), FLOOR_R / d.r);
        const sy = minor.toFixed(3);
        const sx = (1 / minor).toFixed(3);

        // Non-null: the guard above returned early if any were missing.
        const blob = blobs[i]!;
        const x = d.x.toFixed(2);
        const y = d.y.toFixed(2);
        blob.setAttribute("cx", x);
        blob.setAttribute("cy", y);
        blob.setAttribute("r", Math.max(0.1, d.r).toFixed(2));
        blob.setAttribute(
          "transform",
          caret && i === 0
            ? // The caret: the lead is drawn up into a bar, with the trailing
              // droplets melting into its base under the filter, so it reads as
              // liquid standing up rather than as a swapped-in shape.
              //
              // It cannot be a *thin* bar. `FLOOR_R` is the narrowest thing this
              // filter can render at all, so the caret is about 2 x FLOOR_R
              // across — noticeably fatter than the I-beam it replaces. That is
              // the honest cost of a gooier filter: more viscosity means a
              // larger blur, and a larger blur cannot hold a fine edge.
              `translate(${x} ${y}) scale(${CARET_SQUEEZE.toFixed(3)} 1.6) translate(${-d.x.toFixed(2)} ${-d.y.toFixed(2)})`
            : `rotate(${angle.toFixed(1)} ${x} ${y}) translate(${x} ${y}) scale(${sx} ${sy}) translate(${-d.x.toFixed(2)} ${-d.y.toFixed(2)}) rotate(${(-angle).toFixed(1)} ${x} ${y})`,
        );
      }

      // The label rides the lead droplet. It sits outside the filtered group —
      // running type through a blur-and-threshold filter destroys it.
      if (labelEl) {
        // No clamping here: the lead is already clamped at its target above, so
        // riding it keeps the word centred on the disc wherever that ends up.
        labelEl.style.transform = `translate3d(${lead.x.toFixed(1)}px, ${lead.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }

      frame = requestAnimationFrame(tick);
    };

    /** The control currently leaning toward the pointer, if any. */
    let magnet: HTMLElement | null = null;

    const clearMagnet = () => {
      if (!magnet) return;
      magnet.style.transform = "";
      magnet = null;
    };

    const updateMagnet = (target: Element | null) => {
      const candidate =
        target?.closest<HTMLElement>(".press-strong") ??
        nearestStrongControl(pointerX, pointerY);

      if (candidate !== magnet) {
        clearMagnet();
        magnet = candidate;
      }
      if (!magnet) return;

      const box = magnet.getBoundingClientRect();
      const dx = pointerX - (box.left + box.width / 2);
      const dy = pointerY - (box.top + box.height / 2);
      const distance = Math.hypot(dx, dy);
      if (distance > MAGNET_RADIUS) {
        clearMagnet();
        return;
      }
      // Falls off with distance, so the control settles back as you leave
      // rather than snapping home at the radius.
      const fall = 1 - distance / MAGNET_RADIUS;
      magnet.style.transform = `translate(${((dx / MAGNET_RADIUS) * MAGNET_PULL * fall).toFixed(2)}px, ${((dy / MAGNET_RADIUS) * MAGNET_PULL * fall).toFixed(2)}px)`;
    };

    const setMode_ = (next: Mode) => {
      const prev = modeRef.current;
      if (
        prev.kind === next.kind &&
        (prev.kind !== "label" ||
          next.kind !== "label" ||
          prev.text === next.text)
      ) {
        return;
      }
      modeRef.current = next;
      setMode(next);
    };

    const onMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (!placed) {
        // First sighting: place the chain rather than flying it in from the
        // middle of the screen.
        placed = true;
        for (const d of droplets) {
          d.x = pointerX;
          d.y = pointerY;
          d.vx = 0;
          d.vy = 0;
        }
        setSeen(true);
      }

      // `event.target` is only an Element for real pointer events; synthetic
      // ones can target the document, which has no `closest`.
      const target = event.target instanceof Element ? event.target : null;

      const labelHolder = target?.closest<HTMLElement>("[data-cursor]") ?? null;
      const label = labelHolder?.dataset.cursor;
      if (label) {
        setMode_({ kind: "label", text: label });
      } else if (target?.closest(TEXT_TARGETS)) {
        setMode_({ kind: "text" });
      } else {
        setMode_({ kind: "idle" });
      }

      updateMagnet(target);
    };

    const onDown = () => {
      group.dataset.pressed = "true";
    };
    const onUp = () => {
      group.dataset.pressed = "false";
    };
    // The pointer leaving the window has to clear the mode and any leaning
    // control, or both are frozen in place until it returns.
    const onLeave = () => {
      placed = false;
      group.dataset.pressed = "false";
      setSeen(false);
      setMode_({ kind: "idle" });
      clearMagnet();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      clearMagnet();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, size.w, size.h]);

  if (!enabled) return null;

  return (
    <>
      <svg
        aria-hidden
        data-cursor-liquid
        data-seen={seen ? "true" : "false"}
        width={size.w || 1}
        height={size.h || 1}
        viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}
      >
        <defs>
          {/* Identical to the scroll rail's filter, so the two are the same
              material: a modest blur with a hard alpha ramp, which breaks necks
              sooner than a classic goo and reads as low viscosity. */}
          <filter
            id="cursor-goo"
            x="-120%"
            y="-120%"
            width="340%"
            height="340%"
          >
            {/* Both driven from the constants the visibility floor is derived
                from. A literal here could drift from that derivation, and the
                symptom of the drift is a cursor that disappears. */}
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={GOO.sigma}
              result="b"
            />
            <feColorMatrix in="b" type="matrix" values={gooMatrix(GOO)} />
          </filter>
        </defs>

        <g ref={groupRef} data-pressed="false" filter="url(#cursor-goo)">
          {/* Tail first, so the lead paints over it where they overlap. */}
          {[2, 1, 0].map((i) => (
            <circle
              key={i}
              data-drop={i}
              cx="-100"
              cy="-100"
              r={BASE_R}
              fill="var(--signal)"
            />
          ))}
        </g>
      </svg>

      <div
        ref={labelRef}
        aria-hidden
        data-cursor-label
        data-shown={mode.kind === "label" ? "true" : "false"}
      >
        {mode.kind === "label" ? mode.text : null}
      </div>
    </>
  );
}

/**
 * The pointer is often not over the control yet when it should start leaning —
 * that is the whole idea — so proximity has to be checked against the controls
 * themselves rather than inferred from the event target.
 *
 * There are two or three of these on screen at once, so the query is cheap. It
 * is deliberately not cached: chapters mount and unmount as they scroll, and a
 * stale list would leave a detached node being translated forever.
 */
function nearestStrongControl(px: number, py: number): HTMLElement | null {
  let best: HTMLElement | null = null;
  let bestDistance = MAGNET_RADIUS;

  document.querySelectorAll<HTMLElement>(".press-strong").forEach((el) => {
    const box = el.getBoundingClientRect();
    if (box.width === 0) return;
    const distance = Math.hypot(
      px - (box.left + box.width / 2),
      py - (box.top + box.height / 2),
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      best = el;
    }
  });

  return best;
}
