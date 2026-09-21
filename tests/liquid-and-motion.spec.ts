import { test, expect } from "@playwright/test";

/**
 * The two failures that were invisible in review.
 *
 * Both liquids on this site thinned their droplets through their own filter's
 * visibility threshold and vanished — the cursor when flicked, the rail's tail
 * on any fast scroll, and the rail's six section markers on every frame since
 * they were written. Nothing looked broken; the shapes were simply not painted.
 * Only arithmetic catches that, so the arithmetic is asserted here.
 *
 * The entrance is the other one: it holds the page behind a curtain and lifts on
 * a signal, so a bug in the signal is a page that never appears at all. The cap
 * is the guarantee, and a guarantee nobody tests is a hope.
 */

/** Mirrors `gooFloor` in lib/goo.ts — deliberately restated, not imported. */
function floor(sigma: number, slope: number, offset: number) {
  return sigma * Math.sqrt(2 * Math.log(1 / (1 - offset / slope))) * 1.12;
}

const CURSOR_FLOOR = floor(6, 14, 6);
const RAIL_FLOOR = floor(3.4, 26, 12);

test.describe("the liquid cursor", () => {
  test.skip(({ isMobile }) => !!isMobile, "cursor is pointer:fine only");

  test("never thins below the filter's visibility floor when flicked", async ({
    page,
  }) => {
    // The cursor is gated on `(pointer: fine) and (prefers-reduced-motion: no-
    // preference)`, so under reduced motion there is correctly nothing to
    // measure — the next test asserts that absence instead.
    test.skip(
      test.info().project.name === "reduced-motion",
      "the liquid cursor does not mount under reduced motion",
    );
    await page.goto("/");
    const svg = page.locator("[data-cursor-liquid]");
    await expect(svg).toHaveCount(1);

    // Throw it around hard, sampling every droplet's minor axis each move.
    let worst = Infinity;
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < 10; i++) {
        const angle = pass * 1.4;
        await page.mouse.move(
          200 + Math.cos(angle) * i * 90,
          400 + Math.sin(angle) * i * 60,
        );
        const min = await page.evaluate(() => {
          const root = document.querySelector("[data-cursor-liquid]")!;
          let smallest = Infinity;
          for (let d = 0; d < 3; d++) {
            const c = root.querySelector(`[data-drop="${d}"]`);
            if (!c) continue;
            const r = Number(c.getAttribute("r"));
            const m = (c.getAttribute("transform") ?? "").match(
              /scale\(([-\d.]+) ([-\d.]+)\)/,
            );
            const minor = m ? r * Math.min(Number(m[1]), Number(m[2])) : r;
            smallest = Math.min(smallest, minor);
          }
          return smallest;
        });
        if (Number.isFinite(min)) worst = Math.min(worst, min);
      }
    }

    expect(worst).toBeGreaterThanOrEqual(CURSOR_FLOOR - 0.05);
  });

  test("throws a click splash that also stays above the floor", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name === "reduced-motion",
      "the liquid cursor does not mount under reduced motion",
    );
    await page.goto("/");
    await expect(page.locator("[data-cursor-splash]")).toHaveCount(1);

    // Sampled with real input, not a synthetic PointerEvent: the whole point is
    // that a click does this, and a dispatched event can pass while a click
    // does not. The sampler is started first and runs through the press.
    await page.mouse.move(600, 400);
    const sampler = page.evaluate(async () => {
      const group = document.querySelector<SVGGElement>(
        "[data-cursor-splash]",
      )!;
      let smallest = Infinity;
      let frames = 0;
      let reach = 0;
      const start = performance.now();
      while (performance.now() - start < 900) {
        await new Promise((r) => requestAnimationFrame(r));
        if (Number(getComputedStyle(group).opacity) <= 0.01) continue;
        frames++;
        for (const c of group.querySelectorAll("circle")) {
          smallest = Math.min(smallest, Number(c.getAttribute("r")));
          reach = Math.max(
            reach,
            Math.hypot(
              Number(c.getAttribute("cx")) - 600,
              Number(c.getAttribute("cy")) - 400,
            ),
          );
        }
      }
      return { smallest, frames, reach };
    });

    await page.waitForTimeout(150);
    await page.mouse.down();
    await page.waitForTimeout(60);
    await page.mouse.up();
    const splash = await sampler;

    expect(splash.frames, "a click must actually produce a splash").toBeGreaterThan(
      4,
    );
    expect(splash.smallest).toBeGreaterThanOrEqual(CURSOR_FLOOR - 0.05);
    // It travels and then stops; a ring that kept going would mean the
    // easing had been left unclamped.
    expect(splash.reach).toBeLessThanOrEqual(45);
  });

  test("is absent under reduced motion, leaving the native pointer", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "reduced-motion",
      "only meaningful in the reduced-motion project",
    );
    await page.goto("/");
    await expect(page.locator("[data-cursor-liquid]")).toHaveCount(0);
    const hidden = await page.evaluate(() =>
      document.documentElement.classList.contains("liquid-cursor"),
    );
    expect(hidden, "the cursor must not hide the native one when it is off").toBe(
      false,
    );
  });
});

