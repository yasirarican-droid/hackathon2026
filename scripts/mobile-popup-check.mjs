import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const base=process.env.STARBOARD_URL||'http://127.0.0.1:4186/';
const archive=JSON.parse(await readFile('public/content/archive.json','utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try {
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await context.addInitScript(()=>localStorage.setItem('nasa-starboard-learning-v1',JSON.stringify({version:1,introductions:['apollo','viking','sojourner']})));
 const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'#apollo');await p.locator('#application').waitFor({state:'visible',timeout:60000});await p.locator('#room-page').waitFor({state:'visible'});
 for(const size of [{width:844,height:390},{width:667,height:280},{width:1024,height:472},{width:1366,height:650}]) {
  await p.setViewportSize(size);
  const ids=size.width===844?[...Object.keys(archive.panels),'learning-guide','sources','objects','legacy','certificate','apollo-signal','viking-signal','sojourner-signal']:['photos','apollo-story','viking-message','sojourner-message','sojourner-cassette','learning-guide','legacy','certificate','eagle','viking-lander','sojourner-rover','sojourner-name','viking-weather','viking-status','apollo-signal'];
  for(const id of ids){
   console.log(size.width,id);
   await p.evaluate(id=>{let b=document.querySelector('#popup-test-open');if(!b){b=document.createElement('button');b.id='popup-test-open';document.querySelector('#application').append(b);}b.dataset.open=id;b.click();},id);
   await p.locator('#exhibit-dialog').waitFor({state:'visible'});await p.waitForTimeout(100);
   if(['eagle','viking-lander','sojourner-rover'].includes(id)) await p.locator('.eagle-stage').waitFor({state:'visible',timeout:30000});
   const metrics=await p.evaluate(()=>{const d=document.querySelector('#exhibit-dialog'),c=document.querySelector('#exhibit-content'),x=document.querySelector('#close-exhibit'),r=d.getBoundingClientRect(),q=x.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right,closeX:q.x,closeY:q.y,closeRight:q.right,closeBottom:q.bottom,horizontalOverflow:c.scrollWidth-c.clientWidth,scrollable:c.scrollHeight>c.clientHeight};});
   assert.ok(metrics.x>=0&&metrics.y>=0&&metrics.right<=size.width+1&&metrics.bottom<=size.height+1,JSON.stringify({id,size,metrics}));
   assert.ok(metrics.closeX>=0&&metrics.closeY>=0&&metrics.closeRight<=size.width&&metrics.closeBottom<=size.height,JSON.stringify({id,size,metrics}));
   assert.ok(metrics.horizontalOverflow<=2,JSON.stringify({id,size,metrics}));
   const label=await p.locator('#exhibit-content').innerText();assert.ok(label.trim().length>0,id);
   if(size.width===844&&['photos','apollo-story','legacy','eagle','apollo-signal'].includes(id)) await p.screenshot({path:`docs/qa/mobile-popup-${id}.png`});
   await p.locator('#exhibit-content').evaluate(e=>e.scrollTop=e.scrollHeight);
   await p.locator('#close-exhibit').click();assert.equal(await p.locator('#exhibit-dialog').isVisible(),false);
   results.push({id,size,...metrics});
  }
 }
 assert.deepEqual(errors,[]);await writeFile('docs/qa/mobile-popup-results.json',JSON.stringify({passed:true,cases:results.length,results,errors},null,2));console.log(`Mobile popups passed: ${results.length} panel/size combinations, close button accessible after scrolling, no horizontal overflow.`);
} finally {await browser.close();}
