"use client";

/**
 * Adapted from React Bits — `@react-bits/ClickSpark-TS-TW`.
 *
 * Upstream is written to wrap a bounded box. Mounting it around a whole page
 * breaks in four ways, so this version differs deliberately:
 *
 * 1. **Fixed viewport canvas, not a parent-sized one.** Upstream sizes the
 *    canvas to `parent.getBoundingClientRect()`. The home page is ~9,600px
 *    tall, which would allocate a canvas of roughly 800 × 9,600 × 4 bytes
 *    (~30 MB) and repaint all of it every frame.
 * 2. **The rAF loop stops when idle.** Upstream runs `requestAnimationFrame`
 *    forever, drawing nothing between clicks. Here the loop starts on a click
 *    and cancels itself once the last spark expires.
 * 3. **Device pixel ratio.** Upstream draws at CSS pixels, so sparks are blurry
 *    on any HiDPI screen.
 * 4. **No layout wrapper.** Upstream returns `<div class="relative w-full h-full">`
 *    around its children. This renders only the canvas and listens on `window`,
 *    so it can be dropped into the root layout without affecting layout at all.
 *
 * Also added: `prefers-reduced-motion` support (renders nothing), and the spark
 * colour is read from the live `--signal` token at click time so it follows the
 * shell/lab palette flip instead of being hardcoded.
 */

import { useEffect, useRef } from "react";

type Spark = { x: number; y: number; angle: number; startTime: number };

type ClickSparkProps = {
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  /** ms */
  duration?: number;
  lineWidth?: number;
};

export default function ClickSpark({
  sparkSize = 9,
  sparkRadius = 16,
  sparkCount = 8,
  duration = 420,
  lineWidth = 1.5,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const frameRef = useRef<number | null>(null);
  const colorRef = useRef<string>("#2436d8");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const easeOut = (t: number) => t * (2 - t);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Declared as a plain local so it can safely reference itself. Memoising it
    // and recursing through the memoised binding lets an in-flight frame call a
    // stale copy after a prop change.
    const loop = (timestamp: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;

        const eased = easeOut(elapsed / duration);
        const distance = eased * sparkRadius;
        const length = sparkSize * (1 - eased);
        const cos = Math.cos(spark.angle);
        const sin = Math.sin(spark.angle);

        ctx.strokeStyle = colorRef.current;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = 1 - eased;
        ctx.beginPath();
        ctx.moveTo(spark.x + distance * cos, spark.y + distance * sin);
        ctx.lineTo(
          spark.x + (distance + length) * cos,
          spark.y + (distance + length) * sin,
        );
        ctx.stroke();

        return true;
      });

      ctx.globalAlpha = 1;

      // Stop entirely when nothing is left to draw, rather than idling forever.
      frameRef.current =
        sparksRef.current.length > 0 ? requestAnimationFrame(loop) : null;
    };

    const onPointerDown = (event: PointerEvent) => {
      const now = performance.now();
      // Resolve --signal from the clicked element, not from :root. The lab
      // palette is applied by a `.dark` class on a wrapper inside <body>, so
      // reading documentElement would always return the light-shell value.
      const source =
        event.target instanceof Element ? event.target : document.body;
      colorRef.current =
        getComputedStyle(source).getPropertyValue("--signal").trim() ||
        colorRef.current;

      for (let i = 0; i < sparkCount; i++) {
        sparksRef.current.push({
          x: event.clientX,
          y: event.clientY,
          angle: (2 * Math.PI * i) / sparkCount,
          startTime: now,
        });
      }

      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(loop);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onPointerDown);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      sparksRef.current = [];
    };
  }, [duration, sparkRadius, sparkSize, lineWidth, sparkCount]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60]"
    />
  );
}
