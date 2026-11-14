import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

await mkdir("docs/qa", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("response", (response) => {
  if (response.status() >= 400)
    errors.push(response.status() + " " + response.url());
});
await page.goto("http://127.0.0.1:4186");
await page
  .locator("#application")
  .waitFor({ state: "visible", timeout: 60000 });
await page.emulateMedia({ reducedMotion: "no-preference" });
assert.equal(
  await page
    .locator(".rocket-flame")
    .evaluate((element) => getComputedStyle(element).animationName),
  "rocket-burn",
);
await page.locator(".home-header .motion-toggle").click();
for (const flame of [
  ".rocket-flame",
  ".rocket-flame-inner",
  ".hero-rocket",
  ".hero-rocket-flame",
]) {
  assert.equal(
    await page
      .locator(flame)
      .evaluate((element) => getComputedStyle(element).animationPlayState),
    "paused",
  );
}
await page.locator(".home-header .motion-toggle").click();
assert.equal(
  await page
    .locator(".rocket-flame")
    .evaluate((element) => getComputedStyle(element).animationPlayState),
  "running",
);
await page.emulateMedia({ reducedMotion: "reduce" });
assert.equal(
  await page
    .locator(".rocket-flame")
    .evaluate((element) => getComputedStyle(element).animationName),
  "none",
);
assert.equal(
  await page
    .locator(".hero-rocket-flame")
    .evaluate((element) => getComputedStyle(element).animationName),
  "none",
);
await page.emulateMedia({ reducedMotion: "no-preference" });
assert.equal(
  await page
    .locator(".hero-rocket-flame")
    .evaluate((element) => getComputedStyle(element).animationName),
  "hero-burn",
);
const flameBefore = await page
  .locator(".hero-rocket-flame")
  .evaluate((element) => getComputedStyle(element).transform);
await page.bringToFront();
await page.waitForFunction(
  (previous) =>
    getComputedStyle(document.querySelector(".hero-rocket-flame")).transform !==
    previous,
  flameBefore,
  { timeout: 5000 },
);
const flameAfter = await page
  .locator(".hero-rocket-flame")
  .evaluate((element) => getComputedStyle(element).transform);
assert.notEqual(flameBefore, flameAfter);
await page.emulateMedia({ reducedMotion: "reduce" });
await page.screenshot({ path: "docs/qa/home-desktop.png", fullPage: true });
assert.equal(await page.locator(".mission-card").count(), 3);
await page.locator(".apollo-card .watch-story").click();
await page.locator("#briefing-screen").waitFor({ state: "visible" });
await page.locator("#briefing-skip").click();
await page.locator("#arrival-screen").waitFor({ state: "visible" });
await page.locator("#arrival-skip").click();
await page.locator("#crt-intro-screen").waitFor({ state: "visible" });
await page.locator("#crt-intro-skip").click();
await page.locator("#room-page").waitFor({ state: "visible" });
await page.screenshot({ path: "docs/qa/apollo-desktop.png", fullPage: true });
await page.locator(".crt-left").click();
assert.equal(
  await page.locator("#exhibit-title").innerText(),
  "A journey to the Moon",
);
await page.keyboard.press("Escape");
assert.equal(
  await page.evaluate(() =>
    document.activeElement.classList.contains("crt-left"),
  ),
  true,
);
await page.locator("#lamp-toggle").click();
assert.equal(
  await page.locator("#lamp-toggle").getAttribute("aria-pressed"),
  "false",
);
await page.locator("#lamp-toggle").click();
await page.locator(".crt-center").click();
assert.equal(await page.locator(".evidence-figure img").count(), 1);
await page.screenshot({ path: "docs/qa/eagle-panel.png", fullPage: true });
await page.keyboard.press("Escape");
await page.locator(".print-eagle").click();
await page.getByRole("button", { name: "Next photograph →" }).click();
assert.equal(
  await page.locator("#exhibit-title").innerText(),
  "A footprint with a story",
);
await page.keyboard.press("Escape");
await page.locator(".telephone").click();
await page
  .getByRole("button", {
    name: "Read the real landing transcript →",
    exact: true,
  })
  .click();
assert.equal(await page.locator(".transcript q").count(), 2);
assert.ok(
  (await page.locator(".transcript").innerText()).includes("102:45:58"),
);
await page.keyboard.press("Escape");
await page.locator(".notebook").click();
await page
  .getByRole("button", {
    name: "The crew cabin with the astronauts",
    exact: true,
  })
  .click();
assert.ok(
  (await page.locator(".quiz-feedback").innerText()).includes("try again"),
);
await page
  .getByRole("button", { name: "The lower landing stage", exact: true })
  .click();
await page.getByRole("button", { name: "Next discovery →" }).click();
await page
  .getByRole("button", { name: "At an observatory on Earth", exact: true })
  .click();
await page.getByRole("button", { name: "Next discovery →" }).click();
await page
  .getByRole("button", { name: "Lunar rock and soil samples", exact: true })
  .click();
await page.getByRole("button", { name: "See your discoveries →" }).click();
assert.ok(
  (await page.locator(".quiz").innerText()).includes(
    "Curiosity looks good on you.",
  ),
);
await page.keyboard.press("Escape");
await page.locator("#objects-button").click();
assert.equal(await page.locator(".object-list button").count(), 14);
await page.keyboard.press("Escape");
await page.locator('.room-toolbar [data-open="sources"]').click();
assert.ok(
  (await page.locator("#exhibit-content").innerText()).includes("SHA-256"),
);
await page.keyboard.press("Escape");
await page.locator(".room-toolbar a").click();
await page.locator(".disc-object").click();
assert.equal(
  await page.locator("#exhibit-title").innerText(),
  "Messages from planet Earth",
);
await page.keyboard.press("Escape");
await page.setViewportSize({ width: 390, height: 844 });
await page.locator("#orientation-guard").waitFor({ state: "visible" });
assert.equal(
  await page.locator("#application").evaluate((element) => element.inert),
  true,
);
await page.screenshot({ path: "docs/qa/rotate-phone.png", fullPage: true });
await page.setViewportSize({ width: 844, height: 390 });
await page.locator("#orientation-guard").waitFor({ state: "hidden" });
await page.waitForFunction(() => !document.querySelector("#application").inert);
assert.equal(
  await page.locator("#application").evaluate((element) => element.inert),
  false,
);
await page.screenshot({ path: "docs/qa/home-landscape.png", fullPage: true });
await page.locator(".apollo-card .mission-button").click();
await page.locator("#objects-button").click();
await page
  .getByRole("button", { name: "Words from the landing", exact: true })
  .click();
assert.ok(await page.locator(".transcript").isVisible());
await page.screenshot({ path: "docs/qa/radio-landscape.png", fullPage: true });
await page.setViewportSize({ width: 768, height: 1024 });
await page.locator("#orientation-guard").waitFor({ state: "visible" });
assert.equal(
  await page.locator("#exhibit-dialog").evaluate((element) => element.open),
  false,
);
await page.setViewportSize({ width: 1024, height: 768 });
await page.locator("#orientation-guard").waitFor({ state: "hidden" });
await page.waitForFunction(() => !document.querySelector("#application").inert);
await page.locator("#room-page").waitFor({ state: "visible" });
await page.setViewportSize({ width: 844, height: 390 });
await page.screenshot({ path: "docs/qa/apollo-landscape.png", fullPage: true });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  true,
);
assert.deepEqual(errors, []);
await writeFile(
  "docs/qa/results.json",
  JSON.stringify(
    {
      passed: true,
      checks: [
        "initial preparation",
        "three mission cards",
        "direct Apollo entry",
        "CRT content",
        "Escape and focus return",
        "lamp toggle",
        "NASA gallery navigation",
        "attributed transcript",
        "quiz wrong-answer retry and completion",
        "object menu",
        "source records",
        "floating keepsake",
        "phone and tablet portrait guard",
        "landscape menu access",
        "orientation change closes dialog and preserves room",
        "no horizontal overflow",
        "no browser errors",
      ],
      viewports: ["1440x1000", "390x844", "844x390"],
      checkedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
await browser.close();
console.log("Browser checks passed. Screenshots and report: docs/qa/");
