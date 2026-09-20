import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { site } from "@/lib/content";

/**
 * The case-study header.
 *
 * Same twelve-rem bar and the same mono micro type as SiteHeader, so crossing
 * into /work does not feel like crossing into a different site — only a
 * different room. What changes is the leading element: on the home page it is
 * the name, here it is the way out.
 *
 * `viewTransitionName` anchors this through the directional slides. Without it
 * the header travels with the content and the reader loses their one fixed
 * reference point; see the `site-header` rules in globals.css.
 *
 * The back link carries `transitionTypes={["nav-back"]}` so returning slides the
 * opposite way to arriving. Prefetch is left at the default: the home page is
 * where nearly every reader came from and is where they are most likely to go.
 */
export function WorkHeader() {
  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className="fixed inset-x-0 top-0 z-40 border-b border-hairline-soft bg-background/80 backdrop-blur-md"
    >
      <div className="flex h-12 items-center gap-6 px-gutter">
        <Link
          href="/#work"
          transitionTypes={["nav-back"]}
          className="nav-link group/back flex items-center gap-2.5 font-mono text-micro uppercase"
        >
          <ArrowLeft
            aria-hidden
            className="size-3 transition-transform duration-500 group-hover/back:-translate-x-0.5"
          />
          Work
        </Link>

        <nav
          aria-label="Primary"
          className="ml-auto flex items-center gap-5 font-mono text-micro uppercase"
        >
          <Link
            href="/"
            transitionTypes={["nav-back"]}
            className="nav-link text-muted-foreground transition-colors hover:text-foreground"
          >
            {site.shortName}
          </Link>
          <a
            href={site.links.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="press px-2 py-1 text-signal"
          >
            Résumé
          </a>
        </nav>
      </div>
    </header>
  );
}
