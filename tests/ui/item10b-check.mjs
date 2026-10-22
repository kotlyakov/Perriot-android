import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import * as shopUi from '../../src/ui/shop-screen.js';
import {deserializeState} from '../../src/persistence/save.js';

assert.equal(typeof shopUi.jokerStickers,'function','Sticker details must be available to cards and tooltips');
assert.deepEqual(shopUi.jokerStickers({eternal:true}).map(row=>row.label),['Вечный']);
assert.deepEqual(shopUi.jokerStickers({perishable:true,perishRounds:5,rental:true}).map(row=>row.label),['Временный · 5','Аренда']);
assert.match(shopUi.jokerStickers({perishable:true,perishRounds:0})[0].description,/истёк/);
assert.deepEqual(shopUi.jokerStickers({}),[]);

if(!process.argv.includes('--logic-only')){
 const {STAKES}=await import('../../src/content/stakes.js');
 const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  await mkdir('artifacts',{recursive:true});
  for(const [width,height,touch] of [[1536,688,false],[915,412,true],[568,320,true],[360,800,true]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:touch,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(process.env.PREVIEW_URL??'http://127.0.0.1:4173');
   await page.locator('#start_new').click();await page.locator('#setup_stake').waitFor();
   assert.equal(await page.locator('#setup_stake option').count(),8);
   assert.equal(await page.locator('#setup_deck_select option').count(),15);
   assert.equal(await page.locator('#setup_stake').inputValue(),'1');
   for(const stake of STAKES){
    await page.locator('#setup_stake').selectOption(String(stake.level));
    assert.equal(await page.locator('.start-stake-chip').getAttribute('data-stake'),stake.id);
    assert.match(await page.locator('#setup_stake_description').textContent(),new RegExp(stake.description.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),null);
   }
   await page.locator('#setup_stake').selectOption('5');await page.locator('#setup_deck_select').selectOption('blue');
   const controls=await page.locator('#setup_stake,#setup_stake_description,#setup_deck_select,#setup_seed,#setup_play,#setup_back').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom];}));
   for(const [left,top,right,bottom] of controls)assert.ok(left>=-1&&top>=-1&&right<=width+1&&bottom<=height+1,'Stake controls outside viewport');
   const overlap=await page.locator('.start-setup').evaluate(panel=>{const ids=['setup_deck_select','setup_stake','setup_seed','setup_play'],rows=ids.map(id=>panel.querySelector('#'+id).getBoundingClientRect());return rows.slice(1).some((r,i)=>r.top<rows[i].bottom-1);});assert.equal(overlap,false,'Setup rows must not overlap');
   if(width===1536||width===915)await page.screenshot({path:`artifacts/item10b-setup-${width}.png`});
   const activate=locator=>touch?locator.tap():locator.click();
   await page.locator('#setup_seed').fill('STAKES10');await activate(page.locator('#setup_play'));await page.locator('#select_small').waitFor();
   const saved=await page.evaluate(()=>localStorage.getItem('card-cascade.current')),state=deserializeState(saved);assert.equal(state.stake,5);assert.equal(state.deckId,'blue');assert.equal(state.round.discardsRemaining,2);
   await page.reload();await page.locator('#start_new').click();await page.locator('#setup_continue_tab').click();await page.locator('#select_small').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),saved);
   // Render real shop UI with sticker-bearing offers, without introducing a
   // fixture into the persisted run or relying on the random shop draw.
   await page.evaluate(async()=>{
    const {createRun,dispatch}=await import('/src/core/run.js'),{renderShop}=await import('/src/ui/shop-screen.js');
    let state=createRun('STICKERS10',{runId:'stickers10',stake:8,money:100n,referenceRng:true,referenceShop:true,reducedMotion:true});
    state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;state.phase='round_won';state.round.score=state.round.target;state=dispatch(state,{type:'CASH_OUT',expectedRevision:state.revision}).state;
    const card={id:'eternal10',entityId:'j_joker',originalKey:'j_joker',set:'Joker',edition:'base',cost:2n,sellCost:1n};
    state.jokers=[{...card,eternal:true},{...card,id:'expired10',perishable:true,perishRounds:0,debuffed:true,rental:true}];
    state.shop.main=[{...card,id:'offer10',perishable:true,perishRounds:5,rental:true,cost:1n}];
    renderShop(state,false,{onAction(){},onNotice(){}});
   });
   const eternal=page.locator('[data-offer-id="eternal10"] .shop-card'),expired=page.locator('[data-offer-id="expired10"] .shop-card'),offer=page.locator('[data-offer-id="offer10"] .shop-card');
   assert.equal(await eternal.locator('[data-sticker=eternal]').textContent(),'Вечный');assert.equal(await expired.locator('[data-sticker=perishable]').textContent(),'Временный · 0');assert.equal(await expired.locator('[data-sticker=rental]').textContent(),'Аренда');
   assert.ok(await expired.locator('.joker-debuff-stamp').isVisible());assert.equal(await offer.locator('[data-sticker=perishable]').textContent(),'Временный · 5');
   await offer.dispatchEvent('click',{detail:0});assert.match(await page.locator('#shop_tooltip').innerText(),/5 раундов/);assert.match(await page.locator('#shop_tooltip').innerText(),/\$3/);
   const tooltip=await page.locator('#shop_tooltip').boundingBox();assert.ok(tooltip.x>=-1&&tooltip.y>=-1&&tooltip.x+tooltip.width<=width+1&&tooltip.y+tooltip.height<=height+1,'Sticker tooltip stays inside viewport');
   if(width===1536||width===915)await page.screenshot({path:`artifacts/item10b-stickers-${width}.png`});
   assert.deepEqual(errors,[]);await context.close();
  }
 }finally{await browser.close();}
 console.log('item10b stakes/start/resume/sticker UI desktop+touch PASS');
}
