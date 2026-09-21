import { ImageResponse } from "next/og";
import { Contours, OG_SIZE, ogFonts } from "@/lib/og";

export const alt = "Aryaman Bhardwaj — AI Engineer";
export const size = OG_SIZE;
export const contentType = "image/png";

/**
 * The share card.
 *
 * Typeset in the site's own faces — Instrument Serif for the name, JetBrains
 * Mono for the label rows — rather than the runtime default. See lib/og.tsx for
 * how they are loaded and why the previous note against doing it was wrong.
 *
 * The dark case-study card is this one's counterpart: same composition, same
 * contour block, inverted palette. Side by side in a chat client they read as
 * two halves of one system, which is the argument globals.css makes too.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
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
          fontFamily: "Inter",
        }}
      >
        <Contours stroke="#2436d8" />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontFamily: "JetBrains Mono",
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

        {/* 34 rather than 28: Instrument Serif's descender on the "j" of
            Bhardwaj otherwise sits almost on the rule. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Instrument Serif",
              fontSize: 128,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: "#0e0f12",
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
              fontFamily: "JetBrains Mono",
              fontSize: 24,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#63666e",
            }}
          >
            <div style={{ color: "#2436d8" }}>AI Engineer</div>
            <div>Multilingual AI · Geospatial · Full-stack</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [...ogFonts] },
  );
}
