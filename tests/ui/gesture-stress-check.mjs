import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {enterRun} from './enter-run.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try {
 for(const touch of [false,true]){
  const ctx=await browser.newContext({viewport:{width:915,height:412},hasTouch:touch,isMobile:touch});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('crash',()=>errors.push('renderer crash'));
  await page.goto(process.env.PREVIEW_URL);
  await enterRun(page);
  await page.locator('#hand .playing-card').first().waitFor();
  const input=async(type,x,y,id=1)=>{
   if(touch){
    if(!ctx.__cdp)ctx.__cdp=await ctx.newCDPSession(page);
    await ctx.__cdp.send('Input.dispatchTouchEvent',{type:{down:'touchStart',move:'touchMove',up:'touchEnd',cancel:'touchCancel'}[type],touchPoints:['up','cancel'].includes(type)?[]:[{x,y,id}]});
   }else{
    if(type==='down'){await page.mouse.move(x,y);await page.mouse.down();}
    else if(type==='move')await page.mouse.move(x,y);
    else if(type==='cancel'){
     // A physical mouse release is pointerup, NOT pointercancel. Dispatch an
     // explicit cancellation to the captured card, then release the mouse.
     await page.evaluate(()=>document.querySelector('#hand .dragging')?.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:1})));
     await page.mouse.up();
    }else await page.mouse.up();
   }
  };
  const ids=await page.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>n.dataset.cardId));
  for(let i=0;i<24;i++){
   const before=await page.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>n.dataset.cardId));
   const card=page.locator('#hand .playing-card').nth(i%Math.min(4,before.length));
   const rect=await card.boundingBox();
   if(!rect){
    const diagnostics=await page.evaluate(()=>({phase:document.getElementById('hand')?.hidden,handDisplay:getComputedStyle(document.getElementById('hand')).display,cards:[...document.querySelectorAll('#hand .playing-card')].map(n=>({id:n.dataset.cardId,connected:n.isConnected,display:getComputedStyle(n).display,rect:n.getBoundingClientRect().toJSON()}))}));
    throw Error('Card has no bounding box '+JSON.stringify({touch,iteration:i,diagnostics}));
   }
   const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
   await input('down',x,y);await input('move',x+(i%2?260:2),y-12);
   await input(i%3===0?'cancel':'up',x+(i%2?260:2),y-12);
   await page.waitForFunction(()=>!document.querySelector('#hand .dragging'),null,{timeout:3000});
   assert.equal(await page.locator('#hand .playing-card').count(),ids.length,'Cards disappeared');
   assert.equal(await page.locator('#hand .dragging').count(),0,'Stuck dragging state');
   assert.equal(await page.locator('.card-tip').count(),0,'Orphan tooltip');
   const after=await page.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>n.dataset.cardId));
   assert.deepEqual([...after].sort(),[...ids].sort(),'Card identity lost');
   if(i%3===0)assert.deepEqual(after,before,`Cancelled gesture changed hand order (touch=${touch}, iteration=${i})`);
  }
  assert.deepEqual(errors,[],'Unhandled page error');
  console.log(JSON.stringify({scenario:'rapid-gesture-cancel',touch,iterations:24,cards:ids.length,errors}));
  await ctx.close();
 }
}finally{await browser.close();}
