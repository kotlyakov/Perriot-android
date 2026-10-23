import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {canUsePackCard} from '../../src/core/celestial-pack.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
const booster=key=>{const card=catalogue.centres.find(card=>card.key===key);return {id:'arcana-offer',entityId:key,originalKey:key,set:'Booster',edition:'base',cost:BigInt(card.cost),sellCost:BigInt(Math.max(1,Math.floor(card.cost/2)))};};
function fixture(key='p_arcana_normal_1',seed='ARCANA_UI'){
 let state=createRun(seed,{runId:'arcana-ui',money:30n,referenceRng:true,referenceShop:true,reducedMotion:true});
 state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;state.phase='round_won';state.round.score=state.round.target;state=dispatch(state,{type:'CASH_OUT',expectedRevision:state.revision}).state;
 state.shop.boosters=[booster(key)];return state;
}
function strengthFixture(){
 for(let index=0;index<200;index++){
  const shop=fixture('p_arcana_normal_1','ARCANA_UI_'+index),opened=dispatch(shop,{type:'OPEN_BOOSTER',expectedRevision:shop.revision,offerId:'arcana-offer'});
  if(opened.error)throw Error(JSON.stringify(opened.error));
  if(opened.state.packState.cards.some(card=>card.entityId==='c_strength'))return shop;
 }
 throw Error('No seeded Strength fixture');
}
async function install(page,state){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(state));await page.reload();await enterRun(page,{startBlind:false});await page.locator('#shop_screen').waitFor();}
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
async function dragOpen(page,expectOpen=true){
 const box=await page.locator('[data-offer-id=arcana-offer] .shop-card').boundingBox(),stage=await page.locator('#stage').boundingBox(),scale=stage.width/1536;
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(stage.x+850*scale,stage.y+100*scale,{steps:6});await page.locator('#shop_buy_zone[data-available=true]').waitFor();await page.mouse.up();if(expectOpen)await page.locator('#pack_screen').waitFor();
}
const packCard=(page,id)=>page.locator(`[data-offer-id="${id}"] .shop-card`);
const useButton=(page,id)=>page.locator(`[data-offer-id="${id}"] .shop-use`);
async function assertTargetGeometry(page,label){
 await page.waitForFunction(()=>{const box=document.getElementById('stage').getBoundingClientRect();return box.left>=-1&&box.top>=-1&&box.right<=document.documentElement.clientWidth+1&&box.bottom<=document.documentElement.clientHeight+1;});
 // #hand deliberately has no layout box: all cards are positioned on #stage.
 // Check its visibility flag and the actual interactive card surfaces instead.
 assert.equal(await page.locator('#hand').evaluate(node=>node.hidden),false);
 const cards=page.locator('#hand .playing-card'),count=await cards.count();assert.ok(count>0);
 for(let index=0;index<count;index++){
  const card=cards.nth(index);assert.ok(await card.isVisible());assert.ok(await card.isEnabled());
  const box=await card.boundingBox(),viewport=page.viewportSize();assert.ok(box.width>0&&box.height>0);assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width+1&&box.y+box.height<=viewport.height+1);
  assert.ok(await card.evaluate(node=>{const box=node.getBoundingClientRect();return node.contains(document.elementFromPoint(box.x+box.width*.15,box.y+box.height*.5));}),'Target card is covered: '+index+' '+label);
 }
 await page.screenshot({path:'artifacts/arcana-pack-'+label+'.png'});
}
let page;
try{
 page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'reduce'});page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await install(page,strengthFixture());const before=await saved(page);await dragOpen(page);let state=await saved(page);
 assert.equal(state.phase,'pack');assert.equal(state.money,before.money-4n);assert.equal(await page.locator('#shop_screen,#shop_sign').count(),0);assert.equal(await page.locator('#pack_screen [data-kind=pack]').count(),3);assert.equal(await page.locator('#pack_title').innerText(),'НАБОР ТАРО');assert.equal(await page.locator('#hand .playing-card:enabled').count(),state.hand.length);
 for(const id of ['play_hand','discard','hands','discards','round_score','blind_panel'])assert.ok(await page.locator('#'+id).isHidden());
 const strength=state.packState.cards.find(card=>card.entityId==='c_strength');await packCard(page,strength.id).click();assert.ok(await useButton(page,strength.id).isDisabled());
 for(const id of state.hand.slice(0,3))await page.locator(`#hand [data-card-id="${id}"]`).click();assert.ok(await useButton(page,strength.id).isDisabled());
 await page.locator(`#hand [data-card-id="${state.hand[2]}"]`).click();assert.ok(await useButton(page,strength.id).isEnabled());
 const targets=state.hand.slice(0,2),original=state;await useButton(page,strength.id).click();await page.locator('#shop_screen').waitFor();state=await saved(page);
 assert.equal(state.phase,'shop');assert.equal(state.packState,undefined);assert.equal(state.money,before.money-4n);for(const id of targets)assert.equal(state.cards[id].rank,original.cards[id].rank===14?2:original.cards[id].rank+1);
 await page.reload();await enterRun(page,{startBlind:false});await page.locator('#shop_screen').waitFor();assert.equal((await saved(page)).money,state.money);

 const mega=fixture('p_arcana_mega_1');mega.consumables=[{id:'owned-strength',entityId:'c_strength',originalKey:'c_strength',set:'Tarot',edition:'base',cost:3n,sellCost:1n}];await install(page,mega);await dragOpen(page);state=await saved(page);
 // Choose a genuine usable offer and its required hand selection.
 const targetsFor=card=>[[],state.hand.slice(0,1),state.hand.slice(0,2),state.hand.slice(0,3)].find(ids=>canUsePackCard(state,card,ids).available);
 const offered=state.packState.cards.find(card=>targetsFor(card));assert.ok(offered);const ids=targetsFor(offered);await packCard(page,offered.id).click();for(const id of ids)await page.locator(`#hand [data-card-id="${id}"]`).click();await useButton(page,offered.id).click();await page.waitForFunction(()=>document.getElementById('pack_choices')?.textContent==='Выберите 1');state=await saved(page);
 assert.equal(state.packState.choicesRemaining,1);assert.equal(state.packState.cards.length,4);assert.equal(await page.locator('#pack_screen [data-kind=pack]').count(),4);
 const ownedTarget=state.hand[0],rankBefore=state.cards[ownedTarget].rank;await packCard(page,'owned-strength').click();await page.locator(`#hand [data-card-id="${ownedTarget}"]`).click();assert.ok(await useButton(page,'owned-strength').isEnabled());await useButton(page,'owned-strength').click();await page.waitForFunction(()=>!document.querySelector('[data-offer-id=owned-strength]'));state=await saved(page);assert.equal(state.packState.choicesRemaining,1);assert.equal(state.packState.cards.length,4);assert.equal(state.cards[ownedTarget].rank,rankBefore===14?2:rankBefore+1);
 await page.locator('#sort_suit').click();await page.waitForFunction(()=>document.getElementById('sort_suit').classList.contains('sort-active'));assert.equal((await saved(page)).sortMode,'suit');
 const afterFirst=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page,{startBlind:false});await page.locator('#pack_screen').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),afterFirst);await assertTargetGeometry(page,'desktop-mega-reload');
 await page.setViewportSize({width:915,height:412});await assertTargetGeometry(page,'mobile-mega-reload');const mobileCard=(await saved(page)).packState.cards[0];await packCard(page,mobileCard.id).click();assert.ok(await useButton(page,mobileCard.id).isVisible());await page.locator('#hand .playing-card').first().click();assert.equal(await page.locator('#hand .playing-card').first().getAttribute('aria-pressed'),'true');await page.screenshot({path:'artifacts/arcana-pack-mobile-target.png'});await page.setViewportSize({width:1536,height:688});
 state=await saved(page);const money=state.money;await page.locator('#pack_skip').click();await page.locator('#shop_screen').waitFor();assert.equal((await saved(page)).money,money);assert.equal((await saved(page)).phase,'shop');

 // Failed pack purchase and failed target use must leave the durable state intact.
 await install(page,strengthFixture());const oldShop=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.evaluate(()=>{globalThis.realSetItem=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('Arcana save failure');};});await dragOpen(page,false);await page.locator('dialog[open]').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),oldShop);assert.equal(await page.locator('#shop_screen [data-offer-id=arcana-offer]').count(),1);await page.evaluate(()=>Storage.prototype.setItem=globalThis.realSetItem);await page.locator('#dialog-actions button').first().click();await dragOpen(page);
 state=await saved(page);const oldPack=await page.evaluate(()=>localStorage.getItem('card-cascade.current')),failed=state.packState.cards.find(card=>card.entityId==='c_strength');await packCard(page,failed.id).click();await page.locator(`#hand [data-card-id="${state.hand[0]}"]`).click();await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('Arcana target save failure');};});await useButton(page,failed.id).click();await page.locator('dialog[open]').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),oldPack);assert.equal(await page.locator('#pack_screen [data-kind=pack]').count(),3);
 await page.reload();await enterRun(page,{startBlind:false});await page.locator('#pack_screen').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),oldPack);
 await page.screenshot({path:'artifacts/arcana-pack.png'});assert.deepEqual(errors,[]);await page.close();console.log('Arcana drag purchase/target rules, Strength, owned consumable, Mega continuation/sort/reload/skip, purchase/use persistence rollback PASS');
}catch(error){if(page&&!page.isClosed())await page.screenshot({path:'artifacts/arcana-pack-failure.png'}).catch(()=>{});throw error;}finally{await browser.close();}
