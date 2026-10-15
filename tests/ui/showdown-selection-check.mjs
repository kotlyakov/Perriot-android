/** Actual Playwright/browser check; a VM or exporter check does not execute it. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {bossTarget,disableBoss} from '../../src/core/boss-effects.js';
import {getCashout} from '../../src/core/cashout.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
const act=(s,type,fields={})=>dispatch(s,{type,expectedRevision:s.revision,...fields});
function fixture(id,count=3,start=true){
 const s=createRun('AAAAAAA1',{runId:'showdown-ui',money:10n,referenceRng:true,referenceShop:true});
 s.round.ante=8;s.round.blindId='boss';s.apkShop.context.ante=8;s.apkBlinds.ante=8;s.apkBlinds.tagContext.ante=8;s.apkBlinds.bossId=id;s.apkBlinds.bossesUsed[id]=1;s.round.target=bossTarget(s);
 s.jokers=Array.from({length:count},(_,i)=>({id:'joker_'+(i+1),entityId:i?'j_joker':'j_golden',creationOrdinal:i+1,sellCost:BigInt(i+2)}));s.nextJokerCreationOrdinal=count+1;
 if(!start)return s;const r=act(s,'START_BLIND');assert.equal(r.error,null);return r.state;
}
async function install(page,s){if(s.winPending){const continued=act(s,'CONTINUE_ENDLESS');assert.equal(continued.error,null);s=continued.state;}await page.evaluate(raw=>localStorage.setItem('card-cascade.current',raw),serializeState(s));await page.reload();await enterRun(page,{startBlind:false});}
async function saved(page){return deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));}
async function settled(page){await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled||document.getElementById('cashout'));}
async function drag(page,locator,point,inspect){
 const b=await locator.boundingBox();assert.ok(b);const start={x:b.x+b.width/2,y:b.y+b.height/2};
 if(await page.evaluate(()=>navigator.maxTouchPoints>0)){
  const cdp=await page.context().newCDPSession(page),send=(type,p)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:p?[{...p,id:1}]:[]});
  await send('touchStart',start);for(let i=1;i<=8;i++)await send('touchMove',{x:start.x+(point.x-start.x)*i/8,y:start.y+(point.y-start.y)*i/8});if(inspect)await inspect();await send('touchEnd');await cdp.detach();
 }else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(point.x,point.y,{steps:8});if(inspect)await inspect();await page.mouse.up();}
}
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:360,height:800}:{width:1536,height:688},hasTouch:mobile,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.PREVIEW_URL);await enterRun(page);
  let s=fixture('bl_final_bell');await install(page,s);const id=s.bossState.forcedCardId,forced=page.locator(`#hand [data-card-id="${id}"]`);
  assert.equal(await forced.getAttribute('aria-pressed'),'true');assert.equal(await forced.evaluate(n=>n.classList.contains('bell-forced')),true);
  if(mobile)await forced.tap();else await forced.click();assert.equal(await forced.getAttribute('aria-pressed'),'true');
  for(const other of s.hand.filter(x=>x!==id).slice(0,5)){const card=page.locator(`#hand [data-card-id="${other}"]`);if(mobile)await card.tap();else await card.click();}
  assert.equal(await page.locator('#hand [aria-pressed=true]').count(),5);
  for(const type of ['PLAY_HAND','DISCARD']){const r=act(s,type,{cardIds:[s.hand.find(x=>x!==id)]});assert.equal(r.error.code,'FORCED_SELECTION');assert.equal(r.state,s);}
  const before=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page);assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),before);assert.equal(await page.locator(`#hand [data-card-id="${id}"]`).getAttribute('aria-pressed'),'true');
  await page.locator('#discard').click();await settled(page);s=await saved(page);assert.equal(s.round.discardsRemaining,3);assert.equal(await page.locator(`#hand [data-card-id="${s.bossState.forcedCardId}"]`).getAttribute('aria-pressed'),'true');
  disableBoss(s,[]);s.revision++;await install(page,s);assert.equal(await page.locator('.bell-forced').count(),0);
  await install(page,fixture('bl_final_acorn',3,false));await page.locator('#shop_owned .shop-card').first().click();assert.equal(await page.locator('#shop_owned [aria-pressed=true]').count(),1);assert.equal(await page.locator('.shop-tooltip').count(),1);
  await page.locator('#select_boss').click();await settled(page);assert.equal(await page.locator('#shop_owned [aria-pressed=true]').count(),0);assert.equal(await page.locator('.shop-tooltip').count(),0);
  s=await saved(page);const hiddenId=s.jokers[0].id,hidden=page.locator(`#shop_owned [data-offer-id="${hiddenId}"] .shop-card`);
  for(const card of await page.locator('#shop_owned .shop-card').all()){
   assert.equal(await card.getAttribute('aria-label'),'Скрытый джокер');assert.equal(await card.innerText(),'');assert.equal(await card.getAttribute('data-edition'),null);assert.equal(await card.getAttribute('title'),null);
  }
  await hidden.click();assert.equal(await hidden.getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.shop-tooltip').count(),0);await hidden.press('F1');assert.equal(await page.locator('.shop-tooltip').count(),0);
  await page.locator('#sort_suit').click();await settled(page);assert.equal(await page.locator(`#shop_owned [data-offer-id="${hiddenId}"] .shop-card`).getAttribute('aria-pressed'),'true');
  const second=await page.locator('#shop_owned .shop-card').last().boundingBox();await drag(page,hidden,{x:second.x+second.width+6,y:second.y+second.height/2},async()=>{
   assert.equal(await page.locator('.is-dragging .shop-card').getAttribute('aria-label'),'Скрытый джокер');assert.equal(await page.locator('.is-dragging').innerText(),'');assert.match(await page.locator('#shop_sell_zone').innerText(),/\?/);assert.doesNotMatch(await page.locator('#shop_sell_zone').innerText(),/\$/);
  });await settled(page);s=await saved(page);assert.equal(s.jokers.at(-1).id,hiddenId);const order=s.jokers.map(j=>j.id);await page.reload();await enterRun(page);assert.deepEqual((await saved(page)).jokers.map(j=>j.id),order);
  const scale=await page.locator('#stage').evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.left,y:r.top,s:r.width/1536};});const money=s.money,sell=s.jokers.find(j=>j.id===hiddenId).sellCost;
  await drag(page,page.locator(`#shop_owned [data-offer-id="${hiddenId}"] .shop-card`),{x:scale.x+1450*scale.s,y:scale.y+300*scale.s});await settled(page);s=await saved(page);assert.equal(s.money,money+sell);assert.equal(s.bossState.hiddenJokerIds.includes(hiddenId),false);
  disableBoss(s,[]);s.revision++;const revealedOrder=s.jokers.map(j=>j.id);await install(page,s);assert.equal(await page.locator('.acorn-hidden').count(),0);assert.deepEqual((await saved(page)).jokers.map(j=>j.id),revealedOrder);assert.notEqual(await page.locator('#shop_owned .shop-card').first().innerText(),'');
  await install(page,fixture('bl_final_heart'));s=await saved(page);assert.equal(await page.locator('#shop_owned .heart-debuffed').count(),1);const chosen=s.bossState.heartDebuffedJokerId;assert.match(await page.locator(`#shop_owned [data-offer-id="${chosen}"] .shop-card`).getAttribute('aria-label'),/ослаблен/);
  s.round.score=s.round.target-1n;s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;assert.equal(s.jokers.filter(j=>j.debuffed).length,1);await install(page,s);assert.equal(await page.locator('#shop_owned .heart-debuffed').count(),0);
  await install(page,fixture('bl_final_leaf'));s=await saved(page);assert.equal(await page.locator('#hand .boss-debuffed').count(),s.hand.length);
  const zonePoint={x:scale.x+1450*scale.s,y:scale.y+300*scale.s};await drag(page,page.locator('#shop_owned .shop-card').first(),zonePoint);await settled(page);s=await saved(page);assert.equal(s.bossState.disabled,true);assert.equal(await page.locator('#hand .boss-debuffed').count(),0);await page.reload();await enterRun(page);assert.equal(await page.locator('#hand .boss-debuffed').count(),0);assert.equal((await saved(page)).bossState.disabled,true);
  s.round.score=s.round.target-1n;s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;const quote=getCashout(s);await install(page,s);const sale=s.jokers[0],saleBefore=s.money;await drag(page,page.locator('#shop_owned .shop-card').first(),zonePoint);await page.waitForFunction(()=>!document.querySelector('#shop_owned button')?.disabled);s=await saved(page);assert.equal(s.money,saleBefore+sale.sellCost);assert.deepEqual(getCashout(s),quote);await page.reload();await enterRun(page);assert.deepEqual(getCashout(await saved(page)),quote);
  assert.deepEqual(errors,[]);await page.close();console.log('Bell/Acorn selection, privacy, drag reorder/sale, reload; Leaf sale and frozen payout; Heart styling '+(mobile?'mobile':'desktop'));
 }
 // Observe accepted persistence while a real animation is still busy.
 const page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'no-preference'});await page.goto(process.env.PREVIEW_URL);await enterRun(page);const s=fixture('bl_final_bell');await install(page,s);await page.locator('#discard').click();await page.locator('.played-card').waitFor();assert.equal((await saved(page)).revision,s.revision+1);assert.equal(await page.locator('#sort_rank').isDisabled(),true);await settled(page);await page.close();
}finally{await browser.close();}
