import { ImageResponse } from "next/og";

export const alt = "Aryaman Bhardwaj — AI Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card.
 *
 * Deliberately typeset in the runtime's default sans rather than the site's
 * Instrument Serif. Loading a custom face here means either a build-time network
 * fetch or shipping a font binary, and both are fragile for one static image.
 * The card carries the brand through composition and colour instead — bone
 * ground, ultramarine rule, the same contour motif as the icon — which survives
 * being scaled down to a thumbnail in a chat client far better than a typeface
 * would.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#f4f2ec",
        padding: "72px 80px",
        position: "relative",
      }}
    >
      {/* Contour bands, bled off the right edge — the terrain motif, quiet
            enough that it never competes with the name. */}
      <svg
        width="620"
        height="630"
        viewBox="0 0 620 630"
        style={{ position: "absolute", right: 0, top: 0 }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            // One curve translated in y, rather than six curves with drifting
            // control points — otherwise they converge into a knot instead of
            // reading as parallel contour lines.
            d={`M0 ${700 + i * 46} C 200 ${520 + i * 46}, 380 ${430 + i * 46}, 620 ${230 + i * 46}`}
            fill="none"
            stroke="#2436d8"
            strokeWidth="2"
            opacity={0.32 - i * 0.04}
          />
        ))}
      </svg>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 22,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#63666e",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "#2436d8",
          }}
        />
        Available for 2026 roles
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 116,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: "#0e0f12",
            fontWeight: 600,
          }}
        >
          <div>Aryaman</div>
          <div>Bhardwaj</div>
        </div>

        <div style={{ display: "flex", height: 2, background: "#2436d8" }} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 26,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#63666e",
          }}
        >
          <div style={{ color: "#2436d8" }}>AI Engineer</div>
          <div>Multilingual AI · Geospatial · Full-stack</div>
        </div>
      </div>
    </div>,
    size,
  );
}
