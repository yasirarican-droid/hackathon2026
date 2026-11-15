import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('docs/qa', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.STARBOARD_URL || 'http://127.0.0.1:4186/#home');
  await page.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
  assert.doesNotMatch(await page.locator('body').innerText(), /AI-generated/i);
  await page.locator('.home-art-info').click();
  const dialog = page.locator('#exhibit-dialog');
  await dialog.waitFor({ state: 'visible' });
  for (const name of ['How this archive was made', 'ImageGen', 'Kling', 'ElevenLabs', 'Suno', 'NASA']) {
    assert.ok((await dialog.innerText()).includes(name), name);
  }
  await page.screenshot({ path: 'docs/qa/production-card-desktop.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  assert.ok(await dialog.isVisible());
  await page.screenshot({ path: 'docs/qa/production-card-landscape.png' });
  await page.keyboard.press('Escape');
  await page.locator('.apollo-card .mission-button').click();
  await page.locator('#room-page').waitFor({ state: 'visible' });
  assert.doesNotMatch(await page.locator('body').innerText(), /AI-generated/i);
  await page.locator('#art-info').click();
  await dialog.waitFor({ state: 'visible' });
  assert.match(await dialog.innerText(), /ElevenLabs/);
  assert.deepEqual(errors, []);
  console.log('Shared production card works from home and console; no repeated visible AI labels; desktop and landscape checked.');
} finally {
  await browser.close();
}
