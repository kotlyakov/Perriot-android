import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createRun,dispatch} from '../../src/core/run.js';
import {initializeItem7Joker} from '../../src/core/joker-item7-lifecycle.js';
import {bossTarget} from '../../src/core/boss-effects.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const tarot=(entityId,id)=>({id,entityId,originalKey:entityId,set:'Tarot',edition:'base',cost:3n,sellCost:1n});
function act(state,type,rest={}){
 const result=dispatch(state,{type,expectedRevision:state.revision,...rest});
 assert.equal(result.error,null,JSON.stringify(result.error));
 return result.state;
}
function fixture(keys=[],{boss=false}={}){
 let state=createRun('ITEM7B-UI',{runId:'item7b-ui',money:25n,referenceRng:true,referenceShop:true,reducedMotion:true});
 state.jokers=keys.map((entityId,i)=>initializeItem7Joker(state,{id:'owned'+i,entityId,creationOrdinal:i+1,originalKey:entityId,set:'Joker',edition:'base',cost:4n,sellCost:2n}));
 state.nextJokerCreationOrdinal=keys.length+1;
 if(boss){
  state.round.ante=3;state.round.blindId='boss';state.apkShop.context.ante=3;state.apkBlinds.ante=3;state.apkBlinds.tagContext.ante=3;
  state.apkBlinds.bossId='bl_water';state.apkBlinds.bossesUsed.bl_water=1;state.round.target=bossTarget(state);
 }
 state.apkShop.context=currentApkShopContext(state);
 return act(state,'START_BLIND');
}
function judgementFixture(keys=[]){
 const state=fixture(keys);
 // A surviving consumable catches activeCentreIds/save validation regressions.
 state.consumables=[tarot('c_judgement','judgement'),tarot('c_empress','remaining')];
 state.apkShop.context=currentApkShopContext(state);
 return state;
}
function comboFixture(){
 const state=fixture(['j_midas_mask','j_vampire']);
 const id='card_hearts_12';
 if(!state.hand.includes(id)){
  const replaced=state.hand[0];state.hand[0]=id;
  state.drawPile=state.drawPile.filter(cardId=>cardId!==id);state.drawPile.push(replaced);
 }
 return state;
}
const raw=page=>page.evaluate(()=>localStorage.getItem('card-cascade.current'));
const saved=async page=>deserializeState(await raw(page));
async function install(page,state){
 assert.deepEqual(deserializeState(serializeState(state)),state,'fixture must be accepted by strict save validation');
 await page.goto(process.env.PREVIEW_URL);
 await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(state));
 await page.reload();await enterRun(page,{startBlind:false});
 assert.deepEqual(await saved(page),state,'continue must load fixture without recovery/reset');
}
async function reload(page){
 const before=await raw(page);await page.reload();await enterRun(page,{startBlind:false});
 assert.equal(await raw(page),before,'reload must preserve committed save byte for byte');
}
async function tap(locator,touch){if(touch)await locator.tap();else await locator.click();}
async function committed(page,expected){
 await page.waitForFunction(revision=>JSON.parse(localStorage.getItem('card-cascade.current')).state.revision===revision,expected.revision);
 assert.deepEqual(await saved(page),expected,'UI transaction must match reducer including RNG and mutable state');
 await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);
}

// Validate deterministic fixture semantics before requiring a browser executable.
const judgement=judgementFixture(),judged=act(judgement,'USE_CONSUMABLE',{cardId:'judgement'});
assert.equal(judged.jokers.length,1);assert.equal(judged.consumables.length,1);assert.equal(judged.consumableUsage.c_judgement.count,1);
const combo=comboFixture(),scored=act(combo,'PLAY_HAND',{cardIds:['card_hearts_12']});
assert.equal(scored.cards.card_hearts_12.enhancement,'base');assert.equal(scored.jokers[1].xMult,1.1);
const boss=fixture(['j_chicot'],{boss:true});assert.equal(boss.bossState.disabled,true);assert.equal(boss.round.discardsRemaining,4);
const full=judgementFixture(Array(5).fill('j_joker'));
const rejected=dispatch(full,{type:'USE_CONSUMABLE',cardId:'judgement',expectedRevision:full.revision});
assert.ok(rejected.error);assert.equal(rejected.state,full);
if(process.env.UI_FIXTURE_ONLY==='1'){
 for(const state of [judgement,judged,combo,scored,boss,full])assert.deepEqual(deserializeState(serializeState(state)),state);
 console.log('Item7b strict UI fixtures PASS');
}else{
 await mkdir('artifacts',{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
 try{
  for(const [width,height,touch] of [[1536,688,false],[915,412,true]]){
   const page=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});
   page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await install(page,judgement);await reload(page);
   await tap(page.locator('[data-kind=consumable][data-offer-id=judgement] .shop-card'),touch);
   const use=page.locator('[data-offer-id=judgement] .shop-use');assert.equal(await use.isEnabled(),true);
   // Two synchronous events exercise the actual UI guard before a second render.
   await use.evaluate(button=>{button.click();button.click();});
   await committed(page,judged);
   assert.equal(await page.locator('[data-offer-id=judgement]').count(),0);
   assert.equal(await page.locator('[data-kind=consumable][data-offer-id=remaining]').count(),1);
   assert.equal(await page.locator(`[data-kind=owned][data-offer-id="${judged.jokers[0].id}"]`).count(),1);
   await reload(page);await page.screenshot({path:`artifacts/item7b-${width}-judgement.png`});

   await install(page,full);await tap(page.locator('[data-offer-id=judgement] .shop-card'),touch);
   const blocked=page.locator('[data-offer-id=judgement] .shop-use');assert.equal(await blocked.isEnabled(),false);
   const before=await raw(page);await blocked.evaluate(button=>{button.click();button.click();});assert.equal(await raw(page),before);
   await reload(page);await page.screenshot({path:`artifacts/item7b-${width}-full-slots.png`});

   await install(page,combo);await tap(page.locator('#hand [data-card-id=card_hearts_12]'),touch);
   await page.locator('#play_hand').evaluate(button=>{button.click();button.click();});await committed(page,scored);
   await reload(page);await page.screenshot({path:`artifacts/item7b-${width}-midas-vampire.png`});

   await install(page,boss);await reload(page);
   const discardId=boss.hand[0],discarded=act(boss,'DISCARD',{cardIds:[discardId]});
   await tap(page.locator(`#hand [data-card-id=${discardId}]`),touch);await tap(page.locator('#discard'),touch);
   await committed(page,discarded);assert.equal(discarded.bossState.disabled,true);assert.equal(discarded.round.discardsRemaining,3);
   await reload(page);await page.screenshot({path:`artifacts/item7b-${width}-chicot-water.png`});
   assert.deepEqual(errors,[]);await page.close();
  }
  console.log('Item7b Judgement use/full slots/double action, Midas+Vampire mutation, Chicot Water discard and strict reload mouse/touch PASS');
 }finally{await browser.close();}
}
