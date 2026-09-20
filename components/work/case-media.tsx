import Image from "next/image";
import { Reveal } from "@/components/editorial/reveal";
import { Label } from "@/components/editorial/section";
import type { ProjectMedia } from "@/lib/projects";
import { cn } from "@/lib/utils";

/**
 * Screen recordings and stills from the real product.
 *
 * This renders **nothing at all** when a project has no media. A case study
 * with no screenshots should read as finished, not as a page waiting for
 * assets — an empty grid of placeholder frames says "unfinished" far louder
 * than the absence does.
 *
 * Video is muted, looped and `playsInline`, and carries `preload="none"` with a
 * poster: a case page can hold three of these, and three autoloading clips is
 * several megabytes spent before the reader has scrolled to any of them. The
 * poster is what they see until the clip is in view and has buffered.
 *
 * No controls, because there is nothing to control — these are loops of an
 * interface, not footage anyone needs to scrub. They are decorative in the
 * accessibility sense, so each one carries its description in `aria-label` and
 * the caption below it, and none of them are focus stops.
 */
export function CaseMedia({ media }: { media: readonly ProjectMedia[] }) {
  if (media.length === 0) return null;

  return (
    <figure className="mt-20 flex flex-col gap-4 md:mt-28">
      <Label>From the product</Label>
      <div className="grid gap-4 md:grid-cols-2">
        {media.map((item, i) => (
          <Reveal
            key={item.src}
            direction="up"
            delay={Math.min(i, 3) * 0.06}
            className={cn(
              "overflow-hidden rounded-sm border border-hairline bg-card",
              item.wide && "md:col-span-2",
            )}
          >
            {item.kind === "video" ? (
              <video
                src={item.src}
                poster={item.poster}
                aria-label={item.alt}
                autoPlay
                loop
                muted
                playsInline
                preload="none"
                className="block size-full object-cover"
              />
            ) : (
              <Image
                src={item.src}
                alt={item.alt}
                width={1600}
                height={1000}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="block size-full object-cover"
              />
            )}
          </Reveal>
        ))}
      </div>
    </figure>
  );
}
