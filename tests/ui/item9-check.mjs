import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
await mkdir('artifacts',{recursive:true});
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
async function install(page,state,screen){
 await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(state));
 await page.reload();await enterRun(page,{startBlind:false});await page.locator(screen).waitFor();
}
function shopFixture(){
 let state=createRun('ITEM9_UI',{runId:'item9-ui',money:100n,referenceRng:true,referenceShop:true,reducedMotion:true});
 state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;
 state.phase='round_won';state.round.score=state.round.target;
 state=dispatch(state,{type:'CASH_OUT',expectedRevision:state.revision}).state;
 state.shop.vouchers=[{id:'paint-offer',entityId:'v_paint_brush',originalKey:'v_paint_brush',set:'Voucher',edition:'base',cost:10n,sellCost:5n}];
 return state;
}
async function buyVoucher(page,touch){
 const card=page.locator('[data-offer-id="paint-offer"] .shop-card'),b=await card.boundingBox(),stage=await page.locator('#stage').boundingBox(),scale=stage.width/1536;
 const from={x:b.x+b.width/2,y:b.y+b.height/2},to={x:stage.x+850*scale,y:stage.y+90*scale};
 if(touch){const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[to]});await page.locator('#shop_buy_zone[data-available=true]').waitFor();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
 else {await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:6});await page.locator('#shop_buy_zone[data-available=true]').waitFor();await page.mouse.up();}
 await card.waitFor({state:'detached'});
}
try{
 for(const [width,height,touch] of [[1536,688,false],[915,412,true]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  const shop=shopFixture();await install(page,shop,'#shop_screen');
  await page.locator('[data-offer-id="paint-offer"] .shop-card').dispatchEvent('click',{detail:0});
  assert.match(await page.locator('#shop_tooltip').innerText(),/размер руки на 1/);
  await buyVoucher(page,touch);let state=await saved(page);
  assert.equal(state.money,shop.money-10n);assert.equal(state.round.handSize,9);assert.ok(state.apkShop.context.usedVoucherIds.includes('v_paint_brush'));
  const durable=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.reload();await enterRun(page,{startBlind:false});await page.locator('#shop_screen').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),durable);
  state=createRun('ITEM9_BOSS_UI',{runId:'item9-boss-ui',money:50n,referenceRng:true,referenceShop:true,reducedMotion:true});
  state.apkShop.context.usedVoucherIds=['v_directors_cut'];state.pendingTags=['tag_investment'];
  await install(page,state,'#blind_selection');const reroll=page.locator('#boss_reroll');assert.ok(await reroll.isEnabled());assert.match(await page.locator('#pending_tags').innerText(),/Инвест/);
  await (touch?reroll.tap():reroll.click());await page.waitForFunction(()=>document.querySelector('#boss_reroll')?.disabled);const rerolled=await saved(page);assert.equal(rerolled.money,40n);assert.equal(rerolled.bossRerollUsed,true);
  await page.screenshot({path:`artifacts/item9-blinds-${width}.png`});
  state=createRun('ITEM9_PACK_UI',{runId:'item9-pack-ui',money:30n,referenceRng:true,referenceShop:true,reducedMotion:true});state.apkBlinds.tags.small='tag_charm';
  await install(page,state,'#blind_selection');await (touch?page.locator('#skip_small').tap():page.locator('#skip_small').click());await page.locator('#pack_screen').waitFor();state=await saved(page);assert.equal(state.packState.returnPhase,'blind_selection');assert.equal(state.money,30n);
  await page.reload();await enterRun(page,{startBlind:false});await page.locator('#pack_screen').waitFor();await (touch?page.locator('#pack_skip').tap():page.locator('#pack_skip').click());await page.locator('#blind_selection').waitFor();state=await saved(page);assert.equal(state.phase,'blind_selection');assert.equal(state.round.blindId,'big');assert.equal(state.money,30n);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('item9 voucher drag, boss reroll, pending rewards and free pack resume: PASS');
}finally{await browser.close();}
