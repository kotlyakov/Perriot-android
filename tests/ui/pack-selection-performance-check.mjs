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
  const report=await page.evaluate(async offerId=>{
   const {deserializeState}=await import('/src/persistence/save.js'),{canUsePackCard}=await import('/src/core/celestial-pack.js');
   const saved=localStorage.getItem('card-cascade.current'),state=deserializeState(saved),offer=state.packState.cards.find(c=>c.id===offerId);
   const roots=['hand','pack_screen','shop_owned'].map(id=>document.getElementById(id));
   const capture=root=>[...root.querySelectorAll('.playing-card,.shop-card,svg,.shop-art,.card-material-layer')];
   const snapshots=roots.map(capture),removed={hand:0,pack:0,owned:0},names=Object.keys(removed),observers=roots.map((root,i)=>{
    const observer=new MutationObserver(records=>{for(const record of records)for(const n of record.removedNodes)if(n.nodeType===1)removed[names[i]]+=(n.matches('.playing-card,.shop-card')?1:0)+n.querySelectorAll('.playing-card,.shop-card').length;});
    observer.observe(root,{subtree:true,childList:true});return observer;
   });
   const times=[],capabilityErrors=[];
   for(let i=0;i<24;i++){
    const start=performance.now();document.querySelectorAll('#hand .playing-card')[i%2].click();times.push(performance.now()-start);
    await new Promise(requestAnimationFrame);
    const targets=[...document.querySelectorAll('#hand .selected')].map(n=>n.dataset.cardId),choice=document.querySelector(`[data-offer-id="${offerId}"] .shop-card`),use=document.getElementById('shop_use_zone')??document.querySelector(`[data-offer-id="${offerId}"] .shop-use`);
    if(choice?.getAttribute('aria-pressed')!=='true'||!use)capabilityErrors.push('Pack selection lost at '+i);
    else if(use.id==='shop_use_zone'&&document.getElementById('shop_action_zones')?.dataset.offerId!==offerId)capabilityErrors.push('Action belongs to another offer at '+i);
    else if(use.disabled===canUsePackCard(state,offer,targets).available)capabilityErrors.push('Wrong target availability at '+i);
   }
   observers.forEach(o=>o.disconnect());times.sort((a,b)=>a-b);
   return {removed,capabilityErrors,preserved:snapshots.map((nodes,i)=>nodes.length===capture(roots[i]).length&&nodes.every((n,j)=>n===capture(roots[i])[j]&&n.isConnected)),ownedCards:roots[2].querySelectorAll('.shop-card').length,selectedCleared:!document.querySelector('#hand .selected'),saveUnchanged:saved===localStorage.getItem('card-cascade.current'),p50:times[12],p95:times[22]};
  },strength.id);
  console.log(JSON.stringify({width,baselineRef:baselineRef??null,arcanaSelection:report}));
  assert.deepEqual(report.capabilityErrors,[]);assert.deepEqual(report.removed,{hand:0,pack:0,owned:0});assert.deepEqual(report.preserved,[true,true,true]);assert.equal(report.ownedCards,2);assert.ok(report.selectedCleared&&report.saveUnchanged);
  // Switch away from the repeatedly toggled cards: the retained action must use the new ID.
  const target=initial.hand[2];await page.locator(`#hand [data-card-id="${target}"]`).click();assert.ok(await page.locator('#shop_use_zone').isEnabled());
  await page.locator('#shop_use_zone').click();await page.locator('#shop_screen').waitFor();
  const durable=await page.evaluate(()=>localStorage.getItem('card-cascade.current')),after=deserializeState(durable);
  assert.equal(after.phase,'shop');assert.equal(after.packState,undefined);assert.equal(after.money,initial.money);
  for(const [id,card] of Object.entries(initial.cards))assert.equal(after.cards[id].rank,id===target?(card.rank===14?2:card.rank+1):card.rank,`Unexpected Strength target: ${id}`);
  assert.deepEqual(after.jokers,initial.jokers);assert.deepEqual(after.consumables,initial.consumables);
  await page.reload();await enterRun(page,{startBlind:false});await page.locator('#shop_screen').waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),durable);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({width,strengthTarget:target,saveReload:true}));await page.close();
 }
}finally{await browser.close();}
