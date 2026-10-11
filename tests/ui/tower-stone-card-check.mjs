import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const centre=catalogue.centres.find(card=>card.key==='c_tower');
const tower={id:'tower',entityId:'c_tower',originalKey:'c_tower',set:'Tarot',edition:'base',cost:BigInt(centre.cost),sellCost:1n};
let fixture=createRun('STONE21',{runId:'stone-ui',money:4n,referenceRng:true,referenceShop:true});
fixture=dispatch(fixture,{type:'START_BLIND',expectedRevision:fixture.revision}).state;
fixture.consumables=[tower];
const [target,pair]=fixture.hand;
fixture.cards[target].rank=8;fixture.cards[target].suit='diamonds';
fixture.cards[pair].rank=8;fixture.cards[pair].suit='clubs';
fixture.apkShop.context=currentApkShopContext(fixture);

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1536,height:688}});page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(fixture));await page.reload();await enterRun(page,{startBlind:false});
 await page.locator('[data-offer-id=tower] .shop-card').click();assert.ok(await page.locator('.shop-use').isDisabled());assert.match(await page.locator('.shop-use').getAttribute('title'),/одну карту/);assert.match(await page.locator('#shop_tooltip').innerText(),/\+50/);
 await page.locator(`#hand [data-card-id=${target}]`).click();await page.locator('[data-offer-id=tower] .shop-card').click();assert.ok(await page.locator('.shop-use').isEnabled());await page.locator('.shop-use').click();await page.waitForFunction(()=>!document.querySelector('[data-offer-id=tower]'));
 let stone=page.locator(`#hand [data-card-id=${target}]`);assert.equal(await stone.getAttribute('data-enhancement'),'stone');assert.equal(await stone.getAttribute('aria-label'),'Каменная карта');assert.equal(await stone.locator('.corner').count(),0);assert.equal(await stone.locator('.stone-face').count(),1);assert.equal(await stone.evaluate(node=>getComputedStyle(node,'::after').content),'"+50"');
 const converted=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),converted);
 stone=page.locator(`#hand [data-card-id=${target}]`);const box=await stone.boundingBox();assert.ok(box);await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();const tip=page.locator(`.card-tip[data-card-id=${target}]`);await tip.waitFor();assert.match(await tip.innerText(),/Каменная карта/);assert.match(await tip.innerText(),/\+50/);assert.doesNotMatch(await tip.innerText(),/буб|8/);await page.mouse.up();
 await stone.press('Enter');const paired=page.locator(`#hand [data-card-id=${pair}]`);await paired.press('Enter');assert.equal(await stone.getAttribute('aria-pressed'),'true');assert.equal(await paired.getAttribute('aria-pressed'),'true');await page.locator('#play_hand').click();const pop=page.locator(`.score-pop[data-source-id=${target}][data-operation=add_chips]`);await pop.waitFor();assert.equal(await pop.textContent(),'+50');
 const saved=await page.evaluate(()=>localStorage.getItem('card-cascade.current')),state=deserializeState(saved);assert.equal(state.cards[target].enhancement,'stone');assert.equal(state.lastScore.handId,'high_card');assert.deepEqual(state.lastScore.scoringCardIds,[target,pair]);assert.equal(state.lastScore.chips,63n);assert.equal(state.lastScore.score,63n);
 await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),saved);assert.deepEqual(errors,[]);console.log('Tower target, rankless Stone artwork, +50 scoring and reload PASS');
}finally{await browser.close();}
