"use client";

import { useEffect, useRef } from "react";

export type DrawContext = {
  ctx: CanvasRenderingContext2D;
  /** CSS pixels, not device pixels — the transform is already applied */
  width: number;
  height: number;
  /** seconds since the artifact started */
  time: number;
  /** true on the single frame drawn for reduced-motion visitors */
  still: boolean;
};

/**
 * Shared plumbing for every chapter artifact.
 *
 * All four are canvas rather than WebGL on purpose. The hero already holds a
 * WebGL context for the terrain; browsers cap simultaneous contexts (commonly
 * 8–16, and lower on mobile) and silently kill the oldest when the cap is hit.
 * Four more contexts on one page is how you get a hero that goes black once the
 * reader reaches the fourth project.
 *
 * Handles: device pixel ratio, resize, pausing when off screen, teardown, and
 * `prefers-reduced-motion` (one representative frame, no loop).
 */
export function useArtifactCanvas(
  draw: (frame: DrawContext) => void,
  deps: unknown[] = [],
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Latest-callback ref, written in an effect rather than during render so the
  // draw closure can be recreated freely without restarting the loop.
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let frame = 0;
    let running = false;
    const born = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduceMotion) {
        // Redraw the still frame at the new size rather than leaving it stretched.
        drawRef.current({ ctx, width, height, time: 2.4, still: true });
      }
    };

    const loop = () => {
      if (!running) return;
      drawRef.current({
        ctx,
        width,
        height,
        time: (performance.now() - born) / 1000,
        still: false,
      });
      frame = requestAnimationFrame(loop);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (reduceMotion) return;
        if (entry.isIntersecting && !running) {
          running = true;
          frame = requestAnimationFrame(loop);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(frame);
        }
      },
      { rootMargin: "120px" },
    );

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    if (reduceMotion) {
      // A single representative frame — the artifact still communicates, it
      // just does not move.
      drawRef.current({ ctx, width, height, time: 2.4, still: true });
    } else {
      observer.observe(canvas);
    }

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return canvasRef;
}

/** Reads a design token off the element so artifacts follow the palette. */
export function readToken(el: Element | null, name: string, fallback: string) {
  if (!el) return fallback;
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}
