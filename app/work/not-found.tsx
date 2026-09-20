import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { projects } from "@/lib/projects";
import { Label } from "@/components/editorial/section";

/**
 * A case study that does not exist.
 *
 * Rather than a dead end, this lists the four that do. A 404 inside /work is
 * almost always a stale link or a typed URL, and in both cases the reader knows
 * what they were looking for — the useful response is the index, not an apology.
 */
export default function WorkNotFound() {
  return (
    <main className="flex flex-1 items-center px-gutter py-section pt-32">
      <div className="mx-auto w-full max-w-[110rem]">
        <Label className="text-signal">404</Label>
        <h1 className="mt-6 max-w-[20ch] font-display text-title text-balance">
          No case study at that address.
        </h1>
        <p className="mt-6 max-w-[52ch] text-lead text-pretty text-muted-foreground">
          There are four. One of these is probably the one you wanted.
        </p>

        <ul className="mt-16 border-t border-hairline">
          {projects.map((project) => (
            <li key={project.slug}>
              <Link
                href={`/work/${project.slug}`}
                className="group flex items-baseline gap-6 border-b border-hairline py-6 transition-colors hover:text-signal"
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
    </main>
  );
}
