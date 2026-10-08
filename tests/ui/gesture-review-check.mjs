import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
try{for(const touch of [false,true]){
 const ctx=await browser.newContext({viewport:{width:915,height:412},hasTouch:touch,isMobile:touch}),p=await ctx.newPage();await p.goto(process.env.PREVIEW_URL);await p.locator('#hand .playing-card').first().waitFor();
 const c=p.locator('#hand .playing-card').first();const id=await c.getAttribute('data-card-id');if(touch)await c.tap();else await c.click();
 assert.equal(await p.locator('#hand .selected').count(),1,'Single pointer tap toggles exactly once');assert.equal(await p.locator(`#hand [data-card-id=${id}]`).getAttribute('aria-pressed'),'true');
 const before=await p.evaluate(()=>localStorage.getItem('card-cascade.current')),selected=await p.locator('#hand .selected').evaluateAll(ns=>ns.map(n=>n.dataset.cardId));
 const card=p.locator(`#hand [data-card-id=${id}]`),box=await card.boundingBox(),x=box.x+8,y=box.y+box.height*.5;
 const client=touch?await ctx.newCDPSession(p):null;
 const input=async(type,x,y)=>touch?client.send('Input.dispatchTouchEvent',{type:({down:'touchStart',move:'touchMove',up:'touchEnd'})[type],touchPoints:type==='up'?[]:[{x,y,id:1}]}):type==='down'?p.mouse.move(x,y).then(()=>p.mouse.down()):type==='move'?p.mouse.move(x,y):p.mouse.up();
 await input('down',x,y);await input('move',x+15,y-15);await input('up',x+15,y-15);await p.waitForFunction(()=>!document.querySelector('.dragging'));assert.equal(await p.evaluate(()=>localStorage.getItem('card-cascade.current')),before,'Same-slot drag must not save/revise');assert.deepEqual(await p.locator('#hand .selected').evaluateAll(ns=>ns.map(n=>n.dataset.cardId)),selected,'Drag retains selection');
 await p.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('qa storage failure');};});const fresh=await card.boundingBox();await input('down',fresh.x+8,fresh.y+fresh.height*.5);await input('move',fresh.x+400,fresh.y+fresh.height*.5-15);const firstTop=await p.locator('#hand .playing-card').nth(1).evaluate(n=>parseFloat(n.style.top));assert.ok(firstTop>=388,'Unselected neighbor inherits selected vertical lift');await input('up',fresh.x+400,fresh.y+fresh.height*.5-15);await p.locator('dialog[open]').waitFor();assert.match(await p.locator('#dialog-title').innerText(),/сохранить/);assert.equal(await p.evaluate(()=>localStorage.getItem('card-cascade.current')),before);assert.equal(await p.locator('#hand .playing-card').first().getAttribute('data-card-id'),id);assert.equal(await p.locator('.dragging,.card-tip').count(),0);
 console.log('Extra gesture review passed '+(touch?'touch':'mouse'));await ctx.close();
}}finally{await browser.close();}
