import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
// Optional source-only baseline: old rendering is expected to fail the same invariants.
const baselineRef=process.env.UI_BASELINE_REF;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
function fixture(){
 const key='p_arcana_normal_1',meta=catalogue.centres.find(c=>c.key===key);
 for(let i=0;i<200;i++){
  let state=createRun('PACK_SELECTION_'+i,{runId:'pack-selection',money:30n,referenceRng:true,referenceShop:true});
  state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;
  state.phase='round_won';state.round.score=state.round.target;
  state=dispatch(state,{type:'CASH_OUT',expectedRevision:state.revision}).state;
  state.jokers=[{id:'pack-owned-joker',entityId:'j_joker',originalKey:'j_joker',set:'Joker',edition:'base',sellCost:2n}];
  state.consumables=[{id:'pack-owned-tarot',entityId:'c_lovers',originalKey:'c_lovers',set:'Tarot',edition:'base',sellCost:1n}];
  state.shop.boosters=[{id:'performance-arcana',entityId:key,originalKey:key,set:'Booster',edition:'base',cost:BigInt(meta.cost),sellCost:2n}];
  const opened=dispatch(state,{type:'OPEN_BOOSTER',expectedRevision:state.revision,offerId:'performance-arcana'});
  assert.equal(opened.error,null);
  if(opened.state.packState.cards.some(c=>c.entityId==='c_strength'))return opened.state;
 }
 throw Error('No deterministic Arcana Strength fixture');
}
try{
 for(const width of [1536,915]){
  const page=await browser.newPage({viewport:{width,height:width===1536?688:412},hasTouch:width<1000,reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  if(baselineRef)for(const name of ['app','field','shop-screen']){
   const source=execFileSync('git',['show',`${baselineRef}:src/ui/${name}.js`],{encoding:'utf8'});
   await page.route(`**/src/ui/${name}.js`,route=>route.fulfill({contentType:'text/javascript',body:source}));
  }
  const initial=fixture(),strength=initial.packState.cards.find(c=>c.entityId==='c_strength');
  await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(initial));
  await page.reload();await enterRun(page,{startBlind:false});await page.locator('#pack_screen').waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.locator(`[data-offer-id="${strength.id}"] .shop-card`).click();
  assert.ok(await page.locator('#shop_use_zone,.shop-choice .shop-use').isDisabled());
  assert.equal(await page.locator('#hand .playing-card').count(),initial.hand.length,'Arcana target hand is available alongside storage');
  const packReport=await page.evaluate(async()=>{const roots=['hand','pack_screen','shop_owned'].map(id=>document.getElementById(id)),nodes=roots.map(r=>[...r.querySelectorAll('.playing-card,.shop-card,svg')]);for(let i=0;i<24;i++){document.querySelectorAll('#hand .playing-card')[i%2].click();await new Promise(requestAnimationFrame);}return roots.every((r,i)=>{const now=[...r.querySelectorAll('.playing-card,.shop-card,svg')];return now.length===nodes[i].length&&now.every((n,j)=>n===nodes[i][j]);});});assert.equal(packReport,true,'Target selections preserve live pack/hand/owned cards');
  const originalCards=structuredClone(initial.cards);
  const {dragShopAction}=await import('./shop-actions.mjs');
  await dragShopAction(page,strength.id,'buy',width<1000);
  await page.locator('#shop_screen').waitFor();
  let after=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
  assert.deepEqual(after.cards,originalCards,'Taking Strength never mutates playing cards');
  assert.equal(after.consumables.length,2);assert.ok(after.consumables.some(c=>c.id===strength.id));
  // Stored target cards become usable during a later blind, with normal hand selection.
  await page.locator('#shop_next_round').click();await page.locator('#select_big').click();await page.locator('#hand .playing-card').first().waitFor();
  const playing=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current'))),target=playing.hand[2];
  const report=await page.evaluate(async()=>{
   const roots=['hand','shop_owned'].map(id=>document.getElementById(id)),snapshots=roots.map(r=>[...r.querySelectorAll('.playing-card,.shop-card,svg')]);
   const text=localStorage.getItem('card-cascade.current'),times=[];
   for(let i=0;i<24;i++){const start=performance.now();document.querySelectorAll('#hand .playing-card')[i%2].click();times.push(performance.now()-start);await new Promise(requestAnimationFrame);}
   return {preserved:roots.every((r,i)=>{const nodes=[...r.querySelectorAll('.playing-card,.shop-card,svg')];return nodes.length===snapshots[i].length&&nodes.every((n,j)=>n===snapshots[i][j]);}),saveUnchanged:text===localStorage.getItem('card-cascade.current'),maxHandler:Math.max(...times)};
  });assert.equal(report.preserved,true);assert.equal(report.saveUnchanged,true);
  await page.locator(`#hand [data-card-id="${target}"]`).click();
  await dragShopAction(page,strength.id,'use',width<1000);
  await page.locator(`[data-offer-id="${strength.id}"]`).waitFor({state:'detached'});await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);
  const durable=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));after=deserializeState(durable);
  for(const [id,card] of Object.entries(playing.cards))assert.equal(after.cards[id].rank,id===target?(card.rank===14?2:card.rank+1):card.rank);
  assert.equal(after.consumables.length,1);assert.equal(after.money,playing.money);
  await page.reload();await enterRun(page,{startBlind:false});await page.locator('#hand .playing-card').first().waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),durable);assert.deepEqual(errors,[]);
  // The same choice can also be used immediately, with the visible target hand.
  await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(initial));await page.reload();await enterRun(page,{startBlind:false});await page.locator('#pack_screen').waitFor();
  const immediateTarget=initial.hand[1];await page.locator(`#hand [data-card-id="${immediateTarget}"]`).click();await page.locator(`[data-offer-id="${strength.id}"] .shop-card`).click();assert.equal(await page.locator('#shop_use_zone').isEnabled(),true);await page.locator('#shop_use_zone').click();await page.locator('#shop_screen').waitFor();
  const immediate=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current'))),rank=initial.cards[immediateTarget].rank;assert.equal(immediate.cards[immediateTarget].rank,rank===14?2:rank+1);assert.equal(immediate.consumables.length,initial.consumables.length);assert.equal(immediate.phase,'shop');
  console.log(JSON.stringify({width,strengthTarget:target,saveReload:true,visiblePackTargets:true,optionalImmediateUse:true}));await page.close();
 }
}finally{await browser.close();}
