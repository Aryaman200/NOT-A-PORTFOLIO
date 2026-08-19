import { about } from "@/lib/content";
import { Reveal } from "@/components/editorial/reveal";
import { TextReveal } from "@/components/editorial/text-reveal";
import { Section, Label } from "@/components/editorial/section";
import { cn } from "@/lib/utils";

/**
 * 02 · About.
 *
 * Absorbs two sections that used to exist separately. "Vision" was six numbered
 * directives and "Operating principles" was four bullets; both said the same
 * thing at different lengths. They are now the single statement below, set at
 * reading size and given the space to be read once properly instead of skimmed
 * twice.
 *
 * The three cards that follow are facts with dates attached, not adjectives.
 */
export function About() {
  return (
    <Section id="about" title="About" lead={about.lead}>
      <div className="flex flex-col gap-20 md:gap-28">
        <TextReveal
          as="p"
          className="max-w-[34ch] font-display text-[clamp(1.75rem,3.4vw,3rem)] leading-[1.12] tracking-[-0.02em] text-balance"
          stagger={0.028}
        >
          {about.manifesto}
        </TextReveal>

        <div className="grid gap-px border border-hairline bg-hairline md:grid-cols-2">
          {about.cards.map((card, i) => (
            // Background lives on the static cell so an un-revealed card never
            // shows the parent's hairline colour as a solid block.
            <div
              key={card.label}
              className={cn(
                "bg-background p-7 md:p-9",
                card.wide && "md:col-span-2",
              )}
            >
              <Reveal
                direction="up"
                delay={i * 0.06}
                className="flex flex-col gap-3"
              >
                <Label className="text-signal">{card.label}</Label>
                <h3 className="text-heading text-balance">{card.title}</h3>
                <p className="max-w-[62ch] text-sm/relaxed text-pretty text-muted-foreground">
                  {card.body}
                </p>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
