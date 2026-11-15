import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('docs/qa', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const base = process.env.STARBOARD_URL || 'http://127.0.0.1:4186/';
const errors = [];
async function ready(page) {
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(base);
  await page.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
  await page.locator('.sojourner-card .mission-button').click();
  await page.locator('.guide-fact').waitFor({ state: 'visible' });
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await ready(page);
  const fact = page.locator('.guide-fact');
  const invite = page.locator('.guide-fact-invitation');
  assert.equal(await fact.getAttribute('data-read'), 'false');
  const mainBox = await page.locator('.guide-help:not(.guide-fact)').boundingBox();
  const factBox = await fact.boundingBox();
  assert.ok(factBox.y >= mainBox.y + mainBox.height + 8);
  await page.clock.runFor(1100);
  await page.clock.fastForward(11000);
  await page.clock.fastForward(7000);
  await page.clock.fastForward(9000);
  await invite.waitFor({ state: 'visible' });
  await page.screenshot({ path: 'docs/qa/sojourner-naming-invitation.png', animations: 'disabled' });
  await invite.click();
  const dialog = page.locator('#exhibit-dialog');
  await dialog.waitFor({ state: 'visible' });
  assert.match(await dialog.innerText(), /12-year-old Valerie Ambroise/);
  assert.match(await dialog.innerText(), /Sojourner Truth/);
  assert.equal(await dialog.locator('a[href="https://www.jpl.nasa.gov/news/nasa-names-first-rover-to-explore-the-surface-of-mars/"]').count(), 1);
  assert.ok(await dialog.locator('.naming-story-guide img').evaluate(img => img.complete && img.naturalWidth > 0));
  await page.screenshot({ path: 'docs/qa/sojourner-naming-story-desktop.png', animations: 'disabled' });
  assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem('nasa-starboard-learning-v1')).stories.includes('sojourner-name')));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('.guide-fact').dataset.read === 'true');
  assert.doesNotMatch(await fact.getAttribute('aria-label'), /Did you know/i);
  await page.reload();
  await page.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
  await fact.waitFor({ state: 'visible' });
  assert.equal(await fact.getAttribute('data-read'), 'true');
  for (let i = 0; i < 8; i++) {
    await page.mouse.move(12 + i, 300);
    await page.clock.fastForward(20000);
    assert.equal(await invite.isVisible(), false);
  }
  await fact.click();
  await dialog.waitFor({ state: 'visible' });
  assert.match(await dialog.innerText(), /A Child Helped Name a Mars Rover/);
  await page.keyboard.press('Escape');
  await page.locator('.room-toolbar a[href="#home"]').click();
  assert.equal(await fact.isVisible(), false);
  const small = await browser.newPage({ viewport: { width: 844, height: 390 } });
  await ready(small);
  const smallFact = small.locator('.guide-fact');
  const box = await smallFact.boundingBox();
  assert.ok(box.x >= 0 && box.y + box.height < 390);
  await smallFact.click();
  await small.locator('.naming-story').waitFor({ state: 'visible' });
  await small.screenshot({ path: 'docs/qa/sojourner-naming-story-landscape.png', animations: 'disabled' });
  const blocked = await browser.newPage({ viewport: { width: 1200, height: 720 } });
  await blocked.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage disabled'); };
    Storage.prototype.setItem = () => { throw new Error('Storage disabled'); };
  });
  await ready(blocked);
  await blocked.locator('.guide-fact').click();
  await blocked.locator('.naming-story').waitFor({ state: 'visible' });
  await blocked.keyboard.press('Escape');
  await blocked.waitForFunction(() => document.querySelector('.guide-fact').dataset.read === 'true');
  assert.deepEqual(errors, []);
  await writeFile('docs/qa/naming-story-results.json', JSON.stringify({ passed: true, checks: ['NASA-sourced naming story and direct source link', 'Astronaut button below Sojourner portrait', 'Timed Did you know invitation', 'Opening story marks seen', 'Seen state survives reload', 'No reminder after reading across subsequent intervals', 'Story remains reopenable', 'Hidden outside Sojourner', 'Landscape layout', 'Blocked storage fallback'], errors }, null, 2));
  console.log('Naming story passed: sourced content, astronaut control, reminder, read-once persistence, replay, landscape and blocked storage.');
} finally {
  await browser.close();
}
