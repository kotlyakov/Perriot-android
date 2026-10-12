import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun} from '../../src/core/run.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const centre=catalogue.centres.find(card=>card.key==='c_devil');
const devil={id:'devil',entityId:'c_devil',originalKey:'c_devil',set:'Tarot',edition:'base',cost:BigInt(centre.cost),sellCost:1n};
const fixture=createRun('GOLDUI22',{runId:'gold-ui',money:4n,referenceRng:true,referenceShop:true,reducedMotion:true});
fixture.phase='playing';fixture.revision=1;fixture.round.target=1n;fixture.round.handsRemaining=2;
fixture.hand=['card_hearts_10','card_hearts_11','card_hearts_12','card_hearts_13','card_hearts_14','card_clubs_2','card_diamonds_3','card_spades_4'];
fixture.drawPile=Object.keys(fixture.cards).filter(id=>!fixture.hand.includes(id));fixture.consumables=[devil];fixture.apkShop.context=currentApkShopContext(fixture);

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'reduce'});page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(fixture));await page.reload();await enterRun(page,{startBlind:false});
 const target='card_clubs_2';await page.locator('[data-offer-id=devil] .shop-card').click();assert.match(await page.locator('#shop_tooltip').innerText(),/\$3/);assert.ok(await page.locator('.shop-use').isDisabled());
 await page.locator(`#hand [data-card-id=${target}]`).click();await page.locator('[data-offer-id=devil] .shop-card').click();await page.locator('.shop-use').click();await page.waitForFunction(()=>!document.querySelector('[data-offer-id=devil]'));
 const gold=page.locator(`#hand [data-card-id=${target}]`);assert.equal(await gold.getAttribute('data-enhancement'),'gold');assert.equal(await gold.evaluate(node=>getComputedStyle(node,'::after').content),'"$3 В КОНЦЕ"');assert.equal(await gold.getAttribute('aria-label'),'2 трефы');
 const box=await gold.boundingBox();assert.ok(box);await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();const tip=page.locator(`.card-tip[data-card-id=${target}]`);await tip.waitFor();assert.match(await tip.innerText(),/Золотая карта/);assert.match(await tip.innerText(),/\$3/);await page.mouse.up();
 for(const id of fixture.hand.slice(0,5))await page.locator(`#hand [data-card-id=${id}]`).click();await page.locator('#play_hand').click();await page.locator('#cashout').waitFor();
 assert.equal(await page.locator('#money_value').textContent(),'$7');assert.match(await page.locator('#cashout').innerText(),/Обналичить: \$5/);assert.equal(await page.locator('.payout-interest').count(),1);
 const wonText=await page.evaluate(()=>localStorage.getItem('card-cascade.current')),won=deserializeState(wonText);assert.equal(won.phase,'round_won');assert.equal(won.money,7n);assert.equal(won.cards[target].enhancement,'gold');
 await page.reload();await enterRun(page);await page.locator('#cashout').waitFor();assert.equal(await page.locator('#money_value').textContent(),'$7');assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),wonText);
 await page.locator('#cashout').click();await page.locator('#shop_entry').waitFor();const shop=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));assert.equal(shop.money,12n);assert.equal(shop.phase,'shop');assert.deepEqual(errors,[]);
 console.log('Devil target, Gold end-round payout, interest, reload and cashout PASS');
}finally{await browser.close();}
