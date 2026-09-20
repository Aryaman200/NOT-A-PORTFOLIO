import type { ReactNode } from "react";
import { WorkHeader } from "@/components/chrome/work-header";

/**
 * The lab.
 *
 * Everything under /work sits on the dark palette. This is the half of the
 * design system that globals.css has always described and that nothing rendered
 * until now: same type scale, same spacing rhythm, same radii — only colour and
 * density change.
 *
 * `.dark` is applied here rather than on `<html>` on purpose. The token flip is
 * scoped to the subtree, which means the homepage chapters can keep flipping the
 * same tokens inside their own frames without the two mechanisms fighting, and
 * a reader arriving mid-transition never sees a half-applied palette.
 *
 * `bg-background` also has to be set here: the root `<body>` keeps the shell's
 * bone ground, and during a view transition both pages are briefly composited
 * together — a transparent lab would show bone through the dark type.
 */
export default function WorkLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark flex min-h-dvh flex-col bg-background text-foreground">
      <WorkHeader />
      {children}
    </div>
  );
}
