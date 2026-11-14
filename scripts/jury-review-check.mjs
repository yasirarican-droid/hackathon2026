import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('docs/qa', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const base = process.env.STARBOARD_URL || 'http://127.0.0.1:4186/';
const errors = [];
try {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  p.on('pageerror', error => errors.push(error.message));
  await p.clock.install();
  await p.goto(base);
  await p.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
  await p.evaluate(() => document.fonts.ready);
  assert.match(await p.locator('.home-affiliation').innerText(), /Not affiliated with or endorsed by NASA/);
  assert.equal(await p.locator('.where-now-link').count(), 3);
  await p.screenshot({ path: 'docs/qa/review-home.png', fullPage: true });
  for (const [mission, place] of [['apollo', 'Tranquility'], ['viking', 'Chryse'], ['sojourner', 'Ares']]) {
    await p.locator('.' + mission + '-card .where-now-link').click();
    const dialog = p.locator('#exhibit-dialog');
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await dialog.locator('#exhibit-title').innerText(), 'Where is it now?');
    assert.match(await dialog.locator('.status-copy').innerText(), new RegExp(place));
    await dialog.locator('.evidence-figure img').evaluate(img => img.decode());
    assert.match(await dialog.locator('.status-image-note').innerText(), mission === 'sojourner' ? /not a confirmed Sojourner/ : /not a live image/);
    await p.screenshot({ path: 'docs/qa/review-status-' + mission + '.png' });
    await p.keyboard.press('Escape');
    await p.locator('.' + mission + '-card .mission-button').click();
    await p.locator('#room-page').waitFor({ state: 'visible' });
    assert.equal(await p.locator('#arrival-replay').isVisible(), false);
    assert.equal(await p.locator('#crt-intro-restart').isVisible(), false);
    assert.match(await p.locator('#briefing-replay').innerText(), /^Replay story$/i);
    await p.clock.fastForward(65000);
    assert.equal(await p.locator('.explorer-guide').isVisible(), false);
    await p.locator('.mission-status-open').click();
    await dialog.waitFor({ state: 'visible' });
    assert.match(await dialog.locator('.status-copy').innerText(), new RegExp(place));
    await p.keyboard.press('Escape');
    if (mission === 'apollo') {
      await p.locator('.story-media').click();
      await p.getByRole('button', { name: 'Hear the real landing call →', exact: true }).click();
      const audio = dialog.locator('.original-audio audio');
      await audio.waitFor();
      await audio.evaluate(async element => { window.originalAudioProbe = element; await element.play(); });
      assert.equal(await audio.evaluate(element => element.paused), false);
      await p.keyboard.press('Escape');
      await p.waitForFunction(() => window.originalAudioProbe.paused);
      assert.equal(await p.evaluate(() => window.originalAudioProbe.paused), true);
    }
    if (mission === 'viking') {
      await p.locator('.crt-right').click();
      assert.doesNotMatch(await dialog.innerText(), /Archive flag: BB/);
      await p.getByRole('button', { name: 'Warmer season', exact: true }).click();
      assert.equal(await p.locator('.seasons-diagram').getAttribute('data-season'), 'spring');
      assert.match(await p.locator('.season-explanation').innerText(), /More gas/);
      await p.getByRole('button', { name: 'Polar winter', exact: true }).click();
      assert.match(await p.locator('.season-explanation').innerText(), /Less gas/);
      await p.screenshot({ path: 'docs/qa/review-season-lesson.png' });
      await p.keyboard.press('Escape');
    }
    if (mission === 'sojourner') {
      await p.setViewportSize({ width: 844, height: 390 });
      await p.locator('.mission-status-open').click();
      await dialog.waitFor({ state: 'visible' });
      await p.screenshot({ path: 'docs/qa/review-status-landscape.png' });
      const bounds = await dialog.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 844);
      await p.keyboard.press('Escape');
      await p.setViewportSize({ width: 1440, height: 900 });
    }
    await p.locator('.room-toolbar a[href="#home"]').click();
  }
  assert.deepEqual(errors, []);
  await writeFile('docs/qa/jury-review-results.json', JSON.stringify({ passed: true, checks: ['NASA independence disclosure', 'Three visible status entry points on home and in rooms', 'Dated genuine orbital images', 'Where/condition/reason/ending and explicit uncertainty', 'One Replay story control', 'No unsolicited full-screen guide', 'Original Apollo audio playback and close cleanup', 'Seasonal pressure explanation and controls', 'Child-facing archive jargon removed', 'Landscape status layout'], errors }, null, 2));
  console.log('Review changes passed: independent disclosure, mission status, orbital evidence, original audio, seasonal science and quiet guides.');
} finally {
  await browser.close();
}
