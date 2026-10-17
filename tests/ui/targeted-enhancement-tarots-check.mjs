import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const centre=key=>catalogue.centres.find(card=>card.key===key);
const consumable=key=>{const c=centre(key);return {id:key+'-owned',entityId:key,originalKey:key,set:c.set,edition:'base',cost:3n,sellCost:1n};};
function fixture(key){let state=createRun('ENHANCEUI',{runId:'enhance-ui',money:4n});state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;state.consumables=[consumable(key)];return state;}
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
async function install(page,state){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(state));await page.reload();await enterRun(page,{startBlind:false});await page.locator('#hand .playing-card').first().waitFor();}

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1536,height:688}});page.setDefaultTimeout(6000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const [key,want,label] of [['c_empress','mult','+4 MULT'],['c_heirophant','bonus','+30']]){
  const initial=fixture(key),targets=initial.hand.slice(0,2);initial.cards[targets[0]].enhancement=want==='mult'?'bonus':'mult';await install(page,initial);
  await page.locator(`[data-offer-id=${key}-owned] .shop-card`).click();assert.ok(await page.locator('.shop-use').isDisabled());assert.match(await page.locator('.shop-use').getAttribute('title'),/одну или две/);
  await page.locator('#hand .playing-card').nth(0).click();await page.locator('#hand .playing-card').nth(1).click();await page.locator(`[data-offer-id=${key}-owned] .shop-card`).click();assert.ok(await page.locator('.shop-use').isEnabled());await page.locator('.shop-use').click();
  await page.waitForFunction(id=>!document.querySelector(`[data-offer-id="${id}"]`),key+'-owned');const state=await saved(page);assert.deepEqual(targets.map(id=>state.cards[id].enhancement),[want,want]);assert.equal(state.consumables.length,0);assert.equal(state.lastTarotPlanet,key);
  for(const id of targets){const card=page.locator(`#hand [data-card-id=${id}]`);assert.equal(await card.getAttribute('data-enhancement'),want);assert.equal(await card.evaluate((node,pseudo)=>getComputedStyle(node,pseudo).content,'::after'),`"${label}"`);}
  const savedText=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),savedText);assert.deepEqual(await Promise.all(targets.map(id=>page.locator(`#hand [data-card-id=${id}]`).getAttribute('data-enhancement'))),[want,want]);
 }
 assert.deepEqual(errors,[]);await page.close();console.log('Targeted enhancement Tarot selection, overwrite, visual marker and reload');
}finally{await browser.close();}
