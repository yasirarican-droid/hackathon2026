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
  const shade = page.locator('.guide-shade');
  const invitation = page.locator('.guide-invitation:not(.guide-fact-invitation)');
  async function idle() {
    await page.clock.runFor(1100);
    await page.clock.fastForward(46000);
  }
  const focus = await page.evaluate(() => document.activeElement.tagName);
  await page.clock.runFor(1100);
  await page.clock.fastForward(10000);
  await invitation.waitFor({ state: 'visible' });
  assert.equal(await guide.isVisible(), false);
  assert.equal(await shade.isVisible(), false);
  await page.screenshot({ path: 'docs/qa/explorer-invitation-desktop.png', animations: 'disabled' });
  await page.clock.fastForward(6000);
  assert.equal(await invitation.isVisible(), false);
  await idle();
  assert.equal(await guide.isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.tagName), focus);
  await page.locator('.guide-help:not(.guide-fact)').click();
  await guide.waitFor({ state: 'visible' });
  assert.equal(await shade.isVisible(), true);
  assert.equal(await invitation.isVisible(), false);
  assert.equal(await shade.evaluate(el => getComputedStyle(el).pointerEvents), 'none');
  assert.equal(await guide.getAttribute('data-guide'), 'home');
  await page.screenshot({ path: 'docs/qa/explorer-home-desktop.png', animations: 'disabled' });
  await guide.locator('.guide-action').click();
  assert.match(page.url(), /#missions$/);
  assert.equal(await guide.isVisible(), false);
  for (const mission of ['apollo', 'viking', 'sojourner']) {
    await page.locator('.' + mission + '-card .mission-button').click();
    await page.locator('#room-page').waitFor({ state: 'visible' });
    const help = page.locator('.guide-help:not(.guide-fact)');
    await page.waitForFunction(m => document.querySelector('.guide-help').dataset.guide === m, mission);
    const badge = await help.boundingBox();
    assert.ok(badge.y < 120 && Math.abs(badge.width - badge.height) < 1);
    assert.ok(await help.locator('img').evaluate(img => img.complete && img.naturalWidth > 0));
    const button = page.locator('#learning-guide-open');
    const size = await button.boundingBox();
    assert.ok(size.height >= 60);
    const timeline = await page.locator('.room-toolbar a[href="#home"]').boundingBox();
    assert.ok(size.y >= timeline.y + timeline.height + 8 && size.x <= 1 && size.x + size.width > 200);
    if (mission === 'sojourner') await page.screenshot({ path: 'docs/qa/field-guide-tab-desktop.png', animations: 'disabled' });
    assert.equal(await button.locator('.field-guide-dots i').count(), 3);
    await idle();
    assert.equal(await guide.isVisible(), false);
    await help.click();
    await guide.waitFor({ state: 'visible' });
    assert.equal(await shade.isVisible(), true);
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
      await page.locator('.guide-help:not(.guide-fact)').click();
      missionTips.add(await guide.locator('.guide-message').innerText());
    }
    assert.equal(missionTips.size, 4, mission);
    await page.evaluate(() => document.activeElement.blur());
    await page.mouse.move(15, 100);
    await page.clock.fastForward(30000);
    assert.equal(await guide.isVisible(), true, 'Manual tip must survive mouse movement and timeout');
    await guide.locator('.guide-action').click();
    await page.locator('#exhibit-dialog').waitFor({ state: 'visible' });
    assert.equal(await shade.isVisible(), false);
    assert.equal(await page.locator('.learning-card').count(), 3);
    await page.clock.fastForward(130000);
    assert.equal(await guide.isVisible(), false);
    await page.keyboard.press('Escape');
    await page.locator('.room-toolbar a[href="#home"]').click();
  }
  await page.clock.runFor(1100);
  await page.clock.fastForward(130000);
  assert.equal(await guide.isVisible(), false);
  await page.locator('.guide-help:not(.guide-fact)').click();
  await guide.waitFor({ state: 'visible' });
  const manualTips = new Set();
  for (let i = 0; i < 4; i++) {
    await page.locator('.guide-help:not(.guide-fact)').click();
    manualTips.add(await guide.locator('.guide-message').innerText());
  }
  assert.equal(manualTips.size, 4);
  assert.equal(await page.locator('.guide-help:not(.guide-fact)').getAttribute('aria-expanded'), 'true');
  await guide.locator('.guide-disable').click();
  await page.clock.fastForward(240000);
  assert.equal(await guide.isVisible(), false);
  await page.locator('.guide-help:not(.guide-fact)').click();
  await guide.waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  assert.equal(await guide.isVisible(), false);
  await page.locator('.guide-help:not(.guide-fact)').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.fastForward(60000);
  assert.equal(await guide.isVisible(), false);
  assert.equal(await page.locator('.guide-help:not(.guide-fact)').isVisible(), false);
  const small = await browser.newPage({ viewport: { width: 844, height: 390 }, reducedMotion: 'reduce' });
  await small.clock.install();
  await small.goto(base);
  await small.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
  await small.clock.fastForward(11000);
  const smallInvite = small.locator('.guide-invitation:not(.guide-fact-invitation)');
  await smallInvite.waitFor({ state: 'visible' });
  const inviteBounds = await smallInvite.boundingBox();
  assert.ok(inviteBounds.x >= 0 && inviteBounds.y >= 0 && inviteBounds.x + inviteBounds.width <= 844 && inviteBounds.y + inviteBounds.height <= 390);
  await small.screenshot({ path: 'docs/qa/explorer-invitation-landscape.png', animations: 'disabled' });
  await smallInvite.click();
  assert.equal(await small.locator('.explorer-guide').isVisible(), true);
  assert.equal(await small.locator('.guide-shade').isVisible(), true);
  assert.equal(await smallInvite.isVisible(), false);
  await small.keyboard.press('Escape');
  assert.equal(await small.locator('.guide-shade').isVisible(), false);
  assert.equal(await small.locator('.guide-help:not(.guide-fact)').evaluate(el => el === document.activeElement), true);
  await small.close();
  assert.deepEqual(errors, []);
  await writeFile('docs/qa/explorer-guide-results.json', JSON.stringify({ passed: true, checks: ['Small invitations only until clicked on four screens', 'No automatic focus change', 'Mission-specific transparent characters', 'Field Guide action and progress dots', 'Dialog suppression', 'Desktop/landscape bounds', 'Disable automatic tips for visit', 'Four distinct manual tips per cycle', 'Manual tips remain open after outside mouse movement, blur and elapsed time', 'Round character launcher in the top-right corner', 'Manual help remains available when automatic tips disabled', 'Escape dismisses and portrait guard suppresses both controls'], errors }, null, 2));
  console.log('Explorer guides passed: four characters, idle timing, actions, focus, dialogs, responsive bounds, dimmed background and launcher invitation.');
} finally {
  await browser.close();
}
