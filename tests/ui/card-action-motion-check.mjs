import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const item=(key,id='motion-consumable')=>{const c=catalogue.centres.find(c=>c.key===key);return {id,entityId:key,originalKey:key,set:c.set,edition:'base',cost:BigInt(c.cost),sellCost:1n};};
function playing(key){let s=createRun('ACTIONMOTION',{runId:'action-motion',money:30n,referenceRng:true,referenceShop:true});s=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision}).state;s.consumables=[item(key)];return s;}
function packFixture(){
 for(let n=0;n<200;n++){
  let s=createRun('ARCANA_UI_'+n,{runId:'pack-action-motion',money:30n,referenceRng:true,referenceShop:true});s=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision}).state;s.phase='round_won';s.round.score=s.round.target;s=dispatch(s,{type:'CASH_OUT',expectedRevision:s.revision}).state;s.shop.boosters=[item('p_arcana_normal_1','motion-pack')];
  const opened=dispatch(s,{type:'OPEN_BOOSTER',expectedRevision:s.revision,offerId:'motion-pack'});assert.ok(!opened.error);
  if(opened.state.packState.cards.some(c=>c.entityId==='c_strength'))return s;
 }
 throw Error('Strength fixture unavailable');
}
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
async function install(page,state){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(state));await page.reload();await enterRun(page,{startBlind:false});await page.locator(state.phase==='playing'?'#hand .playing-card':'#shop_screen').first().waitFor();await observe(page);}
async function observe(page){
 await page.evaluate(()=>{
  window.motionLog=[];window.holdMotion=true;
  if(!window.motionOriginalAnimate){window.motionOriginalAnimate=Element.prototype.animate;Element.prototype.animate=function(frames,options){
   const animation=window.motionOriginalAnimate.call(this,frames,options);
   if(this.matches('.motion-copy,.box-lid')){
    const save=JSON.parse(localStorage.getItem('card-cascade.current'));window.motionLog.push({frames,className:this.className,revision:save.state.revision,phase:save.state.phase,sortLocked:document.querySelector('#sort_rank').disabled,packLocked:document.querySelector('#pack_skip')?.disabled});
    if(window.holdMotion)animation.pause();
   }
   return animation;
  };}
 });
}
async function release(page){await page.evaluate(()=>{window.holdMotion=false;document.getAnimations().filter(a=>a.playState==='paused').forEach(a=>a.finish());});}
async function performUse(page,id,targetIds,normal,before,expectedKind='flip'){
 for(const target of targetIds)await page.locator(`#hand [data-card-id="${target}"]`).click();
 await page.locator(`[data-offer-id="${id}"] .shop-card`).click();
 const use=page.locator(`[data-offer-id="${id}"] .shop-use`);await use.waitFor();assert.ok(await use.isEnabled());
 await use.evaluate(button=>{button.click();button.click();});
 if(normal){
  await page.waitForFunction(()=>window.motionLog.length>0);const log=await page.evaluate(()=>window.motionLog);assert.ok(log.every(row=>row.revision===before.revision+1));assert.ok(log.every(row=>row.sortLocked),'Hand input remains locked during action motion');
  if(expectedKind==='flip')assert.ok(log.some(row=>row.frames.some(frame=>frame.transform?.includes('rotateY'))));else assert.ok(log.some(row=>row.className.includes('card-dust')));
  const revision=(await saved(page)).revision;await page.evaluate(()=>{document.getElementById('sort_rank').click();document.getElementById('discard').click();});assert.equal((await saved(page)).revision,revision);await release(page);
 }
 await page.waitForFunction(()=>!document.querySelector('.motion-copy')&&!document.querySelector('#sort_rank').disabled);
 const after=await saved(page);assert.equal(after.revision,before.revision+1);assert.equal(after.consumableUsage[before.consumables.find(c=>c.id===id)?.entityId??'c_strength'].count,1);if(!normal)assert.equal((await page.evaluate(()=>window.motionLog)).length,0);return after;
}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 for(const reducedMotion of ['no-preference','reduce']){
  const normal=reducedMotion==='no-preference',page=await browser.newPage({viewport:{width:915,height:412},reducedMotion});page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [key,count] of [['c_strength',2],['c_devil',1],['c_death',2],['c_hanged_man',1],['c_talisman',1],['c_aura',1]]){
   const fixture=playing(key),targets=fixture.hand.slice(0,count);await install(page,fixture);const expected=dispatch(fixture,{type:'USE_CONSUMABLE',expectedRevision:fixture.revision,cardId:'motion-consumable',targetCardIds:targets});assert.ok(!expected.error,key);
   const after=await performUse(page,'motion-consumable',targets,normal,fixture,key==='c_hanged_man'?'dust':'flip');assert.deepEqual(after.cards,expected.state.cards,key+' card values');assert.deepEqual(after.rng,expected.state.rng,key+' no presentation RNG');assert.deepEqual(after.hand,expected.state.hand);assert.equal(after.money,expected.state.money);console.log(key+' '+reducedMotion+' PASS');
  }
  const fixture=packFixture();await install(page,fixture);const before=await saved(page),box=await page.locator('[data-offer-id=motion-pack] .shop-card').boundingBox(),stage=await page.locator('#stage').boundingBox(),scale=stage.width/1536;
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(stage.x+850*scale,stage.y+100*scale,{steps:6});await page.locator('#shop_buy_zone[data-available=true]').waitFor();await page.mouse.up();await page.locator('#pack_screen').waitFor();
  if(normal){await page.waitForFunction(()=>window.motionLog.some(row=>row.className.includes('box-lid')));const log=await page.evaluate(()=>window.motionLog);assert.ok(log.every(row=>row.revision===before.revision+1&&row.phase==='pack'));assert.ok(log.every(row=>row.packLocked),'Pack controls locked while opening');assert.ok(await page.locator('#pack_skip').isDisabled());const revision=(await saved(page)).revision;await page.locator('#pack_skip').evaluate(button=>button.click());assert.equal((await saved(page)).revision,revision);await release(page);}
  await page.waitForFunction(()=>!document.querySelector('#pack_skip').disabled&&!document.querySelector('.motion-copy'));const opened=await saved(page),expectedOpen=dispatch(fixture,{type:'OPEN_BOOSTER',expectedRevision:fixture.revision,offerId:'motion-pack'}).state;assert.equal(opened.revision,before.revision+1);assert.equal(opened.money,expectedOpen.money);assert.deepEqual(opened.rng,expectedOpen.rng);assert.deepEqual(opened.packState,expectedOpen.packState);
  await observe(page);const strength=opened.packState.cards.find(c=>c.entityId==='c_strength'),targets=opened.hand.slice(0,2),expectedUse=dispatch(opened,{type:'USE_PACK_CARD',expectedRevision:opened.revision,cardId:strength.id,targetCardIds:targets});assert.ok(!expectedUse.error);
  // Last normal-pack choice returns to the shop; sort is disabled there even after motion.
  await page.locator(`[data-offer-id="${strength.id}"] .shop-card`).click();for(const target of targets)await page.locator(`#hand [data-card-id="${target}"]`).click();await page.locator(`[data-offer-id="${strength.id}"] .shop-use`).evaluate(b=>{b.click();b.click();});
  if(normal){await page.waitForFunction(()=>window.motionLog.length>0);assert.ok((await page.evaluate(()=>window.motionLog)).every(row=>row.revision===opened.revision+1));await release(page);}
  await page.locator('#shop_screen').waitFor();await page.waitForFunction(()=>!document.querySelector('.motion-copy')&&!document.querySelector('#shop_reroll').disabled);const after=await saved(page);assert.equal(after.revision,opened.revision+1);assert.deepEqual(after.cards,expectedUse.state.cards);assert.deepEqual(after.rng,expectedUse.state.rng);assert.equal(after.money,opened.money);
  if(!normal)assert.equal((await page.evaluate(()=>window.motionLog)).length,0);assert.deepEqual(errors,[]);await page.close();console.log('Actual Tarot/enhancement/copy/destroy/seal/edition and Arcana open/use: save first, locks, single action, RNG '+reducedMotion+' PASS');
 }
}finally{await browser.close();}
