import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun} from '../../src/core/run.js';
import {nextApkRandom} from '../../src/core/apk-rng.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const centre=catalogue.centres.find(card=>card.key==='c_wheel_of_fortune');
function fixture(){for(let i=0;i<1000;i++){const state=createRun('WHEELUI'+i,{runId:'wheel-ui',money:4n,referenceRng:true,referenceShop:true,reducedMotion:true});if(nextApkRandom(state.rng.apk,'wheel_of_fortune').value>=.25)continue;state.consumables=[{id:'wheel',entityId:centre.key,originalKey:centre.key,set:'Tarot',edition:'base',cost:3n,sellCost:1n}];state.jokers=[{id:'newer',entityId:'j_joker',originalKey:'j_joker',set:'Joker',edition:'base',cost:2n,sellCost:1n,creationOrdinal:2},{id:'older',entityId:'j_joker',originalKey:'j_joker',set:'Joker',edition:'base',cost:2n,sellCost:1n,creationOrdinal:1}];state.nextJokerCreationOrdinal=3;return state;}throw new Error('Wheel seed not found');}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'reduce'});page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(fixture()));await page.reload();await enterRun(page,{startBlind:false});
 await page.locator('[data-offer-id=wheel] .shop-card').click();assert.match(await page.locator('#shop_tooltip').innerText(),/Шанс 1 из 4/);assert.ok(await page.locator('[data-offer-id=wheel] .shop-use').isEnabled());await page.locator('[data-offer-id=wheel] .shop-use').evaluate(button=>{button.click();button.click();});await page.waitForFunction(()=>!document.querySelector('[data-offer-id=wheel]'));
 const state=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current'))),changed=state.jokers.filter(card=>card.edition!=='base');assert.equal(changed.length,1);assert.ok(['foil','holographic','polychrome'].includes(changed[0].edition));assert.equal(await page.locator(`[data-offer-id=${changed[0].id}] .shop-card`).getAttribute('data-edition'),changed[0].edition);
 await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.locator(`[data-offer-id=${changed[0].id}] .shop-card`).getAttribute('data-edition'),changed[0].edition);assert.deepEqual(errors,[]);console.log('Wheel use, edition persistence and double-click guard PASS');
}finally{await browser.close();}
