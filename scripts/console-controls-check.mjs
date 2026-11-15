import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const b=await chromium.launch({channel:'chrome',headless:true});const results=[];
try {
 const c=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});await c.addInitScript(()=>localStorage.setItem('nasa-starboard-learning-v1',JSON.stringify({version:1,introductions:['apollo','viking','sojourner']})));
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.STARBOARD_URL||'http://127.0.0.1:4186/')+'#apollo');await p.locator('#application').waitFor({state:'visible',timeout:60000});await p.locator('#room-page').waitFor({state:'visible'});
 for(const size of [{width:1440,height:900},{width:844,height:390},{width:667,height:280},{width:1024,height:472}]){
  await p.setViewportSize(size);
  for(const mission of ['apollo','viking','sojourner']){
   await p.evaluate(m=>location.hash=m,mission);await p.waitForFunction(m=>(document.querySelector('#room-stage').dataset.mission||'apollo')===m,mission);await p.locator('#room-page').waitFor({state:'visible'});await p.waitForTimeout(150);
   assert.equal(await p.locator('.room-toolbar [data-open="last-signal"], #art-info, .lamp .desk-tip, .mission-history-actions').count(),0);
   assert.equal(await p.locator('#room-stage [data-open="mission-status"]').count(),1);
   const rect=await p.locator('.console-location').boundingBox(),crt=await p.locator('.crt-right').boundingBox();
   assert.ok(rect.y>=crt.y+crt.height,JSON.stringify({size,mission,rect,crt}));assert.ok(rect.x>=crt.x&&rect.x+rect.width<=size.width);assert.ok(rect.height>=28);
   for(const selector of ['.notebook-question','.last-signal-notification']){const q=await p.locator(selector).boundingBox();const overlapX=Math.min(rect.x+rect.width,q.x+q.width)-Math.max(rect.x,q.x);const overlapY=Math.min(rect.y+rect.height,q.y+q.height)-Math.max(rect.y,q.y);assert.ok(overlapX<=0||overlapY<=0,JSON.stringify({size,mission,selector,rect,q}));}
   console.log(size.width,size.height,mission);await p.locator('.console-location').click();await p.locator('#exhibit-dialog').waitFor({state:'visible'});assert.match(await p.locator('#exhibit-content').innerText(),/NSSDCA/);await p.locator('#close-exhibit').click();
   await p.locator('.desk-plane .mug').click();await p.locator('#exhibit-dialog').waitFor({state:'visible'});assert.match(await p.locator('#exhibit-content').innerText(),/ElevenLabs/);await p.locator('#close-exhibit').click();
   await p.locator('#lamp-toggle').click();assert.equal(await p.locator('#lamp-toggle').getAttribute('aria-pressed'),'false');await p.locator('#lamp-toggle').click();
   await p.locator('.telephone').click();await p.locator('.signal-glass').waitFor({state:'visible'});await p.locator('#close-exhibit').click();
   await p.mouse.move(0,0);
   if([1440,844].includes(size.width))await p.screenshot({path:`docs/qa/console-location-${mission}-${size.width}.png`});
   assert.equal(await p.locator('.console-location').evaluate(e=>getComputedStyle(e).animationName),'none');
   results.push({size,mission,rect});
  }
 }
 await p.setViewportSize({width:1440,height:900});await p.emulateMedia({reducedMotion:'no-preference'});assert.equal(await p.locator('.console-location').evaluate(e=>getComputedStyle(e).animationName),'location-beacon');
 await p.locator('.room-toolbar .motion-toggle').click();assert.equal(await p.locator('.console-location').evaluate(e=>getComputedStyle(e).animationName),'none');
 assert.deepEqual(errors,[]);await writeFile('docs/qa/console-controls-results.json',JSON.stringify({passed:true,results,errors},null,2));console.log('Console controls passed: three missions/four sizes, status, mug Info, lamp toggle, phone Last Signal, reduced/paused motion.');
}finally{await b.close();}
