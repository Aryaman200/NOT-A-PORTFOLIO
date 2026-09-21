"use client";

import { useEffect, useRef, useState } from "react";
import { useArtifactCanvas } from "@/lib/use-artifact-canvas";

/**
 * Adaptive Traffic Dashboard — a signal-controlled grid you can actually poke.
 *
 * v2 drew cars sliding along fixed lanes with a hardcoded "congested" corridor.
 * Nothing was simulated; the congestion was a colour. This runs a real (if
 * small) model: vehicles queue at red signals, signals hold a cycle, and in
 * adaptive mode each intersection measures the queue on both axes and gives
 * green to whichever is longer, subject to a minimum green time.
 *
 * The point of the controls is that the claim is falsifiable. Turn adaptivity
 * off, raise density, and throughput drops — the number moves because the model
 * moves, not because a label says "ADAPTIVE".
 */

const ROWS = [0.18, 0.4, 0.62, 0.84]; // horizontal roads, fraction of height
const COLS = [0.12, 0.32, 0.5, 0.68, 0.88]; // vertical roads, fraction of width

const MIN_GREEN = 2.2; // seconds — stops adaptive mode flapping every frame
const FIXED_CYCLE = 4.5; // seconds per phase when adaptive is off

type Vehicle = {
  axis: "h" | "v";
  lane: number;
  /** 0..1 along its road */
  pos: number;
  speed: number;
  dir: 1 | -1;
  stopped: boolean;
};

type Intersection = {
  col: number;
  row: number;
  /** which axis currently has green */
  green: "h" | "v";
  since: number;
};

