// Selection must retain live cards and their animation layers, rather than rebuilding the table.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true});await page.goto(process.env.PREVIEW_URL);await enterRun(page);await page.waitForFunction(()=>!document.querySelector('#hand button:disabled'));
 await page.evaluate(async()=>{
  const {createRun}=await import('/src/core/run.js'),{serializeState}=await import('/src/persistence/save.js');
  const s=createRun('performance',{runId:'performance',money:4n});s.phase='playing';s.round.target=10000n;
  s.hand=Object.keys(s.cards).slice(0,8);s.drawPile=Object.keys(s.cards).slice(8);
  s.jokers=[{id:'performance-joker',entityId:'j_joker',originalKey:'j_joker',set:'Joker',edition:'base',sellCost:2n}];
  s.consumables=[{id:'performance-tarot',entityId:'c_strength',originalKey:'c_strength',set:'Tarot',edition:'base',sellCost:1n}];
  localStorage.setItem('card-cascade.current',serializeState(s));
 });
 await page.reload();await enterRun(page);await page.waitForFunction(()=>document.querySelector('#hand .playing-card')&&!document.getElementById('sort_rank').disabled);
 assert.ok(await page.locator('#shop_owned .shop-card').count()>0,'Exercise selection with live owned cards');
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Performance.enable');
 const before=await cdp.send('Performance.getMetrics');
 const report=await page.evaluate(async()=>{
  const hand=document.getElementById('hand'),cards=[...hand.children],owned=[...document.querySelectorAll('#shop_owned .shop-card')],top=cards[0].style.top,initialSave=localStorage.getItem('card-cascade.current');
  let removed=0;const observer=new MutationObserver(records=>{for(const r of records)removed+=r.removedNodes.length;});observer.observe(hand,{childList:true});
  const times=[];for(let i=0;i<24;i++){
   const node=hand.children[0],start=performance.now();node.click();times.push(performance.now()-start);
   await new Promise(requestAnimationFrame);
   if(i%2===0&&(!hand.children[0].classList.contains('selected')||Number.parseFloat(hand.children[0].style.top)>=Number.parseFloat(top)))throw Error('Selection must lift the card');
  }
  observer.disconnect();times.sort((a,b)=>a-b);
  return{p50:times[12],p95:times[22],removed,handPreserved:cards.every((n,i)=>n===hand.children[i]),ownedPreserved:owned.every(n=>n.isConnected),selectionCleared:hand.querySelectorAll('.selected').length===0,saveUnchanged:initialSave===localStorage.getItem('card-cascade.current')};
 });
 const after=await cdp.send('Performance.getMetrics');const delta=Object.fromEntries(after.metrics.filter(m=>['ScriptDuration','TaskDuration','LayoutCount','RecalcStyleCount'].includes(m.name)).map(m=>[m.name,m.value-before.metrics.find(v=>v.name===m.name).value]));
 console.log(JSON.stringify({selection:report,metrics:delta,cpuThrottle:4}));
 assert.ok(report.handPreserved,'Selecting cards must preserve live hand nodes and animations');assert.ok(report.ownedPreserved,'Selecting a hand card must preserve owned joker/consumable nodes');assert.equal(report.removed,0);assert.ok(report.selectionCleared&&report.saveUnchanged);
 const consumable=page.locator('[data-offer-id=performance-tarot] .shop-card');await consumable.click();
 assert.ok(await page.locator('[data-offer-id=performance-tarot] .shop-use').isDisabled());
 const first=page.locator('#hand .playing-card').first();await first.click();
 assert.equal(await page.locator('[data-offer-id=performance-tarot] .shop-use').count(),0,'Hand selection closes the previous consumable action as before');
 await consumable.click();assert.ok(await page.locator('[data-offer-id=performance-tarot] .shop-use').isEnabled(),'Consumable receives current targets');
 await first.click();await consumable.click();assert.ok(await page.locator('[data-offer-id=performance-tarot] .shop-use').isDisabled());
 await first.click();await page.locator('#hand .playing-card').nth(1).click();await consumable.click();
 const use=page.locator('[data-offer-id=performance-tarot] .shop-use');
 const targets=await page.locator('#hand .selected').evaluateAll(ns=>ns.map(n=>n.dataset.cardId));
 const beforeRanks=await page.evaluate(async ids=>{const {deserializeState}=await import('/src/persistence/save.js');const s=deserializeState(localStorage.getItem('card-cascade.current'));return ids.map(id=>s.cards[id].rank);},targets);
 await use.evaluate(n=>n.click());await consumable.waitFor({state:'detached'});await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled&&!document.querySelector('.motion-copy'));
 const ranks=await page.evaluate(async ids=>{const {deserializeState}=await import('/src/persistence/save.js');const s=deserializeState(localStorage.getItem('card-cascade.current'));return ids.map(id=>s.cards[id].rank);},targets);
 assert.deepEqual(ranks,beforeRanks.map(n=>n===14?2:n+1),'Use action receives current targets and changes exactly those ranks');
 console.log('Live consumable availability, target changes and application PASS');
}finally{await browser.close();}
