import { test, expect } from "@playwright/test";

/**
 * The keyboard and assistive-tech paths.
 *
 * Every assertion here corresponds to something that was actually broken and
 * was fixed, rather than to a generic checklist. They are cheap to run and each
 * one fails loudly if the behaviour regresses, which none of them did before —
 * the scroll rail shipped `aria-hidden` while being the page's only scroll
 * affordance, and nobody noticed because nothing looked wrong.
 */

test.describe("keyboard and landmarks", () => {
  test("the skip link is the first tab stop and becomes visible", async ({
    page,
  }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toHaveClass(/skip-link/);

    // Visible means visible: it is translated off-screen at rest, so a rule that
    // only fires on `:focus-visible` would leave it focused-but-invisible.
    await expect(focused).toBeInViewport();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  /**
   * The landmark, not the tag.
   *
   * A first version of this asserted `main footer` was empty and failed with
   * four — the chapter captions in `work-chapters.tsx` are `<footer>` elements
   * scoped to their own `<section>`, which is valid and is not a landmark:
   * `<footer>` only computes to `contentinfo` when its nearest sectioning
   * ancestor is `<body>`. Counting tags tested the wrong thing and would have
   * forced a real markup change to satisfy a bad assertion. Ask for the role.
   */
  test("contentinfo is a single landmark and sits outside main", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("main#main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    await expect(page.locator("main").getByRole("contentinfo")).toHaveCount(0);
  });

  test("the case study keeps its contentinfo outside main too", async ({
    page,
  }) => {
    await page.goto("/work/gods-eye");
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    await expect(page.locator("main").getByRole("contentinfo")).toHaveCount(0);
  });

  test("every case study is reachable and titled", async ({ page }) => {
    for (const slug of ["gods-eye", "nyay", "adaptive-traffic", "convoy-mode"]) {
      const response = await page.goto(`/work/${slug}`);
      expect(response?.status(), `/work/${slug} should resolve`).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("an unknown route gets the site's own 404, not the framework's", async ({
    page,
  }) => {
    const response = await page.goto("/does-not-exist");
    expect(response?.status()).toBe(404);
    // The framework default has no such heading and none of this copy.
    await expect(page.getByText("404", { exact: true })).toBeVisible();
    await expect(page.locator("main#main")).toBeVisible();
  });
});

test.describe("the scroll rail", () => {
  // The rail is hidden below `sm` by design; the progress line covers that case.
  test.skip(({ isMobile }) => !!isMobile, "rail is desktop-only");

  test("is exposed as a scrollbar rather than hidden", async ({ page }) => {
    await page.goto("/");
    const rail = page.getByRole("scrollbar", { name: "Page scroll" });
    await expect(rail).toHaveAttribute("aria-orientation", "vertical");
    await expect(rail).toHaveAttribute("aria-valuenow", "0");
  });

  test("scrubs by keyboard — WCAG 2.2 SC 2.5.7", async ({ page }) => {
    await page.goto("/");
    const rail = page.getByRole("scrollbar", { name: "Page scroll" });
    await rail.focus();

    // A previous version moved 2px and was then dragged back to 0 by
    // SectionSettle re-arming on the scroll the scrub itself caused.
    await rail.press("ArrowDown");
    await page.waitForTimeout(500);
    const afterArrow = await page.evaluate(() => window.scrollY);
    expect(afterArrow).toBeGreaterThan(50);

    await rail.press("End");
    await page.waitForTimeout(500);
    const atEnd = await page.evaluate(() =>
      Math.round(
        document.documentElement.scrollHeight -
          window.innerHeight -
          window.scrollY,
      ),
    );
    expect(atEnd).toBeLessThanOrEqual(2);
    await expect(rail).toHaveAttribute("aria-valuenow", "100");

    await rail.press("Home");
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test.describe("position cues", () => {
  /**
   * Checked mid-page, not at the top.
   *
   * The progress line is `scale: 0 1` at scroll 0 — correctly, because there is
   * no progress to report yet — which makes it zero-width and therefore not
   * "visible" to Playwright. The first version of this test asked at scroll 0
   * and failed on mobile for a line that works: measured at 0 / 0.25 / 0.5 / 1
   * it reports 0, 94.3, 188.5 and 377px against a 377px viewport.
   *
   * The claim worth defending is that once you are somewhere in the page,
   * something tells you where. So put the page somewhere first.
   */
  test("something reports position once the page has moved", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.dataset.entrance ?? "-"),
      )
      .not.toBe("holding");

    await page.evaluate(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: max * 0.4, behavior: "instant" });
    });
    // Two frames for the scroll-driven animation to sample, plus the settle.
    await page.waitForTimeout(800);

    const rail = page.getByRole("scrollbar", { name: "Page scroll" });
    const progress = page.locator(".scroll-progress");

    // The rail is hidden on phones and frozen under reduced motion, so the
    // CSS progress line has to cover both. One of the two must be showing.
    const railVisible = await rail.isVisible();
    const progressVisible = await progress.isVisible();
    expect(
      railVisible || progressVisible,
      isMobile
        ? "phones must get the progress line"
        : "desktop must get the rail or the line",
    ).toBe(true);
  });
});
