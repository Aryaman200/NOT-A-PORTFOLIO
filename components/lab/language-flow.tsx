"use client";

import { useArtifactCanvas } from "@/lib/use-artifact-canvas";

/**
 * Nyay — multilingual legal intelligence.
 *
 * v2 represented this with three lines of static text listing scripts, which
 * said "multilingual" without showing what multilingual costs. The actual shape
 * of the problem is routing: a question arrives in one of many languages, has to
 * be understood in a shared representation, and the answer has to come back out
 * in the language it arrived in.
 *
 * So that is what this draws. A query enters from one language node, resolves at
 * the centre, and the response radiates back. The source rotates, because the
 * point is that no language is the privileged one.
 */

const LANGUAGES = [
  { script: "हिन्दी", roman: "Hindi" },
  { script: "ਪੰਜਾਬੀ", roman: "Punjabi" },
  { script: "বাংলা", roman: "Bengali" },
  { script: "తెలుగు", roman: "Telugu" },
  { script: "தமிழ்", roman: "Tamil" },
  { script: "मराठी", roman: "Marathi" },
  { script: "ગુજરાતી", roman: "Gujarati" },
  { script: "English", roman: "English" },
];

/** Seconds one full query cycle takes. */
const CYCLE = 3.4;

export default function LanguageFlow() {
  const canvasRef = useArtifactCanvas(({ ctx, width, height, time, still }) => {
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const R = Math.min(width, height) * 0.34;

    const t = still ? 1.4 : time;
    const cycle = t / CYCLE;
    const activeIndex = Math.floor(cycle) % LANGUAGES.length;
    const phase = cycle % 1;

    const nodes = LANGUAGES.map((lang, i) => {
      const angle = (i / LANGUAGES.length) * Math.PI * 2 - Math.PI / 2;
      return {
        ...lang,
        x: cx + Math.cos(angle) * R,
        y: cy + Math.sin(angle) * R,
        active: i === activeIndex,
      };
    });

    // Spokes
    for (const node of nodes) {
      ctx.strokeStyle = node.active
        ? "rgba(245,181,99,0.4)"
        : "rgba(124,140,255,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(node.x, node.y);
      ctx.stroke();
    }

    // Core — the shared representation everything routes through.
    const coreGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, R * 0.42);
    coreGlow.addColorStop(0, "rgba(124,140,255,0.3)");
    coreGlow.addColorStop(1, "rgba(124,140,255,0)");
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(124,140,255,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 21, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(232,234,242,0.85)";
    ctx.font = '9px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.fillText("NYAY", cx, cy + 3);
    ctx.textAlign = "left";

    const source = nodes[activeIndex];

    // First half of the cycle: the query travels inward from the source.
    if (phase < 0.5) {
      const p = phase / 0.5;
      ctx.fillStyle = "#f5b563";
      ctx.beginPath();
      ctx.arc(
        source.x + (cx - source.x) * p,
        source.y + (cy - source.y) * p,
        3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    } else {
      // Second half: the answer radiates back out to every language at once.
      const p = (phase - 0.5) / 0.5;
      for (const node of nodes) {
        ctx.fillStyle = node.active
          ? "#f5b563"
          : `rgba(124,140,255,${(1 - p * 0.4).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(
          cx + (node.x - cx) * p,
          cy + (node.y - cy) * p,
          node.active ? 3 : 2.2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    // Nodes
    for (const node of nodes) {
      ctx.fillStyle = node.active ? "#f5b563" : "rgba(124,140,255,0.75)";
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.active ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Labels are pushed outward along the spoke and aligned by which side of
      // the circle they sit on, so nothing collides with the ring.
      const outX = node.x + (node.x - cx) * 0.2;
      const outY = node.y + (node.y - cy) * 0.2;
      ctx.textAlign =
        outX < cx - 6 ? "right" : outX > cx + 6 ? "left" : "center";
      ctx.fillStyle = node.active
        ? "rgba(245,181,99,0.95)"
        : "rgba(232,234,242,0.6)";
      ctx.font = '13px system-ui, "Noto Sans", sans-serif';
      ctx.fillText(node.script, outX, outY + 4);
    }
    ctx.textAlign = "left";
  });

  return (
    <canvas
      ref={canvasRef}
      className="size-full"
      role="img"
      aria-label="Eight Indian languages arranged around a central Nyay core. A query travels inward from one language and the answer radiates back out to all of them; the source language rotates."
    />
  );
}
