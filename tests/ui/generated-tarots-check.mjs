import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun} from '../../src/core/run.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const owned=(key,id,edition='base')=>{const card=catalogue.centres.find(c=>c.key===key);return {id,entityId:key,originalKey:key,set:card.set,edition,cost:BigInt(card.cost),sellCost:1n};};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'reduce'});page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);
 for(const [key,set] of [['c_emperor','Tarot'],['c_high_priestess','Planet']])for(const negative of [false,true]){
  const state=createRun('GENERUI25',{runId:key,money:4n,referenceRng:true,referenceShop:true,reducedMotion:true});state.consumables=[owned(key,'creator',negative?'negative':'base')];if(negative)state.consumables.push(owned('c_pluto','held'));state.apkShop.context=currentApkShopContext(state);
  await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(state));await page.reload();await enterRun(page,{startBlind:false});
  await page.locator('[data-offer-id=creator] .shop-card').click();assert.match(await page.locator('#shop_tooltip').innerText(),/Создаёт до 2/);assert.ok(await page.locator('.shop-use').isEnabled());await page.locator('.shop-use').evaluate(button=>{button.click();button.click();});await page.waitForFunction(()=>!document.querySelector('[data-offer-id=creator]'));
  const raw=await page.evaluate(()=>localStorage.getItem('card-cascade.current')),saved=deserializeState(raw);assert.equal(saved.consumables.length,negative?3:2);assert.equal(saved.consumableUsage[key].count,1);assert.equal(saved.consumables.filter(c=>c.id.startsWith('generated:')).length,2);assert.ok(saved.consumables.filter(c=>c.id.startsWith('generated:')).every(c=>c.set===set));
  await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),raw);assert.equal(await page.locator('#shop_owned [data-offer-id]').count(),negative?3:2);
 }
 assert.deepEqual(errors,[]);console.log('Emperor/High Priestess create, double-click, Negative overfill and reload PASS');
}finally{await browser.close();}
