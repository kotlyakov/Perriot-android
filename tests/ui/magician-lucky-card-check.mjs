import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const centre=catalogue.centres.find(card=>card.key==='c_magician');
const magician={id:'magician',entityId:'c_magician',originalKey:'c_magician',set:'Tarot',edition:'base',cost:BigInt(centre.cost),sellCost:1n};
let fixture=createRun('LUCKY0018',{runId:'lucky-ui',money:4n,referenceRng:true,referenceShop:true});fixture=dispatch(fixture,{type:'START_BLIND',expectedRevision:fixture.revision}).state;fixture.consumables=[magician];fixture.apkShop.context=currentApkShopContext(fixture);const target=fixture.hand[0];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1536,height:688}});page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(fixture));await page.reload();await enterRun(page,{startBlind:false});
 await page.locator(`#hand [data-card-id=${target}]`).click();await page.locator('[data-offer-id=magician] .shop-card').click();assert.ok(await page.locator('.shop-use').isEnabled());assert.match(await page.locator('#shop_tooltip').innerText(),/1 из 5/);await page.locator('.shop-use').click();await page.waitForFunction(()=>!document.querySelector('[data-offer-id=magician]'));
 let state=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));assert.equal(state.cards[target].enhancement,'lucky');assert.equal(await page.locator(`#hand [data-card-id=${target}]`).getAttribute('data-enhancement'),'lucky');assert.equal(await page.locator(`#hand [data-card-id=${target}]`).evaluate(node=>getComputedStyle(node,'::after').content),'none');
 await page.locator(`#hand [data-card-id=${target}]`).click();await page.locator('#play_hand').click();await page.locator(`.score-pop.money[data-source-id=${target}]`).waitFor();assert.equal(await page.locator(`.score-pop.money[data-source-id=${target}]`).innerText(),'+$20');await page.waitForFunction(()=>!document.querySelector('.score-pop,.money-pop'));
 state=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));assert.equal(state.money,24n);assert.equal(state.lastScore.mult,21n);assert.equal(state.lastScore.trace.some(event=>event.type==='score_money'&&event.amount===20n),true);assert.equal(state.lastScore.luckyRolls[0].multTriggered,true);assert.equal(state.lastScore.luckyRolls[0].moneyTriggered,true);
 const saved=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),saved);assert.deepEqual(errors,[]);console.log('Magician target, Lucky dual trigger, card money feedback and reload PASS');
}finally{await browser.close();}
