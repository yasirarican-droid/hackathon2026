import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const base=process.env.STARBOARD_URL||'http://127.0.0.1:4186/';
const results=[];
async function finish(page){
 await page.locator('#briefing-screen').waitFor({state:'visible'});
 await page.locator('#briefing-skip').click();
 await page.locator('#arrival-screen').waitFor({state:'visible'});await page.locator('#arrival-skip').click();
 await page.locator('#crt-intro-screen').waitFor({state:'visible'});await page.locator('#crt-intro-skip').click();
 await page.locator('#room-page').waitFor({state:'visible'});
}
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.locator('#application').waitFor({state:'visible',timeout:60000});
 for(const mission of ['apollo','viking','sojourner']){
  await p.locator('.'+mission+'-card .mission-button').click();await finish(p);
  assert.ok(await p.evaluate(m=>JSON.parse(localStorage.getItem('nasa-starboard-learning-v1')).introductions.includes(m),mission));
  await p.locator('.room-toolbar a[href="#home"]').click();
  assert.match(await p.locator('.'+mission+'-card .watch-story').innerText(),/Replay story/);
  await p.locator('.'+mission+'-card .mission-button').click();await p.locator('#room-page').waitFor({state:'visible'});
  assert.equal(await p.locator('#briefing-screen').isVisible(),false);assert.equal(await p.locator('#arrival-screen').isVisible(),false);assert.equal(await p.locator('#crt-intro-screen').isVisible(),false);
  await p.reload();await p.locator('#application').waitFor({state:'visible'});await p.locator('#room-page').waitFor({state:'visible'});
  assert.equal(await p.locator('#briefing-screen').isVisible(),false);
  await p.locator('.room-toolbar a[href="#home"]').click();await p.locator('.'+mission+'-card .watch-story').click();await finish(p);
  await p.locator('.room-toolbar a[href="#home"]').click();results.push({mission,firstEntryStory:true,repeatDirect:true,reloadDirect:true,manualReplay:true});
 }
 await p.locator('.viking-card .watch-story').click();await p.locator('#briefing-screen').waitFor({state:'visible'});
 await p.goBack();await p.locator('#home-page').waitFor({state:'visible'});await p.goForward();await p.locator('#room-page').waitFor({state:'visible'});assert.equal(await p.locator('#briefing-screen').isVisible(),false);
 await p.locator('.room-toolbar a[href="#home"]').click();await p.locator('.viking-card .watch-story').click();await p.locator('#briefing-screen').waitFor({state:'visible'});
 await p.reload();await p.locator('#application').waitFor({state:'visible'});await p.locator('#room-page').waitFor({state:'visible'});assert.equal(await p.locator('#briefing-screen').isVisible(),false);
 await p.locator('.room-toolbar a[href="#home"]').click();p.once('dialog',d=>d.accept());await p.locator('#reset-missions').click();
 await p.locator('.apollo-card .mission-button').click();await p.locator('#briefing-screen').waitFor({state:'visible'});await finish(p);
 const migrated=await context.newPage();await migrated.addInitScript(()=>localStorage.setItem('nasa-starboard-learning-v1',JSON.stringify({version:1,entries:{viking:{briefingSeen:true,arrivalSeen:false,crtIntroSeen:false}}})));
 await migrated.goto(base+'#viking');await migrated.locator('#application').waitFor({state:'visible'});await migrated.locator('#room-page').waitFor({state:'visible'});assert.equal(await migrated.locator('#briefing-screen').isVisible(),false);
 const blockedContext=await browser.newContext({reducedMotion:'reduce'});await blockedContext.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('blocked')}})});
 const blocked=await blockedContext.newPage();await blocked.goto(base);await blocked.locator('#application').waitFor({state:'visible'});await blocked.locator('.apollo-card .mission-button').click();await finish(blocked);
 await blocked.locator('.room-toolbar a[href="#home"]').click();await blocked.locator('.apollo-card .mission-button').click();await blocked.locator('#room-page').waitFor({state:'visible'});assert.equal(await blocked.locator('#briefing-screen').isVisible(),false);
 assert.deepEqual(errors,[]);
 await writeFile('docs/qa/first-story-results.json',JSON.stringify({passed:true,results,interruptedReplayDoesNotAutoResume:true,reset:true,legacyMigration:true,blockedStorageSameVisit:true},null,2));
 console.log('First-story entry passed: three missions, repeat/reload suppression, explicit replay, reset, legacy data and unavailable storage.');
}finally{await browser.close()}
