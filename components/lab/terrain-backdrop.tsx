"use client";

import dynamic from "next/dynamic";

/**
 * Client boundary for the terrain canvas.
 *
 * `next/dynamic` with `ssr: false` is only legal inside a Client Component, so
 * this thin wrapper exists purely to own that boundary — page.tsx is a Server
 * Component and cannot declare it. Everything real is in terrain-field.tsx.
 */
const TerrainField = dynamic(() => import("./terrain-field"), { ssr: false });

export function TerrainBackdrop() {
  return (
    <TerrainField className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
  );
}
