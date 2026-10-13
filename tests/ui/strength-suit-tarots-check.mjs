import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const cases={c_strength:{count:2},c_star:{count:3,suit:'diamonds'},c_moon:{count:3,suit:'clubs'},c_sun:{count:3,suit:'hearts'},c_world:{count:3,suit:'spades'}};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'reduce'});page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(process.env.PREVIEW_URL);
 for(const [key,rule] of Object.entries(cases)){
  const state=createRun('SUITUI24',{runId:key,money:4n,reducedMotion:true}),centre=catalogue.centres.find(card=>card.key===key);
  state.phase='playing';state.revision=1;state.hand=['card_hearts_14','card_clubs_13','card_spades_10','card_diamonds_3','card_clubs_5','card_hearts_6','card_spades_7','card_diamonds_8'];state.drawPile=Object.keys(state.cards).filter(id=>!state.hand.includes(id));state.cards[state.hand[0]].enhancement='gold';state.consumables=[{id:'target-tarot',entityId:key,originalKey:key,set:'Tarot',edition:'base',cost:BigInt(centre.cost),sellCost:1n}];
  await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(state));await page.reload();await enterRun(page,{startBlind:false});
  await page.locator('[data-offer-id=target-tarot] .shop-card').click();assert.ok(await page.locator('.shop-use').isDisabled());
  for(const id of state.hand.slice(0,rule.count+1))await page.locator(`#hand [data-card-id=${id}]`).click();await page.locator('[data-offer-id=target-tarot] .shop-card').click();assert.ok(await page.locator('.shop-use').isDisabled());
  await page.locator(`#hand [data-card-id=${state.hand[rule.count]}]`).click();await page.locator('[data-offer-id=target-tarot] .shop-card').click();assert.ok(await page.locator('.shop-use').isEnabled());await page.locator('.shop-use').click();await page.waitForFunction(()=>!document.querySelector('[data-offer-id=target-tarot]'));
  const raw=await page.evaluate(()=>localStorage.getItem('card-cascade.current')),saved=deserializeState(raw);
  for(const id of state.hand.slice(0,rule.count))assert.deepEqual(saved.cards[id],{...state.cards[id],...(rule.suit?{suit:rule.suit}:{rank:state.cards[id].rank===14?2:state.cards[id].rank+1})});
  assert.equal(saved.cards[state.hand[0]].enhancement,'gold');assert.equal(saved.consumableUsage[key].count,1);
  await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),raw);
  const changed=page.locator(`#hand [data-card-id=${state.hand[0]}]`);assert.match(await changed.getAttribute('aria-label'),key==='c_strength'?/^2 /:/^A /);
 }
 assert.deepEqual(errors,[]);console.log('Strength and four suit Tarots: selection limits, UI use, enhancements and reload PASS');
}finally{await browser.close();}
