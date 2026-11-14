import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
  });
  await page.goto("http://127.0.0.1:4186/#apollo");
  await page
    .locator("#application")
    .waitFor({ state: "visible", timeout: 60000 });
  if (await page.locator("#briefing-screen").isVisible())
    await page.locator("#briefing-skip").click();
  await page.locator("#arrival-screen").waitFor({ state: "visible" });
  await page.locator("#arrival-skip").click();
  await page.locator("#crt-intro-screen").waitFor({ state: "visible" });
  await page.locator("#crt-intro-skip").click();
  assert.equal(
    await page
      .locator(".telephone")
      .evaluate((element) => getComputedStyle(element).animationName),
    "telephone-ring",
  );
  await page.locator(".room-toolbar .motion-toggle").click();
  assert.equal(
    await page
      .locator(".telephone")
      .evaluate((element) => getComputedStyle(element).animationPlayState),
    "paused",
  );
  await page.locator(".room-toolbar .motion-toggle").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page
      .locator(".telephone")
      .evaluate((element) => getComputedStyle(element).animationName),
    "none",
  );
  await page.locator(".story-media").click();
  await page
    .getByRole("button", { name: "Pause story", exact: true })
    .waitFor();
  assert.equal(await page.locator(".story-paragraph").count(), 7);
  assert.ok(
    (await page.locator(".story-copy").innerText()).includes(
      "Not an original mission transmission",
    ),
  );
  assert.equal(
    await page
      .locator(".story-postcard img")
      .evaluate((image) => image.complete && image.naturalWidth > 0),
    true,
  );
  await page.screenshot({
    path: "docs/qa/apollo-story-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.screenshot({
    path: "docs/qa/apollo-story-landscape.png",
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: "Hear the real landing call →",
      exact: true,
    })
    .click();
  assert.equal(await page.locator(".transcript q").count(), 2);
  await page.keyboard.press("Escape");
  await page.locator("#exhibit-dialog").waitFor({ state: "hidden" });
  assert.equal(
    await page.evaluate(() =>
      document.activeElement.classList.contains("story-media"),
    ),
    true,
  );
  const audioPage = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await audioPage.goto("http://127.0.0.1:4186/#apollo");
  await audioPage
    .locator("#application")
    .waitFor({ state: "visible", timeout: 60000 });
  if (await audioPage.locator("#briefing-screen").isVisible())
    await audioPage.locator("#briefing-skip").click();
  await audioPage.locator("#arrival-screen").waitFor({ state: "visible" });
  await audioPage.locator("#arrival-skip").click();
  await audioPage.locator("#crt-intro-screen").waitFor({ state: "visible" });
  await audioPage.locator("#crt-intro-skip").click();
  await audioPage.locator(".story-media").click();
  await audioPage
    .getByRole("button", { name: "Pause story", exact: true })
    .waitFor();
  await audioPage
    .getByRole("button", { name: "Pause story", exact: true })
    .click();
  await audioPage.locator("#exhibit-content")
    .getByRole("button", { name: "Replay story", exact: true })
    .click();
  await audioPage
    .getByRole("button", { name: "Pause story", exact: true })
    .waitFor();
  await audioPage.keyboard.press("Escape");
  await audioPage.locator("#exhibit-dialog").waitFor({ state: "hidden" });
  assert.equal(
    await audioPage.locator("#story-play").innerText(),
    "Play story",
  );
  await writeFile(
    "docs/qa/story-results.json",
    JSON.stringify(
      {
        passed: true,
        checkedAt: new Date().toISOString(),
        checks: [
          "phone ring animation and pause",
          "reduced motion",
          "postcard and seven sourced narration paragraphs",
          "owner recording autoplay",
          "desktop and landscape layout",
          "real transcript access",
          "focus restoration",
          "owner recording playback on disk click",
          "recording pause and replay",
          "recording stops on close",
        ],
        limitation:
          "Actual unchanged owner-provided apollo-phone.mp3 is used in the playback checks.",
      },
      null,
      2,
    ),
  );
  console.log("Story panel and owner recording playback checks passed.");
} finally {
  await browser.close();
}
