import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const base = process.env.STARBOARD_URL || 'http://127.0.0.1:4186/';
const errors = [];
try {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(base);
  await p.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: 'docs/qa/desk-cartoon-home.png', fullPage: true });
  for (const [mission, file] of [['apollo', 'archive-floppy-525-v1'], ['viking', 'archive-floppy-35-v1'], ['sojourner', 'archive-cd-v1']]) {
    await p.locator('.' + mission + '-card .mission-button').click();
    await p.locator('#room-page').waitFor({ state: 'visible' });
    assert.equal(await p.locator('.telephone').getAttribute('data-open'), 'last-signal');
    assert.match(await p.locator('.last-signal-notification').innerText(), /LAST\s+SIGNAL!/);
    const src = await p.locator('.story-media img').getAttribute('src');
    const matches = await p.evaluate(async ({ src, file }) => {
      const manifest = await (await fetch('content/manifest.json')).json();
      const blob = await (await fetch(src)).arrayBuffer();
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', blob))].map(x => x.toString(16).padStart(2, '0')).join('');
      return manifest.find(x => x.path.endsWith(file + '.webp')).sha256 === digest;
    }, { src, file });
    assert.equal(matches, true);
    await p.locator('.story-media').click();
    await p.getByRole('button', { name: 'Pause story', exact: true }).waitFor();
    assert.equal(await p.locator('.story-postcard img').count(), 1);
    await p.keyboard.press('Escape');
    await p.locator('.telephone').click();
    assert.equal(await p.locator('.signal-cabinet').count(), 1);
    assert.equal(await p.locator('.story-postcard').count(), 0);
    assert.match(await p.locator('.signal-location').innerText(), mission === 'apollo' ? /Moon/ : /Mars/);
    assert.match(await p.locator('.signal-glass h2').evaluate(e => getComputedStyle(e).fontFamily), /ArchiveMono/);
    assert.match(await p.locator('.signal-note').evaluate(e => getComputedStyle(e).fontFamily), /ArchiveHand/);
    await p.screenshot({ path: 'docs/qa/desk-crt-' + mission + '.png' });
    await p.keyboard.press('Escape');
    await p.screenshot({ path: 'docs/qa/desk-console-' + mission + '.png' });
    for (const viewport of [{ width: 1920, height: 1080 }, { width: 1024, height: 600 }, { width: 844, height: 390 }]) {
      await p.setViewportSize(viewport);
      const hit = await p.locator('.story-media').evaluate(e => {
        const r = e.getBoundingClientRect();
        return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      });
      assert.equal(hit, true, mission + ' media is covered at ' + viewport.width);
      await p.locator('.telephone').click();
      const next = p.getByRole('button', { name: 'Next →', exact: true });
      await next.scrollIntoViewIfNeeded();
      const box = await next.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= viewport.width && box.y >= 0 && box.y + box.height <= viewport.height);
      if (viewport.width === 844) await p.screenshot({ path: 'docs/qa/desk-crt-landscape-' + mission + '.png' });
      await p.keyboard.press('Escape');
    }
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.locator('.room-toolbar a[href="#home"]').click();
  }
  await p.locator('.apollo-card .mission-button').click();
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  assert.equal(await p.locator('.last-signal-notification').evaluate(e => getComputedStyle(e).animationName), 'last-signal-buzz');
  const opacityValues = await p.locator('.last-signal-notification').evaluate(e => e.getAnimations()[0].effect.getKeyframes().map(k => Number(k.opacity)));
  assert.ok(Math.min(...opacityValues) < .3 && Math.max(...opacityValues) === 1);
  await p.mouse.move(500, 100);
  await p.screenshot({ path: 'docs/qa/desk-comic-last-signal.png' });
  await p.locator('.room-toolbar .motion-toggle').click();
  assert.equal(await p.locator('.last-signal-notification').evaluate(e => getComputedStyle(e).animationPlayState), 'paused');
  await p.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await p.locator('.last-signal-notification').evaluate(e => getComputedStyle(e).animationName), 'none');
  assert.deepEqual(errors, []);
  await writeFile('docs/qa/archive-desk-results.json', JSON.stringify({ passed: true, base, checks: ['Three verified generated prop assets', 'All recorded stories play from disk/CD controls', 'All phones open Last Signal instead of recorded stories', 'Visible ringing notification obeys pause/reduced motion', 'New CRT cabinet and mission location', 'Digital CRT typography and comic interface typography', 'Uncovered media hit targets at three sizes', 'Landscape Next controls reachable', 'No browser exceptions'], errors }, null, 2));
  console.log('Archive desk passed: comic typography, floppy/CD stories, ringing Last Signal phones and responsive CRTs.');
} finally { await browser.close(); }
