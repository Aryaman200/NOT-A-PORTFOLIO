"use client";

import { useRef, ViewTransition } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { ArrowRight } from "lucide-react";
import { projects, type Project } from "@/lib/projects";
import { Artifact } from "@/components/lab/artifact";

const STATE_COPY: Record<Project["state"], string> = {
  shipped: "Shipped",
  concept: "Concept",
  research: "Research",
};

/**
 * One project chapter: a frame that opens from column width to full bleed as it
 * scrolls through, with the artifact running inside it the whole time.
 *
 * The expansion is a `clip-path` inset rather than an animated width. Animating
 * width would relayout the canvas every frame and force the artifact to resize
 * continuously; clipping is composited, costs nothing, and makes the small state
 * read as a window onto a larger scene that widens — the better idea anyway.
 *
 * The frame carries `.dark`, so the palette tokens flip inside it. Dark is no
 * longer a place you navigate to; it is something the page does as you pass
 * through it.
 */
function Chapter({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Opens over the first third, holds wide through the middle, closes at the
  // end, so consecutive chapters separate instead of running together.
  const inset = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    ["10% 12%", "0% 0%", "0% 0%", "10% 12%"],
  );
  const radius = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    ["8px", "0px", "0px", "8px"],
  );
  const clipPath = useTransform(
    [inset, radius],
    ([i, r]: string[]) => `inset(${i} round ${r})`,
  );

  const captionOpacity = useTransform(
    scrollYProgress,
    [0.22, 0.36, 0.68, 0.82],
    [0, 1, 1, 0],
  );
  // The caption rises slightly as it appears rather than only fading, so it
  // reads as settling into the frame instead of switching on.
  const captionY = useTransform(scrollYProgress, [0.22, 0.36], ["18px", "0px"]);

  const still = reduceMotion ?? false;

  return (
    <section
      ref={ref}
      id={project.slug}
      aria-label={project.title}
      // These frames paint `.dark` full-bleed, so anything fixed on top of one
      // has to adopt the lab palette while it is covered. Nothing currently
      // does — the marker is kept because the condition is real and the next
      // fixed overlay will need to hit-test for it.
      data-chapter
      // Shorter on phones: the pin window only needs to be long enough to read
      // the caption, and 210vh of scroll per project is punishing on a device
      // where each swipe covers less ground. Four chapters at 150vh was six
      // screens of pinned scrolling before Capabilities; 120vh still clears the
      // caption reveal, which finishes at 36% of the window, with room to play
      // with an interactive artifact before the chapter closes.
      className="relative h-[120vh] md:h-[210vh]"
    >
      <div className="sticky top-0 h-dvh overflow-hidden">
        <motion.div
          className="dark absolute inset-0 bg-background text-foreground"
          style={still ? undefined : { clipPath }}
        >
          <div className="absolute inset-0 px-gutter py-[clamp(3.5rem,9vh,6rem)]">
            <div className="mx-auto flex size-full max-w-[110rem] flex-col gap-5">
              <motion.header
                style={still ? undefined : { opacity: captionOpacity }}
                className="flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-micro uppercase"
              >
                <span className="text-signal">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-muted-foreground">{project.year}</span>
                <span className="text-muted-foreground">
                  {STATE_COPY[project.state]}
                </span>
                <span className="ml-auto normal-case text-muted-foreground">
                  {project.artifactNote}
                </span>
              </motion.header>

              {/* The artifact is the content. It runs whether or not the caption
                  is showing, so the chapter is never an empty frame.

                  It is also the morph target: the case study at /work/<slug>
                  names the same element, so the canvas travels into the case
                  hero rather than the two pages swapping. `default="none"` keeps
                  it from crossfading during navigations it has nothing to do
                  with — without it every named element animates on every
                  transition. */}
              <ViewTransition
                name={`artifact-${project.slug}`}
                share="morph"
                default="none"
              >
                <div className="min-h-0 flex-1">
                  <Artifact id={project.artifact} />
                </div>
              </ViewTransition>

              <motion.footer
                style={
                  still ? undefined : { opacity: captionOpacity, y: captionY }
                }
                className="flex flex-col gap-5"
              >
                <span aria-hidden className="h-px w-full bg-hairline" />
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-16">
                  <div className="flex flex-col gap-2.5">
                    <ViewTransition
                      name={`title-${project.slug}`}
                      share="morph"
                      default="none"
                    >
                      <h3 className="font-display text-title text-balance">
                        {project.title}
                      </h3>
                    </ViewTransition>
                    <p className="max-w-[58ch] text-lead text-pretty text-muted-foreground">
                      {project.tagline}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-5 md:items-end">
                    {/* The way into the written argument. A discrete control
                        rather than a clickable frame: two of these artifacts
                        have sliders and checkboxes in them, and a full-frame
                        link would navigate on every attempt to use one. */}
                    <Link
                      href={`/work/${project.slug}`}
                      data-cursor="Open"
                      transitionTypes={["nav-forward"]}
                      className="press press-strong group/case flex items-center gap-3 px-5 py-3.5 font-mono text-label uppercase"
                    >
                      Open case
                      <ArrowRight
                        aria-hidden
                        className="size-3.5 transition-transform duration-500 group-hover/case:translate-x-0.5"
                      />
                    </Link>
                    <ul className="tag-run gap-y-1.5 font-mono text-micro uppercase text-muted-foreground">
                      {project.stack.map((tech) => (
                        <li key={tech}>{tech}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.footer>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * 03 · Work.
 *
 * Four chapters. Each project has a running artifact, and a live thing you can
 * interact with argues better than four hundred words about it — so the chapter
 * leads with the artifact and says almost nothing.
 *
 * The written argument is no longer absent, it is one level down: each chapter
 * opens into /work/<slug>, and the artifact morphs into that page's hero rather
 * than the two swapping. The chapter is the claim; the case is the evidence.
 */
export function WorkChapters() {
  return (
    <>
      {projects.map((project, i) => (
        <Chapter key={project.slug} project={project} index={i} />
      ))}
    </>
  );
}
