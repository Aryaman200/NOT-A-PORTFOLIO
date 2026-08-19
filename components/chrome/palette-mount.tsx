"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

export const OPEN_PALETTE_EVENT = "portfolio:open-command-palette";

/**
 * Owns the palette keybinding, and nothing else.
 *
 * This component is a few hundred bytes and always loaded. The palette itself —
 * cmdk plus the Radix dialog, its icons and the whole command list — is pulled
 * in only once someone actually opens it. Most visitors never press the shortcut
 * and should not download the feature on first paint.
 *
 * `hasOpened` latches: after the first open the chunk is already cached, so
 * subsequent toggles are instant and there is no reason to unmount it.
 */
const CommandPalette = dynamic(() => import("./command-palette"), {
  ssr: false,
});

export function PaletteMount() {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
        setHasOpened(true);
      }
    };
    // The header trigger lives in a server component and cannot hold this
    // state, so it asks via an event rather than dragging a provider across
    // the whole tree.
    const onRequest = () => {
      setOpen(true);
      setHasOpened(true);
    };

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_PALETTE_EVENT, onRequest);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_PALETTE_EVENT, onRequest);
    };
  }, []);

  if (!hasOpened) return null;

  return <CommandPalette open={open} onOpenChange={setOpen} />;
}
