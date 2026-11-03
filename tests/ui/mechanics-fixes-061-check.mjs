import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {bossTarget} from '../../src/core/boss-effects.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
import {dragShopAction} from './shop-actions.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const act=(s,type,fields={})=>{const r=dispatch(s,{type,expectedRevision:s.revision,...fields});assert.ifError(r.error);return r.state;};
const owned=(key,i=1)=>({id:key,entityId:key,originalKey:key,set:key.startsWith('j_')?'Joker':key==='c_ankh'||key==='c_immolate'?'Spectral':'Tarot',edition:'base',cost:4n,sellCost:2n,creationOrdinal:i});
function playing(seed,jokers=[],boss,challengeId){
 let s=createRun(seed,{runId:'ui061-'+seed,money:100n,referenceRng:true,referenceShop:true,challengeId});s.jokers=jokers.map((key,i)=>owned(key,i+1));s.nextJokerCreationOrdinal=jokers.length+1;if(jokers.includes('j_juggler'))s.round.handSize++;
 if(boss){Object.assign(s.round,{ante:2,blindId:'boss'});Object.assign(s.apkBlinds,{ante:2,bossId:boss});s.apkBlinds.bossesUsed[boss]=1;s.apkBlinds.tagContext.ante=2;s.apkShop.context.ante=2;s.round.target=bossTarget(s);}
 return act(s,'START_BLIND');
}
function give(s,key){delete s.effectReplay;s.consumables=[owned(key,s.nextJokerCreationOrdinal++)];s.apkShop.context=currentApkShopContext(s);return s;}
async function install(page,s){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(s));await page.reload();await enterRun(page,{startBlind:false});await page.locator(s.phase==='shop'?'#shop_reroll:enabled':'#sort_rank:enabled').waitFor();}
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
async function use(page,key,ids=[]){const revision=(await saved(page)).revision;for(const id of ids)await page.locator(`#hand [data-card-id="${id}"]`).click();await dragShopAction(page,key,'use',true);await page.waitForFunction(revision=>!!document.querySelector('dialog[open]')||JSON.parse(localStorage.getItem('card-cascade.current')).state.revision>revision,revision);}
const ready=page=>page.waitForFunction(()=>!document.getElementById('sort_rank').disabled&&!document.querySelector('.motion-copy'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true,reducedMotion:'reduce'}),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 // Death, including persistence failure before any successful transformation.
 let s=give(playing('DEATH061'),'c_death'),[left,right]=s.hand.slice(0,2);s.cards[right].permaBonus=25;await install(page,s);
 const durable=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.evaluate(()=>{window.setItem061=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('061 storage failure');};});
 await use(page,'c_death',[left,right]);await page.locator('dialog[open]').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),durable);assert.equal((await saved(page)).cards[left].permaBonus,undefined);
 await page.evaluate(()=>Storage.prototype.setItem=window.setItem061);await page.locator('#dialog-actions button').first().click();await page.locator('dialog').waitFor({state:'hidden'});await use(page,'c_death');await ready(page);assert.equal((await saved(page)).cards[left].permaBonus,25);console.log('Death bonus/save failure/retry PASS');
 // Wheel preserves the Egg/Gift Card accumulated sale component.
 s=give(playing('WHEEL3',['j_egg']),'c_wheel_of_fortune');Object.assign(s.jokers[0],{extraValue:20n,cost:4n,sellCost:22n});await install(page,s);await use(page,'c_wheel_of_fortune');await ready(page);assert.equal((await saved(page)).jokers[0].sellCost,23n);console.log('Wheel accumulated sale price PASS');
 // Trading Card must not swallow the Purple seal.
 s=playing('PURPLE061',['j_trading']);const purple=s.hand[0];s.cards[purple].seal='purple';await install(page,s);await page.locator(`#hand [data-card-id="${purple}"]`).click();await page.locator('#discard:enabled').click();await page.waitForFunction(revision=>JSON.parse(localStorage.getItem('card-cascade.current')).state.revision>revision,s.revision);await ready(page);let after=await saved(page);assert.equal(after.consumables.length,1);assert.equal(after.cards[purple],undefined);assert.equal(after.money,s.money+3n);console.log('Purple seal plus Trading Card PASS');
 // A raw hand-size grant must conceal the new face under Mark.
 s=give(playing('CONCEAL060',['j_juggler'],'bl_mark'),'c_ankh');const face=s.drawPile.find(id=>s.cards[id].rank===11),index=s.drawPile.indexOf(face);[s.drawPile[index],s.drawPile[s.drawPile.length-1]]=[s.drawPile.at(-1),s.drawPile[index]];await install(page,s);await use(page,'c_ankh');await ready(page);after=await saved(page);assert.ok(after.bossState.hiddenCardIds.includes(face));assert.ok(await page.locator(`#hand [data-card-id="${face}"]`).evaluate(n=>n.classList.contains('hidden-card')));console.log('Ankh size grant respects Mark PASS');
 // House keeps the replacement starting hand face down after Immolate.
 s=give(playing('IMMOLATE061',[],'bl_house','five_card_draw'),'c_immolate');await install(page,s);await use(page,'c_immolate');await ready(page);after=await saved(page);assert.equal(after.hand.length,5);assert.ok(after.hand.every(id=>after.bossState.hiddenCardIds.includes(id)));assert.equal(await page.locator('#hand .hidden-card').count(),5);console.log('House full Immolate refill PASS');
 // Canonical most-played snapshot remains usable through actual skip controls.
 s=createRun('OXTIE6',{runId:'ui061-ox',money:20n,referenceRng:true,referenceShop:true});Object.assign(s.round,{ante:5,blindId:'boss'});Object.assign(s.apkBlinds,{ante:5,bossId:'bl_wall'});s.apkBlinds.bossesUsed.bl_wall=1;s.apkBlinds.tagContext.ante=5;s.apkShop.context.ante=5;s.round.target=bossTarget(s);s=act(s,'START_BLIND');s.hand=['card_clubs_3','card_clubs_2','card_spades_2','card_hearts_4','card_hearts_6','card_hearts_8','card_hearts_10','card_diamonds_12'];s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));s=act(s,'PLAY_HAND',{cardIds:['card_clubs_3']});s.round.score=s.round.target-1n;s=act(s,'PLAY_HAND',{cardIds:['card_clubs_2','card_spades_2']});s=act(s,'CASH_OUT');await install(page,s);await page.locator('#shop_next_round:enabled').click();await page.locator('#skip_small:enabled').click();await page.locator('#skip_big:enabled').click();await page.locator('#select_boss:enabled').click();await ready(page);after=await saved(page);assert.equal(after.bossState.id,'bl_ox');assert.equal(after.bossState.oxHand,'high_card');await page.reload();await enterRun(page,{startBlind:false});await ready(page);assert.equal((await saved(page)).bossState.oxHand,'high_card');console.log('Ox tie skip/start/reload PASS');
 assert.deepEqual(errors,[]);await page.close();
}finally{await browser.close();}
