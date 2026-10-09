/** Prerequisites: Playwright in CODEX_PRIMARY_RUNTIME_NODE_MODULES, installed Chromium
 * (or CHROMIUM_PATH), and PREVIEW_URL. Local runner:
 * UI_CHECK_SCRIPT=tests/ui/expanded-boss-check.mjs node scripts/check-ui.mjs
 * Removing hidden-card rendering or preview suppression must fail these assertions.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {bossTarget} from '../../src/core/boss-effects.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
function bossFixture(id='bl_hook',ante=1){
 const run=createRun('AAAAAAA1',{runId:'expanded-boss-ui',deckId:'blue',money:4n,referenceRng:true,referenceShop:true});
 run.apkShop.context.ante=ante;run.apkBlinds.ante=ante;run.apkBlinds.tagContext.ante=ante;
 run.round.ante=ante;run.round.blindId='boss';run.apkBlinds.bossId=id;run.apkBlinds.bossesUsed[id]=ante;run.round.target=bossTarget(run);
 return dispatch(run,{type:'START_BLIND',expectedRevision:run.revision}).state;
}
try{
 // Direct render isolates UI privacy from the persistence/core implementation.
 const page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));await page.goto(process.env.PREVIEW_URL);await enterRun(page);
 const fixture=bossFixture();fixture.bossState.hiddenCardIds=[fixture.hand[0]];
 await page.evaluate(async raw=>{
  const {renderField}=await import('/src/ui/field.js');
  // The direct fixture is deliberately not decoded: old persistence rejects the new contract.
  const state=JSON.parse(raw);state.money=BigInt(state.money);state.round.target=BigInt(state.round.target);state.round.score=BigInt(state.round.score);
  renderField(state,new Set([state.hand[0]]),false,()=>{},()=>{},{handId:'pair',trace:[{after:{chips:10n,mult:2n}}],score:20n});
 },JSON.stringify(fixture,(_key,value)=>typeof value==='bigint'?String(value):value));
 const hidden=page.locator('#hand .playing-card').first();
 assert.equal(await hidden.getAttribute('aria-label'),'Скрытая карта');
 assert.equal(await hidden.locator('.corner,.face,.pip-art,.debuff-stamp').count(),0);
 assert.equal(await hidden.innerText(),'');assert.equal(await hidden.getAttribute('title'),null);
 assert.equal(await hidden.getAttribute('data-deck'),'blue');
 assert.equal(await hidden.evaluate(el=>el.classList.contains('deck-back')),true);
 assert.equal(await page.locator('#hand_name').innerText(),'');assert.equal(await page.locator('#hand_level').innerText(),'');
 assert.equal(await page.locator('#chips_value').innerText(),'0');assert.equal(await page.locator('#mult_value').innerText(),'0');
 const box=await hidden.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
 await page.locator('.card-tip').waitFor();assert.equal(await page.locator('.card-tip .tooltip-title').innerText(),'Скрытая карта');
 assert.match(await page.locator('.card-tip').innerText(),/Неизвестна до игры или сброса/);await page.mouse.up();
 assert.deepEqual(errors,[]);await page.close();console.log('Hidden direct render, explicit preview suppression and private tooltip');
 for(const [width,height] of [[1536,688],[360,800]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await page.goto(process.env.PREVIEW_URL);await enterRun(page);
  const state=bossFixture('bl_house',2);assert.equal(state.phase,'playing');assert.equal(state.bossState.hiddenCardIds.length,state.hand.length);
  await page.evaluate(raw=>localStorage.setItem('card-cascade.current',raw),serializeState(state));await page.reload();await enterRun(page);
  const hidden=page.locator(`#hand [data-card-id="${state.hand[0]}"]`);assert.equal(await hidden.getAttribute('aria-label'),'Скрытая карта');
  if(width===1536){
   const box=await hidden.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
   await page.mouse.move(box.x+box.width/2+245,box.y+box.height/2,{steps:8});await page.mouse.up();
   await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);
   const reordered=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
   assert.notEqual(reordered.hand.indexOf(state.hand[0]),0);assert.equal(await hidden.getAttribute('aria-label'),'Скрытая карта');
  }
  await hidden.click();assert.equal(await hidden.getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#play_hand').isEnabled(),true);
  assert.equal(await page.locator('#hand_name').innerText(),'');await page.locator('#discard').click();
  await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);
  const after=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
  assert.equal(after.round.discardsRemaining,state.round.discardsRemaining-1);assert.equal(after.hand.length,state.hand.length);
  assert.equal(after.bossState.hiddenCardIds.length,state.hand.length-1);
  assert.equal(await page.locator('#hand .corner').count(),2);
  await page.locator('#sort_suit').click();await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);
  const sorted=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page);
  assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),sorted);
  assert.equal(await page.locator('#hand .deck-back').count(),state.hand.length-1);assert.deepEqual(errors,[]);await page.close();
  console.log('House discard, sorting and reload '+width+'x'+height);
 }
 // Normal motion exposes the outgoing clone long enough to check its actual face.
 const motionPage=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'no-preference'}),motionErrors=[];
 motionPage.on('pageerror',error=>motionErrors.push(error.message));await motionPage.goto(process.env.PREVIEW_URL);await enterRun(motionPage);
 const motionState=bossFixture('bl_house',2);
 await motionPage.evaluate(raw=>localStorage.setItem('card-cascade.current',raw),serializeState(motionState));await motionPage.reload();await enterRun(motionPage);
 await motionPage.locator(`#hand [data-card-id="${motionState.hand[0]}"]`).click();await motionPage.locator('#play_hand').click();
 await motionPage.locator('.played-card').waitFor();
 assert.equal(await motionPage.locator('.played-card .corner').count(),2);
 assert.equal(await motionPage.locator('.played-card.hidden-card,.played-card.deck-back').count(),0);
 assert.equal(await motionPage.locator('#sort_rank').isDisabled(),true);
 await motionPage.waitForFunction(()=>!document.getElementById('sort_rank').disabled);
 const hiddenDiscard=motionPage.locator('#hand .hidden-card').first();await hiddenDiscard.click();await motionPage.locator('#discard').click();
 await motionPage.locator('.played-card').waitFor();
 assert.equal(await motionPage.locator('.played-card .corner,.played-card .face,.played-card .pip-art').count(),0);
 assert.equal(await motionPage.locator('.played-card.hidden-card.deck-back').count(),1);
 await motionPage.waitForFunction(()=>!document.getElementById('sort_rank').disabled);
 assert.deepEqual(motionErrors,[]);await motionPage.close();console.log('Hidden play reveals outgoing face; hidden discard retains back during normal motion');
 for(const bossId of ['bl_wheel','bl_fish','bl_mark']){
  const page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await page.goto(process.env.PREVIEW_URL);await enterRun(page);
  let state=bossFixture(bossId,2);
  if(bossId==='bl_fish')state=dispatch(state,{type:'PLAY_HAND',expectedRevision:state.revision,cardIds:[state.hand[0]]}).state;
  assert.ok(state.bossState.hiddenCardIds.length>0);
  await page.evaluate(raw=>localStorage.setItem('card-cascade.current',raw),serializeState(state));await page.reload();await enterRun(page);
  for(const id of state.hand){
   const card=page.locator(`#hand [data-card-id="${id}"]`);
   assert.equal(await card.evaluate(el=>el.classList.contains('hidden-card')),state.bossState.hiddenCardIds.includes(id));
   if(state.bossState.hiddenCardIds.includes(id)){
    assert.equal(await card.getAttribute('aria-label'),'Скрытая карта');assert.equal(await card.locator('.corner,.face,.pip-art').count(),0);
   }
  }
  const visibleId=state.hand.find(id=>!state.bossState.hiddenCardIds.includes(id));
  await page.locator(`#hand [data-card-id="${visibleId}"]`).click();assert.notEqual(await page.locator('#hand_name').innerText(),'');
  const hiddenId=state.bossState.hiddenCardIds[0];await page.locator(`#hand [data-card-id="${hiddenId}"]`).click();
  assert.equal(await page.locator('#hand_name').innerText(),'');assert.equal(await page.locator('#chips_value').innerText(),'0');
  await page.locator('#play_hand').click();await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);
  const after=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
  assert.equal(after.round.handsRemaining,state.round.handsRemaining-1);assert.equal(after.discardPile.includes(hiddenId),true);
  assert.equal(after.bossState.hiddenCardIds.includes(hiddenId),false);assert.ok(after.lastScore.score>0n);
  assert.deepEqual(errors,[]);await page.close();console.log(bossId+' private saved hand and playable mixed selection');
 }
}finally{await browser.close();}
