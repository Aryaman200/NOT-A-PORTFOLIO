"use client";

import { useMemo } from "react";
import { useArtifactCanvas } from "@/lib/use-artifact-canvas";

/**
 * God's Eye — a rotating intelligence globe.
 *
 * Ported from v2's `globe()` canvas, which plotted a Fibonacci sphere and
 * rotated it. That part was already good and is kept verbatim in spirit; what it
 * lacked was any reason to look at it twice, so this adds the thing the project
 * is actually about: signals arriving at real coordinates.
 *
 * Stations are real cities. Each one pulses when a signal lands, and arcs trace
 * between them along great-circle paths, so the globe reads as a system doing
 * something rather than a decorative spinner.
 */

/** [label, latitude, longitude] */
const STATIONS: Array<[string, number, number]> = [
  ["DEL", 28.61, 77.21],
  ["LDN", 51.51, -0.13],
  ["NYC", 40.71, -74.01],
  ["SIN", 1.35, 103.82],
  ["SAO", -23.55, -46.63],
  ["NBO", -1.29, 36.82],
  ["TOK", 35.68, 139.69],
  ["SYD", -33.87, 151.21],
];

const toVec = (lat: number, lon: number): [number, number, number] => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ];
};

export default function IntelGlobe() {
  // Fibonacci sphere — even point distribution without pole clustering.
  const dots = useMemo(() => {
    const points: Array<[number, number, number]> = [];
    const N = 620;
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = i * 2.399963; // golden angle
      points.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
    }
    return points;
  }, []);

  const stations = useMemo(
    () => STATIONS.map(([label, lat, lon]) => ({ label, v: toVec(lat, lon) })),
    [],
  );

  const canvasRef = useArtifactCanvas(({ ctx, width, height, time, still }) => {
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const R = Math.min(width, height) * 0.42;
    const spin = still ? 0.8 : time * 0.16;
    const cos = Math.cos(spin);
    const sin = Math.sin(spin);

    /** Rotate about Y, then project. `depth` 0 = far side, 1 = near side. */
    const project = (v: [number, number, number]) => {
      const x = v[0] * cos - v[2] * sin;
      const z = v[0] * sin + v[2] * cos;
      return { x: cx + x * R, y: cy + v[1] * R, depth: (z + 1) / 2 };
    };

    // Atmosphere
    const glow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.28);
    glow.addColorStop(0, "rgba(124,140,255,0.16)");
    glow.addColorStop(1, "rgba(124,140,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.28, 0, Math.PI * 2);
    ctx.fill();

    // Limb
    ctx.strokeStyle = "rgba(124,140,255,0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // Landmass stand-in: near-side dots read solid, far-side dots fade out, so
    // the sphere reads as a sphere without any texture data.
    for (const d of dots) {
      const p = project(d);
      const alpha = 0.06 + p.depth * 0.5;
      const size = 0.5 + p.depth * 1.5;
      ctx.fillStyle = `rgba(124,140,255,${alpha.toFixed(3)})`;
      ctx.fillRect(p.x, p.y, size, size);
    }

    // Signal arcs between consecutive stations, drawn as quadratic curves
    // bulging away from the surface.
    for (let i = 0; i < stations.length; i++) {
      const a = project(stations[i].v);
      const b = project(stations[(i + 3) % stations.length].v);
      if (a.depth < 0.42 && b.depth < 0.42) continue;

      const phase = still ? 0.6 : (time * 0.34 + i * 0.27) % 1;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const lift = 1 - Math.hypot(mx - cx, my - cy) / R;
      const cxp = mx + (mx - cx) * 0.28 * lift;
      const cyp = my + (my - cy) * 0.28 * lift;

      ctx.strokeStyle = `rgba(124,140,255,${(0.1 + 0.2 * Math.min(a.depth, b.depth)).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(cxp, cyp, b.x, b.y);
      ctx.stroke();

      // Packet travelling the arc
      const t = phase;
      const px = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cxp + t * t * b.x;
      const py = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cyp + t * t * b.y;
      ctx.fillStyle = "rgba(245,181,99,0.95)";
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stations, near side only
    for (const [i, station] of stations.entries()) {
      const p = project(station.v);
      if (p.depth < 0.5) continue;

      const pulse = still ? 0.5 : (time * 0.7 + i * 0.4) % 1;
      ctx.strokeStyle = `rgba(245,181,99,${(0.5 * (1 - pulse)).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 + pulse * 13, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#f5b563";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(232,234,242,0.72)";
      ctx.font = '9px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillText(station.label, p.x + 7, p.y + 3);
    }
  });

  return (
    <canvas
      ref={canvasRef}
      className="size-full"
      role="img"
      aria-label="Illustration: a rotating globe plotting eight fixed city markers, with arcs drawn between them. The points and traffic are hardcoded, not live collection."
    />
  );
}
