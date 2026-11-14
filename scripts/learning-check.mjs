import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
await mkdir("docs/qa", {recursive:true});
const data = JSON.parse(await readFile("public/content/learning.json", "utf8"));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  const p = await context.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:4186/#home");
  await p.locator("#application").waitFor({ state: "visible", timeout: 60000 });
  await p.locator(".apollo-card .mission-button").click();
  assert.equal(await p.locator("#briefing-screen").isVisible(), false);
  await p.locator("#learning-guide-open").click();
  assert.equal(await p.locator(".learning-card").count(), 3);
  await p
    .locator(".learning-card")
    .first()
    .getByRole("button", { name: "Find the evidence →", exact: true })
    .click();
  await p.locator("#exhibit-dialog canvas").waitFor({ state: "visible" });
  await p
    .getByRole("button", {
      name: "Try the mission learning goals →",
      exact: true,
    })
    .click();
  assert.match(await p.locator(".learning-progress").innerText(), /^0 \/ 3/);
  for (const [i, goal] of data.apollo.goals.entries()) {
    const card = p.locator(".learning-card").nth(i);
    if (i === 0) {
      await card
        .locator("fieldset button")
        .nth((goal.answer + 1) % 3)
        .click();
      assert.match(
        await card.locator(".learning-feedback").innerText(),
        /try again/,
      );
      assert.match(
        await p.locator(".learning-progress").innerText(),
        /^0 \/ 3/,
      );
    }
    await card.locator("fieldset button").nth(goal.answer).click();
    assert.match(
      await p.locator(".learning-progress").innerText(),
      new RegExp("^" + (i + 1) + " / 3"),
    );
  }
  await p.screenshot({ path: "docs/qa/learning-apollo-complete.png" });
  const downloaded = p.waitForEvent("download");
  await p
    .getByRole("button", { name: "Save my field notes", exact: true })
    .click();
  const file = await downloaded;
  const notes = await readFile(await file.path(), "utf8");
  assert.match(notes, /lower stage stayed/);
  assert.match(notes, /https:\/\//);
  await p.keyboard.press("Escape");
  await p.reload();
  await p.locator("#application").waitFor({ state: "visible", timeout: 60000 });
  assert.equal(await p.locator("#briefing-screen").isVisible(), false);
  await p.locator("#learning-guide-open").click();
  assert.match(await p.locator(".learning-progress").innerText(), /^3 \/ 3/);
  await p.keyboard.press("Escape");
  await p.locator('.room-toolbar a[href="#home"]').click();
  await p.locator(".sojourner-card .mission-button").click();
  await p.locator(".crt-center").click();
  const canvas = p.locator("#exhibit-dialog canvas");
  for (const [name, id] of [
    ["Solar array", "solar"],
    ["Wheels", "wheels"],
    ["APXS instrument", "apxs"],
  ]) {
    await p.getByRole("button", { name, exact: true }).click();
    assert.equal(await canvas.getAttribute("data-selected-part"), id);
    await canvas.scrollIntoViewIfNeeded();
    const rect = await canvas.boundingBox();
    const before = Number((await canvas.getAttribute("data-part-picks")) || 0);
    await canvas.click({ position: { x: rect.width / 2, y: rect.height / 2 } });
    assert.ok(
      Number(await canvas.getAttribute("data-part-picks")) > before,
      "Ray-pick missing for " + name,
    );
    assert.equal(await canvas.getAttribute("data-selected-part"), id);
  }
  await p.locator("#exhibit-content").evaluate((e) => (e.scrollTop = 0));
  await p.screenshot({ path: "docs/qa/learning-model-parts.png" });
  await p
    .getByRole("button", { name: "Pathfinder lander", exact: true })
    .click();
  await p.getByRole("button", { name: "Lander camera", exact: true }).click();
  assert.equal(await canvas.getAttribute("data-selected-part"), "camera");
  await p.setViewportSize({ width: 844, height: 390 });
  await p.locator("#exhibit-content").evaluate((e) => (e.scrollTop = 0));
  await p.screenshot({ path: "docs/qa/learning-model-landscape.png" });
  assert.ok(await p.locator("#close-exhibit").isVisible());
  await p.keyboard.press("Escape");
  await p.locator("#learning-guide-open").click();
  p.once("dialog", (d) => d.dismiss());
  await p
    .getByRole("button", { name: "Reset saved progress", exact: true })
    .click();
  assert.ok(
    (
      await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("nasa-starboard-learning-v1")).goals,
      )
    ).length === 3,
  );
  p.once("dialog", (d) => d.accept());
  await p
    .getByRole("button", { name: "Reset saved progress", exact: true })
    .click();
  assert.match(await p.locator(".learning-progress").innerText(), /^0 \/ 3/);
  assert.equal(
    (
      await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("nasa-starboard-learning-v1")).goals,
      )
    ).length,
    0,
  );
  await p.keyboard.press("Escape");
  await p.locator('.room-toolbar a[href="#home"]').click();
  await p.locator(".viking-card .watch-story").click();
  await p.locator("#briefing-screen").waitFor({ state: "visible" });
  for (const id of ["briefing-skip", "arrival-skip", "crt-intro-skip"])
    await p.locator("#" + id).click();
  await p.locator("#learning-guide-open").click();
  await p.screenshot({ path: "docs/qa/learning-viking-landscape.png" });
  assert.equal(await p.locator(".learning-card").count(), 3);
  assert.deepEqual(errors, []);
  await context.close();
  const blocked = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  await blocked.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw Error("Storage unavailable");
      },
    }),
  );
  const q = await blocked.newPage();
  await q.goto("http://127.0.0.1:4186/#home");
  await q.locator("#application").waitFor({ state: "visible", timeout: 60000 });
  await q.locator(".viking-card .mission-button").click();
  await q.locator("#learning-guide-open").click();
  assert.match(await q.locator(".learning-progress").innerText(), /this visit/);
  await q
    .locator(".learning-card")
    .first()
    .locator("fieldset button")
    .nth(2)
    .click();
  assert.match(await q.locator(".learning-progress").innerText(), /^1 \/ 3/);
  await blocked.close();
  results.push(
    "Direct entry and explicit story entry",
    "Visited objects distinct from learning goals",
    "Wrong-answer feedback and correct goal completion",
    "Three goal-specific takeaways and downloadable source-linked field notes",
    "Goals and entry preference persist after reload",
    "Rover part buttons and actual ray picking for solar array, wheels and APXS",
    "Pathfinder model-specific part lessons",
    "Responsive model/guide modal and close control",
    "Reset cancellation and confirmed local reset",
    "Storage-blocked graceful fallback",
    "No browser exceptions",
  );
  await writeFile(
    "docs/qa/learning-results.json",
    JSON.stringify(
      { passed: true, checkedAt: new Date().toISOString(), checks: results },
      null,
      2,
    ),
  );
  console.log(
    "Learning, persistence, real 3D part picking and fallback checks passed.",
  );
} finally {
  await browser.close();
}
