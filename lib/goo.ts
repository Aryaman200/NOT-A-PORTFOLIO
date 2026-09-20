/**
 * The metaball filter, and the one number you cannot guess.
 *
 * Both liquids on this site — the scroll rail and the pointer — are drawn the
 * same way: plain circles in one group, run through `feGaussianBlur` and then a
 * high-contrast `feColorMatrix`. The blur spreads each circle's alpha into a
 * falloff; the matrix maps alpha `a` to `slope · a − offset` and clips, so what
 * is actually painted is the `a = offset / slope` isocontour. Where two falloffs
 * overlap their sum crosses that contour and the shapes weld with a tapered
 * neck; where they do not, they break apart cleanly. Every bit of the surface
 * tension is the filter. The shapes are only ever circles.
 *
 * The trap is that the filter has a **visibility floor**, and it is not obvious.
 * A disc of radius `r` blurred by `σ` has a centre value of `1 − exp(−r² / 2σ²)`.
 * Once that peak falls below the isocontour, no part of the droplet is bright
 * enough to survive the threshold and it does not render faintly — it does not
 * render at all. A droplet a hair under the floor is *gone*.
 *
 * Both components thin their droplets as the chain stretches, to conserve
 * apparent volume. Both were thinning them straight through their own floor, so
 * the rail's tail vanished mid-scroll and the cursor blinked out when it was
 * flicked across the screen. Neither was a rendering glitch; both were this
 * arithmetic, unnoticed.
 *
 * So the floor is derived here from the same constants the filter is built
 * from, rather than being written down as a tuned literal in either file. A
 * literal would drift the moment someone adjusted the blur, and the symptom of
 * that drift is a liquid that disappears.
 */

export type GooFilter = {
  /** `stdDeviation` on the `feGaussianBlur`. Larger = longer necks = more viscous. */
  sigma: number;
  /** Alpha multiplier in the `feColorMatrix`. Larger = harder threshold. */
  slope: number;
  /** Alpha offset in the `feColorMatrix`. */
  offset: number;
};

/** The alpha level the filter actually paints: `slope · a − offset = 0`. */
export function isocontour({ slope, offset }: GooFilter): number {
  return offset / slope;
}

/**
 * The smallest radius that still renders **at all** under this filter.
 *
 * Solves `1 − exp(−r² / 2σ²) = a` for `r`. A lone droplet at exactly this
 * radius is infinitesimally visible, so callers want a margin — see
 * `gooFloor`.
 */
export function visibleRadius(filter: GooFilter): number {
  const a = isocontour(filter);
  return filter.sigma * Math.sqrt(2 * Math.log(1 / (1 - a)));
}

/**
 * The working floor: the smallest radius anything should ever be drawn at.
 *
 * The margin covers the squash, which thins one axis further — a droplet that
 * clears the floor as a circle can still vanish once it is flattened across its
 * direction of travel, which is precisely what happened on fast movement.
 */
export function gooFloor(filter: GooFilter, margin = 1.12): number {
  return visibleRadius(filter) * margin;
}

/**
 * The `feColorMatrix` `values` string for a filter.
 *
 * Built here so the painted threshold and the derived floor can never disagree:
 * there is one source for both.
 */
export function gooMatrix({ slope, offset }: GooFilter): string {
  return `1 0 0 0 0
          0 1 0 0 0
          0 0 1 0 0
          0 0 0 ${slope} ${-offset}`;
}
