"use client";

import dynamic from "next/dynamic";
import type { ArtifactId } from "@/lib/projects";

/**
 * Artifact registry.
 *
 * Every artifact is client-only and code-split, so a reader who never reaches
 * the fourth chapter never downloads its simulation. The skeleton is a plain
 * hairline frame rather than a spinner — the chapter around it is already
 * legible, and a spinner would imply something is broken while it loads.
 */
const LOADING = () => (
  <div
    aria-hidden
    className="size-full animate-pulse rounded-sm border border-hairline/40"
  />
);

const IntelGlobe = dynamic(() => import("./intel-globe"), {
  ssr: false,
  loading: LOADING,
});
const TrafficGrid = dynamic(() => import("./traffic-grid"), {
  ssr: false,
  loading: LOADING,
});
const ConvoyRoute = dynamic(() => import("./convoy-route"), {
  ssr: false,
  loading: LOADING,
});
const LanguageFlow = dynamic(() => import("./language-flow"), {
  ssr: false,
  loading: LOADING,
});

export function Artifact({ id }: { id: ArtifactId }) {
  switch (id) {
    case "globe":
      return <IntelGlobe />;
    case "traffic":
      return <TrafficGrid />;
    case "convoy":
      return <ConvoyRoute />;
    case "language":
      return <LanguageFlow />;
  }
}
