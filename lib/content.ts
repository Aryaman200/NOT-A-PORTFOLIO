/**
 * All prose for the site.
 *
 * Two rules for editing this file.
 *
 * **Plain language.** The previous version was dressed as an intelligence
 * terminal — mission codes, CLASSIFIED stamps, "operator profile", ACCESS
 * GRANTED. It was costume. Everything here says what it means.
 *
 * **Every claim is checkable.** If a line cannot be traced to a role, a project
 * or a shipped thing, it does not belong on the page.
 */

export const site = {
  name: "Aryaman Bhardwaj",
  shortName: "Aryaman",
  role: "AI Engineer",
  location: "New Delhi",
  email: "aryaman.bhardwaj.05@gmail.com",
  links: {
    linkedin: "https://www.linkedin.com/in/aryaman-bhardwaj-7a0507330",
    github: "https://github.com/Aryaman200",
    /** Hosted, not a PDF in public/ — it stays current without a redeploy. */
    resume: "https://resumelink.co/aryaman",
  },
} as const;

/**
 * Six sections, down from nine.
 *
 * Cut: "Ideas Lab" (six unbuilt concepts with nothing to show), "Endeavours"
 * (eight one-line items already covered by the timeline), and "Vision" (six
 * numbered directives restating the four principles already in About). Three
 * sections of assertion have become one paragraph.
 */
export const sections = [
  { code: "01", id: "intro", label: "Intro" },
  { code: "02", id: "about", label: "About" },
  { code: "03", id: "work", label: "Work" },
  { code: "04", id: "capabilities", label: "Capabilities" },
  { code: "05", id: "path", label: "Path" },
  { code: "06", id: "contact", label: "Contact" },
] as const;

export type SectionId = (typeof sections)[number]["id"];

export const hero = {
  roles: ["AI Engineer", "Builder", "Researcher"],
  statement:
    "I build products, not just models. Most of my time goes into the distance between something that works in a notebook and something a person can rely on — which is where most of the actual engineering lives.",
  meta: [
    { label: "Now", value: "AI Engineer Intern, Anuvadini", accent: true },
    { label: "Studying", value: "B.Tech, Computer Science" },
    { label: "Working on", value: "Multilingual legal AI" },
    { label: "Based in", value: "New Delhi, India" },
  ],
  focus: [
    "LLMs",
    "Machine learning",
    "Computer vision",
    "Geospatial",
    "Multilingual AI",
    "Full-stack",
  ],
} as const;

export type AboutCard = {
  label: string;
  title: string;
  body: string;
  /** spans both columns on wide screens — exactly one card should set this */
  wide?: boolean;
};

export const about: {
  lead: string;
  manifesto: string;
  cards: readonly AboutCard[];
} = {
  lead: "Final-year computer science student, currently building multilingual AI in production.",
  /**
   * The old "Operating principles" card and the entire six-item Vision section
   * said the same four things. This is that, once.
   */
  manifesto:
    "Adoption is the only benchmark I trust. A model nobody can reach is a paper, not a product, so I spend as much time on the interface and the infrastructure as on the model itself. Design and engineering are one discipline seen from two sides, and complexity is meant to feel simple by the time it reaches anyone.",
  cards: [
    {
      label: "Now",
      title: "AI Engineer Intern at Anuvadini",
      body: "Part of Bhashini, India's National Language Translation Mission. I work on multilingual AI systems and Nyay, a platform that makes legal information reachable in the language a person actually speaks.",
      wide: true,
    },
    {
      label: "Background",
      title: "Computer science, AI & ML",
      body: "Final year. Foundations in machine learning, systems and mathematics, pointed at problems bigger than coursework.",
    },
    {
      label: "Before that",
      title: "Quantum ML research at DRDO",
      body: "Quantum kernels applied to cybersecurity data, testing where quantum methods actually beat classical ones and where they do not.",
    },
  ],
} as const;

/**
 * Real roles only.
 *
 * The previous version padded this with "Student leadership roles" and a
 * "Learning journey" entry describing a feeling rather than a job. Four entries
 * where two carried information is worse than two entries.
 */
export const timeline = [
  {
    period: "2026 — now",
    title: "AI Engineer Intern",
    org: "Anuvadini · Bhashini",
    body: "Multilingual AI systems and the Nyay legal platform, under India's National Language Translation Mission. Real users, many languages, one system.",
    current: true,
  },
  {
    period: "2025",
    title: "Research Intern, Quantum Machine Learning",
    org: "DRDO",
    body: "Quantum kernels on cybersecurity datasets. The useful result was negative as often as positive, which is the point of running the experiment.",
  },
  {
    period: "2023 — 2026",
    title: "B.Tech, Computer Science (AI & ML)",
    org: "Final year",
    body: "Machine learning, systems and mathematics, alongside the projects above.",
  },
] as const;

export type SkillEvidence = { label: string; href?: string; note?: string };

/**
 * Capability, then the work that proves it.
 *
 * The original listed invented packages with self-assigned scores
 * (`neural-core v9.2`, 92% loaded). A number you gave yourself carries no
 * information. Everything here points at something checkable.
 */
export const skills: ReadonlyArray<{
  capability: string;
  tools: readonly string[];
  evidence: readonly SkillEvidence[];
}> = [
  {
    capability: "Language models & NLP",
    tools: ["Transformers", "RAG", "Bhashini stack"],
    evidence: [
      { label: "Nyay", href: "#nyay" },
      { label: "God's Eye", href: "#gods-eye" },
    ],
  },
  {
    capability: "Geospatial & 3D",
    tools: ["Three.js", "WebGL", "Maps SDK"],
    evidence: [
      { label: "God's Eye", href: "#gods-eye" },
      { label: "Convoy Mode", href: "#convoy-mode" },
    ],
  },
  {
    capability: "Computer vision",
    tools: ["PyTorch", "OpenCV"],
    evidence: [{ label: "Adaptive Traffic", href: "#adaptive-traffic" }],
  },
  {
    capability: "Quantum machine learning",
    tools: ["Qiskit", "Quantum kernels"],
    evidence: [{ label: "DRDO", note: "Research internship, 2025" }],
  },
  {
    capability: "Full-stack engineering",
    tools: ["FastAPI", "React", "TypeScript", "Postgres", "Docker"],
    evidence: [
      { label: "God's Eye", href: "#gods-eye" },
      { label: "Nyay", href: "#nyay" },
    ],
  },
  {
    capability: "Simulation & data visualisation",
    tools: ["Canvas", "D3", "Python"],
    evidence: [
      { label: "Adaptive Traffic", href: "#adaptive-traffic" },
      { label: "Convoy Mode", href: "#convoy-mode" },
    ],
  },
];

export const contact = {
  lead: "Open to 2026 roles in AI engineering and applied research.",
  headline: "Let's build\nsomething useful.",
  links: [
    { label: "Email", href: `mailto:${site.email}`, external: false },
    { label: "LinkedIn", href: site.links.linkedin, external: true },
    { label: "GitHub", href: site.links.github, external: true },
    { label: "Résumé", href: site.links.resume, external: true },
  ],
} as const;
