/**
 * Project registry.
 *
 * The mission-code framing (`MSN-001`, `OSINT · FLAGSHIP`, `CLASSIFIED`) is
 * gone. What is left is what a reader needs: what it is, what it runs on,
 * whether it shipped, and which live artifact stands for it.
 */

export type ArtifactId = "globe" | "convoy" | "traffic" | "language";

export type Project = {
  /** doubles as the on-page anchor */
  slug: string;
  title: string;
  /** one line, used in the chapter caption and the index */
  tagline: string;
  /** what the artifact is actually showing — the caption under the canvas */
  artifactNote: string;
  year: string;
  state: "shipped" | "concept" | "research";
  stack: string[];
  artifact: ArtifactId;
};

export const projects: Project[] = [
  {
    slug: "gods-eye",
    title: "God's Eye",
    tagline:
      "Open-source intelligence gathered, reasoned over, and put on a globe you can read at a glance.",
    artifactNote:
      "Live — eight collection points, traffic routed between them.",
    year: "2025",
    state: "shipped",
    stack: ["React", "FastAPI", "LLMs", "Three.js"],
    artifact: "globe",
  },
  {
    slug: "nyay",
    title: "Nyay",
    tagline:
      "Legal information that answers in the language the question was asked in.",
    artifactNote:
      "Live — a query resolving through a shared representation, returning to every language.",
    year: "2026",
    state: "research",
    stack: ["LLMs", "NLP", "Bhashini"],
    artifact: "language",
  },
  {
    slug: "adaptive-traffic",
    title: "Adaptive Traffic",
    tagline:
      "Signal timing that responds to the queue in front of it instead of a fixed clock.",
    artifactNote:
      "Interactive — change the density, switch adaptive off, watch throughput move.",
    year: "2025",
    state: "shipped",
    stack: ["Python", "Simulation", "Data viz"],
    artifact: "traffic",
  },
  {
    slug: "convoy-mode",
    title: "Convoy Mode",
    tagline:
      "A concept for Google Maps: groups travelling together on one shared route, nobody left behind.",
    artifactNote:
      "Interactive — brake the leader and watch the convoy stretch.",
    year: "2025",
    state: "concept",
    stack: ["Maps SDK", "Realtime", "Routing"],
    artifact: "convoy",
  },
];

export const projectSlugs = projects.map((p) => p.slug);
