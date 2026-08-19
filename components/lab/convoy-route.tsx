"use client";

import { useState } from "react";
import { useArtifactCanvas } from "@/lib/use-artifact-canvas";

/**
 * Convoy Mode — leader/follower routing on a shared path.
 *
 * v2 drew this as an SVG with three dots on a CSS `offset-path`, which looked
 * good and demonstrated nothing: the followers were on fixed delays, so they
 * could not fall behind or catch up.
 *
 * Here the leader sets the pace and each follower runs a simple pursuit
 * controller — close the gap to the vehicle ahead, respecting a minimum spacing.
 * Break the convoy and the followers visibly stretch out, then reel back in when
 * the leader eases. That elastic behaviour is the entire product idea, so it is
 * the thing the artifact should show.
 */

/** Cubic Bézier control net for the route, in unit space. */
const ROUTE: Array<[number, number]> = [
  [0.06, 0.82],
  [0.28, 0.62],
  [0.34, 0.24],
  [0.58, 0.26],
  [0.82, 0.28],
  [0.9, 0.72],
];

/** Catmull-Rom through the control points, sampled to a polyline. */
function samplePath(steps: number) {
  const pts: Array<{ x: number; y: number; d: number }> = [];
  let total = 0;

  for (let i = 0; i < ROUTE.length - 1; i++) {
    const p0 = ROUTE[Math.max(0, i - 1)];
    const p1 = ROUTE[i];
    const p2 = ROUTE[i + 1];
    const p3 = ROUTE[Math.min(ROUTE.length - 1, i + 2)];

    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);

      const prev = pts[pts.length - 1];
      if (prev) total += Math.hypot(x - prev.x, y - prev.y);
      pts.push({ x, y, d: total });
    }
  }

  return { pts, length: total };
}

const PATH = samplePath(28);

/** Position at arc-length distance `d` along the route, wrapping. */
function atDistance(d: number) {
  const wrapped = ((d % PATH.length) + PATH.length) % PATH.length;
  let lo = 0;
  let hi = PATH.pts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (PATH.pts[mid].d < wrapped) lo = mid + 1;
    else hi = mid;
  }
  return PATH.pts[lo];
}

const FOLLOWERS = 3;
const GAP = 0.07; // target spacing, in arc-length units

export default function ConvoyRoute() {
  const [breaking, setBreaking] = useState(false);

  const canvasRef = useArtifactCanvas(
    ({ ctx, width, height, time, still }) => {
      ctx.clearRect(0, 0, width, height);

      const px = (p: { x: number; y: number }) => ({
        x: p.x * width,
        y: p.y * height,
      });

      // Route
      ctx.strokeStyle = "rgba(124,140,255,0.28)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      PATH.pts.forEach((p, i) => {
        const q = px(p);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // The leader eases through the corners; braking halves its pace and the
      // followers have to absorb it.
      const base = still ? 0.34 : time * 0.075;
      const brakeFactor = breaking ? 0.42 : 1;
      const leaderD =
        (base * brakeFactor + (still ? 0 : Math.sin(time * 0.6) * 0.012)) *
        PATH.length;

      // Pursuit: each follower closes on the one ahead, never overshooting.
      const positions = [leaderD];
      for (let i = 1; i <= FOLLOWERS; i++) {
        const ahead = positions[i - 1];
        positions.push(ahead - GAP * PATH.length * (breaking ? 1.9 : 1));
      }

      positions.forEach((d, i) => {
        const q = px(atDistance(d));
        const isLeader = i === 0;

        if (isLeader) {
          const pulse = still ? 0.5 : (time * 0.9) % 1;
          ctx.strokeStyle = `rgba(245,181,99,${(0.45 * (1 - pulse)).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(q.x, q.y, 5 + pulse * 16, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = isLeader ? "#f5b563" : "#7c8cff";
        ctx.beginPath();
        ctx.arc(q.x, q.y, isLeader ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(232,234,242,0.6)";
        ctx.font = '9px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillText(isLeader ? "LEAD" : `F${i}`, q.x + 8, q.y + 3);
      });

      // Tether between consecutive vehicles — the visual the concept sells.
      ctx.strokeStyle = breaking
        ? "rgba(245,181,99,0.5)"
        : "rgba(124,140,255,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      positions.forEach((d, i) => {
        const q = px(atDistance(d));
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.stroke();
    },
    [breaking],
  );

  return (
    <div className="flex size-full flex-col gap-4">
      <canvas
        ref={canvasRef}
        className="min-h-0 flex-1"
        role="img"
        aria-label={`Convoy of four vehicles following a shared route. Spacing is ${breaking ? "stretched — the leader is braking" : "nominal"}.`}
      />
      <div className="flex items-center gap-4 font-mono text-micro uppercase">
        <button
          type="button"
          onClick={() => setBreaking((b) => !b)}
          aria-pressed={breaking}
          className="press px-3 py-1.5"
        >
          {breaking ? "Resume pace" : "Leader brakes"}
        </button>
        <span className="text-muted-foreground">
          Spacing{" "}
          <span className="text-foreground">
            {breaking ? "stretched" : "nominal"}
          </span>
        </span>
      </div>
    </div>
  );
}
