import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const centre=catalogue.centres.find(card=>card.key==='c_justice');
const justice={id:'justice',entityId:'c_justice',originalKey:'c_justice',set:'Tarot',edition:'base',cost:BigInt(centre.cost),sellCost:1n};
let fixture=createRun('GLASS2',{runId:'glass-ui',money:4n,referenceRng:true,referenceShop:true});
fixture=dispatch(fixture,{type:'START_BLIND',expectedRevision:fixture.revision}).state;
fixture.consumables=[justice];
const [target,pair]=fixture.hand;
fixture.cards[target].rank=8;fixture.cards[target].suit='diamonds';
fixture.cards[pair].rank=8;fixture.cards[pair].suit='clubs';
fixture.apkShop.context=currentApkShopContext(fixture);

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1536,height:688}});page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(fixture));await page.reload();await enterRun(page,{startBlind:false});
 await page.locator('[data-offer-id=justice] .shop-card').click();assert.ok(await page.locator('.shop-use').isDisabled());assert.match(await page.locator('.shop-use').getAttribute('title'),/одну карту/);assert.match(await page.locator('#shop_tooltip').innerText(),/шанс 1 из 4/);
 await page.locator(`#hand [data-card-id=${target}]`).click();await page.locator('[data-offer-id=justice] .shop-card').click();assert.ok(await page.locator('.shop-use').isEnabled());await page.locator('.shop-use').click();await page.waitForFunction(()=>!document.querySelector('[data-offer-id=justice]'));
 let glass=page.locator(`#hand [data-card-id=${target}]`);assert.equal(await glass.getAttribute('data-enhancement'),'glass');assert.equal(await glass.evaluate(node=>getComputedStyle(node,'::after').content),'none');
 const converted=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),converted);
 await page.evaluate(()=>{window.__shattered=[];new MutationObserver(records=>{for(const record of records){const node=record.target;if(node instanceof HTMLElement&&node.classList.contains('shattering'))window.__shattered.push(node.dataset.cardId);}}).observe(document.getElementById('stage'),{subtree:true,attributes:true,attributeFilter:['class']});});
 await page.locator(`#hand [data-card-id=${target}]`).click();await page.locator(`#hand [data-card-id=${pair}]`).click();await page.locator('#play_hand').click();
 const pop=page.locator(`.score-pop[data-source-id=${target}][data-operation=multiply_mult]`);await pop.waitFor();assert.equal(await pop.textContent(),'×2');await page.waitForFunction(id=>window.__shattered.includes(id),target);
 const saved=await page.evaluate(()=>localStorage.getItem('card-cascade.current')),state=deserializeState(saved);
 assert.equal(Object.hasOwn(state.cards,target),false);assert.equal(state.lastScore.glassRolls[0].cardId,target);assert.equal(state.lastScore.glassRolls[0].destroyed,true);assert.equal(state.lastScore.glassDestroyedCards[0].id,target);assert.equal(Object.keys(state.cards).length,51);assert.equal(await page.locator('#deck_count').textContent(),'42/51');
 await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),saved);assert.equal(await page.locator(`#hand [data-card-id=${target}]`).count(),0);assert.deepEqual(errors,[]);console.log('Justice target, Glass ×2, keyed shatter, draw replacement and reload PASS');
}finally{await browser.close();}
