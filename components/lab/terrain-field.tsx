"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { TERRAIN_READY_EVENT } from "@/lib/entrance";

/**
 * Scroll-scrubbed terrain flythrough.
 *
 * A faithful port of v2's `_build3d` (public/v2/index.html) off the CDN
 * `three@r128` global and onto a real dependency. The height field, the endless
 * world-offset flow, the ~14fps geometry rebuild against a full-rate render, and
 * the aerial-to-horizon camera dive are all kept — that logic was already good.
 *
 * What changed:
 * - Palette. v2 ramped phosphor green to amber over near-black. On the light
 *   editorial shell the ramp runs hairline to signal green over warm off-white,
 *   at a fraction of the opacity so the display type stays the subject.
 * - Lifecycle. The old one leaked: `_rafId3d` was only cancelled on unmount of a
 *   page that never unmounted, and the resize listener was never removed. This
 *   tears everything down, disposes the GPU resources, and stops entirely when
 *   scrolled past.
 * - `prefers-reduced-motion` renders one static frame instead of the dive.
 * - Context loss is handled rather than leaving a dead black rectangle.
 */

type TerrainFieldProps = {
  /** How far down the page the dive completes, as a fraction of viewport height. */
  scrubDistance?: number;
  className?: string;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (p: number) =>
  p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
const smoothstep = (edge: number, x: number, y: number) => {
  const t = clamp01((edge - x) / (y - x));
  return t * t * (3 - 2 * t);
};

/** v2's ridgeline field, unchanged — four summed waves with a mild power curve. */
const heightAt = (x: number, z: number) => {
  const y =
    Math.sin(x * 0.045) * Math.cos(z * 0.04) * 8 +
    Math.sin((x + z) * 0.03) * 10 +
    Math.sin(x * 0.09 - z * 0.07) * 4 +
    Math.cos(x * 0.017 + z * 0.02) * 12;
  return Math.sign(y) * Math.pow(Math.abs(y), 1.12);
};

export default function TerrainField({
  scrubDistance = 0.92,
  className,
}: TerrainFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    /**
     * Tells the entrance that there is now something on screen to rise over.
     *
     * Fired on the first drawn frame — and also when there will never be one,
     * because "no WebGL" is an answer the entrance can act on immediately. The
     * alternative is waiting out the full cap for a frame that is not coming.
     */
    let announced = false;
    const announce = () => {
      if (announced) return;
      announced = true;
      window.dispatchEvent(new Event(TERRAIN_READY_EVENT));
    };

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      // No WebGL. The hero is designed to read without this layer, so the
      // correct behaviour is to leave the canvas empty and say nothing — but
      // the entrance is waiting on a frame that will never arrive, so tell it.
      announce();
      return;
    }

    // Capped at 1 like v2 — a wireframe this fine gains nothing from retina and
    // the fill cost is real on phones.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));

    const ground = new THREE.Color(0xf4f2ec);
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(ground, 80, 540);

    const camera = new THREE.PerspectiveCamera(
      62,
      window.innerWidth / window.innerHeight,
      0.1,
      1400,
    );
    camera.rotation.order = "YXZ";

    const SIZE = 660;

    /**
     * The mobile budget.
     *
     * The terrain is kept on phones rather than swapped for a static image —
     * the live ground is the point of the first screen and a picture of it is
     * not the same thing. What changes is how much work it costs to draw.
     *
     * 72 segments is 5,329 vertices re-evaluated ~14 times a second. At 28 it
     * is 841, an 84% cut in the per-rebuild loop, and the rebuild itself runs
     * at ~9fps instead of ~14. At this opacity and fog depth, on a screen this
     * size, the coarser mesh is not distinguishable — the saving is free.
     */
    const mobile = window.innerWidth < 768;
    const SEG = mobile ? 28 : 72;
    /** ms between height-field rebuilds. The render stays at full rate. */
    const REBUILD_MS = mobile ? 110 : 70;
    const geometry = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    geometry.rotateX(-Math.PI / 2);

    const position = geometry.attributes.position;
    const count = position.count;
    const baseX = new Float32Array(count);
    const baseZ = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      baseX[i] = position.getX(i);
      baseZ[i] = position.getZ(i);
    }

    const colors = new Float32Array(count * 3);
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const colorAttr = geometry.attributes.color;

    // Valleys sit at hairline, ridges resolve to ultramarine — the same two
    // values the rest of the page draws its rules and accents with.
    const low = [0xcb / 255, 0xc7 / 255, 0xbb / 255];
    const high = [0x24 / 255, 0x36 / 255, 0xd8 / 255];
    const LO = -42;
    const HI = 42;

    const rebuild = (offset: number) => {
      for (let i = 0; i < count; i++) {
        const y = heightAt(baseX[i], baseZ[i] - offset);
        position.setY(i, y);

        const t = clamp01((y - LO) / (HI - LO));
        const tt = Math.pow(t, 1.4);
        colors[i * 3] = low[0] + (high[0] - low[0]) * tt;
        colors[i * 3 + 1] = low[1] + (high[1] - low[1]) * tt;
        colors[i * 3 + 2] = low[2] + (high[2] - low[2]) * tt;
      }
      position.needsUpdate = true;
      colorAttr.needsUpdate = true;
    };
    rebuild(0);

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: 0.34,
      fog: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    /* A field of 140 `THREE.Points` drifted above the terrain here, meant to
       read as dust. It could not: `PointsMaterial` with no `map` rasterises the
       entire point sprite quad, so every particle was a hard-edged axis-aligned
       square — 1.4px of solid blue with corners, against a wireframe mesh whose
       whole character is thin diagonal lines. Rotating the cloud on y only made
       the squares more obvious, because they never rotate with it.

       Removed rather than fixed. Making them round costs a radial-alpha texture
       or a custom shader with a `gl_PointCoord` discard, and buys a haze the
       terrain does not need — the mesh already carries the depth, and the fog
       already does the distance. */

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    resize();

    /** Position the camera for a given dive progress, 0 aerial → 1 horizon. */
    const placeCamera = (progress: number, seconds: number) => {
      const eased = easeInOut(progress);
      camera.position.x = Math.sin(seconds * 0.22) * 7;
      camera.position.y = lerp(172, 32, eased);
      camera.position.z = lerp(212, 150, eased);
      camera.rotation.x = lerp(-1.16, -0.06, eased);
      camera.rotation.y = Math.sin(seconds * 0.16) * 0.03;
    };

    if (reduceMotion) {
      // One frame, mid-dive, no loop and no scroll coupling.
      placeCamera(0.55, 0);
      canvas.style.opacity = "0.5";
      renderer.render(scene, camera);
      announce();
      window.addEventListener("resize", resize);
      return () => {
        window.removeEventListener("resize", resize);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    }

    const born = performance.now();
    let progress = 0;
    let lastRebuild = 0;
    let frame = 0;
    let running = true;

    const loop = () => {
      if (!running) return;

      const now = performance.now();
      const seconds = (now - born) / 1000;
      const scrollY = window.scrollY || 0;
      const target = clamp01(scrollY / (window.innerHeight * scrubDistance));

      // Chase the scroll rather than snapping to it, so flicks read as a glide.
      progress += (target - progress) * 0.09;

      placeCamera(progress, seconds);

      // Heights regenerate at ~14fps; the camera and the render stay at full
      // rate. The flow is slow enough that the difference is invisible, and it
      // keeps a 5,300-vertex rebuild off most frames.
      const offset = scrollY * 0.05 + seconds * 7;
      if (now - lastRebuild > REBUILD_MS) {
        lastRebuild = now;
        rebuild(offset);
      }

      renderer.render(scene, camera);
      announce();

      const born_in = Math.min(1, (now - born) / 1100);
      // Settles to an ambient level once the dive completes and stays there for
      // the rest of the page. This used to drop to 0.22, which combined with the
      // material opacity read as nothing at all — the ground appeared to vanish
      // after the first screen. At 0.5 the mesh is clearly present behind the
      // writing while body copy still holds ~17:1 against it.
      canvas.style.opacity = (
        born_in * lerp(1, 0.5, smoothstep(progress, 0.55, 1))
      ).toFixed(3);

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);

    // Stop outright once the hero is well off screen.
    // The canvas is viewport-fixed and therefore always on screen, so the old
    // visibility observer never fired. Pause on tab-hide instead, which is the
    // case that actually matters for battery.
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        frame = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    // `focus` is insurance, not duplication. Applying the visibility state at
    // setup (below) means a page that loads hidden starts paused — and a paused
    // terrain that never receives a `visibilitychange` would stay dead for the
    // whole session. Every real browser fires that event when a tab comes
    // forward, but a second, independent way back to running costs one listener
    // and removes the failure mode entirely. `onVisibility` is idempotent, so
    // both firing is harmless.
    window.addEventListener("focus", onVisibility);
    // `visibilitychange` only fires on a *change*. A page opened in a background
    // tab — a link middle-clicked, or a session restored — is already hidden
    // when this runs, so the event never arrives and the loop would render at
    // full rate against a tab nobody is looking at. Applying the current state
    // once at setup is what makes the pause cover the case it was written for.
    onVisibility();

    const onContextLost = (event: Event) => {
      event.preventDefault();
      running = false;
      cancelAnimationFrame(frame);
      canvas.style.opacity = "0";
    };

    window.addEventListener("resize", resize);
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [scrubDistance]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      // Starts transparent and is faded in by the loop, so a failed or slow
      // WebGL init never flashes a block of colour behind the name.
      className={className}
      style={{ opacity: 0 }}
    />
  );
}
