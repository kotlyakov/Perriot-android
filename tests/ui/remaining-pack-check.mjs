import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {displayPlayingCard,describeShopItem} from '../../src/content/shop-display.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
const booster=key=>{const card=catalogue.centres.find(card=>card.key===key);return {id:'remaining-offer',entityId:key,originalKey:key,set:'Booster',edition:'base',cost:BigInt(card.cost),sellCost:BigInt(Math.max(1,Math.floor(card.cost/2)))};};
function fixture(key,seed='REMAINING_UI',{boss=false}={}){
 let state=createRun(seed,{runId:'remaining-ui',money:40n,referenceRng:true,referenceShop:true,reducedMotion:true});
 if(boss){state.round.blindId='boss';state.round.target=600n;}
 state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;state.phase='round_won';state.round.score=state.round.target;state=dispatch(state,{type:'CASH_OUT',expectedRevision:state.revision}).state;
 state.shop.boosters=[booster(key)];return state;
}
function cryptidFixture(){
 for(let index=0;index<300;index++){
  const shop=fixture('p_spectral_mega_1','SPECTRAL_UI_'+index),opened=dispatch(shop,{type:'OPEN_BOOSTER',expectedRevision:shop.revision,offerId:'remaining-offer'});
  if(opened.error)throw Error(JSON.stringify(opened.error));
  if(opened.state.packState.cards.some(card=>card.entityId==='c_cryptid'))return shop;
 }
 throw Error('No seeded Cryptid fixture');
}
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
const durable=page=>page.evaluate(()=>localStorage.getItem('card-cascade.current'));
const packCard=(page,id)=>page.locator(`[data-offer-id="${id}"] .shop-card`);
const useButton=(page,id)=>page.locator(`[data-offer-id="${id}"] .shop-use`);
const tap=(locator,touch)=>touch?locator.tap():locator.click();
async function install(page,state){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(state));await page.reload();await enterRun(page,{startBlind:false});await page.locator('#shop_screen').waitFor();}
async function open(page,touch,expectOpen=true){
 const b=await packCard(page,'remaining-offer').boundingBox(),stage=await page.locator('#stage').boundingBox(),scale=stage.width/1536;
 const from={x:b.x+b.width/2,y:b.y+b.height/2},to={x:stage.x+850*scale,y:stage.y+100*scale};
 if(touch){const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[to]});await page.locator('#shop_buy_zone[data-available=true]').waitFor();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
 else{await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:6});await page.locator('#shop_buy_zone[data-available=true]').waitFor();await page.mouse.up();}
 if(expectOpen)await page.locator('#pack_screen').waitFor();
}
async function reloadPack(page){const text=await durable(page);await page.reload();await enterRun(page,{startBlind:false});await page.locator('#pack_screen').waitFor();assert.equal(await durable(page),text);}
async function failWrites(page){await page.evaluate(()=>{globalThis.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('Pack persistence failure');};});}
async function recoverWrites(page){await page.evaluate(()=>Storage.prototype.setItem=globalThis.originalSetItem);await page.locator('#dialog-actions button').first().click();}
async function targetGeometry(page){
 // #hand is a zero-size container; check its flag and actual card surfaces.
 assert.equal(await page.locator('#hand').evaluate(node=>node.hidden),false);
 const cards=page.locator('#hand .playing-card');assert.ok(await cards.count()>0);
 for(let index=0;index<await cards.count();index++){
  const card=cards.nth(index);assert.ok(await card.isVisible());assert.ok(await card.isEnabled());
  const box=await card.boundingBox(),viewport=page.viewportSize();assert.ok(box.width>0&&box.height>0&&box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width+1&&box.y+box.height<=viewport.height+1);
  assert.ok(await card.evaluate(node=>{const b=node.getBoundingClientRect();return node.contains(document.elementFromPoint(b.x+b.width*.15,b.y+b.height*.5));}),'Spectral target is covered');
 }
}
let page;
try{
 const spectral=cryptidFixture();
 for(const touch of [false,true]){
  page=await browser.newPage({viewport:touch?{width:915,height:412}:{width:1536,height:688},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});page.setDefaultTimeout(10000);await page.addInitScript(()=>{globalThis.packInputTrace=[];for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture','click','touchstart','touchend'])document.addEventListener(type,event=>{const card=event.target.closest?.('.shop-card,.shop-use'),entry={type,target:event.target.tagName,offer:card?.closest('[data-offer-id]')?.dataset.offerId,disabled:card?.disabled,pressed:card?.getAttribute('aria-pressed'),pointer:event.pointerType,detail:event.detail,prevented:event.defaultPrevented};globalThis.packInputTrace.push(entry);if(globalThis.packInputTrace.length>70)globalThis.packInputTrace.shift();queueMicrotask(()=>{entry.afterPressed=card?.getAttribute('aria-pressed');entry.use=card?.closest('.shop-choice')?.querySelector('.shop-use')?.textContent;});},true);});const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const [family,title] of [['standard','СТАНДАРТНЫЙ НАБОР'],['buffoon','ШУТОВСКОЙ НАБОР']]){
   await install(page,fixture(`p_${family}_mega_1`,'REMAINING_UI',{boss:family==='standard'}));const shop=await saved(page);await open(page,touch);let state=await saved(page);
   assert.equal(state.money,shop.money-8n);if(family==='standard')assert.equal(await page.locator('#ante strong').evaluate(node=>node.firstChild.textContent),String(shop.apkShop.context.ante));assert.equal(await page.locator('#pack_title').innerText(),title);assert.equal(await page.locator('#pack_screen [data-kind=pack]').count(),family==='standard'?5:4);assert.ok(await page.locator('#hand').evaluate(node=>node.hidden));
   const before=state,offer=state.packState.cards[0];await tap(packCard(page,offer.id),touch);assert.equal(await useButton(page,offer.id).innerText(),'Взять');assert.ok(await useButton(page,offer.id).isEnabled());
   if(family==='standard'){
    const display=displayPlayingCard(offer);assert.ok(display);assert.equal(await packCard(page,offer.id).getAttribute('aria-label'),describeShopItem(offer).name);assert.equal(await packCard(page,offer.id).locator('.corner').count(),display.enhancement==='stone'?0:2);
    for(const key of ['enhancement','edition','seal'])if(display[key]&&display[key]!=='base')assert.equal(await packCard(page,offer.id).getAttribute('data-'+key),display[key]);
   }
   // Storage failure must not consume the selection or charge twice on retry.
   const text=await durable(page);await failWrites(page);await tap(useButton(page,offer.id),touch);await page.locator('dialog[open]').waitFor();assert.equal(await durable(page),text);assert.equal(await page.locator('#pack_choices').innerText(),'Выберите 2');await recoverWrites(page);
   await tap(packCard(page,offer.id),touch);await tap(useButton(page,offer.id),touch);await page.waitForFunction(()=>document.getElementById('pack_choices')?.textContent==='Выберите 1');state=await saved(page);
   assert.equal(state.money,before.money);assert.deepEqual(state.consumableUsageTotal,before.consumableUsageTotal);
   if(family==='standard'){assert.equal(Object.keys(state.cards).length,Object.keys(before.cards).length+1);const added=Object.values(state.cards).find(card=>!before.cards[card.id]);assert.equal(added.rank,displayPlayingCard(offer).rank);assert.equal(added.suit,displayPlayingCard(offer).suit);}
   else{assert.equal(state.jokers.length,before.jokers.length+1);assert.equal(state.jokers.at(-1).entityId,offer.entityId);}
   assert.equal(await page.locator('#pack_screen [data-kind=pack]').count(),before.packState.cards.length-1);await reloadPack(page);await page.screenshot({path:`artifacts/${family}-mega-${touch?'touch':'mouse'}.png`});
   const afterFirst=await saved(page);
   if(family==='standard'){const second=afterFirst.packState.cards[0];await tap(packCard(page,second.id),touch);await tap(useButton(page,second.id),touch);}else await tap(page.locator('#pack_skip'),touch);
   await page.locator('#shop_screen').waitFor();assert.equal((await saved(page)).money,afterFirst.money);assert.equal((await saved(page)).packState,undefined);
  }
  await install(page,spectral);const shop=await durable(page);await failWrites(page);await open(page,touch,false);await page.locator('dialog[open]').waitFor();assert.equal(await durable(page),shop);await recoverWrites(page);await open(page,touch);let state=await saved(page);
  assert.equal(await page.locator('#pack_title').innerText(),'ПРИЗРАЧНЫЙ НАБОР');await targetGeometry(page);for(const id of ['play_hand','discard','hands','discards','round_score','blind_panel'])assert.ok(await page.locator('#'+id).isHidden());
  const cryptid=state.packState.cards.find(card=>card.entityId==='c_cryptid');await tap(packCard(page,cryptid.id),touch);assert.equal(await useButton(page,cryptid.id).innerText(),'Использовать');assert.ok(await useButton(page,cryptid.id).isDisabled());
  for(const id of state.hand.slice(0,2))await tap(page.locator(`#hand [data-card-id="${id}"]`),touch);assert.ok(await useButton(page,cryptid.id).isDisabled());await tap(page.locator(`#hand [data-card-id="${state.hand[1]}"]`),touch);assert.ok(await useButton(page,cryptid.id).isEnabled());
  const text=await durable(page);await failWrites(page);await tap(useButton(page,cryptid.id),touch);await page.locator('dialog[open]').waitFor();assert.equal(await durable(page),text);await recoverWrites(page);await tap(packCard(page,cryptid.id),touch);await tap(useButton(page,cryptid.id),touch);await page.waitForFunction(()=>document.getElementById('pack_choices')?.textContent==='Выберите 1');const used=await saved(page);
  assert.equal(Object.keys(used.cards).length,Object.keys(state.cards).length+2);assert.equal(used.hand.length,state.hand.length+2);assert.equal(used.consumableUsageTotal.spectral,(state.consumableUsageTotal.spectral??0)+1);await reloadPack(page);await tap(page.locator('#sort_suit'),touch);assert.equal((await saved(page)).sortMode,'suit');await targetGeometry(page);await page.screenshot({path:`artifacts/spectral-target-${touch?'touch':'mouse'}.png`});
  await tap(page.locator('#pack_skip'),touch);await page.locator('#shop_screen').waitFor();state=await saved(page);assert.equal(state.hand.length,0);assert.equal(Object.keys(state.cards).length,Object.keys(used.cards).length);assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Standard/Buffoon take vs Spectral target use, desktop mouse/mobile touch purchase, Mega continuation/reload/skip, visual modifiers and persistence rollback PASS');
}catch(error){if(page&&!page.isClosed())console.log('PACK_INPUT_TRACE',JSON.stringify(await page.evaluate(()=>globalThis.packInputTrace)));if(page&&!page.isClosed())await page.screenshot({path:'artifacts/remaining-pack-failure.png'}).catch(()=>{});throw error;}finally{await browser.close();}
