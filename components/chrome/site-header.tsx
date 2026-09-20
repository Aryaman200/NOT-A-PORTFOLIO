import Link from "next/link";
import { site } from "@/lib/content";
import { CommandTrigger } from "./command-trigger";

/**
 * Slim fixed header. Deliberately thin — the display type is the subject, so the
 * chrome stays out of its way.
 *
 * The previous version carried a live clock, latitude and longitude, and a
 * module crumb. None of it told a reader anything; it was set dressing for a
 * console theme that no longer exists.
 */
export function SiteHeader() {
  return (
    // The name pairs this with the case-study header so the bar stays put
    // through a route slide instead of travelling with the content. See the
    // `site-header` rules in globals.css.
    <header
      // Rises with the name when the opening curtain lifts. Stage 1 rather than
      // 2: the bar and the name are one move, and a header arriving separately
      // from the thing it sits above reads as two page loads.
      data-entrance-stage="1"
      style={{ viewTransitionName: "site-header" }}
      className="fixed inset-x-0 top-0 z-40 border-b border-hairline-soft bg-background/80 backdrop-blur-md"
    >
      <div className="flex h-12 items-center gap-6 px-gutter">
        <Link
          href="#intro"
          className="font-mono text-micro uppercase transition-opacity hover:opacity-70"
        >
          {site.name}
        </Link>

        <nav
          aria-label="Primary"
          className="ml-auto flex items-center gap-5 font-mono text-micro uppercase"
        >
          <Link
            href="#work"
            className="nav-link text-muted-foreground transition-colors hover:text-foreground"
          >
            Work
          </Link>
          <Link
            href="#contact"
            className="nav-link text-muted-foreground transition-colors hover:text-foreground"
          >
            Contact
          </Link>
          <a
            href={site.links.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="press px-2 py-1 text-signal"
          >
            Résumé
          </a>
          {/* Hidden on touch widths: a "Ctrl K" chip is not actionable without a
              keyboard, and it wraps the header to two lines at 375px. */}
          <span className="hidden md:inline">
            <CommandTrigger />
          </span>
        </nav>
      </div>
    </header>
  );
}
