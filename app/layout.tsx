import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import ClickSpark from "@/components/reactbits/ClickSpark";
import { Cursor } from "@/components/chrome/cursor";
import { PaletteMount } from "@/components/chrome/palette-mount";
import { ENTRANCE_INLINE_SCRIPT } from "@/lib/entrance";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const display = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Aryaman Bhardwaj — AI Engineer",
    template: "%s — Aryaman Bhardwaj",
  },
  description:
    "AI engineer building multilingual language systems, geospatial intelligence and interfaces for complex models. Currently at Anuvadini, part of Bhashini.",
  authors: [{ name: "Aryaman Bhardwaj" }],
  creator: "Aryaman Bhardwaj",
  openGraph: {
    type: "website",
    siteName: "Aryaman Bhardwaj",
    title: "Aryaman Bhardwaj — AI Engineer",
    description:
      "Multilingual AI, geospatial intelligence, and interfaces for complex models.",
    url: SITE_URL,
    locale: "en_GB",
  },
  // Only `card`, deliberately.
  //
  // A `title` here used to pin every page's `twitter:title` to this one string:
  // metadata is inherited, and `generateMetadata` on a case study overrides
  // `openGraph.title` without touching `twitter`. So `/work/nyay` emitted
  // `og:title` "Nyay — Aryaman Bhardwaj" and `twitter:title` "Aryaman Bhardwaj
  // — AI Engineer", and on any client that prefers the `twitter:` tags all four
  // case studies previewed under the homepage's name.
  //
  // Unset, `twitter:title` falls back to the page's own resolved `title`, which
  // is what `twitter:description` was already doing correctly here for exactly
  // the same reason — it was never set, so it was never pinned.
  //
  // No handle is claimed because none is listed anywhere on the site; the
  // creator falls back to the `Person` in the JSON-LD instead.
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ec" },
    { media: "(prefers-color-scheme: dark)", color: "#070912" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The entrance script writes `data-entrance` on this element before React
      // hydrates, which React reports as a mismatch it will not patch up. The
      // attribute is deliberately client-only — it depends on sessionStorage,
      // the pathname and a media query, none of which the server can know — so
      // the mismatch is the design, not a defect. Suppression is one level deep
      // and does not reach any child.
      suppressHydrationWarning
      // globals.css sets `scroll-behavior: smooth`; this attribute tells Next to
      // suppress it during route transitions rather than animating a scroll
      // through the whole page.
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full`}
    >
      <head>
        {/* Sets the opening hold before first paint. It has to run here and
            block: doing it from a React effect paints the writing and then
            hides it, which is a flash rather than an entrance. The script is a
            constant in lib/entrance.ts — no interpolation, nothing from a
            request — so there is no injection surface. */}
        <script dangerouslySetInnerHTML={{ __html: ENTRANCE_INLINE_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        {/* First tab stop on every page. Without it a keyboard reader has to
            traverse the whole header before reaching content, and on the home
            page the content is ~9,600px of pinned chapters after that. */}
        <a
          href="#main"
          className="skip-link press font-mono text-label uppercase"
        >
          Skip to content
        </a>
        {/* Position indicator for the cases the liquid rail cannot serve —
            phones, where it is hidden, and reduced motion, where it freezes. */}
        <div aria-hidden className="scroll-progress" />
        {children}
        {/* Both are viewport-fixed, pointer-events-none and idle until the
            reader does something, and both are mounted at the root so they
            follow through the shell and the lab alike. The spark is the
            cursor's click feedback rather than a separate effect — see the
            note in ClickSpark. */}
        <Cursor />
        {/* Tuned to the cursor dot rather than to the defaults: the sparks
            start at the dot's own edge (it is 8px across) and clear quickly,
            so a click reads as that dot breaking rather than as a separate
            effect that happens to fire at the same coordinates. The colour
            already follows `--signal`, which is the same token the dot uses. */}
        <ClickSpark
          sparkRadius={10}
          sparkSize={7}
          lineWidth={1.25}
          duration={380}
        />
        {/* Reachable with Cmd/Ctrl+K from anywhere. Only the keybinding ships
            on first load; the palette itself arrives on first open. */}
        <PaletteMount />
      </body>
    </html>
  );
}
