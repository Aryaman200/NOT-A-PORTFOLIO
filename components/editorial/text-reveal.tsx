"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

/** Exponential ease-out: quick departure, long settle. */
const EXPO_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * Declared once at module scope. Building these inside the component — with
 * `motion.create(Tag)` — creates a brand new component type on every render,
 * which throws away the subtree's state each time.
 */
const TAGS = {
  span: motion.span,
  p: motion.p,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
} as const;

type Tag = keyof typeof TAGS;

type TextRevealProps = {
  /** newlines are honoured as hard line breaks */
  children: string;
  as?: Tag;
  className?: string;
  /** seconds before the first word moves */
  delay?: number;
  /** seconds between consecutive words */
  stagger?: number;
};

/**
 * Word-level entrance: each word rises out of its own clipped box.
 *
 * A block fading from `opacity: 0` is the most over-used entrance on the web,
 * and at display sizes it reads as a slideshow transition rather than
 * typesetting. Masking per word makes the type appear to be set rather than to
 * arrive, and the stagger gives a heading internal rhythm a single fade cannot.
 *
 * Words, not characters: characters look like a special effect and multiply the
 * DOM by an order of magnitude for no extra legibility.
 *
 * **Each word is animated directly, not through variant propagation.** The
 * obvious implementation puts `initial="hidden" whileInView="shown"` on the
 * container and `variants` on each word, letting the label cascade. That cascade
 * proved unreliable through the plain `<span>` masks and the line breaks, and
 * when it failed it failed silently and completely: every word frozen at
 * `translateY(105%)` inside `overflow: hidden`, so headings rendered as blank
 * space with no console error and correct-looking DOM. One `useInView` on the
 * container and an explicit per-word `delay` has no such failure mode.
 *
 * Newlines are split before words. Splitting only on spaces left the `\n` glued
 * to a word and the masks wrapped wherever they happened to overflow.
 *
 * Real text throughout, so selection, screen readers and search indexing are
 * unaffected. Under `prefers-reduced-motion` the plain element renders with no
 * wrappers at all.
 */
export function TextReveal({
  children,
  as = "span",
  className,
  delay = 0,
  stagger = 0.045,
}: TextRevealProps) {
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

  // Word offsets are precomputed rather than counted with a mutable variable
  // inside the JSX, so nothing is reassigned during render. The offset keeps the
  // stagger continuous across line breaks — a two-line heading reads as one
  // gesture rather than two sequences starting over.
  const lines = children
    .split("\n")
    .reduce<Array<{ words: string[]; offset: number }>>((acc, line) => {
      const previous = acc[acc.length - 1];
      const offset = previous ? previous.offset + previous.words.length : 0;
      return [...acc, { words: line.split(" "), offset }];
    }, []);

  return (
    <MotionTag ref={ref} className={className}>
      {lines.map(({ words, offset }, lineIndex) => {
        return (
          <span key={lineIndex}>
            {lineIndex > 0 ? <br /> : null}
            {words.map((word, i) => {
              const wordDelay = delay + (offset + i) * stagger;
              return (
                // `pb-[0.14em]` keeps descenders from being clipped by their own
                // mask — the usual bug in this pattern.
                <span
                  key={`${word}-${i}`}
                  className="inline-block overflow-hidden pb-[0.14em] align-bottom"
                >
                  <motion.span
                    className="inline-block will-change-transform"
                    initial={{ y: "105%" }}
                    animate={inView ? { y: "0%" } : { y: "105%" }}
                    transition={{
                      duration: 0.85,
                      ease: EXPO_OUT,
                      delay: wordDelay,
                    }}
                  >
                    {word}
                    {i < words.length - 1 ? "\u00A0" : ""}
                  </motion.span>
                </span>
              );
            })}
          </span>
        );
      })}
    </MotionTag>
  );
}
