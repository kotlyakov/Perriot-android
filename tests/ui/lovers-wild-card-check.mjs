import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const centre=catalogue.centres.find(card=>card.key==='c_lovers');
const lovers={id:'lovers',entityId:'c_lovers',originalKey:'c_lovers',set:'Tarot',edition:'base',cost:BigInt(centre.cost),sellCost:1n};
let fixture=createRun('WILDUI19',{runId:'wild-ui',money:4n,referenceRng:true,referenceShop:true});fixture=dispatch(fixture,{type:'START_BLIND',expectedRevision:fixture.revision}).state;fixture.consumables=[lovers];const [target,other]=fixture.hand;fixture.cards[target].enhancement='bonus';fixture.apkShop.context=currentApkShopContext(fixture);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1536,height:688}});page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(fixture));await page.reload();await enterRun(page,{startBlind:false});
 await page.locator('[data-offer-id=lovers] .shop-card').click();assert.ok(await page.locator('.shop-use').isDisabled());assert.match(await page.locator('.shop-use').getAttribute('title'),/одну карту/);assert.match(await page.locator('#shop_tooltip').innerText(),/любой масти/);
 await page.locator(`#hand [data-card-id=${target}]`).click();await page.locator('[data-offer-id=lovers] .shop-card').click();assert.ok(await page.locator('.shop-use').isEnabled());
 await page.locator(`#hand [data-card-id=${other}]`).click();await page.locator('[data-offer-id=lovers] .shop-card').click();assert.ok(await page.locator('.shop-use').isDisabled());assert.match(await page.locator('.shop-use').getAttribute('title'),/одну карту/);
 await page.locator(`#hand [data-card-id=${other}]`).click();await page.locator('[data-offer-id=lovers] .shop-card').click();await page.locator('.shop-use').click();await page.waitForFunction(()=>!document.querySelector('[data-offer-id=lovers]'));
 let state=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));assert.equal(state.cards[target].enhancement,'wild');assert.deepEqual(state.apkShop.context.enhancementIds,['m_wild']);const card=page.locator(`#hand [data-card-id=${target}]`);assert.equal(await card.getAttribute('data-enhancement'),'wild');assert.equal(await card.evaluate(node=>getComputedStyle(node,'::after').content),'none');assert.ok(await card.locator('[data-wild-symbol]').count()>=3);
 const saved=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),saved);state=deserializeState(saved);assert.equal(state.cards[target].enhancement,'wild');assert.deepEqual(errors,[]);console.log('Lovers exact target, Wild visual marker, shop identity and reload PASS');
}finally{await browser.close();}