export default function TrafficGrid() {
  const [density, setDensity] = useState(28);
  const [adaptive, setAdaptive] = useState(true);
  const [metrics, setMetrics] = useState({ throughput: 0, flow: 100 });

  // Control values are read inside the animation loop, so they live in refs.
  // Written from an effect, never during render.
  const densityRef = useRef(density);
  const adaptiveRef = useRef(adaptive);
  useEffect(() => {
    densityRef.current = density;
    adaptiveRef.current = adaptive;
  }, [density, adaptive]);

  const vehiclesRef = useRef<Vehicle[]>([]);
  const lastRef = useRef(0);
  const completedRef = useRef(0);
  const windowStartRef = useRef(0);
  const speedSumRef = useRef({ sum: 0, n: 0 });
  // Completions are bursty: at this fleet size a one-second window swings
  // between 0 and ~180/min, which is useless for comparing adaptive on against
  // adaptive off. An exponential moving average settles in about five seconds
  // and still responds to a real change in the model.
  const throughputEmaRef = useRef<number | null>(null);

  // The signal grid is mutated in place every frame, so it lives in a ref.
  // A useMemo result is treated as immutable by the React compiler and mutating
  // one is a genuine correctness hazard, not just a lint complaint.
  const gridRef = useRef<Intersection[]>([]);

  const canvasRef = useArtifactCanvas(({ ctx, width, height, time, still }) => {
    const dt = still ? 0 : Math.min(0.05, time - lastRef.current);
    lastRef.current = time;

    // Lazy init inside the loop, so it cannot race the effect that starts it.
    if (gridRef.current.length === 0) {
      for (let c = 0; c < COLS.length; c++) {
        for (let r = 0; r < ROWS.length; r++) {
          gridRef.current.push({ col: c, row: r, green: "h", since: 0 });
        }
      }
    }
    const grid = gridRef.current;

    const vehicles = vehiclesRef.current;
    const target = densityRef.current;

    // Grow or shrink the fleet toward the requested density.
    while (vehicles.length < target) {
      const horizontal = vehicles.length % 2 === 0;
      vehicles.push({
        axis: horizontal ? "h" : "v",
        lane: Math.floor(
          Math.random() * (horizontal ? ROWS.length : COLS.length),
        ),
        pos: Math.random(),
        speed: 0.045 + Math.random() * 0.03,
        dir: Math.random() > 0.5 ? 1 : -1,
        stopped: false,
      });
    }
    if (vehicles.length > target) vehicles.length = target;

    // ---- signals -------------------------------------------------------
    for (const node of grid) {
      node.since += dt;

      if (!adaptiveRef.current) {
        if (node.since >= FIXED_CYCLE) {
          node.green = node.green === "h" ? "v" : "h";
          node.since = 0;
        }
        continue;
      }

      if (node.since < MIN_GREEN) continue;

      // Queue pressure: vehicles stopped within reach of this intersection.
      const cx = COLS[node.col];
      const cy = ROWS[node.row];
      let hQueue = 0;
      let vQueue = 0;
      for (const v of vehicles) {
        if (!v.stopped) continue;
        if (v.axis === "h" && v.lane === node.row) {
          if (Math.abs(v.pos - cx) < 0.09) hQueue++;
        } else if (v.axis === "v" && v.lane === node.col) {
          if (Math.abs(v.pos - cy) < 0.09) vQueue++;
        }
      }

      const wants: "h" | "v" = hQueue >= vQueue ? "h" : "v";
      if (wants !== node.green) {
        node.green = wants;
        node.since = 0;
      }
    }

    // ---- vehicles ------------------------------------------------------
    let moving = 0;
    for (const v of vehicles) {
      const along = v.axis === "h" ? COLS : ROWS;
      const crossIndex = v.axis === "h" ? "col" : "row";

      // Is there a red light just ahead?
      v.stopped = false;
      for (let i = 0; i < along.length; i++) {
        const node = grid.find(
          (n) =>
            n[crossIndex] === i &&
            (v.axis === "h" ? n.row === v.lane : n.col === v.lane),
        );
        if (!node || node.green === v.axis) continue;

        const gap = (along[i] - v.pos) * v.dir;
        if (gap > 0 && gap < 0.035) {
          v.stopped = true;
          break;
        }
      }

      if (!v.stopped) {
        v.pos += v.speed * v.dir * dt;
        moving++;
        if (v.pos > 1) {
          v.pos = 0;
          completedRef.current++;
        }
        if (v.pos < 0) {
          v.pos = 1;
          completedRef.current++;
        }
      }
    }

    speedSumRef.current.sum += vehicles.length ? moving / vehicles.length : 0;
    speedSumRef.current.n++;

    // ---- draw ----------------------------------------------------------
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(124,140,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(124,140,255,0.1)";
    for (const r of ROWS) {
      ctx.beginPath();
      ctx.moveTo(0, r * height);
      ctx.lineTo(width, r * height);
      ctx.stroke();
    }
    for (const c of COLS) {
      ctx.beginPath();
      ctx.moveTo(c * width, 0);
      ctx.lineTo(c * width, height);
      ctx.stroke();
    }

    // Signals — the colour is the state, not decoration.
    for (const node of grid) {
      const x = COLS[node.col] * width;
      const y = ROWS[node.row] * height;
      ctx.fillStyle =
        node.green === "h" ? "rgba(124,140,255,0.9)" : "rgba(245,181,99,0.9)";
      ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
    }

    for (const v of vehicles) {
      const x = v.axis === "h" ? v.pos * width : COLS[v.lane] * width;
      const y = v.axis === "h" ? ROWS[v.lane] * height : v.pos * height;
      ctx.fillStyle = v.stopped ? "#f5b563" : "#7c8cff";
      if (v.axis === "h") ctx.fillRect(x - 3, y - 1.5, 6, 3);
      else ctx.fillRect(x - 1.5, y - 3, 3, 6);
    }

    // ---- metrics, sampled once a second --------------------------------
    if (!still && time - windowStartRef.current >= 1) {
      const elapsed = time - windowStartRef.current;
      const instantaneous = (completedRef.current / elapsed) * 60;
      throughputEmaRef.current =
        throughputEmaRef.current === null
          ? instantaneous
          : throughputEmaRef.current * 0.78 + instantaneous * 0.22;
      const perMin = Math.round(throughputEmaRef.current);
      const flow = Math.round(
        (speedSumRef.current.sum / Math.max(1, speedSumRef.current.n)) * 100,
      );
      setMetrics({ throughput: perMin, flow });
      completedRef.current = 0;
      windowStartRef.current = time;
      speedSumRef.current = { sum: 0, n: 0 };
    }
  });

  // Changing the mode invalidates the running average, otherwise the previous
  // regime's numbers bleed into the new one for a second.
  useEffect(() => {
    completedRef.current = 0;
    speedSumRef.current = { sum: 0, n: 0 };
    // Drop the average too, or the previous regime bleeds into the new one for
    // several seconds and hides the very change the control is demonstrating.
    throughputEmaRef.current = null;
  }, [adaptive, density]);

  return (
    <div className="flex size-full flex-col gap-4">
      <canvas
        ref={canvasRef}
        className="min-h-0 flex-1"
        role="img"
        // The figures are the toy model's own, and the label has to say so.
        // It previously read "throughput 5 vehicles per minute" with no framing,
        // which announced a simulated number as a measured result — to screen
        // reader users only, and on a project registry whose header rule is "no
        // invented numbers". Sighted readers get the same framing from
        // `artifactNote` above the canvas.
        aria-label={`Simulated city grid. In this toy model: ${density} vehicles, adaptive signals ${adaptive ? "on" : "off"}, modelled throughput ${metrics.throughput} vehicles per minute, ${metrics.flow}% of vehicles moving. These are the simulation's figures, not measurements from a real junction.`}
      />

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 font-mono text-micro uppercase">
        <label data-cursor="Adjust" className="flex items-center gap-3">
          <span className="text-muted-foreground">Density</span>
          <input
            type="range"
            min={6}
            max={70}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="h-1 w-28 cursor-pointer appearance-none bg-hairline accent-signal"
          />
          <span className="w-6 tabular-nums text-foreground">{density}</span>
        </label>

        <label data-cursor="Toggle" className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={adaptive}
            onChange={(e) => setAdaptive(e.target.checked)}
            className="size-3.5 cursor-pointer rounded-none accent-signal"
          />
          <span className={adaptive ? "text-signal" : "text-muted-foreground"}>
            Adaptive signals
          </span>
        </label>

        <span className="flex items-center gap-2">
          <span className="text-muted-foreground">Throughput</span>
          <span className="tabular-nums text-foreground">
            {metrics.throughput}/min
          </span>
        </span>

        <span className="flex items-center gap-2">
          <span className="text-muted-foreground">Flowing</span>
          <span className="tabular-nums text-foreground">{metrics.flow}%</span>
        </span>
      </div>
    </div>
  );
}
