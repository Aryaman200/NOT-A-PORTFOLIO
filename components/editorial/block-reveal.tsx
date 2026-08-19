"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

/** Decisive cover — the block should arrive, not drift in. */
const COVER = [0.7, 0, 0.3, 1] as const;
/** Exponential ease-out: quick departure, long settle. */
const EXPO_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * Fraction of the sequence at which the block fully covers the line. The text
 * switches on at exactly this point, hidden underneath.
 */
const COVERED = 0.42;
/** Fraction at which the block starts leaving. The gap is the beat it holds. */
const RELEASE = 0.5;

const TAGS = {
  span: motion.span,
  p: motion.p,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
} as const;

type Tag = keyof typeof TAGS;

type BlockRevealProps = {
  /** newlines are honoured as hard line breaks */
  children: string;
  as?: Tag;
  className?: string;
  /** seconds before the first line moves */
  delay?: number;
  /** seconds between consecutive lines */
  stagger?: number;
  /** total seconds for one line's cover-and-clear */
  duration?: number;
};

/**
 * Colour-block entrance: a solid bar sweeps across each line, and the type is
 * behind it when it leaves.
 *
 * The block enters from the left, covers the line completely, holds for a beat,
 * then clears to the right — one continuous gesture rather than two animations
 * that happen to be adjacent. The type flips on underneath at the moment of
 * full cover, so it is never seen arriving; from the outside the block appears
 * to deposit it.
 *
 * **The direction reversal is `originX`, not a second element.** Scaling a bar
 * from 0 to 1 and back to 0 with a fixed origin makes it grow and shrink from
 * the same edge — a stretch, not a sweep. Flipping the origin from 0 to 1 at
 * the covered keyframe changes which edge is anchored, and because `scaleX` is
 * exactly 1 at that instant the switch has no visual effect of its own. The
 * result is one bar that travels.
 *
 * **Per line, not per heading.** One bar spanning a two-line title is a large
 * rectangle crossing the page, which reads as a page transition rather than as
 * typesetting. Per-line bars with a small stagger read as the words being set.
 *
 * Unlike `Reveal`, this genuinely hides its content until the block passes —
 * there is no reveal otherwise. That is why it is for headings only: they are
 * short, they are re-stated in the document outline, and `TextReveal` already
 * established the precedent of a masked heading here. Body copy keeps the
 * opacity floor so a fast scroll never lands on text that is simply not there.
 *
 * Each line is animated from an explicit `useInView` and per-line delay rather
 * than through variant propagation, for the reason documented on `TextReveal`:
 * the cascade proved unreliable through the wrapper spans, and when it failed
 * it failed silently and completely — leaving blank space with correct-looking
 * DOM and no console error.
 *
 * Under `prefers-reduced-motion` the plain element renders with no wrappers and
 * no block at all.
 */
export function BlockReveal({
  children,
  as = "span",
  className,
  delay = 0,
  stagger = 0.09,
  duration = 1.05,
}: BlockRevealProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  // TAGS[as] is a union of motion components, which TypeScript cannot reconcile
  // against a single ref type. The runtime component is whichever tag was asked
  // for; only the ref signature is narrowed here.
  const MotionTag = TAGS[as] as typeof motion.span;

  if (reduceMotion) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  const lines = children.split("\n");

  return (
    <MotionTag ref={ref} className={className}>
      {lines.map((line, i) => {
        const start = delay + i * stagger;
        return (
          // Two elements per line, and both are load-bearing. The outer is
          // `block` so each line takes its own row; the inner is `inline-block`
          // so it shrinks to the width of its text. A single `block` wrapper
          // stretches to the container, which sizes the bar to the container
          // too — on a short line in a wide parent that left a bar hanging in
          // empty space well past the last glyph.
          //
          // `pb-[0.14em]` keeps descenders clear of the clip edge, and the bar
          // is inset by the same amount so it still covers the glyphs rather
          // than sitting low against them.
          <span key={`${line}-${i}`} className="block">
            <span className="relative inline-block overflow-hidden pb-[0.14em]">
              <motion.span
                // The text is server-rendered at opacity 0, so with no scripting
                // the bar never moves and the heading never appears. `opacity: 0`
                // still exposes it to assistive tech and indexing — the content
                // is in the HTML either way — so only the visual needs restoring;
                // globals.css does it under `@media (scripting: none)`.
                data-block-reveal-text
                className="block"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                // A step, not a fade: the type is already hidden behind the block
                // when this fires, so any duration here would show it dissolving
                // in at the moment the block clears.
                transition={{
                  duration: 0.001,
                  delay: start + duration * COVERED,
                }}
              >
                {line}
              </motion.span>

              <motion.span
                aria-hidden
                className="absolute inset-x-0 top-0 bottom-[0.14em] bg-signal"
                initial={{ scaleX: 0, originX: 0 }}
                animate={
                  inView
                    ? { scaleX: [0, 1, 1, 0], originX: [0, 0, 1, 1] }
                    : { scaleX: 0, originX: 0 }
                }
                transition={{
                  duration,
                  delay: start,
                  times: [0, COVERED, RELEASE, 1],
                  ease: [COVER, "linear", EXPO_OUT],
                }}
              />
            </span>
          </span>
        );
      })}
    </MotionTag>
  );
}
