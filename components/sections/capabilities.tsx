import Link from "next/link";
import { skills } from "@/lib/content";
import { Reveal } from "@/components/editorial/reveal";
import { Section, Label } from "@/components/editorial/section";

/**
 * 04 · Capabilities.
 *
 * The original was a fake package manifest — `neural-core v9.2`, a progress bar
 * at 92%, LOADED. Invented libraries with self-assigned scores. Nobody can check
 * a number you gave yourself, so it carried no information at all.
 *
 * Every row here names real tools and links to the work that demonstrates it.
 * The evidence column is the point; the capability is just its label.
 */
export function Capabilities() {
  return (
    <Section
      id="capabilities"
      title="Capabilities"
      lead="Each one links to the work that demonstrates it. No self-assigned scores."
    >
      <div className="border-t border-hairline">
        <div className="hidden grid-cols-12 gap-10 border-b border-hairline pb-3 md:grid">
          <Label className="md:col-span-4">Capability</Label>
          <Label className="md:col-span-4">Tools</Label>
          <Label className="md:col-span-4">Evidence</Label>
        </div>

        <dl>
          {skills.map((skill, i) => (
            <Reveal
              direction="right"
              key={skill.capability}
              delay={i * 0.045}
              className="grid gap-4 border-b border-hairline py-7 md:grid-cols-12 md:items-baseline md:gap-10"
            >
              <dt className="text-heading text-balance md:col-span-4">
                {skill.capability}
              </dt>

              <dd className="tag-run gap-y-1.5 font-mono text-micro text-muted-foreground md:col-span-4">
                {skill.tools.map((tool) => (
                  <span key={tool}>{tool}</span>
                ))}
              </dd>

              <dd className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 md:col-span-4">
                {skill.evidence.map((item) =>
                  item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="press px-2 py-1 font-mono text-micro uppercase text-signal"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      key={item.label}
                      className="text-sm text-muted-foreground"
                    >
                      {item.label}
                      {item.note ? (
                        <span className="ml-1.5 font-mono text-micro uppercase opacity-60">
                          {item.note}
                        </span>
                      ) : null}
                    </span>
                  ),
                )}
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </Section>
  );
}
