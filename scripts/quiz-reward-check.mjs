import { chromium } from 'playwright';
import { finishFirstEntry } from './test-entry.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const archive = JSON.parse(await readFile('public/content/archive.json', 'utf8'));
const base = process.env.STARBOARD_URL || 'http://127.0.0.1:4186/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
try {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(base);
  await p.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
  await p.locator('#certificate-open').click();
  assert.equal(await p.locator('.certificate-form').count(), 0);
  await p.locator('.certificate-mission').first().getByRole('button', { name: 'Start this mission quiz →', exact: true }).click();
  await p.locator('.quiz-question').waitFor();
  assert.match(p.url(), /#apollo$/);
  await p.keyboard.press('Escape');
  for (const [mission, quiz] of [['apollo', 'legacy'], ['viking', 'viking-legacy'], ['sojourner', 'sojourner-legacy']]) {
    if (mission !== 'apollo') {
      await p.locator('.room-toolbar a[href="#home"]').click();
      await p.locator('.' + mission + '-card .mission-button').click();
      await finishFirstEntry(p);
    }
    await p.locator('#objects-button').click();
    const menu = await p.locator('.object-list button').evaluateAll(buttons => buttons.map(b => b.dataset.object));
    const scene = await p.locator('#room-stage [data-open]').evaluateAll((nodes, mission) => nodes.filter(n => n.getClientRects().length).map(n => n.dataset.open === 'last-signal' ? mission + '-signal' : n.dataset.open), mission);
    for (const id of menu) assert.ok(scene.includes(id), mission + ' menu lists an absent desk object: ' + id);
    assert.ok(!menu.includes('radio') && !menu.includes('olive') && !menu.includes('disc'));
    if (mission === 'sojourner') assert.ok(!menu.includes('sojourner-solar') && !menu.includes('sojourner-relay') && !menu.includes('sojourner-timeline'));
    const objectId = mission === 'apollo' ? 'footprint' : mission + '-photos';
    assert.equal(await p.locator(`[data-object="${objectId}"]`).getAttribute('data-visited'), 'false');
    await p.locator(`[data-object="${objectId}"]`).click();
    await p.keyboard.press('Escape');
    await p.locator('#objects-button').click();
    assert.equal(await p.locator(`[data-object="${objectId}"]`).getAttribute('data-visited'), 'true');
    assert.equal(await p.locator(`[data-object="${objectId}"] .object-check`).innerText(), '✓');
    await p.screenshot({ path: 'docs/qa/objects-visited-' + mission + '.png' });
    await p.locator(`[data-object="${quiz}"]`).click();
    if (mission === 'apollo') {
      await p.locator('.choices button').nth((archive.panels[quiz].quiz[0].answer + 1) % 3).click();
      assert.match(await p.locator('.quiz-feedback').innerText(), /try again/);
      await p.getByRole('button', { name: 'Look at the clue →', exact: true }).click();
      await p.getByRole('button', { name: 'Back to mission quiz →', exact: true }).click();
      assert.match(await p.locator('.quiz-question').innerText(), /Which part of Eagle/);
    }
    for (const [i, question] of archive.panels[quiz].quiz.entries()) {
      assert.equal(await p.locator('.quiz-steps .is-current').innerText(), String(i + 1));
      await p.locator('.choices button').nth(question.answer).click();
      if (i < archive.panels[quiz].quiz.length - 1) await p.getByRole('button', { name: 'Next discovery →', exact: true }).click();
    }
    assert.equal(await p.locator('.certificate-form').count(), 1);
    assert.equal(await p.locator('.reward-celebration').count(), 1);
    assert.equal(await p.locator('.reward-confetti i').count(), 48);
    if (mission === 'apollo') { await p.waitForTimeout(250); await p.screenshot({ path: 'docs/qa/quiz-confetti.png' }); }
    assert.ok(await p.evaluate(m => JSON.parse(localStorage.getItem('nasa-starboard-learning-v1')).completedMissions.includes(m), mission));
    const image = p.locator('.certificate-preview');
    await image.evaluate(e => e.decode());
    await p.locator('#certificate-name').fill('Maya & Arda');
    await p.locator('.certificate-theme').selectOption('night');
    await image.evaluate(e => e.decode());
    const preview = await image.getAttribute('src');
    assert.match(decodeURIComponent(preview), /Maya &amp; Arda/);
    await p.screenshot({ path: 'docs/qa/quiz-reward-' + mission + '.png' });
    const downloadWait = p.waitForEvent('download');
    await p.getByRole('button', { name: 'Download my certificate ↓', exact: true }).click();
    const file = await downloadWait;
    const svg = await readFile(await file.path(), 'utf8');
    assert.match(svg, /Maya &amp; Arda/);
    assert.match(svg, /Not issued by NASA/);
    assert.equal(await p.evaluate(() => localStorage.getItem('nasa-starboard-learning-v1').includes('Maya')), false);
    if (mission === 'apollo') {
      await p.getByRole('button', { name: 'Practice this quiz again', exact: true }).click();
      await p.keyboard.press('Escape');
      await p.reload();
      await p.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
      await p.locator('.room-toolbar a[href="#home"]').click();
      await p.locator('#certificate-open').click();
      await p.locator('.certificate-mission').first().getByRole('button', { name: 'View certificate →', exact: true }).click();
      assert.equal(await p.locator('.certificate-form').count(), 1);
      await p.keyboard.press('Escape');
      await p.locator('.apollo-card .mission-button').click();
    } else await p.keyboard.press('Escape');
  }
  await p.locator('.room-toolbar a[href="#home"]').click();
  assert.match(await p.locator('#certificate-open').innerText(), /certificate is ready/);
  await p.locator('#certificate-open').click();
  assert.match(await p.locator('.certificate-heading').innerText(), /All three missions complete/);
  await p.setViewportSize({ width: 844, height: 390 });
  await p.locator('#certificate-name').fill('Little Explorer');
  const button = p.getByRole('button', { name: 'Download my certificate ↓', exact: true });
  await button.scrollIntoViewIfNeeded();
  const rect = await button.boundingBox();
  assert.ok(rect.x >= 0 && rect.x + rect.width <= 844);
  await p.screenshot({ path: 'docs/qa/quiz-certificate-landscape.png' });
  await p.keyboard.press('Escape');
  p.once('dialog', d => d.accept());
  await p.locator('#reset-missions').click();
  assert.deepEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('nasa-starboard-learning-v1')).completedMissions), []);
  await p.locator('#certificate-open').click();
  assert.equal(await p.locator('.certificate-form').count(), 0);
  const migratedContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await migratedContext.addInitScript(() => localStorage.setItem('nasa-starboard-learning-v1', JSON.stringify({ version: 1, quiz: { legacy: 3, 'viking-legacy': 3, 'sojourner-legacy': 3 }, screens: ['apollo-signal'] })));
  const migrated = await migratedContext.newPage();
  await migrated.goto(base);
  await migrated.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
  assert.match(await migrated.locator('#certificate-open').innerText(), /certificate is ready/);
  await migrated.locator('.apollo-card .mission-button').click();
  await migrated.locator('#objects-button').click();
  assert.equal(await migrated.locator('[data-object="apollo-signal"]').getAttribute('data-visited'), 'true');
  await migratedContext.close();
  const blockedContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await blockedContext.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage unavailable', 'SecurityError'); } }); });
  const blocked = await blockedContext.newPage();
  await blocked.goto(base);
  await blocked.locator('#application').waitFor({ state: 'visible', timeout: 60000 });
  await blocked.locator('.apollo-card .mission-button').click();
  await finishFirstEntry(blocked);
  await blocked.locator('.notebook').click();
  for (const [i, question] of archive.panels.legacy.quiz.entries()) {
    await blocked.locator('.choices button').nth(question.answer).click();
    if (i < 2) await blocked.getByRole('button', { name: 'Next discovery →', exact: true }).click();
  }
  assert.equal(await blocked.locator('.certificate-form').count(), 1);
  assert.equal(await blocked.locator('.reward-confetti').count(), 0);
  assert.equal(await blocked.locator('.reward-celebration').count(), 1);
  await blockedContext.close();
  assert.deepEqual(errors, []);
  await writeFile('docs/qa/quiz-reward-results.json', JSON.stringify({ passed: true, base, checks: ['Only actual room objects in menu', 'Visited checkmarks', 'Certificate-to-quiz navigation', 'Clue and return navigation', 'Wrong-answer support', 'Immediate reward on final correct answer', '48-piece confetti celebration', 'Per-mission and three-mission awards', 'Editable name/theme and SVG download', 'No name persisted', 'Award survives practice/reload', 'Landscape controls', 'Full reset clears awards', 'No browser exceptions'], errors }, null, 2));
  console.log('Quiz rewards passed: real object checkmarks, guided quizzes, immediate confetti, customized certificates and saved awards.');
} finally { await browser.close(); }
