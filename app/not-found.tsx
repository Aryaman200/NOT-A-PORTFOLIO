import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { sections, site } from "@/lib/content";
import { projects } from "@/lib/projects";
import { Label } from "@/components/editorial/section";

export const metadata = {
  title: "Not found",
  // A 404 that ranks is a 404 that wastes someone's click.
  robots: { index: false, follow: true },
};

/**
 * The root 404.
 *
 * There was one at `app/work/not-found.tsx` but none here, so any mistyped URL
 * outside /work fell through to Next's default black-on-white page — which is a
 * different site wearing none of this one's type, colour or chrome, and is the
 * single most common way a visitor sees something that looks broken.
 *
 * Modelled on the /work one: it answers with somewhere to go rather than an
 * apology. Someone who lands here knows what they were looking for, so the
 * useful response is the index — all four cases, all six sections, and the
 * email.
 */
export default function NotFound() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="flex flex-1 items-center px-gutter py-section pt-32 outline-none"
    >
      <div className="mx-auto w-full max-w-[110rem]">
        <Label className="text-signal">404</Label>
        <h1 className="mt-6 max-w-[22ch] font-display text-title text-balance">
          There is nothing at that address.
        </h1>
        <p className="mt-6 max-w-[52ch] text-lead text-pretty text-muted-foreground">
          The site is one page and four case studies. One of these is almost
          certainly what you were after.
        </p>

        <div className="mt-16 grid gap-16 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-7">
            <Label>Work</Label>
            <ul className="mt-5 border-t border-hairline">
              {projects.map((project) => (
                <li key={project.slug}>
                  <Link
                    href={`/work/${project.slug}`}
                    data-cursor="Open"
                    className="group flex items-baseline gap-6 border-b border-hairline py-5 transition-colors hover:text-signal"
                  >
                    <span className="font-display text-[clamp(1.25rem,2vw,1.75rem)]">
                      {project.title}
                    </span>
                    <span
                      aria-hidden
                      className="h-px flex-1 bg-hairline transition-colors group-hover:bg-signal"
                    />
                    <span className="font-mono text-micro uppercase text-muted-foreground">
                      {project.year}
                    </span>
                    <ArrowRight
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground transition-all duration-500 group-hover:translate-x-1 group-hover:text-signal"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <Label>Sections</Label>
            <ul className="mt-5 flex flex-col gap-3">
              {sections.map((section) => (
                <li key={section.id}>
                  <Link
                    href={`/#${section.id}`}
                    className="nav-link font-mono text-micro uppercase text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="mr-3 text-signal">{section.code}</span>
                    {section.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Label>Or just say hello</Label>
              <a
                href={`mailto:${site.email}`}
                className="nav-link mt-3 inline-block font-mono text-micro text-signal"
              >
                {site.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
