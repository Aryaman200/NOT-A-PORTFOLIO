/**
 * Project registry.
 *
 * The mission-code framing (`MSN-001`, `OSINT · FLAGSHIP`, `CLASSIFIED`) is
 * gone. What is left is what a reader needs: what it is, what it runs on,
 * whether it shipped, and which live artifact stands for it.
 *
 * Each project also carries a `case` — the written argument behind the chapter,
 * rendered at /work/<slug>. Two rules carried over from lib/content.ts:
 *
 * **Every claim is checkable.** Lines that were inferred rather than taken from
 * a role, a repo or a shipped thing are marked `VERIFY:` so they can be swept.
 *
 * **No invented numbers.** `numbers` is deliberately unpopulated. A figure you
 * gave yourself carries no information — the same reason the old capabilities
 * section's self-assigned scores were cut. Fill it when a figure is real.
 *
 * **The artifacts are illustrations, and `artifactNote` has to say so.** All
 * four canvases are hand-written simulations with hardcoded inputs: eight fixed
 * city coordinates on the globe, eight fixed scripts in the language flow, and
 * a toy vehicle model whose throughput and flow percentages are computed by
 * that model rather than measured from anything. They previously opened with
 * "Live", which on a page that also says "Shipped" invites a reader to take
 * them for production telemetry. A running canvas is a strong claim, and this
 * registry's own rules apply to it exactly as they do to prose.
 */

export type ArtifactId = "globe" | "convoy" | "traffic" | "language";

/**
 * Phase 1 drops real screen recordings and stills in here. An empty array
 * renders as nothing at all rather than as a placeholder frame — a case study
 * with no media should read as complete, not as pending.
 */
export type ProjectMedia = {
  /** path under /public/work/<slug>/ */
  src: string;
  /** poster frame for video; omitted for stills */
  poster?: string;
  kind: "video" | "image";
  alt: string;
  /** spans the full measure rather than sitting in the column */
  wide?: boolean;
};

/**
 * One narrative block. The headings differ by project state on purpose — a
 * concept has no outcome and a research project has no ship date, and forcing
 * all three into one shape is how you end up inventing one.
 */
export type CaseBlock = { heading: string; body: string };

export type ProjectCase = {
  /** what I actually did, not what the team did */
  role: string;
  period: string;
  blocks: readonly CaseBlock[];
  /** real, checkable figures only — see the file header */
  numbers?: readonly { value: string; label: string }[];
  media: readonly ProjectMedia[];
  links?: readonly { label: string; href: string }[];
};

export type Project = {
  /** doubles as the on-page anchor and the /work/<slug> route */
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
  case: ProjectCase;
};

