import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
const card=(id,key='c_fool',set='Tarot')=>({id,entityId:key,originalKey:key,set,edition:'base',cost:3n,sellCost:1n});
function fixture(previous='c_pluto'){
 let s=createRun('FOOL_UI',{runId:'fool-ui',money:30n,referenceRng:true,referenceShop:true,reducedMotion:true});s.phase='round_won';s.round.score=s.round.target;s=dispatch(s,{type:'CASH_OUT',expectedRevision:s.revision}).state;s.shop.main=[];s.consumables=[card('fool'),card('held','c_hermit')];s.lastTarotPlanet=previous;s.apkShop.context=currentApkShopContext(s);return s;
}
async function install(page,s){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(s));await page.reload();await enterRun(page,{startBlind:false});await page.locator('#shop_screen').waitFor();}
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
async function select(page,touch){const c=page.locator('#shop_owned [data-offer-id="fool"] .shop-card');if(touch)await c.tap();else await c.click();}
try{
 await mkdir('artifacts',{recursive:true});
 for(const [width,height,touch] of [[1536,688,false],[915,412,true]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});page.setDefaultTimeout(7000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await install(page,fixture(null));await select(page,touch);assert.equal(await page.locator('[data-offer-id="fool"] .shop-use').isDisabled(),true);
  await install(page,fixture());const before=await saved(page);await select(page,touch);assert.match(await page.locator('#shop_tooltip').innerText(),/последнюю использованную/);
  if(touch)await page.locator('[data-offer-id="fool"] .shop-use').tap();else await page.locator('[data-offer-id="fool"] .shop-use').evaluate(b=>{b.click();b.click();});
  await page.waitForFunction(()=>!document.querySelector('#shop_owned [data-offer-id="fool"]'));let s=await saved(page);assert.deepEqual(s.consumables.map(c=>c.entityId),['c_hermit','c_pluto']);assert.equal(s.consumableUsage.c_fool.count,1);assert.equal(s.lastTarotPlanet,'c_fool');assert.equal(s.money,before.money);assert.deepEqual(s.handLevels,before.handLevels);assert.deepEqual(s.rng.apk.streams,before.rng.apk.streams);
  await page.reload();await enterRun(page,{startBlind:false});await page.locator('#shop_screen').waitFor();s=await saved(page);assert.equal(s.consumables.length,2);assert.equal(s.consumableUsage.c_fool.count,1);
  const copy=page.locator('#shop_owned [data-offer-id="fool:fool"] .shop-card');if(touch)await copy.tap();else await copy.click();if(touch)await page.locator('[data-offer-id="fool:fool"] .shop-use').tap();else await page.locator('[data-offer-id="fool:fool"] .shop-use').click();await page.waitForFunction(()=>!document.querySelector('[data-offer-id="fool:fool"]'));assert.equal((await saved(page)).handLevels.high_card,2);
  assert.deepEqual(errors,[]);await page.screenshot({path:`artifacts/fool-${width}.png`});await page.close();
 }
 const page=await browser.newPage();page.setDefaultTimeout(7000);await install(page,fixture());const original=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await select(page,false);await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('Fool persistence failure');};});await page.locator('[data-offer-id="fool"] .shop-use').click();await page.locator('dialog[open]').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),original);assert.equal(await page.locator('#shop_owned [data-offer-id="fool"]').count(),1);await page.close();console.log('Fool desktop/touch/full slots/double click/copy/use/reload/write failure PASS');
}finally{await browser.close();}
