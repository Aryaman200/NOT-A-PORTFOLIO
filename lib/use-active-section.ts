"use client";

import { useEffect, useState } from "react";

/**
 * Tracks which section is currently "at" the reading line.
 *
 * Ports v2's `observers()` logic — the section whose top has passed 42% of the
 * viewport wins — but as a hook with rAF throttling and proper teardown.
 * A scroll listener is used rather than IntersectionObserver because "current"
 * is a single-winner question, which observer entries answer badly when
 * sections are taller than the viewport.
 */
export function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.42;
      let current = ids[0] ?? "";

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = id;
      }

      setActive(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);

  return active;
}
