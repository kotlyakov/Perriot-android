import {enterRun} from './enter-run.mjs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
for(const [width,height,touch,reduced] of [[1536,688,false,false],[915,412,true,false],[568,320,true,true]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:reduced?'reduce':'no-preference'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);await enterRun(page);
 const s=createRun('gesture',{runId:'gesture',money:4n});s.phase='playing';s.revision=1;s.round.target=10000n;
 s.hand=['card_spades_12','card_hearts_12','card_clubs_11','card_hearts_10','card_spades_8','card_hearts_5','card_clubs_3','card_diamonds_2'];s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));
 await page.evaluate(v=>localStorage.setItem('card-cascade.current',v),serializeState(s));await page.reload();await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();
 const saved=async()=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
 const client=touch?await context.newCDPSession(page):null;
 const input=async(type,x,y)=>touch?client.send('Input.dispatchTouchEvent',{type:({down:'touchStart',move:'touchMove',up:'touchEnd',cancel:'touchCancel'})[type],touchPoints:['up','cancel'].includes(type)?[]:[{x,y,id:1}]}):type==='down'?page.mouse.move(x,y).then(()=>page.mouse.down()):type==='move'?page.mouse.move(x,y):page.mouse.up();
 const id=s.hand[0],card=page.locator(`#hand [data-card-id="${id}"]`),box=await card.boundingBox(),x=box.x+10*width/1536,y=box.y+box.height*.6;
 const neighbor=page.locator('#hand .playing-card').nth(1),oldLeft=await neighbor.evaluate(n=>n.style.left);
 await input('down',x,y);await page.waitForTimeout(400);assert.match(await page.locator('.card-tip').innerText(),/Q.*пик[\s\S]*\+10 очков/);
 await input('move',x+width*.38,y-30);await page.waitForFunction(()=>!!document.querySelector('.dragging'));
 assert.notEqual(await neighbor.evaluate(n=>n.style.left),oldLeft,'Neighbors reserve insertion slot while holding');assert.equal((await saved()).revision,s.revision,'Drag preview must not commit');
 if(!touch)await page.screenshot({path:'artifacts/card-drag-preview.png'});
 await input('up',x+width*.38,y-30);await page.waitForFunction(()=>!document.querySelector('.dragging')&&!document.querySelector('.card-tip'));const moved=await saved();assert.equal(moved.hand.at(-1),id);assert.equal(moved.revision,s.revision+1);
 await page.reload();await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();assert.deepEqual(await page.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>n.dataset.cardId)),moved.hand);
 if(touch){
   const c=page.locator('#hand .playing-card').first(),r=await c.boundingBox(),cx=r.x+8,cy=r.y+r.height*.5,prior=await saved();
   const positions=await page.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>[n.style.left,n.style.top,n.style.transform]));
   await input('down',cx,cy);await input('move',cx+width*.25,cy-20);await input('cancel',cx,cy);
   assert.deepEqual((await saved()).hand,prior.hand);assert.equal((await saved()).revision,prior.revision);
   assert.deepEqual(await page.locator('#hand .playing-card').evaluateAll(ns=>ns.map(n=>[n.style.left,n.style.top,n.style.transform])),positions);assert.equal(await page.locator('.card-tip,.dragging').count(),0);
 }
 for(const id of s.hand.slice(0,5)){const c=page.locator(`#hand [data-card-id="${id}"]`);if(touch)await c.tap();else await c.click();}
 await page.evaluate(()=>{window.liftQA=[];new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes)if(n.nodeType===1&&n.classList.contains('score-pop')&&!n.classList.contains('counter-pop'))window.liftQA.push([...document.querySelectorAll('.played-card')].map(c=>({id:c.dataset.cardId,top:c.style.top,scoring:c.dataset.scoring})));}).observe(document.getElementById('stage'),{childList:true});document.getElementById('play_hand').click();});
 await page.waitForFunction(()=>window.liftQA.length>0);const poses=await page.evaluate(()=>window.liftQA[0]);assert.equal(poses.length,5);for(const c of poses){assert.equal(c.top,['card_spades_12','card_hearts_12'].includes(c.id)?'204px':'232px');}
 if(!touch)await page.screenshot({path:'artifacts/scoring-lift-preview.png'});
 await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({width,height,touch,reduced,dragInsertion:true,tooltip:true,scoringLiftOnlyPair:true}));await context.close();
}
}finally{await browser.close();}
