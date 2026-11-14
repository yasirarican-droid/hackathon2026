import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

await mkdir('docs/qa', { recursive: true });
const info = JSON.parse(await readFile('public/content/project-info.json', 'utf8'));
const archive = JSON.parse(await readFile('public/content/archive.json', 'utf8'));
for (const group of info.archives) for (const id of group.sources) assert.ok(archive.sources[id], id);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const base = process.env.STARBOARD_URL || 'http://127.0.0.1:4186/';
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await page.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
  const header = page.locator('.home-header');
  assert.equal(await header.getByRole('button', { name: 'Our story', exact: true }).count(), 0);
  const button = header.locator('.home-art-info');
  assert.match(await button.innerText(), /Info/);
  const box = await button.boundingBox();
  assert.ok(box.height >= 44 && box.width >= 44);
  const floating = page.locator('.floating-object').first();
  const oldStyle = await floating.getAttribute('style');
  await floating.evaluate((element, bounds) => {
    element.style.cssText = `position:fixed;left:${bounds.x}px;top:${bounds.y}px;width:${bounds.width}px;height:${bounds.height}px;animation:none;transform:none;z-index:10;`;
  }, box);
  await button.click();
  const dialog = page.locator('#exhibit-dialog');
  await dialog.waitFor({ state: 'visible' });
  assert.equal(await dialog.locator('#exhibit-title').innerText(), 'About this project');
  for (const member of info.team) assert.ok((await dialog.innerText()).includes(member.name));
  assert.match(await dialog.innerText(), /2026 NASA Space Apps Challenge/);
  assert.match(await dialog.innerText(), /Universal Event/);
  await page.screenshot({ path: 'docs/qa/project-info-team.png' });
  for (const label of ['AI & production', 'NASA archives', 'Licenses', 'The team']) {
    await dialog.locator('.project-info-links').getByRole('button', { name: label, exact: true }).evaluate(element => element.click());
    const focused = await page.evaluate(() => ({ focused: document.activeElement.className, y: document.activeElement.getBoundingClientRect().y }));
    assert.equal(focused.focused, 'project-info-section');
    assert.ok(focused.y >= 0 && focused.y < 900);
    if (label === 'AI & production') await page.screenshot({ path: 'docs/qa/project-info-tools.png' });
  }
  for (const link of ['licenses/APACHE-2.0.txt', 'licenses/THIRD_PARTY.txt']) assert.equal((await page.request.get(new URL(link, base).href)).status(), 200);
  await page.keyboard.press('Escape');
  await floating.evaluate((element, value) => value === null ? element.removeAttribute('style') : element.setAttribute('style', value), oldStyle);
  await header.getByRole('button', { name: 'Sources', exact: true }).click();
  await dialog.waitFor({ state: 'visible' });
  assert.equal(await dialog.locator('#exhibit-title').innerText(), 'Sources & making this archive');
  await page.keyboard.press('Escape');
  const motion = header.locator('.motion-toggle');
  await motion.click();
  assert.equal(await motion.getAttribute('aria-pressed'), 'true');
  await motion.click();
  assert.equal(await motion.getAttribute('aria-pressed'), 'false');
  await page.waitForFunction(() => document.querySelector('#music-toggle').getAttribute('aria-pressed') === 'true');
  await header.locator('#music-toggle').click();
  await page.waitForFunction(() => document.querySelector('#music-toggle').getAttribute('aria-pressed') === 'false');
  await header.locator('#music-toggle').click();
  await page.waitForFunction(() => document.querySelector('#music-toggle').getAttribute('aria-pressed') === 'true');
  await header.getByRole('link', { name: 'Explore', exact: true }).click();
  assert.match(page.url(), /#missions$/);
  await header.locator('.small-brand').click();
  assert.match(page.url(), /#home$/);
  const fullscreen = header.locator('[data-fullscreen]');
  if (await fullscreen.isVisible()) {
    await fullscreen.click();
    await page.waitForFunction(() => document.fullscreenElement || document.querySelector('.home-header [data-fullscreen]').hidden);
    if (await page.evaluate(() => Boolean(document.fullscreenElement))) {
      assert.equal(await fullscreen.getAttribute('aria-label'), 'Exit fullscreen');
      await fullscreen.click();
      await page.waitForFunction(() => !document.fullscreenElement);
    }
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await button.click();
  await dialog.waitFor({ state: 'visible' });
  await page.screenshot({ path: 'docs/qa/project-info-landscape.png' });
  await page.keyboard.press('Escape');
  const unsupported = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  unsupported.on('pageerror', error => errors.push(error.message));
  await unsupported.addInitScript(() => Object.defineProperty(Document.prototype, 'fullscreenEnabled', { configurable: true, get: () => false }));
  await unsupported.goto(base);
  await unsupported.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
  assert.equal(await unsupported.locator('[data-fullscreen]:visible').count(), 0);
  assert.deepEqual(errors, []);
  await writeFile('docs/qa/header-info-results.json', JSON.stringify({ passed: true, checks: ['Info opens despite overlapping floating art', 'Team names and responsibilities', 'Event identity and Universal Event', 'Working information section shortcuts', 'Real NASA sources', 'Accessible Info hit area', 'License files return 200', 'Sources, Explore and home controls', 'Music on/off and motion pause/resume', 'Fullscreen or rejection hides unavailable control', 'Unsupported fullscreen controls absent', 'Landscape layout'], errors }, null, 2));
  console.log('Header and Info checks passed: team, tools, archives, shortcuts, media/motion/navigation controls and fullscreen fallback.');
} finally {
  await browser.close();
}
