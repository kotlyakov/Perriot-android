import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
const consumable=(id,entityId='c_pluto',set='Planet')=>({id,entityId,originalKey:entityId,set,edition:'base',cost:3n,sellCost:1n});
function fixture({owned=[],offer=true}={}){
 let s=createRun('PLANET_UI',{runId:'planet-ui',money:40n,referenceRng:true,referenceShop:true});s.phase='round_won';s.round.score=s.round.target;s=dispatch(s,{type:'CASH_OUT',expectedRevision:s.revision}).state;
 s.consumables=owned;s.shop.main=offer?[consumable('pluto-offer')]:[];s.apkShop.context=currentApkShopContext(s);return s;
}
async function install(page,s){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(s));await page.reload();await enterRun(page,{startBlind:false});await page.locator('#shop_screen').waitFor();}
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
async function idle(page){await page.waitForFunction(()=>!document.querySelector('.is-dragging,#shop_buy_zone,#shop_sell_zone,.money-pop')&&!document.getElementById('shop_reroll')?.disabled);}
async function drag(page,id,x,y,touch,reason){
 const card=page.locator(`[data-offer-id=${id}] .shop-card`),b=await card.boundingBox(),stage=await page.locator('#stage').boundingBox(),scale=stage.width/1536;
 const from={x:b.x+b.width/2,y:b.y+b.height/2},to={x:stage.x+x*scale,y:stage.y+y*scale};
 if(touch){const session=await page.context().newCDPSession(page);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[to]});await page.locator('.shop-buy-zone').waitFor();assert.equal(await page.locator('.is-dragging .shop-use').count(),0);if(reason)assert.match(await page.locator('.shop-buy-zone').innerText(),reason);await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();}
 else{await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:6});await page.locator('.shop-buy-zone').waitFor();assert.equal(await page.locator('.is-dragging .shop-use').count(),0);if(reason)assert.match(await page.locator('.shop-buy-zone').innerText(),reason);await page.mouse.up();}
 await idle(page);
}
try{
 await mkdir('artifacts',{recursive:true});
 for(const [width,height,touch] of [[1536,688,false],[915,412,true]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch});page.setDefaultTimeout(6000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Owned targetless use must be discoverable before testing purchase routing.
  await install(page,fixture({owned:[consumable('owned-pluto')],offer:false}));await page.locator('[data-offer-id=owned-pluto] .shop-card').click();assert.equal(await page.locator('.shop-use').count(),1);assert.equal(await page.locator('.shop-use').innerText(),'Использовать');assert.equal(await page.locator('#shop_owned .shop-buy').count(),0);
  await page.evaluate(async()=>{const {renderShop}=await import('/src/ui/shop-screen.js'),{deserializeState}=await import('/src/persistence/save.js');renderShop(deserializeState(localStorage.getItem('card-cascade.current')),true);});assert.ok(await page.locator('.shop-use').isDisabled());
  await install(page,fixture());const initial=await saved(page);await page.locator('[data-offer-id=pluto-offer] .shop-card').click();assert.match(await page.locator('#shop_tooltip').innerText(),/Старшая карта/);assert.deepEqual(await page.locator('#shop_tooltip .tooltip-level').evaluate(el=>({text:el.textContent,weight:getComputedStyle(el).fontWeight,color:getComputedStyle(el).color,parentColor:getComputedStyle(el.parentElement).color})),{text:'+1',weight:'800',color:'rgb(38, 62, 62)',parentColor:'rgb(38, 62, 62)'});
  await drag(page,'pluto-offer',1150,90,touch);let s=await saved(page);assert.equal(s.money,initial.money-3n);assert.equal(s.jokers.length,initial.jokers.length);assert.equal(s.consumables.length,1);assert.equal(s.handLevels.high_card,1);
  await page.reload();await enterRun(page,{startBlind:false});await page.locator('[data-offer-id=pluto-offer] .shop-card').click();assert.ok(await page.locator('.shop-use').isEnabled());
  const bounds=await page.locator('.shop-use').boundingBox(),stage=await page.locator('#stage').boundingBox();assert.ok((bounds.y+bounds.height-stage.y)/(stage.width/1536)<=205,'Use control fits above shop');
  if(!touch)await page.screenshot({path:'artifacts/planet-use-desktop.png'});else await page.screenshot({path:'artifacts/planet-use-mobile.png'});
  await page.locator('.shop-use').evaluate(button=>{button.click();button.click();});await page.waitForFunction(()=>!document.querySelector('[data-offer-id=pluto-offer]'));await idle(page);s=await saved(page);assert.equal(s.handLevels.high_card,2);assert.equal(s.consumables.length,0);assert.equal(s.money,initial.money-3n);assert.deepEqual(s.consumableUsage.c_pluto,{count:1,order:9,set:'Planet'});assert.equal(s.consumableUsageTotal.planet,1);assert.equal(s.lastTarotPlanet,'c_pluto');
  const usedText=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page,{startBlind:false});assert.equal((await saved(page)).handLevels.high_card,2);assert.equal(await page.locator('.shop-use').count(),0);assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),usedText);
  await install(page,fixture({owned:[consumable('fool','c_fool','Tarot'),consumable('held')]}));await page.locator('[data-offer-id=fool] .shop-card').click();assert.ok(await page.locator('.shop-use').isDisabled());assert.match(await page.locator('.shop-use').getAttribute('title'),/не реализован/);
  const full=await saved(page);await drag(page,'pluto-offer',1150,90,touch,/Нет места для расходной карты/);assert.equal((await saved(page)).money,full.money);assert.equal((await saved(page)).consumables.length,2);assert.equal(await page.locator('[data-kind=main][data-offer-id=pluto-offer]').count(),1);
  await drag(page,'fool',1450,300,touch);assert.equal((await saved(page)).money,full.money+1n);assert.deepEqual((await saved(page)).consumables.map(c=>c.id),['held']);assert.equal(await page.locator('.shop-use').count(),0);
  await install(page,fixture({owned:[consumable('black-hole','c_black_hole','Spectral')],offer:false}));await page.locator('[data-offer-id=black-hole] .shop-card').click();assert.match(await page.locator('#shop_tooltip').innerText(),/всех 12 комбинаций/);if(touch)await page.locator('.shop-use').tap();else await page.locator('.shop-use').click();await page.waitForFunction(()=>!document.querySelector('[data-offer-id=black-hole]'));await idle(page);s=await saved(page);assert.ok(Object.values(s.handLevels).every(level=>level===2));assert.equal(s.consumableUsageTotal.spectral,1);assert.equal(s.lastTarotPlanet,null);
  assert.deepEqual(errors,[]);await page.close();console.log('Planet buy/store/use/reload/full slots/unsupported/sale and Black Hole '+width);
 }
 const failure=await browser.newPage();failure.setDefaultTimeout(6000);await install(failure,fixture({owned:[consumable('save-pluto')],offer:false}));const original=await failure.evaluate(()=>localStorage.getItem('card-cascade.current'));await failure.locator('[data-offer-id=save-pluto] .shop-card').click();await failure.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('consumable persistence failure');};});await failure.locator('.shop-use').click();await failure.locator('dialog[open]').waitFor();assert.equal(await failure.evaluate(()=>localStorage.getItem('card-cascade.current')),original);assert.equal(await failure.locator('[data-offer-id=save-pluto]').count(),1);assert.equal((await saved(failure)).handLevels.high_card,1);await failure.close();console.log('Failed use persistence preserves card and level');
}finally{await browser.close();}
