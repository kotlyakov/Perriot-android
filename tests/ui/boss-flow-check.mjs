import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';import {serializeState,deserializeState} from '../../src/persistence/save.js';import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
function shop(){let s=createRun('AAAAAAA1',{runId:'boss-ui',money:4n,referenceRng:true,referenceShop:true});s.round.blindId='big';s.phase='round_won';s.round.score=450n;return dispatch(s,{type:'CASH_OUT',expectedRevision:s.revision}).state;}
try{for(const [width,height] of [[1536,688],[915,412],[360,800]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);await enterRun(page);
 await page.evaluate(s=>localStorage.setItem('card-cascade.current',s),serializeState(shop()));await page.reload();await enterRun(page);
 assert.equal(await page.locator('#shop_next_round').isEnabled(),true);await page.locator('#shop_next_round').click();await page.locator('#select_boss').waitFor();assert.equal(await page.locator('#select_boss').isEnabled(),true);assert.equal(await page.locator('.blind-choice-boss .blind-choice-skip').count(),0);
 assert.equal(await page.locator('#select_small').innerText(),'Пройден');assert.equal(await page.locator('#select_big').innerText(),'Пройден');const pending=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));
 await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),pending);await page.locator('#select_boss').click();await page.locator('#hand .playing-card').first().waitFor();
 assert.equal(await page.locator('#blind_title').innerText(),'Окно');assert.equal(await page.locator('#target_value').innerText(),'600');const active=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));assert.equal(active.roundNumber,3);
 for(const id of active.hand){const card=page.locator(`[data-card-id="${id}"]`);assert.equal(await card.evaluate(el=>el.classList.contains('boss-debuffed')),active.cards[id].suit==='diamonds');}
 if(width===1536)await page.screenshot({path:'artifacts/boss-playing.png'});
 await page.reload();await enterRun(page);assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),serializeState(active));assert.deepEqual(errors,[]);await page.close();console.log('boss enter/start/debuff/reload '+width+'x'+height);
 }
 const page=await browser.newPage({reducedMotion:'reduce'});await page.goto(process.env.PREVIEW_URL);await enterRun(page);const s=shop();delete s.apkBlinds.playedCardIds;await page.evaluate(s=>localStorage.setItem('card-cascade.current',s),serializeState(s));await page.reload();await enterRun(page);assert.equal(await page.locator('#shop_next_round').isDisabled(),true);await page.close();console.log('legacy missing history safely gated');
}finally{await browser.close();}
