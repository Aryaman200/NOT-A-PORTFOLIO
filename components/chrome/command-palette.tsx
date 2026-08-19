"use client";

import { useCallback, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  FileUser,
  FileText,
  Hash,
  Mail,
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons/brand-icons";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { sections, site } from "@/lib/content";
import { projects } from "@/lib/projects";

/**
 * The site's quick path, on ⌘K.
 *
 * This started as a simulated terminal at the bottom of the contact section that
 * accepted a handful of typed commands and could only be reached by scrolling to
 * it. Same idea, except it works: bound from anywhere, keyboard navigable, and
 * every entry does something real.
 *
 * Default-exported and free of any global listener, because it is loaded lazily
 * by palette-mount.tsx. cmdk plus the Radix dialog is a meaningful chunk of
 * JavaScript, and most visitors never press ⌘K — they should not pay for it on
 * first load. The mount owns the keybinding and pulls this in on first open.
 */
export default function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);

  /** Close first, then act — otherwise the dialog's focus trap fights the jump. */
  const run = useCallback(
    (action: () => void) => {
      onOpenChange(false);
      requestAnimationFrame(action);
    },
    [onOpenChange],
  );

  const goTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ block: "start" });
    // Keep the URL honest so the entry is shareable and Back works.
    history.replaceState(null, "", `#${id}`);
  }, []);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked by permissions policy — fall back to the mail
      // client rather than failing silently.
      window.location.href = `mailto:${site.email}`;
    }
  }, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Jump to a section, open a project, or get in touch."
    >
      {/* shadcn's CommandDialog renders Dialog > DialogContent > children with no
          cmdk root of its own, so the Command provider is supplied here. Without
          it CommandInput has no store and throws on open. */}
      <Command>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No match.</CommandEmpty>

          <CommandGroup heading="Work">
            {projects.map((project) => (
              <CommandItem
                key={project.slug}
                value={`${project.title} ${project.stack.join(" ")}`}
                onSelect={() => run(() => goTo(project.slug))}
              >
                <FileText />
                <span>{project.title}</span>
                <CommandShortcut className="font-mono">
                  {project.year}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Jump to">
            {sections.map((section) => (
              <CommandItem
                key={section.id}
                value={`${section.code} ${section.label}`}
                onSelect={() => run(() => goTo(section.id))}
              >
                <Hash />
                <span>{section.label}</span>
                <CommandShortcut className="font-mono">
                  {section.code}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Get in touch">
            <CommandItem value="copy email address" onSelect={copyEmail}>
              {copied ? <Check /> : <Copy />}
              <span>{copied ? "Copied" : "Copy email address"}</span>
              <CommandShortcut className="font-mono normal-case">
                {site.email}
              </CommandShortcut>
            </CommandItem>

            <CommandItem
              value="email mail write"
              onSelect={() =>
                run(() => {
                  window.location.href = `mailto:${site.email}`;
                })
              }
            >
              <Mail />
              <span>Write an email</span>
            </CommandItem>

            <CommandItem
              value="resume cv"
              onSelect={() =>
                run(() => window.open(site.links.resume, "_blank", "noopener"))
              }
            >
              <FileUser />
              <span>Résumé</span>
              <ArrowUpRight className="ml-auto opacity-50" />
            </CommandItem>

            <CommandItem
              value="github source code"
              onSelect={() =>
                run(() => window.open(site.links.github, "_blank", "noopener"))
              }
            >
              <GithubIcon className="size-4" />
              <span>GitHub</span>
              <ArrowUpRight className="ml-auto opacity-50" />
            </CommandItem>

            <CommandItem
              value="linkedin"
              onSelect={() =>
                run(() =>
                  window.open(site.links.linkedin, "_blank", "noopener"),
                )
              }
            >
              <LinkedinIcon className="size-4" />
              <span>LinkedIn</span>
              <ArrowUpRight className="ml-auto opacity-50" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
