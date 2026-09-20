import { ImageResponse } from "next/og";
import { getProject, projectSlugs } from "@/lib/projects";

export const alt = "Case study";
export const size = { width: 1200, height: 630 };
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
 * homepage card is the bone counterpart; side by side in a chat client they read
 * as two halves of one system, which is the same argument globals.css makes.
 *
 * Default sans rather than Instrument Serif, for the reason given on the
 * homepage card: a custom face here means a build-time network fetch or a font
 * binary in the repo, and neither is worth it for a static image that is mostly
 * seen at thumbnail size.
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
        }}
      >
        {/* Same contour motif as the homepage card, rotated into the dark
            palette — periwinkle on navy instead of ultramarine on bone. */}
        <svg
          width="620"
          height="630"
          viewBox="0 0 620 630"
          style={{ position: "absolute", right: 0, top: 0 }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M0 ${700 + i * 46} C 200 ${520 + i * 46}, 380 ${430 + i * 46}, 620 ${230 + i * 46}`}
              fill="none"
              stroke="#7c8cff"
              strokeWidth="2"
              opacity={0.34 - i * 0.045}
            />
          ))}
        </svg>

        <div
          style={{
            display: "flex",
            gap: 28,
            fontSize: 22,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#a8aec4",
          }}
        >
          <div style={{ color: "#7c8cff" }}>{state}</div>
          <div>{year}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              fontSize: 104,
              lineHeight: 1,
              letterSpacing: "-0.035em",
              color: "#e8eaf2",
              fontWeight: 600,
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
              fontSize: 24,
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
    size,
  );
}
