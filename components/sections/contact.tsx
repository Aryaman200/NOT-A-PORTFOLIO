import { ArrowRight, ArrowUpRight } from "lucide-react";
import { contact, site } from "@/lib/content";
import { Reveal } from "@/components/editorial/reveal";
import { BlockReveal } from "@/components/editorial/block-reveal";
import { Section } from "@/components/editorial/section";

/**
 * 06 · Contact.
 *
 * The page's second-largest type lands here on purpose: the last thing a reader
 * sees should be the thing you want them to do. The original closed on a
 * simulated terminal, which buried the four links that matter behind a `help`
 * command nobody types. That terminal became the real command palette; this is
 * the four links, large.
 */
export function Contact() {
  return (
    <Section id="contact" title="Contact" lead={contact.lead}>
      <div className="flex flex-col gap-16 md:gap-24">
        <a
          href={`mailto:${site.email}`}
          className="group inline-flex flex-col gap-7"
        >
          <BlockReveal as="span" className="font-display text-title">
            {contact.headline}
          </BlockReveal>
          <Reveal direction="up" delay={0.2}>
            <span className="flex items-center gap-3 font-mono text-label uppercase text-signal">
              {site.email}
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform duration-500 group-hover:translate-x-1.5"
              />
            </span>
          </Reveal>
        </a>

        <ul>
          {contact.links.map((link, i) => (
            <Reveal as="li" direction="up" key={link.label} delay={i * 0.05}>
              <a
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex items-baseline gap-6 py-6 transition-colors hover:text-signal"
              >
                <span className="font-display text-[clamp(1.25rem,2vw,1.75rem)]">
                  {link.label}
                </span>
                {/* The rule between label and arrow lights on hover, so the whole
                    row reads as one target rather than a link plus decoration. */}
                <span
                  aria-hidden
                  className="h-px flex-1 bg-hairline transition-colors group-hover:bg-signal"
                />
                <ArrowUpRight
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal"
                />
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  );
}
