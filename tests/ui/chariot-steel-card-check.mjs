import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const centre=catalogue.centres.find(card=>card.key==='c_chariot');
const chariot={id:'chariot',entityId:'c_chariot',originalKey:'c_chariot',set:'Tarot',edition:'base',cost:BigInt(centre.cost),sellCost:1n};
let fixture=createRun('STEELUI19',{runId:'steel-ui',money:4n,referenceRng:true,referenceShop:true});fixture=dispatch(fixture,{type:'START_BLIND',expectedRevision:fixture.revision}).state;fixture.consumables=[chariot];const [target,played]=fixture.hand;fixture.cards[target].enhancement='bonus';fixture.apkShop.context=currentApkShopContext(fixture);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1536,height:688}});page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(fixture));await page.reload();await enterRun(page,{startBlind:false});
 await page.locator('[data-offer-id=chariot] .shop-card').click();assert.ok(await page.locator('.shop-use').isDisabled());assert.match(await page.locator('.shop-use').getAttribute('title'),/одну карту/);assert.match(await page.locator('#shop_tooltip').innerText(),/остаётся в руке/);
 await page.locator(`#hand [data-card-id=${target}]`).click();await page.locator('[data-offer-id=chariot] .shop-card').click();assert.ok(await page.locator('.shop-use').isEnabled());await page.locator('.shop-use').click();await page.waitForFunction(()=>!document.querySelector('[data-offer-id=chariot]'));
 let steel=page.locator(`#hand [data-card-id=${target}]`);assert.equal(await steel.getAttribute('data-enhancement'),'steel');assert.equal(await steel.evaluate(node=>getComputedStyle(node,'::after').content),'"×1.5 В РУКЕ"');
 const converted=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),converted);
 await page.evaluate(target=>{
  window.steelPopText=null;
  const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof Element&&node.matches(`.score-pop[data-source-id="${target}"][data-operation=multiply_mult]`)){window.steelPopText=node.textContent;observer.disconnect();}});
  observer.observe(document.getElementById('stage'),{childList:true});
 },target);
 await page.locator(`#hand [data-card-id=${played}]`).click();await page.locator('#play_hand').click();await page.waitForFunction(()=>window.steelPopText!==null);assert.equal(await page.evaluate(()=>window.steelPopText),'×1.5');assert.equal(await page.locator('#mult_value').textContent(),'1.5');
 const state=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));assert.deepEqual(state.lastScore.mult,{n:3n,d:2n});assert.equal(state.lastScore.trace.some(event=>event.phase==='held_card'&&event.sourceId===target),true);assert.deepEqual(state.apkShop.context.enhancementIds,['m_steel']);assert.deepEqual(errors,[]);console.log('Chariot target, Steel held score, exact fractional UI and reload PASS');
}finally{await browser.close();}

