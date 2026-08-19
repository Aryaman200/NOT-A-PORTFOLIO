"use client";

import { useSyncExternalStore } from "react";
import { OPEN_PALETTE_EVENT } from "./palette-mount";

/** The platform never changes mid-session, so nothing ever needs to re-notify. */
const subscribe = () => () => {};
const getSnapshot = () =>
  /mac|iphone|ipad|ipod/i.test(navigator.userAgent) ? "⌘" : "Ctrl ";
/** Server has no platform to read — render the neutral form and let the client
 *  swap it in on hydration. */
const getServerSnapshot = () => "";

/**
 * Header affordance for the palette. Discoverability matters: a ⌘K that can only
 * be discovered by guessing ⌘K is a feature most visitors never find.
 *
 * Read via `useSyncExternalStore` rather than an effect + setState, which would
 * cost an extra render on every mount to display a constant.
 */
export function CommandTrigger() {
  const modifier = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
      aria-keyshortcuts="Meta+K Control+K"
      className="press flex items-center gap-1.5 whitespace-nowrap px-2 py-1 font-mono text-micro uppercase text-muted-foreground"
    >
      {/* min-width keeps the button from resizing when "Ctrl " replaces "⌘" */}
      <span aria-hidden className="min-w-[2.5ch] text-center">
        {modifier}K
      </span>
      <span className="sr-only">Open command palette</span>
    </button>
  );
}
