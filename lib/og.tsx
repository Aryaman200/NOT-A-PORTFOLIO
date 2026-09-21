import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * What both share cards are built from.
 *
 * The two `opengraph-image.tsx` routes differ only in palette and content, so
 * the typeface loading and the contour motif live here rather than being
 * written twice and drifting apart — which is the same argument every other
 * derived thing on this site makes.
 */

/**
 * The site's three faces, as files in the repo.
 *
 * Both cards previously rendered in the runtime's default sans, defended in a
 * comment as avoiding "a build-time network fetch or shipping a font binary,
 * and both are fragile". The second half is true and the conclusion was wrong:
 * `node_modules/next/dist/docs/.../opengraph-image.md` documents exactly this —
 * a `readFile` of a local file at module scope. There is no network, it happens
 * once at build, and the three faces together are 75KB. The cost was a share
 * card that looked like nothing else on the site.
 *
 * Read at module scope so the files are loaded once per process rather than per
 * image. `.woff`, not `.woff2`: Satori does not decode WOFF2, and the failure
 * mode is a silent fall back to the default sans — the exact thing this fixes.
 *
 * Vendored from the `@fontsource/*` packages rather than depended on, so the
 * build does not resolve a path inside `node_modules`. Licences sit beside them
 * in `assets/`; all three are SIL OFL.
 */
const load = (file: string) => readFile(join(process.cwd(), "assets", file));

const [serif, sans, mono] = await Promise.all([
  load("InstrumentSerif-Regular.woff"),
  load("Inter-Regular.woff"),
  load("JetBrainsMono-Regular.woff"),
]);

/**
 * Instrument Serif ships a single weight. Asking for 600 anywhere would make
 * Satori synthesise a bold or drop to a fallback, so every face is declared at
 * 400 and no card asks for anything heavier.
 */
export const ogFonts = [
  { name: "Instrument Serif", data: serif, style: "normal", weight: 400 },
  { name: "Inter", data: sans, style: "normal", weight: 400 },
  { name: "JetBrains Mono", data: mono, style: "normal", weight: 400 },
] as const;

/** The card is always 1200x630; the contour block occupies its top right. */
export const OG_SIZE = { width: 1200, height: 630 };

const BANDS = [0, 1, 2, 3, 4, 5];

/**
 * The terrain motif — the same device as the icon and the hero field.
 *
 * The first version drew six copies of one curve running from `y = 700` to
 * `y = 230` inside a 630-tall viewBox. Most of each curve was below the canvas,
 * so all that rendered was the near-straight tail of each one, bunched into the
 * lower right and crossing both the rule and the type beneath it. It was a
 * faint diagonal hatch over the text, not a set of contour lines.
 *
 * Two things fix it. The bands are confined to the top of the card, above every
 * line of type on either layout, so nothing ever reads through them. And each
 * band starts further right than the one below it, which is what stops six
 * paths beginning on the same x from forming a hard vertical seam down the
 * middle of the card — the stagger is the reason this can be a 620-wide block
 * anchored right instead of needing a gradient Satori would not render anyway.
 *
 * Opacity rises toward the bottom of the stack: the nearest ridge is the most
 * present one, and the ones above it recede.
 */
export function Contours({ stroke }: { stroke: string }) {
  return (
    <svg
      width="620"
      height="630"
      viewBox="0 0 620 630"
      style={{ position: "absolute", right: 0, top: 0 }}
    >
      {BANDS.map((i) => {
        // Top band is shortest and sits furthest right; the lowest spans the
        // full block. Together they open downward-left, like a ridge line.
        const x0 = (BANDS.length - 1 - i) * 56;
        const y = 16 + i * 40;
        const span = 620 - x0;

        return (
          <path
            key={i}
            // Shallow on purpose. At the amplitude this started with, the
            // bands read as ripples on water rather than as contour lines on
            // ground, and adjacent ones came close enough to touch.
            d={
              `M${x0} ${y}` +
              ` C ${x0 + span * 0.26} ${y - 19},` +
              ` ${x0 + span * 0.52} ${y + 15},` +
              ` ${x0 + span * 0.72} ${y - 4}` +
              ` S ${x0 + span * 0.89} ${y - 23}, 620 ${y - 14}`
            }
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            opacity={0.13 + i * 0.042}
          />
        );
      })}
    </svg>
  );
}
