import { timeline } from "@/lib/content";
import { Reveal } from "@/components/editorial/reveal";
import { Section } from "@/components/editorial/section";

/**
 * 05 · Path.
 *
 * Three entries, down from four. "Student leadership roles" and a "Learning
 * journey" entry describing a trajectory rather than a job were removed —
 * padding a short CV makes it look shorter, not longer.
 *
 * The period sits in the margin and the substance takes the measure, so the
 * column of dates reads as a scale you can scan down.
 */
export function Path() {
  return (
    <Section
      id="path"
      title="Path"
      lead="Where the work has actually happened."
    >
      <ol className="border-t border-hairline">
        {timeline.map((entry, i) => (
          <Reveal
            as="li"
            direction="left"
            key={entry.title}
            delay={i * 0.06}
            className="grid gap-4 border-b border-hairline py-9 md:grid-cols-12 md:gap-10 md:py-12"
          >
            <div className="flex items-baseline gap-3 md:col-span-3 md:flex-col md:gap-2">
              <p className="font-mono text-micro uppercase text-signal">
                {entry.period}
              </p>
              {"current" in entry && entry.current ? (
                <p className="flex items-center gap-2 font-mono text-micro uppercase text-muted-foreground">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
                  </span>
                  Current
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2.5 md:col-span-8 md:col-start-5">
              <h3 className="text-heading text-balance">{entry.title}</h3>
              <p className="font-mono text-micro uppercase text-muted-foreground">
                {entry.org}
              </p>
              <p className="mt-1 max-w-[62ch] text-sm/relaxed text-pretty text-muted-foreground">
                {entry.body}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
