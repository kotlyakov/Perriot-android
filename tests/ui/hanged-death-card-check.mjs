import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const owned=(id,key)=>{const card=catalogue.centres.find(value=>value.key===key);return {id,entityId:key,originalKey:key,set:'Tarot',edition:'base',cost:BigInt(card.cost),sellCost:1n};};
const fixture=createRun('DECKUI23',{runId:'deck-ui',money:4n,reducedMotion:true});
fixture.phase='playing';fixture.revision=1;fixture.hand=['card_hearts_10','card_hearts_11','card_hearts_12','card_hearts_13','card_hearts_14','card_clubs_2','card_diamonds_3','card_spades_4'];fixture.drawPile=Object.keys(fixture.cards).filter(id=>!fixture.hand.includes(id));fixture.consumables=[owned('hanged','c_hanged_man'),owned('death','c_death')];

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'reduce'});page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(fixture));await page.reload();await enterRun(page,{startBlind:false});
 await page.locator('[data-offer-id=hanged] .shop-card').click();assert.match(await page.locator('#shop_tooltip').innerText(),/Уничтожает до 2/);assert.ok(await page.locator('.shop-use').isDisabled());
 const removed=['card_diamonds_3','card_spades_4'];for(const id of removed)await page.locator(`#hand [data-card-id=${id}]`).click();await page.locator('[data-offer-id=hanged] .shop-card').click();assert.ok(await page.locator('.shop-use').isEnabled());await page.locator('.shop-use').click();await page.waitForFunction(()=>!document.querySelector('[data-offer-id=hanged]'));
 for(const id of removed)assert.equal(await page.locator(`#hand [data-card-id=${id}]`).count(),0);let state=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));assert.equal(Object.keys(state.cards).length,50);assert.equal(state.hand.length,6);assert.deepEqual(state.hangedShortfallCardIds,removed);assert.deepEqual(state.hangedDestroyedCardIds,removed);assert.deepEqual(state.destroyedCardIds,removed);assert.equal(await page.locator('#deck_count').textContent(),'44/50');
 const afterHanged=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),afterHanged);
 const left='card_hearts_10',right='card_clubs_2';await page.locator(`#hand [data-card-id=${right}]`).click();await page.locator(`#hand [data-card-id=${left}]`).click();await page.locator('[data-offer-id=death] .shop-card').click();assert.match(await page.locator('#shop_tooltip').innerText(),/левую.*правой/i);assert.ok(await page.locator('.shop-use').isEnabled());await page.locator('.shop-use').click();await page.waitForFunction(()=>!document.querySelector('[data-offer-id=death]'));
 const copied=page.locator(`#hand [data-card-id=${left}]`);assert.equal(await copied.getAttribute('aria-label'),'2 трефы');state=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));assert.deepEqual(state.cards[left],{id:left,rank:2,suit:'clubs'});assert.deepEqual(state.cards[right],{id:right,rank:2,suit:'clubs'});assert.deepEqual(state.hangedShortfallCardIds,removed);
 const afterDeath=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),afterDeath);assert.equal(await page.locator(`#hand [data-card-id=${left}]`).getAttribute('aria-label'),'2 трефы');assert.deepEqual(errors,[]);console.log('Hanged destruction, short-hand reload, Death visual direction and reload PASS');
}finally{await browser.close();}
