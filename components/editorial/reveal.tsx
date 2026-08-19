"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Exponential ease-out. Fast at the start, long settle — the curve that reads as
 * "arriving" rather than "sliding in".
 */
const EXPO_OUT = [0.16, 1, 0.3, 1] as const;

type Direction = "up" | "left" | "right" | "settle";

const ENTRANCES: Record<
  Direction,
  { from: Record<string, string | number>; to: Record<string, string | number> }
> = {
  // Body copy and cards. The workhorse.
  up: {
    from: { y: 26, filter: "blur(5px)" },
    to: { y: 0, filter: "blur(0px)" },
  },
  // Row-based sections — timeline, work, vision — so lists build across rather
  // than up, and do not read as the same entrance as everything else.
  left: {
    from: { x: -28, filter: "blur(4px)" },
    to: { x: 0, filter: "blur(0px)" },
  },
  right: {
    from: { x: 28, filter: "blur(4px)" },
    to: { x: 0, filter: "blur(0px)" },
  },
  // Headings. No travel, just resolves into focus, so display type never slides.
  settle: {
    from: { scale: 1.03, filter: "blur(8px)" },
    to: { scale: 1, filter: "blur(0px)" },
  },
};

type RevealProps = {
  children: ReactNode;
  /** seconds — small steps (0.05) for lists, not per-item guesses */
  delay?: number;
  direction?: Direction;
  className?: string;
  as?: "div" | "li" | "section" | "article";
};

/**
 * Scroll-triggered entrance. Replaces v2's hand-rolled IntersectionObserver plus
 * `.reveal`/`.reveal.in` class toggling.
 *
 * Two rules this deliberately follows:
 *
 * **It never starts from invisible.** The opacity floor is 0.4, not 0. Content
 * is legible the instant it enters the viewport, so a fast scroll, a failed
 * animation or an impatient reader never leaves text that simply is not there.
 * The blur does the perceptual work the opacity used to.
 *
 * **It is not one entrance everywhere.** Direction is chosen per section, so
 * lists build sideways, headings resolve in place, and the page does not repeat
 * a single identical move nine times on the way down.
 *
 * Under `prefers-reduced-motion` this renders the plain element with no observer
 * at all — the content is simply there.
 */
export function Reveal({
  children,
  delay = 0,
  direction = "up",
  className,
  as = "div",
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motion[as];

  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const { from, to } = ENTRANCES[direction];

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0.4, ...from }}
      whileInView={{ opacity: 1, ...to }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.85, delay, ease: EXPO_OUT }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * A hairline that draws itself left-to-right as it enters view.
 *
 * The rule is the page's primary structural device, so animating the structure
 * itself — rather than adding an effect on top of it — is what keeps the motion
 * inside the design system's own vocabulary.
 */
export function DrawRule({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={`h-px w-full bg-hairline ${className ?? ""}`} />;
  }

  return (
    <motion.div
      aria-hidden
      className={`h-px w-full origin-left bg-hairline ${className ?? ""}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 1.1, delay, ease: EXPO_OUT }}
    />
  );
}
