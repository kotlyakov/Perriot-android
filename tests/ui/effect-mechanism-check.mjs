import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {createApkShopContext,rerollApkShop} from '../../src/core/apk-shop.js';
import {createApkRng} from '../../src/core/apk-rng.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const seals={c_deja_vu:'red',c_talisman:'gold',c_trance:'blue',c_medium:'purple'};
function spectral(key,index){
 const context=createApkShopContext({mainSlots:1,boosterSlots:0,reducedMotion:true,rates:{Joker:0,Tarot:0,Planet:0,Base:0,Spectral:1},bannedCentreIds:catalogue.centres.filter(c=>c.set==='Spectral'&&c.key!==key).map(c=>c.key)});
 for(let i=0;i<100;i++){const offer=rerollApkShop(createApkRng('EFFECTUI'+i),context).main[0];if(offer.entityId===key)return {...offer,id:'effect_'+index};}throw Error('Missing generated Spectral '+key);
}
function jokerFor(key,id,seed){
 const context=createApkShopContext({mainSlots:1,boosterSlots:0,reducedMotion:true,rates:{Joker:1,Tarot:0,Planet:0,Base:0,Spectral:0},unlockedCentreIds:[key],bannedCentreIds:catalogue.centres.filter(c=>c.set==='Joker'&&c.key!==key).map(c=>c.key)});
 // Native rarity selection can produce an empty rarity pool and fallback Joker.
 for(let index=0;index<100;index++){const offer=rerollApkShop(createApkRng(seed+index),context).main[0];if(offer.entityId===key)return {...offer,id,creationOrdinal:1};}
 throw Error('Missing generated Joker '+key);
}
function fixture(key){let s=createRun('EFFECTUI',{runId:'effect-ui',referenceRng:true,referenceShop:true,reducedMotion:true,money:100n});s=dispatch(s,{type:'START_BLIND',expectedRevision:0}).state;s.consumables=[spectral(key,0),spectral('c_aura',1)];s.hand=['card_hearts_2','card_clubs_2','card_spades_4','card_diamonds_6','card_hearts_8','card_clubs_10','card_spades_12','card_diamonds_14'];s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));return s;}
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
async function install(page,s){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(s));await page.reload();await enterRun(page,{startBlind:false});}
async function tap(locator,touch){if(touch)await locator.tap();else await locator.click();}
async function use(page,id,touch){const revision=(await saved(page)).revision;await tap(page.locator('#hand [data-card-id=card_hearts_2]'),touch);await tap(page.locator(`[data-kind=consumable][data-offer-id=${id}] .shop-card`),touch);const use=page.locator(`[data-offer-id=${id}] .shop-use`);assert.equal(await use.isEnabled(),true);await tap(use,touch);await page.waitForFunction(r=>JSON.parse(localStorage.getItem('card-cascade.current')).state.revision>r,revision);await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);assert.equal((await saved(page)).revision,revision+1);}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 for(const [width,height,touch] of [[1536,688,false],[915,412,true]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [key,seal] of Object.entries(seals)){
   await install(page,fixture(key));await use(page,'effect_0',touch);await use(page,'effect_1',touch);let s=await saved(page),card=s.cards.card_hearts_2;assert.equal(card.seal,seal);assert.ok(['foil','holographic','polychrome'].includes(card.edition));const edition=card.edition;
   const node=page.locator('#hand [data-card-id=card_hearts_2]');assert.equal(await node.getAttribute('data-seal'),seal);assert.equal(await node.getAttribute('data-edition'),edition);assert.equal(await node.locator(`.playing-seal[data-seal=${seal}]`).count(),1);
   const snapshot=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),snapshot);
   await tap(page.locator('#deck'),touch);const deckCard=page.locator('.deck-card[data-card-id=card_hearts_2] .playing-card');assert.equal(await deckCard.getAttribute('data-edition'),edition);assert.equal(await deckCard.locator(`.playing-seal[data-seal=${seal}]`).count(),1);await tap(page.locator('#dialog-actions button'),touch);
   const before=await saved(page);await tap(page.locator('#hand [data-card-id=card_hearts_2]'),touch);await tap(page.locator('#play_hand'),touch);await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);s=await saved(page);assert.equal(s.revision,before.revision+1);assert.equal(s.cards.card_hearts_2.seal,seal);assert.equal(s.cards.card_hearts_2.edition,edition);assert.equal(s.lastScore.trace.filter(e=>e.type==='score_repeat').length,seal==='red'?1:0);assert.equal(s.money,before.money+(seal==='gold'?3n:0n));
   const committed=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.evaluate(()=>{document.getElementById('play_hand').click();});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),committed);await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),committed);await page.screenshot({path:`artifacts/effect-mechanisms-${width}-${seal}.png`});
  }
  // The tenth hand commits removal before its final repeat animates.
  await page.emulateMedia({reducedMotion:'no-preference'});const expired=fixture('c_deja_vu');expired.consumables=[];
  const selzer={...jokerFor('j_selzer','final_selzer','EFFECTSELZER'),repeatHandsRemaining:1};expired.jokers=[selzer];expired.nextJokerCreationOrdinal=2;
  await install(page,expired);await page.evaluate(()=>{window.finalRepeat=null;new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1&&node.classList.contains('score-repeat')){const anchor=document.querySelector('#shop_owned [data-offer-id=final_selzer]');window.finalRepeat={saved:localStorage.getItem('card-cascade.current'),left:node.style.left,top:node.style.top,source:node.dataset.effectSourceId,anchor:anchor?{left:anchor.style.left,top:anchor.style.top,height:anchor.offsetHeight}:null};}}).observe(document.getElementById('stage'),{childList:true,subtree:true});});
  await tap(page.locator('#hand [data-card-id=card_hearts_2]'),touch);await tap(page.locator('#play_hand'),touch);await page.waitForFunction(()=>window.finalRepeat!==null);const finalRepeat=await page.evaluate(()=>window.finalRepeat),committed=deserializeState(finalRepeat.saved);assert.equal(committed.jokers.length,0);assert.equal(committed.lastScore.trace.filter(e=>e.type==='score_repeat').length,1);assert.equal(finalRepeat.source,'final_selzer');assert.ok(finalRepeat.anchor);assert.equal(parseFloat(finalRepeat.left),parseFloat(finalRepeat.anchor.left)+57.5);assert.equal(parseFloat(finalRepeat.top),parseFloat(finalRepeat.anchor.top)+finalRepeat.anchor.height+4);
  await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);assert.equal(await page.locator('#shop_owned [data-offer-id=final_selzer]').count(),0);await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),finalRepeat.saved);assert.equal(await page.locator('#shop_owned [data-offer-id=final_selzer]').count(),0);assert.equal(await page.locator('.score-repeat').count(),0);
  // DNA's copy participates in held effects in this same score transaction.
  const dnaState=fixture('c_deja_vu');dnaState.consumables=[];dnaState.cards.card_hearts_2.enhancement='steel';dnaState.cards.card_hearts_2.seal='red';
  const dna=jokerFor('j_dna','copy_dna','EFFECTDNA');dnaState.jokers=[dna];dnaState.nextJokerCreationOrdinal=2;dnaState.apkShop.context=currentApkShopContext(dnaState);
  await install(page,dnaState);await page.evaluate(()=>{window.dnaHeldRepeat=null;new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1&&node.classList.contains('score-repeat')&&node.dataset.effectSourceId==='card_created_53'){const anchor=document.querySelector('#hand .playing-card[data-card-id=card_created_53]');window.dnaHeldRepeat={saved:localStorage.getItem('card-cascade.current'),source:node.dataset.sourceId,left:node.style.left,top:node.style.top,anchor:anchor?{left:anchor.style.left,top:anchor.style.top,enhancement:anchor.dataset.enhancement,seal:anchor.dataset.seal}:null};}}).observe(document.getElementById('stage'),{childList:true,subtree:true});});
  await tap(page.locator('#hand [data-card-id=card_hearts_2]'),touch);await tap(page.locator('#play_hand'),touch);await page.waitForFunction(()=>window.dnaHeldRepeat!==null);const dnaRepeat=await page.evaluate(()=>window.dnaHeldRepeat),dnaCommitted=deserializeState(dnaRepeat.saved);assert.equal(dnaRepeat.source,'card_created_53');assert.ok(dnaRepeat.anchor,'DNA copy must be rendered in the held hand before its repeat animates');assert.equal(dnaRepeat.anchor.enhancement,'steel');assert.equal(dnaRepeat.anchor.seal,'red');assert.equal(parseFloat(dnaRepeat.left),parseFloat(dnaRepeat.anchor.left)+57.5);assert.equal(parseFloat(dnaRepeat.top),parseFloat(dnaRepeat.anchor.top)-27);assert.ok(dnaCommitted.lastScore.heldCardIds.includes('card_created_53'));assert.equal(dnaCommitted.lastScore.trace.filter(e=>e.type==='score_repeat'&&e.phase==='held_card'&&e.effectSourceId==='card_created_53').length,1);
  await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),dnaRepeat.saved);assert.equal(await page.locator('#hand [data-card-id=card_created_53]').count(),1);assert.equal(await page.locator('.score-repeat').count(),0);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Spectral seals + Aura independent rendering, normal use, scoring, reload and duplicate action guards on mouse/touch PASS');
}finally{await browser.close();}
