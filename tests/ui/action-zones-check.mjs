import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createRun,dispatch} from '../../src/core/run.js';
import {session} from '../../src/core/apk-shop.js';
import {nativeBlindTarget} from '../../src/core/blind-progression.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
import {dragShopAction} from './shop-actions.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});await mkdir('artifacts',{recursive:true});
function fixture(){
 const s=createRun('ZONES',{runId:'zones',money:20n,referenceRng:true,referenceShop:true});s.phase='shop';s.round.score=s.round.target;
 const gen=session(s.rng.apk,currentApkShopContext(s));s.shop={main:[gen.construct('c_mercury','planet-offer')],vouchers:[gen.construct('v_paint_brush','ticket')],boosters:[],rerollBase:5n,rerollIncrease:0n,freeRerolls:0};s.shop.main[0].cost=3n;s.consumables=['c_pluto','c_mars'].map((id,i)=>gen.construct(id,'owned-'+i));s.rng.apk=gen.rng;s.apkShop.context=currentApkShopContext(s);return s;
}
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
async function install(page,state,screen){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(state));await page.reload();await enterRun(page,{startBlind:false});await page.locator(screen).waitFor();}
const idle=page=>page.waitForFunction(()=>!document.getElementById('sort_rank').disabled||!!document.querySelector('#shop_reroll:not(:disabled),#pack_skip:not(:disabled),#select_big:not(:disabled)'));
try{
 for(const [width,height,touch] of [[1536,688,false],[915,412,true],[568,320,true]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'}),errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
  const original=fixture();await install(page,original,'#shop_screen');assert.equal(await page.locator('.ticket-main [data-collection-art-id]').count(),1);
  const before=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));
  await dragShopAction(page,'planet-offer','buy',touch,async()=>{
   const geometry=await page.locator('#shop_action_zones').evaluate(root=>{const b=root.querySelector('#shop_buy_zone').getBoundingClientRect(),s=root.querySelector('#shop_sell_zone').getBoundingClientRect(),u=root.querySelector('#shop_use_zone').getBoundingClientRect();return {square:Math.abs(s.width-s.height)<1,buyAbove:b.bottom<=u.top,sellAbove:s.bottom<=u.top,long:b.width>s.width*3,nowrap:[...root.querySelectorAll('.shop-drop-caption span')].every(n=>n.scrollWidth<=n.clientWidth+1),childButtons:document.querySelectorAll('.shop-choice .shop-use,.shop-choice .shop-buy').length};});
   assert.ok(geometry.square&&geometry.buyAbove&&geometry.sellAbove&&geometry.long&&geometry.nowrap,JSON.stringify(geometry));assert.equal(geometry.childButtons,0);
   await page.screenshot({path:`artifacts/action-zones-${width}.png`});
  });
  assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),before);assert.match(await page.locator('#notice').innerText(),/Нет места для расходной карты/);
  await dragShopAction(page,'planet-offer','use',touch);await page.locator('.shop-choice[data-offer-id=planet-offer]').waitFor({state:'detached'});await idle(page);let state=await saved(page);
  assert.equal(state.money,17n);assert.equal(state.handLevels.pair,original.handLevels.pair+1);assert.deepEqual(state.consumables,original.consumables);
  const money=state.money,sellCost=state.consumables[0].sellCost;await dragShopAction(page,'owned-0','sell',touch);await page.locator('.shop-choice[data-offer-id=owned-0]').waitFor({state:'detached'});await idle(page);state=await saved(page);assert.equal(state.money,money+sellCost);
  await dragShopAction(page,'owned-1','use',touch);await page.locator('.shop-choice[data-offer-id=owned-1]').waitFor({state:'detached'});await idle(page);assert.equal((await saved(page)).consumables.length,0);
  // A full Joker row cannot block a free pack. Selling while it is open permits retry.
  let full=createRun('ZONESTAG',{runId:'zones-tag',money:0n,referenceRng:true,referenceShop:true});full.round.ante=full.apkBlinds.ante=full.apkBlinds.tagContext.ante=2;full.round.target=nativeBlindTarget(2);const g=session(full.rng.apk,currentApkShopContext(full));full.jokers=Array.from({length:5},(_,i)=>g.construct('j_joker','j'+i));full.rng.apk=g.rng;full.apkBlinds.tags.small='tag_buffoon';full.apkShop.context=currentApkShopContext(full);
  await install(page,full,'#blind_selection');await page.locator('#skip_small').click();await page.locator('#pack_screen').waitFor();state=await saved(page);const id=state.packState.cards[0].id;assert.equal(state.money,0n);assert.equal(await page.locator('#pack_skip').innerText(),'Пропустить набор');
  const durable=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await dragShopAction(page,id,'buy',touch);assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),durable);assert.match(await page.locator('#notice').innerText(),/Нет места для Джокера/);
  await dragShopAction(page,'j0','sell',touch);await page.locator('.shop-choice[data-offer-id=j0]').waitFor({state:'detached'});await idle(page);await dragShopAction(page,id,'buy',touch);await idle(page);assert.ok((await saved(page)).jokers.some(j=>j.id===id));
  await (touch?page.locator('#pack_skip').tap():page.locator('#pack_skip').click());await page.locator('#blind_selection').waitFor();assert.equal((await saved(page)).round.blindId,'big');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({width,touch,geometry:true,fullInventoryBuyAndUse:true,sale:true,ownedUse:true,fullPackRetry:true}));await page.close();
 }
}finally{await browser.close();}
