import { ViewTransition } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Artifact } from "@/components/lab/artifact";
import { CaseMedia } from "@/components/work/case-media";
import { Reveal } from "@/components/editorial/reveal";
import { BlockReveal } from "@/components/editorial/block-reveal";
import { Label } from "@/components/editorial/section";
import { site } from "@/lib/content";
import { jsonLd, projectSchema } from "@/lib/structured-data";
import {
  getProject,
  nextProject,
  projects,
  projectSlugs,
} from "@/lib/projects";

const STATE_COPY = {
  shipped: "Shipped",
  concept: "Concept",
  research: "Research",
} as const;

/**
 * A case study.
 *
 * The homepage chapter argues with a running artifact and one sentence. This is
 * the rest of the argument — problem, constraint, what was built, and what it
 * did or failed to do. The artifact comes with it: the same simulation the
 * reader was just looking at keeps running at the top of the page, which is what
 * the shared-element morph is communicating. Same object, gone deeper.
 *
 * Statically generated for the four known slugs. `dynamicParams = false` means a
 * hand-typed /work/anything-else is a real 404 rather than a runtime render of a
 * project that does not exist.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return projectSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    // The layout template appends "— Aryaman Bhardwaj".
    title: project.title,
    description: project.tagline,
    openGraph: {
      type: "article",
      title: `${project.title} — ${site.name}`,
      description: project.tagline,
      // Relative — resolved against the `metadataBase` set in the root layout.
      url: `/work/${slug}`,
    },
    alternates: { canonical: `/work/${slug}` },
  };
}

export default async function CasePage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const next = nextProject(slug);
  const { case: study } = project;

  return (
    // Directional slides. Home and every case wrap their content identically;
    // the wrapper has to live in page.tsx rather than layout.tsx because layouts
    // persist across navigation, so enter and exit never fire in one.
    <ViewTransition
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      default="none"
    >
      <main className="flex-1 pt-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(projectSchema(project)) }}
        />
        {/* ---- hero: the artifact, still running ---- */}
        <section className="px-gutter pt-[clamp(3rem,7vh,5rem)]">
          <div className="mx-auto w-full max-w-[110rem]">
            <header className="flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-micro uppercase">
              <span className="text-signal">
                {String(projects.indexOf(project) + 1).padStart(2, "0")}
              </span>
              <span className="text-muted-foreground">{project.year}</span>
              <span className="text-muted-foreground">
                {STATE_COPY[project.state]}
              </span>
              <span className="ml-auto normal-case text-muted-foreground">
                {project.artifactNote}
              </span>
            </header>

            {/* The morph target. Paired with the chapter's artifact frame by
                name, so the canvas travels from the chapter into this slot
                instead of the two swapping. `default="none"` stops it animating
                during unrelated transitions — without it, every named element on
                the page crossfades on every navigation. */}
            <ViewTransition
              name={`artifact-${project.slug}`}
              share="morph"
              default="none"
            >
              <div className="mt-8 h-[clamp(20rem,48vh,34rem)]">
                <Artifact id={project.artifact} />
              </div>
            </ViewTransition>

            <div className="mt-10 h-px w-full bg-hairline" />

            <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-7">
                <ViewTransition
                  name={`title-${project.slug}`}
                  share="morph"
                  default="none"
                >
                  <h1 className="font-display text-title text-balance">
                    {project.title}
                  </h1>
                </ViewTransition>
                <p className="mt-6 max-w-[52ch] text-lead text-pretty text-muted-foreground">
                  {project.tagline}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-x-8 gap-y-6 lg:col-span-4 lg:col-start-9 lg:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <dt>
                    <Label>Role</Label>
                  </dt>
                  <dd className="text-sm text-pretty">{study.role}</dd>
                </div>
                <div className="flex flex-col gap-1.5">
                  <dt>
                    <Label>Period</Label>
                  </dt>
                  <dd className="text-sm">{study.period}</dd>
                </div>
                <div className="col-span-2 flex flex-col gap-1.5 lg:col-span-1">
                  <dt>
                    <Label>Stack</Label>
                  </dt>
                  <dd>
                    <ul className="tag-run gap-y-1.5 font-mono text-micro uppercase text-muted-foreground">
                      {project.stack.map((tech) => (
                        <li key={tech}>{tech}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Populated only when there are real figures. See the no-invented-
                numbers rule at the top of lib/projects.ts. */}
            {study.numbers?.length ? (
              <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-hairline pt-8 md:grid-cols-4">
                {study.numbers.map((n) => (
                  <div key={n.label} className="flex flex-col gap-2">
                    <dt className="font-display text-[clamp(1.75rem,3vw,2.75rem)] leading-none text-signal">
                      {n.value}
                    </dt>
                    <dd>
                      <Label>{n.label}</Label>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </section>

        {/* ---- the argument ---- */}
        <section className="px-gutter py-section">
          <div className="mx-auto w-full max-w-[110rem]">
            <div className="border-t border-hairline">
              {study.blocks.map((block, i) => (
                <Reveal
                  key={block.heading}
                  direction="up"
                  delay={Math.min(i, 3) * 0.05}
                  className="grid gap-4 border-b border-hairline py-10 md:grid-cols-12 md:gap-10 md:py-14"
                >
                  <h2 className="text-heading text-balance md:col-span-4">
                    {block.heading}
                  </h2>
                  {/* 68ch rather than the 62ch used in the shell: the lab ground
                      is dark, and light type on dark reads slightly narrower per
                      character, so the same measure looks cramped here. */}
                  <p className="max-w-[68ch] text-lead text-pretty text-muted-foreground md:col-span-7 md:col-start-6">
                    {block.body}
                  </p>
                </Reveal>
              ))}
            </div>

            <CaseMedia media={study.media} />

            {study.links?.length ? (
              <ul className="mt-16 flex flex-wrap gap-3">
                {study.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="press group/link flex items-center gap-3 px-5 py-3.5 font-mono text-label uppercase"
                    >
                      {link.label}
                      <ArrowUpRight
                        aria-hidden
                        className="size-3.5 transition-transform duration-500 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        {/* ---- next ---- */}
        {next ? (
          <section className="border-t border-hairline px-gutter py-section">
            <div className="mx-auto w-full max-w-[110rem]">
              <Label>Next</Label>
              <Link
                href={`/work/${next.slug}`}
                transitionTypes={["nav-forward"]}
                className="group mt-7 flex flex-col gap-6"
              >
                <BlockReveal as="span" className="font-display text-title">
                  {next.title}
                </BlockReveal>
                <span className="flex items-center gap-5">
                  <span className="max-w-[52ch] text-lead text-pretty text-muted-foreground">
                    {next.tagline}
                  </span>
                  <span
                    aria-hidden
                    className="h-px flex-1 bg-hairline transition-colors group-hover:bg-signal"
                  />
                  <ArrowRight
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground transition-all duration-500 group-hover:translate-x-1.5 group-hover:text-signal"
                  />
                </span>
              </Link>
            </div>
          </section>
        ) : null}

      </main>

      <footer className="border-t border-hairline px-gutter py-12">
        <div className="mx-auto flex w-full max-w-[110rem] flex-col gap-4 font-mono text-micro uppercase text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/#work"
            transitionTypes={["nav-back"]}
            className="nav-link text-foreground"
          >
            All work
          </Link>
          <a
            href={`mailto:${site.email}`}
            className="nav-link transition-colors hover:text-foreground"
          >
            {site.email}
          </a>
        </div>
      </footer>
    </ViewTransition>
  );
}
