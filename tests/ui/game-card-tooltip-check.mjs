import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createRun} from '../../src/core/run.js';
import {serializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
await mkdir('artifacts',{recursive:true});
try{
 for(const [width,height,touch] of [[1536,688,false],[915,412,true],[568,320,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);await enterRun(page);
  const state=createRun('tooltip',{runId:'tooltip',money:100n});state.phase='playing';state.revision=1;state.round.target=10000n;state.hand=Object.keys(state.cards).slice(0,8);state.drawPile=Object.keys(state.cards).filter(id=>!state.hand.includes(id));
  await page.evaluate(value=>localStorage.setItem('card-cascade.current',value),serializeState(state));await page.reload();await enterRun(page);
  const tap=async locator=>touch?locator.tap():locator.click();
  async function adjacent(card,selector){
   await page.locator(selector).waitFor({timeout:3000});
   const c=await card.boundingBox(),t=await page.locator(selector).boundingBox(),stage=await page.locator('#stage').boundingBox(),scale=stage.width/1536;
   assert(t.x>=stage.x-1&&t.y>=stage.y-1&&t.x+t.width<=stage.x+stage.width+1&&t.y+t.height<=stage.y+stage.height+1,'Tooltip stays inside stage');
   const gap=Math.max(c.x-t.x-t.width,t.x-c.x-c.width,c.y-t.y-t.height,t.y-c.y-c.height);
   assert(gap>=-1&&gap<=24*scale+2,`Tooltip is adjacent to its card (${gap})`);
   assert.equal(await page.locator(selector+' button').count(),0,'Descriptions have no close button');
  }
  async function outside(){
   const s=await page.locator('#stage').boundingBox();if(touch)await page.touchscreen.tap(s.x+s.width*.98,s.y+s.height*.96);else await page.mouse.click(s.x+s.width*.98,s.y+s.height*.96);
   assert.equal(await page.locator('[role=tooltip]').count(),0,'Empty-space tap dismisses description');
  }
  const playing=page.locator('#hand .playing-card').first();await playing.waitFor();
  const id=await playing.getAttribute('data-card-id');
  await tap(playing);const fresh=page.locator(`#hand [data-card-id="${id}"]`);
  assert.equal(await fresh.getAttribute('aria-pressed'),'true','Short tap still selects playing card');await adjacent(fresh,'.card-tip');
  if(!touch){await fresh.hover();assert.equal(await page.locator('.card-tip').count(),1,'Hover preserves the tapped description');}
  await tap(fresh);assert.equal(await page.locator('.card-tip').count(),0,'Second tap on same physical card dismisses after redraw');assert.equal(await fresh.getAttribute('aria-pressed'),'false');
  await tap(fresh);await adjacent(fresh,'.card-tip');{const t=await page.locator('.card-tip').boundingBox();if(touch)await page.touchscreen.tap(t.x+t.width/2,t.y+t.height/2);else await page.mouse.click(t.x+t.width/2,t.y+t.height/2);}assert.equal(await page.locator('[role=tooltip]').count(),0,'Tapping description dismisses it');
  await tap(fresh);await outside();
  await page.evaluate(async()=>{
   const {createRun}=await import('/src/core/run.js'),{renderShop}=await import('/src/ui/shop-screen.js');
   const s=createRun('tooltip-shop',{runId:'tooltip-shop',money:100n});s.phase='shop';
   const offer=(id,entityId,set='Joker')=>({id,entityId,originalKey:entityId,set,edition:'base',cost:3n,sellCost:1n});
   s.jokers=[offer('tooltip-owned','j_joker')];s.consumables=[offer('tooltip-consumable','c_fool','Tarot')];
   s.shop={main:[offer('tooltip-main','j_joker')],vouchers:[offer('tooltip-voucher','v_overstock_norm','Voucher')],boosters:[offer('tooltip-booster','p_arcana_normal_1','Booster')],rerollBase:5n,rerollIncrease:0n,freeRerolls:0};
   // Mirror app.render: the playing hand is not interactive beneath the shop.
   for(const id of ['hand','hand_count','play_hand','discard','sort_panel','sort_label','sort_rank','sort_suit'])document.getElementById(id).hidden=true;
   window.tooltipFixture=s;renderShop(s,false);
  });
  for(const kind of ['main','voucher','booster','owned','consumable']){
   const card=page.locator(`[data-kind=${kind}] .shop-card`).first();console.log('Tooltip path',width,kind);await tap(card);await adjacent(card,'.shop-tooltip');
   await tap(card);assert.equal(await page.locator('.shop-tooltip').count(),0,`${kind}: same-card tap dismisses`);
   await tap(card);await adjacent(card,'.shop-tooltip');await outside();
  }
  await page.evaluate(async()=>{const {renderShop}=await import('/src/ui/shop-screen.js');const s=window.tooltipFixture;s.phase='pack';s.packState={sourceEntityId:'p_arcana_normal_1',cards:[{id:'tooltip-pack',entityId:'c_fool',originalKey:'c_fool',set:'Tarot',edition:'base',cost:3n,sellCost:1n}],choicesRemaining:1};renderShop(s,false);});
  const pack=page.locator('#pack_screen .shop-card');await tap(pack);await adjacent(pack,'.shop-tooltip');await outside();
  await tap(pack);await page.screenshot({path:`artifacts/game-card-tooltip-${width}.png`});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({width,height,touch,playingShortTap:true,shopAndPackAdjacent:true,anyNextTapDismisses:true}));await context.close();
 }
}finally{await browser.close();}
