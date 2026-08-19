# components/reactbits

Components sourced from [React Bits](https://reactbits.dev), installed with:

```bash
npx shadcn@latest add @react-bits/<Name>-TS-TW
```

The `@react-bits` registry is declared in `components.json`. It is the only
external component source in this project.

## Policy

Keep these files as close to upstream as possible so they stay traceable and
re-installable. Restyle at the **call site** with tokens and wrapper components,
not by editing the drop.

Two kinds of local change are allowed, and both must be recorded in a header
comment in the file itself:

1. **`"use client"`** — React Bits targets Vite, so the drops have no directive.
   Every one of these is a client component and needs it under the App Router.
2. **Documented adaptations** — where upstream has a real defect for our usage.
   List each delta explicitly at the top of the file.

## What is here

| Component | Deps added | Used for | Local changes |
|---|---|---|---|
| `ClickSpark` | none | Global click accent | Substantially adapted — see file header |

## Installed, tried, removed

Recorded so the same ground is not re-covered.

- **`PixelSwap`** — used for a redacted-file reveal on the work rows. It
  absolutely positions both layers inside a fixed box, so every project became
  an identical 288px card, and the un-revealed layer is `aria-hidden`, hiding
  project titles from assistive tech until an IntersectionObserver fired. Good
  component, wrong job.
- **`ScrollExpand`** — wanted for the full-bleed project chapters. It requires an
  `<img>` or `<video>` as its media layer (`applyProgress` returns early without
  one) and offers no slot for a live canvas. The chapters use a `clip-path`
  driven by `motion` instead.
- **`GlassSurface`** — the hero action bar, refracting the terrain behind it. It
  worked, and it went when the chrome moved to a letterpress system: a glass
  panel is the one thing a press treatment cannot sit inside. Also removed the
  last dependency on a component that disables itself on Safari and Firefox.
- **`DecryptedText`** — scrambled the section labels. Removed with the rest of
  the intelligence-terminal theme; it was costume, not communication.

## Deliberately not installed

- **`ScrollStack`** — pulls in `lenis`, which hijacks native scrolling. It fights
  `scroll-behavior: smooth`, the spine, and reduced-motion preferences.
- **`SplitText`** — needs `gsap` + `@gsap/react` for one effect. `motion` is
  already installed, and `components/editorial/text-reveal.tsx` does the same job
  with no new dependency.
- **Everything else.** A page where every section uses a different library
  component reads as a component-library tour, not as design.

## Why only React Bits

21st.dev was evaluated and dropped: its registry now requires authentication —
both first-party (`/r/shadcn/...`) and community (`/r/<author>/...`) URLs return
`{"error":"Authentication required"}` — so nothing can be installed from it
without an account and API key. The command palette that would have come from
there is built on shadcn's own `command` (cmdk), which is the primitive those
palettes compose from anyway.
