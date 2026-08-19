import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import ClickSpark from "@/components/reactbits/ClickSpark";
import { PaletteMount } from "@/components/chrome/palette-mount";
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
      // globals.css sets `scroll-behavior: smooth`; this attribute tells Next to
      // suppress it during route transitions rather than animating a scroll
      // through the whole page.
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        {/* Viewport-fixed, pointer-events-none, idle until a click. Mounted at
            the root so it follows the reader through both grounds. */}
        <ClickSpark />
        {/* Reachable with Cmd/Ctrl+K from anywhere. Only the keybinding ships
            on first load; the palette itself arrives on first open. */}
        <PaletteMount />
      </body>
    </html>
  );
}
