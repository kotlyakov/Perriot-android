import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun} from '../../src/core/run.js';
import {createPlayingCard} from '../../src/core/apk-deck.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
// Test fixture exercises the identity boundary; it enables no generator in the UI.
function fixture(){
 const s=createRun('IDENTITYUI4',{runId:'identity-ui4',money:4n});
 s.phase='playing';s.revision=1;
 s.hand=['card_hearts_10','card_hearts_11','card_hearts_12','card_hearts_13','card_hearts_14','card_clubs_2'];
 s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));
 const a=createPlayingCard(s,s.cards.card_clubs_2,{area:'hand'}),b=createPlayingCard(s,s.cards.card_clubs_2,{area:'hand'});
 s.hand=[a.id,'card_hearts_14',b.id,...s.hand.filter(id=>![a.id,b.id,'card_hearts_14'].includes(id))];
 s.consumables=[{id:'death',entityId:'c_death',originalKey:'c_death',set:'Tarot',sellCost:1n}];return s;
}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 for(const [width,height] of [[1536,688],[915,412]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:width===915,hasTouch:width===915,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.PREVIEW_URL);await page.evaluate(raw=>localStorage.setItem('card-cascade.current',raw),serializeState(fixture()));await page.reload();await enterRun(page,{startBlind:false});
  const a=page.locator('#hand [data-card-id=card_created_53]'),b=page.locator('#hand [data-card-id=card_created_54]');
  assert.equal(await a.getAttribute('aria-label'),'2 трефы');assert.equal(await b.getAttribute('aria-label'),'2 трефы');
  await a.click();assert.equal(await a.getAttribute('aria-pressed'),'true');assert.equal(await b.getAttribute('aria-pressed'),'false');
  await page.locator('#hand [data-card-id=card_hearts_14]').click();await page.locator('[data-offer-id=death] .shop-card').click();await page.locator('.shop-use').click();
  await page.waitForFunction(()=>!document.querySelector('[data-offer-id=death]'));
  let state=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
  assert.deepEqual(state.cards.card_created_53,{id:'card_created_53',rank:14,suit:'hearts',creationOrdinal:53});
  assert.equal(state.cards.card_created_54.rank,2);assert.equal(state.nextPlayingCardOrdinal,55);
  const raw=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),raw);
  assert.equal(await a.getAttribute('aria-label'),'A червы');
  await a.click();await page.locator('#play_hand').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('card-cascade.current')).state.revision===3);
  state=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
  assert.deepEqual(state.lastScore.playedCardIds,['card_created_53']);assert.equal(state.cards.card_created_54.rank,2);
  await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);
  assert.deepEqual(errors,[]);console.log(`Physical copy identity, Death and score reload ${width}x${height} PASS`);await page.close();
 }
}finally{await browser.close();}
