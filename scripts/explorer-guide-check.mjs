import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('docs/qa', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const base = process.env.STARBOARD_URL || 'http://127.0.0.1:4186/';
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(base);
  await page.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
  const guide = page.locator('.explorer-guide');
  async function idle() {
    await page.clock.runFor(1100);
    await page.clock.fastForward(46000);
  }
  const focus = await page.evaluate(() => document.activeElement.tagName);
  await idle();
  await guide.waitFor({ state: 'visible' });
  assert.equal(await guide.getAttribute('data-guide'), 'home');
  assert.equal(await page.evaluate(() => document.activeElement.tagName), focus);
  await page.screenshot({ path: 'docs/qa/explorer-home-desktop.png', animations: 'disabled' });
  await guide.locator('.guide-action').click();
  assert.match(page.url(), /#missions$/);
  assert.equal(await guide.isVisible(), false);
  for (const mission of ['apollo', 'viking', 'sojourner']) {
    await page.locator('.' + mission + '-card .mission-button').click();
    await page.locator('#room-page').waitFor({ state: 'visible' });
    const button = page.locator('#learning-guide-open');
    const size = await button.boundingBox();
    assert.ok(size.height >= 60);
    assert.equal(await button.locator('.field-guide-dots i').count(), 3);
    await idle();
    await guide.waitFor({ state: 'visible' });
    assert.equal(await guide.getAttribute('data-guide'), mission);
    const image = guide.locator('img');
    assert.ok(await image.evaluate(element => element.complete && element.naturalWidth > 0));
    await page.screenshot({ path: `docs/qa/explorer-${mission}-desktop.png`, animations: 'disabled' });
    if (mission === 'sojourner') {
      await page.setViewportSize({ width: 844, height: 390 });
      await page.screenshot({ path: 'docs/qa/explorer-sojourner-landscape.png', animations: 'disabled' });
      const box = await guide.boundingBox();
      assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 844 && box.y + box.height <= 390);
      await page.setViewportSize({ width: 1440, height: 900 });
    }
    const missionTips = new Set();
    for (let i = 0; i < 4; i++) {
      await page.locator('.guide-help').click();
      missionTips.add(await guide.locator('.guide-message').innerText());
    }
    assert.equal(missionTips.size, 4, mission);
    await guide.locator('.guide-action').click();
    await page.locator('#exhibit-dialog').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.learning-card').count(), 3);
    await page.clock.fastForward(130000);
    assert.equal(await guide.isVisible(), false);
    await page.keyboard.press('Escape');
    await page.locator('.room-toolbar a[href="#home"]').click();
  }
  await page.clock.runFor(1100);
  await page.clock.fastForward(130000);
  await guide.waitFor({ state: 'visible' });
  const manualTips = new Set();
  for (let i = 0; i < 4; i++) {
    await page.locator('.guide-help').click();
    manualTips.add(await guide.locator('.guide-message').innerText());
  }
  assert.equal(manualTips.size, 4);
  assert.equal(await page.locator('.guide-help').getAttribute('aria-expanded'), 'true');
  await guide.locator('.guide-disable').click();
  await page.clock.fastForward(240000);
  assert.equal(await guide.isVisible(), false);
  await page.locator('.guide-help').click();
  await guide.waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  assert.equal(await guide.isVisible(), false);
  await page.locator('.guide-help').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.fastForward(60000);
  assert.equal(await guide.isVisible(), false);
  assert.equal(await page.locator('.guide-help').isVisible(), false);
  assert.deepEqual(errors, []);
  await writeFile('docs/qa/explorer-guide-results.json', JSON.stringify({ passed: true, checks: ['Idle-only appearance on four screens', 'No automatic focus change', 'Mission-specific transparent characters', 'Field Guide action and progress dots', 'Dialog suppression', 'Desktop/landscape bounds', 'Disable automatic tips for visit', 'Four distinct manual tips per cycle', 'Manual help remains available when automatic tips disabled', 'Escape dismisses and portrait guard suppresses both controls'], errors }, null, 2));
  console.log('Explorer guides passed: four characters, idle timing, actions, focus, dialogs, suppression and responsive bounds.');
} finally {
  await browser.close();
}
