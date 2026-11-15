import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const base=process.env.STARBOARD_URL||'http://127.0.0.1:4186/';
const results=[];
try {
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await context.addInitScript(()=>localStorage.setItem('nasa-starboard-learning-v1',JSON.stringify({version:1,introductions:['apollo','viking','sojourner']})));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'#viking');await page.locator('#application').waitFor({state:'visible',timeout:60000});await page.locator('#room-page').waitFor({state:'visible',timeout:30000});
 for(const size of [{width:844,height:390},{width:667,height:320},{width:1024,height:472},{width:1366,height:650}]) {
  await page.setViewportSize(size);
  for(const mission of ['apollo','viking','sojourner']) {
   await page.evaluate(m=>location.hash=m,mission);await page.waitForFunction(m=>document.querySelector('#room-stage').dataset.mission===m,mission);await page.locator('#room-page').waitFor({state:'visible'});
   await page.waitForTimeout(300);
   const metrics=await page.evaluate(()=>{
    const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
    return {stage:rect('#room-stage'),guide:rect('#learning-guide-open'),left:rect('.crt-left'),history:rect('.console-location'),toolbar:rect('.room-toolbar'),portrait:rect('.guide-help'),overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   assert.equal(metrics.overflow,false);
   assert.ok(metrics.guide.bottom<=metrics.left.y+2,JSON.stringify({size,mission,metrics}));
   assert.ok(metrics.guide.right<metrics.history.x,JSON.stringify({size,mission,metrics}));
   assert.ok(metrics.toolbar.right<=size.width);
   assert.ok(metrics.stage.bottom<=size.height+1);
   await page.locator('#learning-guide-open').click();await page.locator('#exhibit-dialog').waitFor({state:'visible'});await page.locator('#close-exhibit').click();
   results.push({size,mission,metrics});
   if(mission==='viking'&&[844,1024].includes(size.width)) await page.screenshot({path:`docs/qa/mobile-room-${size.width}.png`});
  }
 }
 await page.setViewportSize({width:844,height:390});
 await page.evaluate(()=>{Object.defineProperty(document,'fullscreenEnabled',{configurable:true,value:false});Object.defineProperty(document,'webkitFullscreenEnabled',{configurable:true,value:false});});
 await page.locator('.room-toolbar [data-fullscreen]').click();await page.locator('#screen-space-help').waitFor({state:'visible'});assert.match(await page.locator('#screen-space-help').innerText(),/Hide Toolbar/);await page.locator('[data-close-screen-help]').click();
 await page.evaluate(()=>{Object.defineProperty(document,'fullscreenEnabled',{configurable:true,value:true});document.documentElement.requestFullscreen=async options=>{window.fullscreenOptions=options;};});
 await page.locator('.room-toolbar [data-fullscreen]').click();assert.equal(await page.evaluate(()=>window.fullscreenOptions.navigationUI),'hide');
 await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('#orientation-guard').isVisible());
 await page.setViewportSize({width:844,height:390});assert.equal(await page.locator('#orientation-guard').isVisible(),false);
 assert.deepEqual(errors,[]);
 await writeFile('docs/qa/mobile-layout-results.json',JSON.stringify({passed:true,results,fullscreenFallback:true,fullscreenRequest:true,rotation:true,errors},null,2));
 console.log('Mobile layout: three missions at four landscape sizes; controls, bounds, fullscreen request/fallback and rotation passed.');
} finally {await browser.close();}

