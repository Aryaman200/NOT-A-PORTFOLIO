import { site } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-hairline bg-background px-gutter py-12">
      <div className="mx-auto flex w-full max-w-[110rem] flex-col gap-4 font-mono text-micro uppercase text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="text-foreground">{site.name}</span>
          <span className="mx-2 opacity-40">·</span>
          {site.location}
        </p>
        <p className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a
            href={site.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Source
          </a>
          <span className="opacity-60">© 2026</span>
        </p>
      </div>
    </footer>
  );
}
