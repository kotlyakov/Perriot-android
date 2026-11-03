import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
import {dragShopAction} from './shop-actions.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
function fixture(booster='p_arcana_mega_1'){
 let s=createRun('ARCANA_UI_1',{runId:'arcana-layout-062',money:100n,referenceRng:true,referenceShop:true,reducedMotion:true});
 const act=(type,fields={})=>{const r=dispatch(s,{type,expectedRevision:s.revision,...fields});assert.ifError(r.error);s=r.state;};
 act('START_BLIND');s.phase='round_won';s.round.score=s.round.target;act('CASH_OUT');
 s.shop.boosters=[{id:'layout-booster',entityId:booster,originalKey:booster,set:'Booster',edition:'base',cost:6n,sellCost:1n}];
 act('OPEN_BOOSTER',{offerId:'layout-booster'});return s;
}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
await mkdir('artifacts',{recursive:true});
try{
 const reports=[];
 for(const [width,height,key] of [[1536,688,'p_arcana_mega_1'],[915,412,'p_arcana_mega_1'],[1280,720,'p_arcana_normal_1'],[740,360,'p_spectral_mega_1']]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<1000,reducedMotion:'reduce'});page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const initial=fixture(key);await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(initial));await page.reload();await enterRun(page,{startBlind:false});await page.locator('#pack_screen').waitFor();await page.evaluate(()=>document.fonts.ready);
  for(const id of ['sort_panel','sort_label','sort_rank','sort_suit'])assert(await page.locator('#'+id).isHidden(),'No sorting in target packs: '+id);
  const inspect=()=>page.evaluate(()=>{
   const stage=document.getElementById('stage'),s=stage.getBoundingClientRect().width/1536,pack=document.getElementById('pack_screen').getBoundingClientRect(),skip=document.getElementById('pack_skip').getBoundingClientRect(),label=document.getElementById('pack_choices').getBoundingClientRect(),hand=[...document.querySelectorAll('#hand .playing-card')],tarots=[...document.querySelectorAll('#pack_screen .shop-card')].map(n=>n.getBoundingClientRect());
   return {tops:hand.map(n=>parseFloat(n.style.top)),angles:hand.map(n=>n.style.transform),gap:Math.min(...hand.map(n=>n.getBoundingClientRect().top))-pack.bottom,bottom:Math.max(...hand.map(n=>n.getBoundingClientRect().bottom))+6*s,height:innerHeight,inside:hand.every(n=>{const b=n.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.bottom+6*s<innerHeight}),skipInset:(pack.bottom-skip.bottom)/s-5,labelGap:(Math.min(...tarots.map(b=>b.top))-label.bottom)/s};
  });
  const base=await inspect();assert(base.tops.every(t=>t===base.tops[0]));assert(base.angles.every(t=>t==='rotate(0deg)'),'Straight hand, no fan');assert(base.inside,'All cards/shadows inside viewport');assert(base.skipInset>=12,'Skip stays clear of frame');assert(base.labelGap>=7,'Choice label separated from Tarots');
  const before=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));
  for(let i=0;i<initial.hand.length;i++){await page.locator('#hand .playing-card').nth(i).click();const selected=await inspect();assert(selected.gap>3,'Lifted card clear of pack');assert(selected.inside);await page.locator('#hand .playing-card').nth(i).click();}
  assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),before,'Selection does not persist/replay');
  // Real stationary hold followed by drag and cancellation, using physical pointer events.
  const offer=await page.locator('#pack_screen .shop-card').first().boundingBox();await page.mouse.move(offer.x+offer.width/2,offer.y+offer.height/2);await page.mouse.down();await page.waitForTimeout(380);await page.mouse.move(offer.x+offer.width/2+20,offer.y+offer.height/2+15,{steps:4});await page.locator('#shop_action_zones.is-dragging').waitFor();
  const aligned=await page.evaluate(()=>{const p=document.getElementById('pack_screen').getBoundingClientRect(),b=document.getElementById('shop_buy_zone').getBoundingClientRect(),u=document.getElementById('shop_use_zone').getBoundingClientRect();return Math.abs(p.left-b.left)<1&&Math.abs(p.right-b.right)<1&&Math.abs(p.top-u.top)<1&&p.right<u.left;});assert(aligned);
  await page.screenshot({path:`artifacts/arcana-062-drag-${width}.png`});await page.mouse.move(10,10);await page.mouse.up();assert.equal(await page.locator('.shop-choice.is-dragging').count(),0);
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const perf=await page.evaluate(async()=>{
   const hand=document.getElementById('hand'),pack=document.getElementById('pack_screen'),nodes=[...hand.children,...pack.querySelectorAll('.shop-card')],saved=localStorage.getItem('card-cascade.current'),times=[],removed=[];
   const ob=new MutationObserver(rs=>{for(const r of rs)for(const n of r.removedNodes)if(n.nodeType===1&&(n.matches('.playing-card,.shop-card')||n.querySelector('.playing-card,.shop-card')))removed.push(n);});ob.observe(hand,{subtree:true,childList:true});ob.observe(pack,{subtree:true,childList:true});
   for(let i=0;i<200;i++){const t=performance.now();hand.children[i%2].click();times.push(performance.now()-t);await new Promise(requestAnimationFrame);}ob.disconnect();times.sort((a,b)=>a-b);
   return {max:times.at(-1),p95:times[189],preserved:nodes.every(n=>n.isConnected),removed:removed.length,saved:localStorage.getItem('card-cascade.current')===saved};
  });await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});assert(perf.preserved&&perf.saved&&perf.removed===0,'No card churn or saves under selection stress');assert(perf.p95<250,'Selection handler must not stall a quarter second');
  // Return from the pack and enter the next real blind: gameplay sort/fan remains.
  await page.locator('#pack_skip').click();await page.locator('#shop_screen').waitFor();await page.locator('#shop_next_round').click();await page.locator('#select_big').click();await page.locator('#hand .playing-card:enabled').first().waitFor();assert(await page.locator('#sort_rank').isVisible());assert(await page.locator('#hand .playing-card').evaluateAll(ns=>ns.some(n=>n.style.transform!=='rotate(0deg)')));
  const saved=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));assert.equal(saved.phase,'playing');assert.deepEqual(errors,[]);
  reports.push({width,height,key,layout:base,selectionCPU4:perf});await page.close();
 }
 await writeFile('artifacts/arcana-062-metrics.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports.map(({width,height,key,selectionCPU4})=>({width,height,key,selectionCPU4}))));
}finally{await browser.close();}