test.describe("the liquid rail", () => {
  test.skip(({ isMobile }) => !!isMobile, "rail is desktop-only");
  test.skip(
    () => test.info().project.name === "reduced-motion",
    "droplet loop does not run under reduced motion",
  );

  test("never thins below its floor during a fast scroll", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);

    let worst = Infinity;
    for (let pass = 0; pass < 2; pass++) {
      for (const f of [0, 0.25, 0.5, 0.75, 1, 0.5, 0]) {
        const min = await page.evaluate((frac) => {
          const max =
            document.documentElement.scrollHeight - window.innerHeight;
          window.scrollTo({ top: frac * max, behavior: "instant" });
          const root = document.querySelector('[role="scrollbar"] svg')!;
          let smallest = Infinity;
          for (let d = 0; d < 3; d++) {
            const c = root.querySelector(`[data-blob="${d}"]`);
            if (!c) continue;
            const r = Number(c.getAttribute("r"));
            const m = (c.getAttribute("transform") ?? "").match(
              /scale\(([-\d.]+) ([-\d.]+)\)/,
            );
            const minor = m ? r * Math.min(Number(m[1]), Number(m[2])) : r;
            smallest = Math.min(smallest, minor);
          }
          return smallest;
        }, f);
        await page.waitForTimeout(120);
        if (Number.isFinite(min)) worst = Math.min(worst, min);
      }
    }

    expect(worst).toBeGreaterThanOrEqual(RAIL_FLOOR - 0.05);
  });

  test("carries no sub-floor shapes at all", async ({ page }) => {
    await page.goto("/");
    // The deleted section markers were r="3" against a 3.78px floor. Nothing
    // inside the filtered group may be born under it.
    const tooSmall = await page.evaluate(() => {
      const g = document.querySelector('[role="scrollbar"] svg g');
      if (!g) return [];
      return [...g.querySelectorAll("circle")]
        .map((c) => Number(c.getAttribute("r")))
        .filter((r) => r > 0 && r < 3.78);
    });
    expect(tooSmall).toEqual([]);
  });
});

test.describe("the entrance", () => {
  test("releases within its cap, so the page can never stay hidden", async ({
    page,
  }) => {
    await page.goto("/");

    // ENTRANCE_MAX is 1200ms; allow generously for CI scheduling and still
    // catch a hold that never lifts at all, which is the failure that matters.
    await expect
      .poll(
        () =>
          page.evaluate(
            () => document.documentElement.dataset.entrance ?? "(unset)",
          ),
        { timeout: 5_000, message: "the entrance must release" },
      )
      .not.toBe("holding");

    // Whatever happened, the name has to be readable.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("does not gate case studies reached by a direct link", async ({
    page,
  }) => {
    await page.goto("/work/nyay");
    const state = await page.evaluate(
      () => document.documentElement.dataset.entrance ?? "(unset)",
    );
    expect(state).toBe("(unset)");
  });
});
