import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try {
 const failures=[];
 for(const [width,height] of [[1536,688],[915,412],[568,320],[412,915]]) {
  const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);await page.locator('#hand .playing-card').first().waitFor();
  const reports=[];
  for(const menu of ['deck','settings','run','confirmation']) {
   const entry=await page.evaluate(menu=>{
    document.getElementById(menu==='deck'?'deck':menu==='run'?'run_info':'options').click();
    if(menu==='confirmation')[...document.querySelectorAll('#dialog-actions button')].find(n=>n.textContent==='Новый забег').click();
    const d=document.getElementById('dialog'),a=d.getAnimations();a.forEach(a=>{a.pause();a.currentTime=0;});const r=d.getBoundingClientRect();
    return {title:document.getElementById('dialog-title').textContent,animations:a.length,duration:a[0]?.effect.getTiming().duration,top:r.top,left:r.left,width:r.width,height:r.height,frames:a[0]?.effect.getKeyframes().map(f=>f.translate)};
   },menu);
   assert.equal(entry.animations,1,menu+' missing bottom entry');assert.equal(entry.duration,360);assert.ok(entry.top>=height-1,menu+' starts above viewport bottom');
   const end=await page.evaluate(async()=>{const d=document.getElementById('dialog');await Promise.all(d.getAnimations().map(a=>{a.play();return a.finished;}));const r=d.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height,right:r.right,bottom:r.bottom,translate:getComputedStyle(d).translate,transform:getComputedStyle(d).transform,deck:d.classList.contains('deck-dialog')};});
   assert.ok(end.left>=-.2&&end.top>=-.2&&end.right<=width+.2&&end.bottom<=height+.2,JSON.stringify({menu,end,width,height}));assert.ok(Math.abs(entry.left-end.left)<.1&&Math.abs(entry.width-end.width)<.1&&Math.abs(entry.height-end.height)<.1,'Entry altered dialog geometry');assert.ok(Math.abs(end.left*2+end.width-width)<.2,'Dialog not centered horizontally');assert.equal(end.deck,menu==='deck');assert.ok(['none','0px'].includes(end.translate),'Final translate retained offset');
   reports.push({menu,title:entry.title,entryTop:entry.top,finalTop:end.top,width:end.width,height:end.height});
   const back=await page.evaluate(async()=>{const closed=new Promise(r=>document.getElementById('dialog').addEventListener('close',r,{once:true}));const first=window.cardGameBack(),second=window.cardGameBack();await closed;return {first,second};});assert.equal(back.first,true);assert.equal(back.second,false);
   await page.waitForFunction(()=>!document.getElementById('dialog').open&&!document.getElementById('dialog').getAnimations().length);
  }
  // Replacing an already open dialog must replace its single animation.
  await page.evaluate(()=>{document.getElementById('options').click();document.getElementById('deck').click();});
  assert.equal(await page.locator('#dialog').evaluate(d=>d.getAnimations().length),1);await page.evaluate(()=>{window.qaClosed=new Promise(r=>document.getElementById('dialog').addEventListener('close',r,{once:true}));});await page.keyboard.press('Escape');await page.evaluate(()=>window.qaClosed);await page.waitForFunction(()=>!document.getElementById('dialog').open&&!document.getElementById('dialog').getAnimations().length);assert.equal(await page.locator('#dialog').evaluate(d=>d.classList.contains('deck-dialog')),false);
  // A queued close event from the previous dialog must not reset the new one.
  await page.evaluate(()=>{document.getElementById('options').click();window.cardGameBack();document.getElementById('deck').click();});
  const quick=await page.evaluate(async()=>{await new Promise(r=>setTimeout(r,40));const d=document.getElementById('dialog');return {open:d.open,deck:d.classList.contains('deck-dialog'),animations:d.getAnimations().length,title:document.getElementById('dialog-title').textContent};});
  if(!quick.open||!quick.deck||quick.animations!==1)failures.push({viewport:[width,height],quick});
  if(quick.deck){const reopened=await page.evaluate(async()=>{const d=document.getElementById('dialog');await Promise.all(d.getAnimations().map(a=>a.finished));const r=d.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height};});assert.ok(Math.abs(reopened.width-reports[0].width)<.2&&Math.abs(reopened.height-reports[0].height)<.2,'Reopen changed deck geometry');}
  await page.evaluate(async()=>{const closed=new Promise(r=>document.getElementById('dialog').addEventListener('close',r,{once:true}));window.cardGameBack();await closed;});
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const id of ['options','run_info','deck']){await page.evaluate(id=>document.getElementById(id).click(),id);assert.equal(await page.locator('#dialog').evaluate(d=>d.getAnimations().length),0,'Reduced motion should skip dialog entry');await page.evaluate(()=>{window.qaClosed=new Promise(r=>document.getElementById('dialog').addEventListener('close',r,{once:true}));});await page.keyboard.press('Escape');await page.evaluate(()=>window.qaClosed);}
  await page.evaluate(()=>{document.getElementById('options').click();[...document.querySelectorAll('#dialog-actions button')].find(n=>n.textContent==='Новый забег').click();});assert.equal(await page.locator('#dialog').evaluate(d=>d.getAnimations().length),0);assert.equal(await page.locator('#dialog-title').textContent(),'Новый забег');await page.evaluate(async()=>{const closed=new Promise(r=>document.getElementById('dialog').addEventListener('close',r,{once:true}));window.cardGameBack();await closed;});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({viewport:[width,height],menus:reports,quick,reducedMotion:true,escape:true,backHook:true}));await context.close();
 }
 assert.deepEqual(failures,[],'Queued close damaged reopened deck dialog');
 console.log('Dialog 0.4.2 checks passed');
} finally {await browser.close();}
