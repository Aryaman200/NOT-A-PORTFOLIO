"use client";

import { useEffect } from "react";
import Link from "next/link";
import { site } from "@/lib/content";
import { Label } from "@/components/editorial/section";

/**
 * The route error boundary.
 *
 * There was none, so any render error below the root layout showed Next's
 * default error page — which in production is an unstyled "Application error"
 * with no way back. This keeps the reader inside the site and gives them the
 * two things that are actually useful: retry, and a way out.
 *
 * `reset()` re-renders the segment without a full reload. It is offered first
 * because most render errors here would come from a lazily-imported artifact
 * failing, and those genuinely do recover on a second attempt.
 *
 * The error's own message is deliberately not printed. It is either a stack
 * trace, which means nothing to a reader, or a digest hash, which means nothing
 * to anyone without server logs — and neither belongs in front of someone who
 * wanted to look at a portfolio.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // No analytics on this site, so the console is the only place this can go.
    // Logged rather than swallowed: a boundary that hides the error from the
    // developer too is worse than no boundary.
    console.error("Route error:", error);
  }, [error]);

  return (
    <main
      id="main"
      tabIndex={-1}
      className="flex flex-1 items-center px-gutter py-section pt-32 outline-none"
    >
      <div className="mx-auto w-full max-w-[110rem]">
        <Label className="text-signal">Error</Label>
        <h1 className="mt-6 max-w-[22ch] font-display text-title text-balance">
          Something on this page failed to load.
        </h1>
        <p className="mt-6 max-w-[52ch] text-lead text-pretty text-muted-foreground">
          Not your doing. Trying again usually works — the parts of this site
          that can fail are the ones loaded on demand.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reset}
            data-cursor="Retry"
            className="press press-strong px-5 py-3.5 font-mono text-label uppercase"
          >
            Try again
          </button>
          <Link
            href="/"
            className="press px-5 py-3.5 font-mono text-label uppercase text-muted-foreground"
          >
            Back to the start
          </Link>
          <a
            href={`mailto:${site.email}`}
            className="press px-5 py-3.5 font-mono text-label uppercase text-muted-foreground"
          >
            Tell me about it
          </a>
        </div>
      </div>
    </main>
  );
}
