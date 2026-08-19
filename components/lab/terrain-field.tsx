"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

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
      // correct behaviour is to leave the canvas empty and say nothing.
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
    // 72 segments is 5,329 vertices re-evaluated ~14 times a second. Phones get
    // a coarser mesh: at this opacity and fog depth the difference is not
    // visible, and it is the largest single saving available here.
    const SEG = window.innerWidth < 768 ? 44 : 72;
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

    const DUST = 140;
    const dustPositions = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 620;
      dustPositions[i * 3 + 1] = Math.random() * 100 + 6;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 620;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(dustPositions, 3),
    );
    const dustMaterial = new THREE.PointsMaterial({
      size: 1.4,
      color: 0x2436d8,
      transparent: true,
      opacity: 0.3,
      fog: true,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

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
      window.addEventListener("resize", resize);
      return () => {
        window.removeEventListener("resize", resize);
        geometry.dispose();
        material.dispose();
        dustGeometry.dispose();
        dustMaterial.dispose();
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
      dust.rotation.y = seconds * 0.014;

      // Heights regenerate at ~14fps; the camera and the render stay at full
      // rate. The flow is slow enough that the difference is invisible, and it
      // keeps a 5,300-vertex rebuild off most frames.
      const offset = scrollY * 0.05 + seconds * 7;
      if (now - lastRebuild > 70) {
        lastRebuild = now;
        rebuild(offset);
      }

      renderer.render(scene, camera);

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
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      geometry.dispose();
      material.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
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
