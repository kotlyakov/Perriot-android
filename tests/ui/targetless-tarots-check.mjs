import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
const offer=(key,id='tarot-offer')=>{const c=catalogue.centres.find(card=>card.key===key);return {id,entityId:key,originalKey:key,set:'Tarot',edition:'base',cost:BigInt(c.cost),sellCost:1n};};
function fixture(key,{money=30n,jokers=[]}={}){let state=createRun('TAROT_UI',{runId:'tarot-ui',money,referenceRng:true,referenceShop:true,reducedMotion:true});state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;state.phase='round_won';state.round.score=state.round.target;state=dispatch(state,{type:'CASH_OUT',expectedRevision:state.revision}).state;state.shop.main=[offer(key)];state.jokers=jokers;return state;}
async function install(page,state){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(state));await page.reload();await enterRun(page,{startBlind:false});await page.locator('#shop_screen').waitFor();}
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
async function buyAndUse(page){
 const card=page.locator('[data-offer-id="tarot-offer"] .shop-card'),box=await card.boundingBox(),stage=await page.locator('#stage').boundingBox(),scale=stage.width/1536;
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(stage.x+850*scale,stage.y+100*scale,{steps:6});await page.locator('#shop_buy_zone[data-available=true]').waitFor();await page.mouse.up();await page.waitForFunction(()=>document.querySelector('#shop_owned [data-offer-id="tarot-offer"]')&&!document.getElementById('shop_reroll')?.disabled);await page.locator('#shop_owned [data-offer-id="tarot-offer"] .shop-card').click();await page.locator('[data-offer-id="tarot-offer"] .shop-use').click();await page.waitForFunction(()=>!document.querySelector('[data-offer-id="tarot-offer"]'));
}
try{
 const page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'reduce'});page.setDefaultTimeout(7000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await install(page,fixture('c_hermit',{money:10n}));await page.locator('[data-offer-id="tarot-offer"] .shop-card').click();assert.match(await page.locator('#shop_tooltip').innerText(),/не более \$20/);await buyAndUse(page);let state=await saved(page);assert.equal(state.money,32n);assert.equal(state.consumableUsage.c_hermit.count,1);assert.equal(state.lastTarotPlanet,'c_hermit');
 await page.reload();await enterRun(page,{startBlind:false});await page.locator('#shop_screen').waitFor();assert.equal((await saved(page)).money,32n);
 const jokers=[{id:'joker-1',entityId:'joker_joker',edition:'base',cost:4n,sellCost:2n},{id:'joker-2',entityId:'joker_sly_joker',edition:'base',cost:14n,sellCost:7n}];await install(page,fixture('c_temperance',{jokers}));await page.locator('[data-offer-id="tarot-offer"] .shop-card').click();assert.match(await page.locator('#shop_tooltip').innerText(),/стоимости продажи/);await buyAndUse(page);state=await saved(page);assert.equal(state.money,45n);assert.equal(state.consumableUsage.c_temperance.count,1);assert.equal(state.jokers.length,2);assert.deepEqual(errors,[]);await page.close();console.log('Hermit and Temperance buy/use/money/usage/reload');
}finally{await browser.close();}
