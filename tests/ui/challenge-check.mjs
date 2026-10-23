import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState} from '../../src/persistence/save.js';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{
 await mkdir('artifacts',{recursive:true});
 for(const [width,height,touch] of [[1536,688,false],[915,412,true],[360,800,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL??'http://127.0.0.1:4173');await page.locator('#start_new').click();
  assert.equal(await page.locator('#setup_challenge_tab').count(),1,'Challenge mode has a setup tab');
  assert.equal(await page.locator('#setup_challenge_tab').isDisabled(),true,'Five distinct deck wins open challenge mode');
  await page.evaluate(async()=>{const {renderStartScreen}=await import('/src/ui/start-screen.js');const {createProfile}=await import('/src/core/profile.js');const profile={...createProfile(),deckWins:Object.fromEntries(['red','blue','yellow','green','black'].map(id=>[id,[1]])),completedChallenges:[]};renderStartScreen({profile,onNew:options=>globalThis.challengeSelection=options});});
  await page.locator('#start_new').click();await page.locator('#setup_challenge_tab').click();
  assert.equal(await page.locator('[data-challenge-id]').count(),20,'All twenty challenges can be inspected');
  assert.equal(await page.locator('#challenge_play').isDisabled(),false);
  for(const id of await page.locator('[data-challenge-id]').evaluateAll(nodes=>nodes.map(node=>node.dataset.challengeId))){await page.locator('[data-challenge-id="'+id+'"]').click();const details=await page.locator('#challenge_details').textContent();assert.match(details,/Начальные условия/);assert.match(details,/Особые правила/);assert.match(details,/Запрещено/);assert.doesNotMatch(details,/undefined|NaN/);}

  await page.locator('[data-challenge-id="jokerless"]').click();assert.equal(await page.locator('#challenge_play').isDisabled(),true,'Locked challenge cannot launch');assert.match(await page.locator('#challenge_details').textContent(),/0/);
  await page.locator('[data-challenge-id="knife_edge"]').click();assert.match(await page.locator('#challenge_details').textContent(),/закрепл/);
  await page.locator('[data-challenge-id="omelette"]').click();assert.match(await page.locator('#challenge_details').textContent(),/Яйцо/);
  if(width!==360)await page.screenshot({path:`artifacts/item10d-challenges-${width}.png`});
  await page.locator('#challenge_play').click();assert.deepEqual(await page.evaluate(()=>globalThis.challengeSelection),{challengeId:'omelette',deckId:'red',stake:1});
  await page.evaluate(async()=>{
   const {createProfile}=await import('/src/core/profile.js');const profiles=Object.fromEntries(['1','2','3'].map(id=>[id,{name:'П'+id,profile:createProfile(),current:null,backup:null}]));
   profiles['1'].profile.deckWins=Object.fromEntries(['red','blue','yellow','green','black'].map(id=>[id,[1,0,0,0,0,0,0,0]]));
   localStorage.setItem('card-cascade.current',JSON.stringify({format:'card-cascade-save',version:1,state:null,account:{version:1,activeId:'1',profiles}}));localStorage.removeItem('card-cascade.backup');
  });
  await page.reload();await page.locator('#start_new').click();await page.locator('#setup_challenge_tab').click();
  assert.equal(await page.locator('[data-challenge-id][data-unlocked=true]').count(),5);
  await page.locator('#challenge_play').click();await page.locator('#select_small').waitFor();
  let saved=await page.evaluate(async()=>{const {deserializeState}=await import('/src/persistence/save.js');const raw=localStorage.getItem('card-cascade.current');const state=deserializeState(raw),profile=JSON.parse(raw).account.profiles['1'].profile;return {id:state.challengeId,discards:state.round.discardsRemaining,hands:state.round.handsRemaining,jokers:state.jokers.length,challenge:profile.runs[state.runId].challenge};});
  assert.deepEqual(saved,{id:'omelette',discards:3,hands:4,jokers:5,challenge:true});
  await page.reload();await page.locator('#start_new').click();assert.equal(await page.locator('#setup_continue_tab').textContent(),'Продолжить испытание');await page.locator('#setup_continue_tab').click();await page.locator('#select_small').click();
  await page.locator('#hand .playing-card').first().click();await page.locator('#play_hand').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('card-cascade.current')).account.profiles['1'].profile.career.c_hands_played===0);
  const continued=await page.evaluate(async()=>{const {deserializeState}=await import('/src/persistence/save.js');const state=deserializeState(localStorage.getItem('card-cascade.current'));return {id:state.challengeId,hands:state.round.handsRemaining};});assert.deepEqual(continued,{id:'omelette',hands:3});
  assert.deepEqual(errors,[]);await context.close();
 }
 const page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'reduce'});await page.goto(process.env.PREVIEW_URL??'http://127.0.0.1:4173');
 let hidden=createRun('XRAYTEST',{money:4n,runId:'hidden-ui',challengeId:'xray_vision',referenceRng:true,referenceShop:true});hidden=dispatch(hidden,{type:'START_BLIND',expectedRevision:hidden.revision}).state;assert.ok(hidden.challengeFlippedCardIds.length>0);
 await page.evaluate(raw=>{localStorage.setItem('card-cascade.current',raw);localStorage.removeItem('card-cascade.backup');},serializeState(hidden));await page.reload();await page.locator('#start_new').click();await page.locator('#setup_continue_tab').click();
 assert.equal(await page.locator('#hand .hidden-card').count(),hidden.challengeFlippedCardIds.length);await page.locator('#hand .hidden-card').first().click();assert.equal(await page.locator('#hand .hidden-card').first().getAttribute('aria-label'),'Скрытая карта');
 await page.evaluate(async()=>{const {renderShop}=await import('/src/ui/shop-screen.js');const {createRun}=await import('/src/core/run.js');document.getElementById('start_screen')?.remove();globalThis.reorderActions=[];
  const pinned=createRun('PINNEDUI',{money:4n,runId:'pinned-ui',challengeId:'knife_edge',referenceRng:true,referenceShop:true});
  pinned.jokers.push(createRun('PINNEDUI',{money:4n,runId:'other-ui',challengeId:'inflation',referenceRng:true,referenceShop:true}).jokers[0]);
  renderShop(pinned,false,{onAction:(type,fields)=>globalThis.reorderActions.push({type,fields})});
 });
 const knife=page.locator('#shop_owned [data-kind=owned]').first(),otherCard=page.locator('#shop_owned [data-kind=owned]').nth(1),a=await knife.boundingBox(),b=await otherCard.boundingBox();
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width,b.y+b.height/2,{steps:5});await page.mouse.up();assert.deepEqual(await page.evaluate(()=>globalThis.reorderActions),[],'Pinned joker cannot reorder');await page.close();
}finally{await browser.close();}
console.log('item10d challenge list/details/gates desktop+touch PASS');
