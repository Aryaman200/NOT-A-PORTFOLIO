import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal, DrawRule } from "./reveal";
import { BlockReveal } from "./block-reveal";

/**
 * The section scaffold: a rule, a title, a lead, then the content.
 *
 * Two things were removed from this and are not coming back.
 *
 * A mono index line — `04 / CAPABILITIES` — sat above every title, restating
 * the heading immediately below it in smaller type. The heading is already the
 * largest thing on the screen; numbering it changes nothing about finding it.
 *
 * A right-aligned stat row: `ROWS 6`, `ENTRIES 3`, `UPDATED AUGUST 2026`. It
 * counted the rows of the thing you were already looking at. Both were the same
 * console-dressing instinct as the theme they came from.
 */
export function Section({
  id,
  title,
  lead,
  children,
  className,
}: {
  id: string;
  title: string;
  lead?: string;
  /** optional — a section can be a header that hands off to what follows */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      // scroll-mt clears the fixed header when jumping here from the command
      // palette, the footer links or a /#id deep link
      className={cn("scroll-mt-24 px-gutter py-section", className)}
    >
      <div className="mx-auto w-full max-w-[110rem]">
        <DrawRule />

        <header className="mt-12 flex flex-col gap-7 md:mt-16 md:flex-row md:items-end md:justify-between md:gap-20">
          <BlockReveal as="h2" className="font-display text-title text-balance">
            {title}
          </BlockReveal>
          {lead ? (
            <Reveal direction="up" delay={0.14}>
              <p className="max-w-[44ch] text-lead text-pretty text-muted-foreground md:pb-2">
                {lead}
              </p>
            </Reveal>
          ) : null}
        </header>

        {children ? <div className="mt-20 md:mt-28">{children}</div> : null}
      </div>
    </section>
  );
}

/** Small mono label used above card titles and inside panels. */
export function Label({
  children,
  className,
}: {
  /** optional — a section can be a header that hands off to what follows */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-micro uppercase text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Static hairline, for places that should not animate. */
export function Rule({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-hairline", className)} />;
}
