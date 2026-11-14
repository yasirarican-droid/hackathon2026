import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { vikingItems } from '../public/mission-room.js';
import { sojournerItems } from '../public/sojourner-room.js';
const archive = JSON.parse(await readFile('public/content/archive.json', 'utf8'));
const learning = JSON.parse(await readFile('public/content/learning.json', 'utf8'));
const apolloItems = ['mission', 'eagle', 'science', 'photos', 'seismometer', 'footprint', 'samples', 'timeline', 'radio', 'apollo-story', 'legacy'];
const base = process.env.STARBOARD_URL || 'http://127.0.0.1:4186/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
try {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(base);
  await p.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
  await p.locator('#certificate-open').click();
  assert.equal(await p.locator('.certificate-form').count(), 0);
  await p.keyboard.press('Escape');
  for (const [mission, ids, quiz] of [['apollo', apolloItems, 'legacy'], ['viking', vikingItems, 'viking-legacy'], ['sojourner', sojournerItems, 'sojourner-legacy']]) {
    await p.locator('.' + mission + '-card .mission-button').click();
    await p.locator('#room-page').waitFor({ state: 'visible' });
    assert.match(await p.locator('.crt-heading').first().evaluate(e => getComputedStyle(e).fontFamily), /ArchiveMono/);
    if (mission === 'apollo') await p.screenshot({ path: 'docs/qa/journey-digital-console.png' });
    await p.locator('.mission-status-open').click();
    assert.match(await p.locator('.catalog-record').getAttribute('href'), /nssdc\.gsfc\.nasa\.gov\/nmc\/spacecraft\/display.action\?id=/);
    await p.keyboard.press('Escape');
    for (const id of ids) {
      await p.locator('#objects-button').click();
      await p.locator('.object-list').getByRole('button', { name: archive.panels[id].title, exact: true }).click();
      await p.locator('#exhibit-dialog').waitFor({ state: 'visible' });
      if (id === quiz) {
        for (const item of archive.panels[id].quiz) {
          await p.locator('.quiz .choices button').nth(item.answer).click();
          await p.locator('.quiz').getByRole('button', { name: /Next discovery|See your discoveries/ }).click();
        }
        assert.equal(await p.locator('.completion-badge').count(), 1);
      }
      await p.keyboard.press('Escape');
    }
    await p.locator('#learning-guide-open').click();
    for (const [index, goal] of learning[mission].goals.entries()) await p.locator('.learning-card').nth(index).locator('fieldset button').nth(goal.answer).click();
    await p.keyboard.press('Escape');
    await p.locator('.last-signal-open').click();
    assert.match(await p.locator('.signal-note').innerText(), /not the spacecraft/);
    await p.getByRole('button', { name: 'Pause', exact: true }).click();
    assert.equal(await p.getByRole('button', { name: 'Resume', exact: true }).count(), 1);
    await p.getByRole('button', { name: 'Resume', exact: true }).click();
    if (mission === 'apollo') {
      await p.getByRole('button', { name: 'Skip to timeline →', exact: true }).click();
      await p.waitForURL(/#home$/);
      assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('nasa-starboard-learning-v1')).screens.includes('apollo-signal')), false);
      await p.locator('.apollo-card .mission-button').click();
      await p.locator('.last-signal-open').click();
    }
    if (mission === 'viking') {
      await p.setViewportSize({ width: 844, height: 390 });
      await p.screenshot({ path: 'docs/qa/journey-signal-landscape.png' });
      assert.equal(await p.locator('#close-exhibit').isVisible(), true);
      const rect = await p.locator('.signal-glass').boundingBox();
      assert.ok(rect.x >= 0 && rect.x + rect.width <= 844);
      await p.setViewportSize({ width: 1440, height: 900 });
    }
    if (mission === 'sojourner') await p.screenshot({ path: 'docs/qa/journey-signal.png' });
    for (let i = 0; i < 3; i++) await p.getByRole('button', { name: 'Next →', exact: true }).click();
    await p.getByRole('button', { name: 'Thank you · Return home →', exact: true }).click();
    await p.waitForURL(/#home$/);
    await p.locator('#home-page').waitFor({ state: 'visible' });
    assert.ok(await p.evaluate(m => JSON.parse(localStorage.getItem('nasa-starboard-learning-v1')).screens.includes(m + '-signal'), mission));
  }
  assert.match(await p.locator('#certificate-open').innerText(), /certificate is ready/);
  await p.locator('#certificate-open').click();
  await p.locator('#certificate-name').fill('Little Explorer');
  await p.screenshot({ path: 'docs/qa/journey-certificate.png' });
  const downloaded = p.waitForEvent('download');
  await p.getByRole('button', { name: 'Download my certificate ↓', exact: true }).click();
  const download = await downloaded;
  const svg = await readFile(await download.path(), 'utf8');
  assert.match(svg, /Little Explorer/);
  assert.match(svg, /Not a NASA-issued certificate/);
  assert.equal(await p.evaluate(() => localStorage.getItem('nasa-starboard-learning-v1').includes('Little Explorer')), false);
  await p.keyboard.press('Escape');
  await p.reload();
  await p.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
  assert.match(await p.locator('#certificate-open').innerText(), /certificate is ready/);
  p.once('dialog', d => d.dismiss());
  await p.locator('#reset-missions').click();
  assert.match(await p.locator('#certificate-open').innerText(), /certificate is ready/);
  p.once('dialog', d => d.accept());
  await p.locator('#reset-missions').click();
  assert.equal(await p.locator('#certificate-open').innerText(), '✦ Explorer certificate');
  const cleared = await p.evaluate(() => JSON.parse(localStorage.getItem('nasa-starboard-learning-v1')));
  assert.deepEqual(cleared.goals, []);
  assert.deepEqual(cleared.screens, []);
  assert.deepEqual(cleared.stories, []);
  assert.deepEqual(cleared.quiz, {});
  assert.equal(Object.values(cleared.visited).flat().length, 0);
  await p.locator('#certificate-open').click();
  assert.equal(await p.locator('.certificate-form').count(), 0);
  await p.keyboard.press('Escape');
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  await p.clock.install();
  await p.locator('.apollo-card .mission-button').click();
  await p.locator('.last-signal-open').click();
  await p.clock.runFor(900);
  assert.ok((await p.locator('.signal-text').innerText()).length > 5);
  await p.getByRole('button', { name: 'Pause', exact: true }).click();
  const pausedText = await p.locator('.signal-text').innerText();
  await p.clock.runFor(1500);
  assert.equal(await p.locator('.signal-text').innerText(), pausedText);
  await p.getByRole('button', { name: 'Resume', exact: true }).click();
  await p.getByRole('button', { name: 'Toggle the brief screen static sound effect', exact: true }).click();
  await p.getByRole('button', { name: 'Next →', exact: true }).click();
  for (let i = 0; i < 3; i++) {
    await p.getByRole('button', { name: 'Next →', exact: true }).click();
    await p.getByRole('button', { name: i === 2 ? 'Thank you · Return home →' : 'Next →', exact: true }).click();
  }
  await p.getByRole('button', { name: 'Thank you · Return home →', exact: true }).click();
  await p.clock.runFor(800);
  await p.screenshot({ path: 'docs/qa/journey-static-fade.png' });
  assert.equal(await p.locator('.signal-ending').count(), 1);
  await p.clock.runFor(1500);
  await p.waitForURL(/#home$/);
  assert.deepEqual(errors, []);
  await writeFile('docs/qa/final-journey-results.json', JSON.stringify({ passed: true, base, checks: ['NSSDCA record links in all three status cards', 'Digital console font', '34 mission object visits', 'All nine field guide answers and nine discovery answers', 'Last Signal pause/skip/full ending', 'Three completed stories return home', 'Landscape CRT layout', 'Certificate locked until all requirements complete', 'Named certificate download without storing name', 'Progress survives reload', 'Reset cancel and full reset', 'No browser exceptions'], errors }, null, 2));
  console.log('Final journey passed: NSSDCA, digital CRT, three farewells, complete certificate, persistence and reset.');
} finally { await browser.close(); }
