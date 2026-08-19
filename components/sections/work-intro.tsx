import { Section } from "@/components/editorial/section";

/**
 * The hinge into the chapters.
 *
 * This carried a four-up contents grid — one card per project with the title,
 * year and stack. Every one of those facts reappears a screen later in the
 * chapter itself, at full size and next to the thing actually running. A table
 * of contents for four items you are about to scroll through is not navigation,
 * it is repetition.
 *
 * It also carried a second paragraph restating the lead. Both are gone. The
 * section is a title and one sentence, and then the work speaks.
 */
export function WorkIntro() {
  return (
    <Section
      id="work"
      title="Work"
      lead="Two shipped, one in research, one a concept. Each opens into its own frame below, running live — and two of them you can interfere with."
    />
  );
}
