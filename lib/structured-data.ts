import { site, skills, timeline } from "@/lib/content";
import { projects, type Project } from "@/lib/projects";
import { SITE_URL } from "@/lib/site-url";

/**
 * JSON-LD, built from the same objects the page renders from.
 *
 * The point of deriving it rather than hand-writing it is that structured data
 * is invisible: nobody proofreads it, so a hand-written block drifts from the
 * visible copy and then quietly asserts something the page no longer says. Here
 * a change to `lib/content.ts` or `lib/projects.ts` moves both at once, and
 * anything the site declines to state is simply absent.
 *
 * Two deliberate omissions:
 *
 * - **No `alumniOf`.** The institution is unnamed on the page by choice, and an
 *   organisation is the one thing that property takes. Emitting a placeholder to
 *   fill the slot would be exactly the invented-fact problem the rest of the
 *   registry is written to avoid.
 * - **No `image`.** `public/` holds no photograph. The generated OG cards are
 *   share images, not depictions of a person, and labelling one as `image` on a
 *   `Person` would be a small lie to a machine.
 */

/** Only the capabilities that point at something checkable become skills. */
const knowsAbout = [
  ...new Set(skills.flatMap((s) => [s.capability, ...s.tools])),
];

const currentRole = timeline.find(
  (entry) => "current" in entry && entry.current,
);

export function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}#person`,
    name: site.name,
    url: SITE_URL,
    jobTitle: site.role,
    email: `mailto:${site.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.location,
      addressCountry: "IN",
    },
    sameAs: [site.links.github, site.links.linkedin],
    knowsAbout,
    ...(currentRole
      ? {
          worksFor: {
            "@type": "Organization",
            name: currentRole.org,
          },
        }
      : {}),
  };
}

/**
 * One `CreativeWork` per case study.
 *
 * `creativeWorkStatus` carries the shipped/research/concept distinction the page
 * makes, rather than flattening all four into "published" — the difference is
 * the most load-bearing thing the work section says.
 */
export function projectSchema(project: Project) {
  const url = `${SITE_URL}/work/${project.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#work`,
    name: project.title,
    headline: project.title,
    description: project.tagline,
    url,
    dateCreated: project.year,
    creativeWorkStatus: project.state,
    keywords: project.stack.join(", "),
    author: { "@id": `${SITE_URL}#person` },
    ...(project.case.links?.length
      ? { sameAs: project.case.links.map((l) => l.href) }
      : {}),
  };
}

export function projectListSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: projects.map((project, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/work/${project.slug}`,
      name: project.title,
    })),
  };
}

/**
 * Renders a schema object as a script tag's content.
 *
 * `JSON.stringify` escapes nothing that matters here — every value comes from
 * module-scope constants in this repo, not from a request — but `<` is escaped
 * anyway so a future string containing `</script>` cannot break out of the tag.
 */
export function jsonLd(schema: object) {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
