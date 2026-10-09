import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
const centre=key=>catalogue.centres.find(card=>card.key===key);
const booster=(key,id='celestial-pack')=>{const card=centre(key);return {id,entityId:key,originalKey:key,set:'Booster',edition:'base',cost:BigInt(card.cost),sellCost:BigInt(Math.max(1,Math.floor(card.cost/2)))};};
function fixture(key='p_celestial_normal_1'){
 let state=createRun('CELEST_UI',{runId:'celestial-ui',money:30n,referenceRng:true,referenceShop:true,reducedMotion:true});
 state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;state.phase='round_won';state.round.score=state.round.target;state=dispatch(state,{type:'CASH_OUT',expectedRevision:state.revision}).state;
 state.shop.boosters=[booster(key)];return state;
}
async function install(page,state){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(state));await page.reload();await enterRun(page,{startBlind:false});await page.locator('#shop_screen').waitFor();}
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
async function openPack(page){
 const card=page.locator('[data-offer-id="celestial-pack"] .shop-card'),box=await card.boundingBox(),stage=await page.locator('#stage').boundingBox(),scale=stage.width/1536;
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(stage.x+850*scale,stage.y+100*scale,{steps:6});await page.locator('#shop_buy_zone[data-available=true]').waitFor();await page.mouse.up();await page.locator('#pack_screen').waitFor();
}
try{
 const page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'reduce'});page.setDefaultTimeout(7000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await install(page,fixture());const before=await saved(page);await openPack(page);let state=await saved(page);
 assert.equal(state.phase,'pack');assert.equal(state.money,before.money-4n);assert.equal(await page.locator('#shop_screen,#shop_sign').count(),0);assert.equal(await page.locator('#pack_screen [data-kind=pack]').count(),3);assert.match(await page.locator('#pack_title').innerText(),/НЕБЕСНЫЙ НАБОР/);assert.match(await page.locator('#pack_choices').innerText(),/Выберите 1/);
 const cardId=state.packState.cards[0].id;await page.locator(`[data-offer-id="${cardId}"] .shop-card`).click();assert.ok(await page.locator('[data-offer-id="'+cardId+'"] .shop-use').isEnabled());await page.locator('[data-offer-id="'+cardId+'"] .shop-use').click();await page.locator('#shop_screen').waitFor();state=await saved(page);
 assert.equal(state.phase,'shop');assert.equal(Object.hasOwn(state,'packState'),false);assert.equal(state.money,before.money-4n);assert.equal(state.shop.boosters.length,0);assert.ok(Object.values(state.handLevels).some(level=>level>1));
 await page.reload();await enterRun(page,{startBlind:false});await page.locator('#shop_screen').waitFor();assert.equal((await saved(page)).money,before.money-4n);

 await install(page,fixture('p_celestial_mega_1'));await openPack(page);state=await saved(page);const first=state.packState.cards[0].id;await page.locator(`[data-offer-id="${first}"] .shop-card`).click();await page.locator(`[data-offer-id="${first}"] .shop-use`).click();await page.locator('#pack_screen').waitFor();state=await saved(page);assert.equal(state.packState.choicesRemaining,1);assert.equal(await page.locator('#pack_screen [data-kind=pack]').count(),4);
 const afterFirst=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page,{startBlind:false});await page.locator('#pack_screen').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),afterFirst);assert.match(await page.locator('#pack_choices').innerText(),/Выберите 1/);
 const money=state.money,rng=structuredClone(state.rng);await page.locator('#pack_skip').click();await page.locator('#shop_screen').waitFor();state=await saved(page);assert.equal(state.money,money);assert.deepEqual(state.rng,rng);assert.equal(state.phase,'shop');

 await install(page,fixture());const original=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('pack persistence failure');};});
 const pack=page.locator('[data-offer-id="celestial-pack"] .shop-card'),box=await pack.boundingBox(),stage=await page.locator('#stage').boundingBox(),scale=stage.width/1536;await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(stage.x+850*scale,stage.y+100*scale,{steps:6});await page.mouse.up();await page.locator('dialog[open]').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),original);assert.equal(await page.locator('#shop_screen [data-offer-id="celestial-pack"]').count(),1);
 assert.deepEqual(errors,[]);await page.close();console.log('Celestial pack buy/use/reload, Mega continuation/skip and persistence failure');
}finally{await browser.close();}
