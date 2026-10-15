/** Dedicated real-browser lifecycle check; no VM substitute for this gate. */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {nativeBlindTarget} from '../../src/core/blind-progression.js';
import {bossTarget,disableBoss} from '../../src/core/boss-effects.js';
import {getCashout} from '../../src/core/cashout.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
mkdirSync('artifacts',{recursive:true});
const act=(s,type,fields={})=>dispatch(s,{type,expectedRevision:s.revision,...fields});
function fixture(bossId='bl_final_heart'){
 const s=createRun('AAAAAAA1',{runId:'victory-ui',money:10n,referenceRng:true,referenceShop:true});
 s.round.ante=8;s.round.blindId='boss';s.apkShop.context.ante=8;s.apkBlinds.ante=8;s.apkBlinds.tagContext.ante=8;s.apkBlinds.bossId=bossId;s.apkBlinds.bossesUsed[bossId]=1;s.round.target=bossTarget(s);
 s.jokers=[{id:'golden',entityId:'j_golden',creationOrdinal:1,sellCost:2n}];s.nextJokerCreationOrdinal=2;
 const playing=act(s,'START_BLIND').state;
 if(bossId==='bl_final_vessel'){playing.round.score=100000n;disableBoss(playing,[]);playing.revision++;assert.equal(playing.lastScore,null);assert.equal(playing.winPending,true);return playing;}
 playing.round.score=playing.round.target-1n;
 const r=act(playing,'PLAY_HAND',{cardIds:[playing.hand[0]]});assert.equal(r.error,null);assert.equal(r.state.winPending,true);return r.state;
}
function endlessSelection(ante,blindId='small'){
 const s=createRun('AAAAAAA1',{runId:'endless-ui-'+ante,money:10n,referenceRng:true,referenceShop:true});
 s.round.ante=ante;s.round.blindId=blindId;s.apkShop.context.ante=ante;s.apkBlinds.ante=ante;s.apkBlinds.tagContext.ante=ante;
 s.apkBlinds.bossId=ante%8===0?'bl_final_vessel':'bl_club';s.apkBlinds.bossesUsed[s.apkBlinds.bossId]=1;
 s.round.target=blindId==='boss'?bossTarget(s):nativeBlindTarget(ante,blindId==='big'?1.5:1);
 Object.assign(s,{won:true,winNotified:true,winPending:false});return s;
}
async function installEndless(page,s,selector){
 await page.evaluate(raw=>{localStorage.setItem('card-cascade.current',raw);localStorage.removeItem('card-cascade.backup');},serializeState(s));
 await page.reload();await enterRun(page,{startBlind:false});await page.locator(selector).first().waitFor();
}
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
async function install(page,s){await page.evaluate(raw=>{localStorage.setItem('card-cascade.current',raw);localStorage.removeItem('card-cascade.backup');},serializeState(s));await page.reload();await page.locator('#victory_endless').waitFor();}
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:360,height:800}:{width:1536,height:688},hasTouch:mobile,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.PREVIEW_URL);
  // Recovery must replace its own dialog with the durable pending victory in the same session.
  for(const pending of [fixture(),fixture('bl_final_vessel')]){
   const backup=serializeState(pending);
   await page.evaluate(raw=>{localStorage.setItem('card-cascade.current','invalid current');localStorage.setItem('card-cascade.backup',raw);},backup);
   await page.reload();await page.locator('#restore-backup').waitFor();await page.locator('#restore-backup').click();await page.locator('#victory_endless').waitFor();
   assert.match(await page.locator('#dialog-title').innerText(),/Победа/);assert.equal(await page.locator('#restore-backup').count(),0);assert.equal(await page.locator('#victory_new').isVisible(),true);assert.equal(await page.locator('#victory_menu').isVisible(),true);assert.equal(await page.locator('#cashout').isDisabled(),true);assert.deepEqual(await saved(page),pending);assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.backup')),backup);
   await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>cardGameBack()),true);assert.equal(await page.locator('#victory_endless').isVisible(),true);assert.deepEqual(await saved(page),pending);
   await page.locator('#victory_endless').click();await page.locator('#dialog').waitFor({state:'hidden'});assert.deepEqual(await saved(page),{...pending,winPending:false,revision:pending.revision+1});assert.equal(await page.locator('#cashout').isEnabled(),true);
   if(pending.apkBlinds.bossId==='bl_final_vessel'){
    await page.locator('#cashout').click();await page.locator('#shop_next_round').waitFor();const paid=await saved(page);
    assert.equal(paid.round.target,100000n);assert.equal(paid.round.bossDisabled,true);assert.equal(paid.apkShop.context.ante,9);
    await page.reload();await enterRun(page,{startBlind:false});await page.locator('#shop_next_round').waitFor();assert.deepEqual(await saved(page),paid);
    await page.locator('#shop_next_round').click();await page.locator('#select_small').waitFor();assert.equal((await saved(page)).round.bossDisabled,undefined);assert.equal((await saved(page)).round.target,110000n);
   }
  }
  const s=fixture(),raw=serializeState(s),quote=getCashout(s);await install(page,s);
  assert.match(await page.locator('#dialog-title').innerText(),/Победа/);assert.equal(await page.locator('#cashout').isDisabled(),true);
  await page.screenshot({path:'artifacts/victory-'+(mobile?'mobile':'desktop')+'.png'});
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>cardGameBack()),true);assert.equal(await page.locator('#dialog').getAttribute('open'),'');assert.deepEqual(await saved(page),s);
  await page.reload();await page.locator('#victory_endless').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),raw);
  await page.locator('#victory_new').click();await page.keyboard.press('Escape');await page.locator('#victory_endless').waitFor();
  // Main menu preserves the unacknowledged victory and offers the established Continue flow.
  await page.locator('#victory_menu').click();await page.locator('#start_screen').waitFor();assert.equal(await page.locator('#dialog').isVisible(),false);assert.deepEqual(await saved(page),s);
  await enterRun(page,{startBlind:false});await page.locator('#victory_endless').waitFor();
  // Neither failed primary nor backup writes may close or acknowledge victory.
  for(const failSlot of ['backup','current']){
   await page.evaluate(()=>{
    const dialog=document.getElementById('dialog');
    window.victoryRetryTrace=[];
    window.traceVictoryRetry=(label,event)=>{
     const style=getComputedStyle(dialog),rect=dialog.getBoundingClientRect();
     window.victoryRetryTrace.push({label,event:event?.type,prevented:event?.defaultPrevented,open:dialog.open,view:dialog.dataset.view,title:document.getElementById('dialog-title').textContent,display:style.display,visibility:style.visibility,translate:style.translate,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},buttons:[...dialog.querySelectorAll('button')].map(b=>({id:b.id,disabled:b.disabled})),animations:dialog.getAnimations().map(a=>({state:a.playState,time:a.currentTime}))});
    };
    if(!window.victoryRetryTracing){
     window.victoryRetryTracing=true;
     for(const type of ['cancel','close','click','keydown','keyup'])dialog.addEventListener(type,event=>queueMicrotask(()=>window.traceVictoryRetry('event',event)));
     new MutationObserver(()=>window.traceVictoryRetry('open mutation')).observe(dialog,{attributes:true,attributeFilter:['open']});
    }
    window.traceVictoryRetry('before failed save');
   });
   await page.evaluate(slot=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='card-cascade.'+slot)throw Error('full');return window.originalSetItem.call(this,key,value);};},failSlot);
   await page.locator('#victory_endless').click();await page.locator('#victory_retry').waitFor();assert.deepEqual(await saved(page),s);await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>cardGameBack()),true);
   await page.evaluate(()=>{Storage.prototype.setItem=window.originalSetItem;window.traceVictoryRetry('after Escape and Back');});
   try{await page.locator('#victory_retry').click();await page.locator('#victory_endless').waitFor();}
   catch(error){console.error('Victory retry diagnostics '+JSON.stringify({mobile,failSlot,trace:await page.evaluate(()=>{window.traceVictoryRetry('failure');return window.victoryRetryTrace;})}));await page.screenshot({path:'artifacts/victory-retry-failure-'+(mobile?'mobile':'desktop')+'-'+failSlot+'.png'});throw error;}
  }
  await page.evaluate(()=>{window.closedAfterSave=[];document.getElementById('dialog').addEventListener('close',()=>window.closedAfterSave.push(JSON.parse(localStorage.getItem('card-cascade.current')).state.winPending));});
  await page.locator('#victory_endless').click();await page.locator('#dialog').waitFor({state:'hidden'});const acknowledged=await saved(page);
  assert.equal(acknowledged.winPending,false);assert.equal(acknowledged.winNotified,true);assert.equal(acknowledged.revision,s.revision+1);assert.deepEqual(acknowledged.cashoutQuote,s.cashoutQuote);assert.deepEqual(acknowledged.round,s.round);assert.deepEqual(acknowledged.rng,s.rng);assert.equal(acknowledged.money,s.money);assert.deepEqual(await page.evaluate(()=>window.closedAfterSave),[false]);assert.equal(await page.locator('#cashout').isEnabled(),true);
  await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.locator('#victory_endless').count(),0);assert.deepEqual(getCashout(await saved(page)),quote);assert.deepEqual(await saved(page),acknowledged);
  // Acknowledgement proceeds through the actual generated shop; reload cannot re-pay or reroll it.
  const expectedShop=act(acknowledged,'CASH_OUT');assert.equal(expectedShop.error,null);
  await page.locator('#cashout').click();await page.locator('#shop_next_round').waitFor();assert.deepEqual(await saved(page),expectedShop.state);
  assert.equal((await saved(page)).apkShop.context.ante,9);assert.equal((await saved(page)).nextAnteBlinds.ante,9);
  await page.reload();await enterRun(page,{startBlind:false});await page.locator('#shop_next_round').waitFor();assert.deepEqual(await saved(page),expectedShop.state);
  await page.locator('#shop_next_round').click();await page.locator('#select_small').waitFor();assert.deepEqual(await saved(page),act(expectedShop.state,'LEAVE_SHOP').state);
  assert.equal(await page.locator('#select_small_target').innerText(),'110,000');assert.equal(await page.locator('#select_big_target').innerText(),'165,000');
  await page.screenshot({path:'artifacts/endless-ante9-'+(mobile?'mobile':'desktop')+'.png'});
  await page.locator('#select_small').click();await page.locator('#hand .playing-card').first().waitFor();assert.equal((await saved(page)).roundNumber,25);assert.equal(await page.locator('#target_value').innerText(),'110,000');
  await page.reload();await enterRun(page,{startBlind:false});await page.locator('#hand .playing-card').first().waitFor();assert.equal((await saved(page)).roundNumber,25);
  // The repeated showdown has no second victory overlay and shows native scientific targets.
  const later=act(endlessSelection(16,'boss'),'START_BLIND');assert.equal(later.error,null);later.state.round.score=later.state.round.target-1n;
  await installEndless(page,later.state,'#hand .playing-card');assert.equal(await page.locator('#target_value').innerText(),'5.160e21');
  await page.locator('#hand .playing-card').first().click();await page.locator('#play_hand').click();await page.locator('#cashout').waitFor();
  const wonLater=await saved(page);assert.equal(wonLater.phase,'round_won');assert.equal(wonLater.winPending,false);assert.equal(await page.locator('#victory_endless').count(),0);assert.equal(await page.locator('.payout-target strong').innerText(),'5.160e21');
  await page.reload();await enterRun(page,{startBlind:false});await page.locator('#cashout').waitFor();assert.deepEqual(await saved(page),wonLater);
  await page.locator('#cashout').click();await page.locator('#shop_next_round').waitFor();assert.equal((await saved(page)).nextAnteBlinds.ante,17);
  // Binary64-tail display does not alter the exact committed BigInt; overflow remains unwinnable after resume.
  for(const [ante,small,big,boss] of [[32,'2.700e179','4.050e179','1.620e180'],[38,'4.500e288','6.750e288','9.000e288'],[39,'nan','nan','nan'],[40,'nan','nan','nan']]){
   const selection=endlessSelection(ante);await installEndless(page,selection,'#select_small');
   assert.equal(await page.locator('#select_small_target').innerText(),small);assert.equal(await page.locator('#select_big_target').innerText(),big);assert.equal(await page.locator('#select_boss_target').innerText(),boss);assert.deepEqual(await saved(page),selection);
   await page.screenshot({path:'artifacts/endless-ante'+ante+'-'+(mobile?'mobile':'desktop')+'.png'});
   await page.locator('#select_small').click();await page.locator('#hand .playing-card').first().waitFor();assert.equal(await page.locator('#target_value').innerText(),small);
   const started=await saved(page);assert.ok(Object.is(started.round.target,selection.round.target));
   await page.reload();await enterRun(page,{startBlind:false});await page.locator('#hand .playing-card').first().waitFor();assert.deepEqual(await saved(page),started);
   if(ante>=39){
    assert.equal(await page.locator('#score_flame').getAttribute('data-height'),'0');
    for(let i=0;i<4;i++){
     await page.locator('#hand .playing-card').first().click();await page.locator('#play_hand').click();
     await page.waitForFunction(phase=>JSON.parse(localStorage.getItem('card-cascade.current')).state.phase===phase,i===3?'game_over':'playing');
     if(i<3){await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);const checkpoint=await saved(page);assert.equal(checkpoint.round.handsRemaining,3-i);await page.reload();await enterRun(page,{startBlind:false});await page.locator('#hand .playing-card').first().waitFor();assert.deepEqual(await saved(page),checkpoint);}
    }
    await page.locator('#dialog[open]').waitFor();assert.match(await page.locator('#dialog').innerText(),/из nan очков/);assert.equal((await saved(page)).phase,'game_over');assert.equal((await saved(page)).winPending,false);
    const terminal=await saved(page);await page.reload();await enterRun(page,{startBlind:false});await page.locator('#target_value').waitFor();assert.deepEqual(await saved(page),terminal);assert.equal(await page.locator('#target_value').innerText(),'nan');assert.equal(await page.locator('#play_hand').isDisabled(),true);assert.equal(await page.locator('#discard').isDisabled(),true);
   }
  }
  await install(page,s);await page.locator('#victory_new').click();await page.getByRole('button',{name:'Отмена',exact:true}).click();await page.locator('#victory_endless').waitFor();assert.deepEqual(await saved(page),s);
  await page.locator('#victory_new').click();await page.getByRole('button',{name:'Начать',exact:true}).click();await page.locator('#select_small').waitFor();const fresh=await saved(page);assert.notEqual(fresh.runId,s.runId);assert.equal(fresh.money,4n);assert.equal(fresh.winPending,false);assert.equal(fresh.won,false);assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.backup')),raw);
  assert.deepEqual(errors,[]);await page.close();console.log('Victory locks, save retry, Ante9 shop/reload, Ante16 showdown, large targets and NaN loss/resume: '+(mobile?'mobile':'desktop'));
 }
 // Actual animated transition: accepted persistence precedes closing, controls stay locked while busy.
 const page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'no-preference'});await page.goto(process.env.PREVIEW_URL);await install(page,fixture());await page.locator('#victory_endless').click();await page.locator('#dialog').waitFor({state:'hidden'});assert.equal((await saved(page)).winPending,false);await page.close();
}finally{await browser.close();}