export const projects: Project[] = [
  {
    slug: "gods-eye",
    title: "God's Eye",
    tagline:
      "Open-source intelligence gathered, reasoned over, and put on a globe you can read at a glance.",
    artifactNote: "Illustrative — eight fixed points, not live collection.",
    year: "2025",
    state: "shipped",
    stack: ["React", "FastAPI", "LLMs", "Three.js"],
    artifact: "globe",
    case: {
      role: "Solo — collection, reasoning layer and interface.",
      period: "2025",
      blocks: [
        {
          heading: "The problem",
          body: "Open-source intelligence is not scarce, it is unreadable. The signal exists in public feeds, filings, reports and imagery; what does not exist is a way to hold thousands of fragments in your head at once and notice that three of them are the same story. The usual answer is a dashboard of counts, which tells you how much arrived and nothing about what it means.",
        },
        {
          heading: "The constraint",
          body: "An analyst will not read a summary they cannot trace. Anything the system asserts has to stay attached to the source that produced it, or the whole thing is a confident guess with better typography. That ruled out summarising a feed into prose and calling it intelligence.",
        },
        {
          heading: "What I built",
          body: "A collection layer that pulls from several open sources on a schedule and normalises them into one shape. A reasoning pass over that corpus using language models — clustering fragments that describe the same event, and producing a short account of each cluster that links back to every fragment it drew on. Then the part that makes it usable: a globe that places each cluster where it happened, sized by how much corroborates it, so the shape of a week is legible before you read a word.",
        },
        {
          heading: "Why a globe",
          body: "Most of this data is geographic, and a list throws that away. On a globe, two clusters being near each other is information you get for free — no query, no filter, no chart. The projection is doing analytical work rather than decorating the page. The artifact above this text is the same rendering approach the product uses.",
        },
        {
          heading: "Where it landed",
          body: "Shipped and running. The reasoning layer is the part that still moves — clustering is the step where the system is most likely to be confidently wrong, so it is the step that stays under review. The source is not public, so there is nothing to click here; the artifact above is the rendering approach the product uses, and it is the honest half I can show.",
        },
      ],
      media: [],
      // No public repo. Said plainly in the closing block rather than left as a
      // silent gap — an absent link with no explanation reads as an oversight.
    },
  },
  {
    slug: "nyay",
    title: "Nyay",
    tagline:
      "Legal information that answers in the language the question was asked in.",
    artifactNote:
      "Illustrative — a query resolving through a shared representation, drawn from a fixed set of scripts.",
    year: "2026",
    state: "research",
    stack: ["LLMs", "NLP", "Bhashini"],
    artifact: "language",
    case: {
      role: "AI engineering — retrieval, multilingual pipeline, evaluation.",
      period: "2026 — ongoing",
      blocks: [
        {
          heading: "The problem",
          body: "Indian law is published, in the main, in English. A large share of the people it governs do not read English well enough to act on it. The gap is not legal literacy, it is language access — and the usual fix, translating the corpus, scales badly across twenty-two official languages and goes stale the moment the law moves.",
        },
        {
          heading: "The constraint",
          body: "A wrong answer about the law is worse than no answer. That rules out a model answering from its weights: everything returned has to be grounded in a retrieved statute or judgment, and a question the corpus cannot support has to come back empty rather than fluent. Translation quality is also not uniform across Indian languages, so the system has to be honest about which pairs it is confident in.",
        },
        {
          heading: "What I am building",
          body: "Retrieval that runs against the source language rather than against a translation of it, so a Hindi question is matched to the law on its own terms instead of round-tripping through English and losing the question on the way. The answer is composed from retrieved passages and returned in the asking language, with the citation intact. This work sits inside Anuvadini, part of Bhashini — India's National Language Translation Mission — so the language infrastructure is shared rather than rebuilt.",
        },
        {
          heading: "What I am testing",
          body: "Whether a shared representation holds up across the language pairs that matter, or whether retrieval quality falls off sharply outside the few languages with deep training data. The artifact above is that idea drawn literally: one query resolving into a shared space and returning to every language at once.",
        },
        {
          heading: "Open questions",
          body: "How to measure a correct legal answer without a labelled corpus in each language. How to surface uncertainty to someone who came for a straight answer. And whether retrieval in the source language actually beats translate-then-retrieve, or is only more elegant — which is the experiment, and it can still come back negative.",
        },
        {
          heading: "Why there is no link",
          body: "This is work inside a national language mission, not a side project. The code is not mine to publish and the deployment is not mine to link, so this page is the only account of it I can give.",
        },
      ],
      media: [],
    },
  },
  {
    slug: "adaptive-traffic",
    title: "Adaptive Traffic",
    tagline:
      "Signal timing that responds to the queue in front of it instead of a fixed clock.",
    artifactNote:
      "Toy model — change the density, switch adaptive off, watch throughput move. Figures are the simulation's own.",
    year: "2025",
    state: "shipped",
    // Taken from the repository rather than described from memory: the backend
    // is Flask with YOLOv8 for detection and scikit-learn for prediction, and
    // it pulls live conditions from TomTom.
    stack: ["Python", "YOLOv8", "Flask", "scikit-learn"],
    artifact: "traffic",
    case: {
      role: "Simulation, vision pipeline, evaluation.",
      period: "2025",
      blocks: [
        {
          heading: "The problem",
          body: "Most signals run a fixed cycle. The cycle was set for an average day, and there is no average day — so the light holds an empty approach while a full one waits, several times an hour, at every junction, forever. The waste is not dramatic at any one light, which is exactly why it persists.",
        },
        {
          heading: "The constraint",
          body: "Adaptive timing is easy to demonstrate and hard to trust. A controller that reacts to every fluctuation starves an approach; one that is too smooth is a fixed cycle with extra steps. And no authority deploys a policy whose failure mode has not been shown, so the interesting output is not the best case, it is the case where adaptive loses.",
        },
        {
          heading: "What I built",
          body: "A vision pass that estimates queue length per approach from camera frames, and a controller that allocates green time against those estimates under an explicit floor — no approach can be starved regardless of what the numbers say. Both sit inside a simulation that runs the same demand through adaptive and fixed timing, so the comparison is like-for-like rather than anecdotal.",
        },
        {
          heading: "Why the simulator is the deliverable",
          body: "A number in a slide deck is unfalsifiable. A simulation you can drive is not: you set the density, you switch adaptive off, and you watch throughput move — or fail to. The artifact above this text is that, running. Push the density to the top and the advantage narrows, which is the honest result and the one worth showing.",
        },
        {
          heading: "Where it landed",
          body: "Shipped as a working simulation with the vision pipeline attached. It has not run on a live junction, and this write-up does not claim it has — the gap between a simulator and a deployed controller is calibration against real detector data, which is the next thing, not a finished thing.",
        },
      ],
      media: [],
      links: [
        {
          label: "Source",
          href: "https://github.com/Aryaman200/Adative-Traffic-Dashboard-for-Sustainable-Urban-Mobilitty",
        },
      ],
    },
  },
  {
    slug: "convoy-mode",
    title: "Convoy Mode",
    tagline:
      "A concept for Google Maps: groups travelling together on one shared route, nobody left behind.",
    artifactNote: "Toy model — brake the leader and watch the convoy stretch.",
    year: "2025",
    state: "concept",
    // Leaflet and WebSockets, not a proprietary maps SDK — the repo is the
    // source of truth for this line.
    stack: ["JavaScript", "Leaflet", "WebSockets"],
    artifact: "convoy",
    case: {
      role: "Concept, interaction design, prototype.",
      period: "2025",
      blocks: [
        {
          heading: "The problem",
          body: "Navigation apps route one vehicle. Three cars driving to the same place get three independent routes, three independent recalculations, and a group chat doing the coordination the software declined to do. Anyone who has driven anywhere in convoy has pulled over on a shoulder to wait for a car the app had no idea existed.",
        },
        {
          heading: "The constraint",
          body: "The fix cannot be a group chat with a map in it. It has to survive the case where one car misses a turn, and it has to degrade sanely when a phone drops signal — which is when a convoy is most likely to break and least able to talk about it.",
        },
        {
          heading: "What the concept proposes",
          body: "One shared route owned by the convoy rather than by each driver. Position is shared along that route, so the interesting quantity is not distance on a map, it is gap in the line. When the leader slows, the line stretches, and every driver sees the stretch rather than being told about it. A car that falls out is rerouted to rejoin the line ahead rather than to the destination — the behaviour a group actually wants, and the one a single-vehicle router cannot express.",
        },
        {
          heading: "Why it is a concept",
          body: "The routing side is unremarkable: a shared polyline and position sync. What is unproven is whether drivers read a stretching line as quickly as the design assumes, and that is not a question a prototype answers — it needs people in cars. Calling this shipped would be the kind of claim the rest of the site is built to avoid.",
        },
        {
          heading: "What is here",
          body: "The interaction, running. Brake the leader in the artifact above and the convoy stretches. That stretch, and how fast it reads, is the whole proposition. There is also a working build behind the link below — live location sharing between group members over WebSockets, on a Leaflet map — so the untested part is the human question, not the engineering one.",
        },
      ],
      media: [],
      links: [
        {
          label: "Source",
          href: "https://github.com/Aryaman200/Maps-Convoy-Feature",
        },
      ],
    },
  },
];

export const projectSlugs = projects.map((p) => p.slug);

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

/**
 * Sequential neighbour for the case-study footer. Wraps, so the last project is
 * never a dead end — the reader is always handed somewhere to go.
 */
export function nextProject(slug: string) {
  const i = projects.findIndex((p) => p.slug === slug);
  if (i === -1) return undefined;
  return projects[(i + 1) % projects.length];
}
