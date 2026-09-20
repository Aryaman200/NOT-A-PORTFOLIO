"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { hero, site } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * 01 · Intro.
 *
 * The page's one authored motion moment. Everything below reveals quietly on
 * scroll; here the scroll position itself drives a continuous sequence — the
 * terrain camera dives from an aerial view to the horizon while the two halves
 * of the name part and drift at different rates.
 *
 * The name is only ever transformed *by the scroll* — it is the largest text on
 * the page and therefore the LCP element, so nothing here fades it as you move.
 *
 * On first load the name is uncovered by the opening curtain rather than faded
 * in, and rises the last few pixels as that happens. The distinction matters:
 * it is painted the whole time, behind an opaque cover, so the LCP element is
 * never held back — see the load note in lib/entrance.ts. The stage wrapper
 * below therefore carries a transform and no opacity, and it should stay that
 * way.
 *
 * There is no kicker above the name. A pulsing dot next to "Available for 2026
 * roles" is the single most template-looking element a portfolio hero can open
 * with, and the availability is already stated plainly in Contact.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // The two lines separate as the terrain dives — the type does what the camera
  // does, which is what ties the sequence together.
  const firstLineX = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);
  const secondLineX = useTransform(scrollYProgress, [0, 1], ["0%", "9%"]);
  const nameY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const nameOpacity = useTransform(scrollYProgress, [0, 0.75, 1], [1, 1, 0.15]);
  const supportingOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const supportingY = useTransform(
    scrollYProgress,
    [0, 0.45],
    ["0px", "-28px"],
  );

  const still = reduceMotion ?? false;

  return (
    <section
      ref={sectionRef}
      id="intro"
      className="relative flex min-h-dvh scroll-mt-24 flex-col justify-end overflow-hidden px-gutter pt-32 pb-16 md:pb-24"
    >
      <div className="mx-auto w-full max-w-[110rem]">
        {/* The entrance stages. These are plain wrappers rather than props on
            the motion elements below, because motion writes opacity and y as
            inline styles from the scroll — an inline style beats the class the
            entrance uses, so the two mechanics have to live on different
            elements or the reveal never runs. See the opening section of
            globals.css. */}
        <div data-entrance-stage="1">
          <motion.h1
            style={still ? undefined : { y: nameY, opacity: nameOpacity }}
            className="font-display text-display"
          >
            <motion.span
              style={still ? undefined : { x: firstLineX }}
              className="block will-change-transform"
            >
              Aryaman
            </motion.span>
            <motion.span
              style={still ? undefined : { x: secondLineX }}
              className="block will-change-transform"
            >
              Bhardwaj
            </motion.span>
          </motion.h1>
        </div>

        <div data-entrance-stage="2">
          <motion.div
            style={
              still ? undefined : { opacity: supportingOpacity, y: supportingY }
            }
            className="mt-9 flex flex-col gap-12 md:mt-12"
          >
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-label uppercase">
              {hero.roles.map((role, i) => (
                <span key={role} className="flex items-center gap-3">
                  {i > 0 ? (
                    <span aria-hidden className="h-px w-4 bg-hairline" />
                  ) : null}
                  <span
                    className={
                      i === 0 ? "text-signal" : "text-muted-foreground"
                    }
                  >
                    {role}
                  </span>
                </span>
              ))}
            </p>

            <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
              <p className="text-lead text-pretty lg:col-span-5">
                {hero.statement}
              </p>

              <div className="flex flex-col items-start gap-8 lg:col-span-5 lg:col-start-8">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="#work"
                    className="press press-strong group/action flex items-center gap-3 px-5 py-3.5 font-mono text-label uppercase"
                  >
                    See the work
                    <ArrowDown
                      aria-hidden
                      className="size-3.5 transition-transform duration-500 group-hover/action:translate-y-0.5"
                    />
                  </Link>
                  <a
                    href={site.links.resume}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press group/action flex items-center gap-3 px-5 py-3.5 font-mono text-label uppercase text-muted-foreground"
                  >
                    Résumé
                    <ArrowUpRight
                      aria-hidden
                      className="size-3.5 transition-transform duration-500 group-hover/action:-translate-y-0.5 group-hover/action:translate-x-0.5"
                    />
                  </a>
                </div>

                <ul className="tag-run gap-y-2 font-mono text-micro uppercase text-muted-foreground">
                  {hero.focus.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <div className="h-px w-full bg-hairline" />
              <dl className="grid grid-cols-2 gap-x-8 gap-y-6 pt-6 md:grid-cols-4">
                {hero.meta.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1.5">
                    <dt className="font-mono text-micro uppercase text-muted-foreground">
                      {item.label}
                    </dt>
                    <dd
                      className={cn(
                        "text-sm text-pretty",
                        "accent" in item && item.accent
                          ? "text-signal"
                          : "text-foreground",
                      )}
                    >
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
