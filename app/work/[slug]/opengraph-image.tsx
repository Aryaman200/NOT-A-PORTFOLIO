import { ImageResponse } from "next/og";
import { getProject, projectSlugs } from "@/lib/projects";
import { Contours, OG_SIZE, ogFonts } from "@/lib/og";

export const alt = "Case study";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return projectSlugs.map((slug) => ({ slug }));
}

const STATE_COPY = {
  shipped: "Shipped",
  concept: "Concept",
  research: "Research",
} as const;

/**
 * The share card for a case study.
 *
 * Dark ground, because that is the ground the page itself sits on — a link
 * preview that does not match the page it opens is a small broken promise. The
 * homepage card is the bone counterpart.
 *
 * Every field is read from lib/projects.ts, so a card can never claim a stack
 * or a state the case study does not.
 */
export default async function CaseOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);

  const title = project?.title ?? "Work";
  const tagline = project?.tagline ?? "";
  const stack = project?.stack.join(" · ") ?? "";
  const state = project ? STATE_COPY[project.state] : "";
  const year = project?.year ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#070912",
          padding: "72px 80px",
          position: "relative",
          fontFamily: "Inter",
        }}
      >
        {/* Periwinkle on navy, against the homepage card's ultramarine on
            bone — one motif, two palettes. */}
        <Contours stroke="#7c8cff" />

        <div
          style={{
            display: "flex",
            gap: 28,
            fontFamily: "JetBrains Mono",
            fontSize: 22,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#a8aec4",
          }}
        >
          <div style={{ color: "#7c8cff" }}>{state}</div>
          <div>{year}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Instrument Serif",
              fontSize: 116,
              lineHeight: 1,
              letterSpacing: "-0.015em",
              color: "#e8eaf2",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 30,
              lineHeight: 1.35,
              color: "#a8aec4",
              maxWidth: 900,
            }}
          >
            {tagline}
          </div>

          <div style={{ display: "flex", height: 2, background: "#7c8cff" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "JetBrains Mono",
              fontSize: 22,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#8e93ad",
            }}
          >
            <div>{stack}</div>
            <div style={{ color: "#7c8cff" }}>Aryaman Bhardwaj</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [...ogFonts] },
  );
}
