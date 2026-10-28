import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
await mkdir('artifacts/inventory-layout',{recursive:true});
try{
 for(const [width,height] of [[1536,688],[915,412],[568,320]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'});await page.goto(process.env.PREVIEW_URL);
  await page.evaluate(async()=>{
   const [{createRun,dispatch},{renderShop},{default:catalogue}]=await Promise.all([import('/src/core/run.js'),import('/src/ui/shop-screen.js'),import('/src/content/apk-shop-catalog.js')]);
   document.getElementById('start_screen')?.remove();document.querySelector('dialog[open]')?.close();
   globalThis.renderInventory=count=>{const s=createRun('layout',{runId:'layout',referenceRng:true,referenceShop:true,money:100n});s.phase='playing';s.jokers=Array.from({length:count},(_,i)=>({id:'owned_'+i,entityId:'j_joker',originalKey:'j_joker',set:'Joker',edition:'base',sellCost:2n}));s.consumables=Array.from({length:2},(_,i)=>({id:'consumable_'+i,entityId:'c_pluto',originalKey:'c_pluto',set:'Planet',edition:'base',sellCost:1n}));globalThis.inventoryState=s;globalThis.inventoryActions=[];renderShop(s,false,{onAction:(...a)=>inventoryActions.push(a)});};
   globalThis.renderVouchers=()=>{let s=createRun('voucher-layout',{runId:'voucher-layout',referenceRng:true,referenceShop:true,money:100n});s.phase='round_won';s.round.score=300n;s.round.handsRemaining=1;s=dispatch(s,{type:'CASH_OUT',expectedRevision:0}).state;s.shop.vouchers=[...new Set(['v_directors_cut','v_observatory','v_recyclomancy','v_reroll_glut',...catalogue.centres.filter(c=>c.set==='Voucher').map(c=>c.key)])].map((key,i)=>({id:'voucher_'+i,entityId:key,originalKey:key,set:'Voucher',edition:'base',cost:10n}));renderShop(s,false);};
   globalThis.renderArcana=()=>{inventoryState.phase='pack';inventoryState.packState={sourceEntityId:'p_arcana_normal_1',choicesRemaining:1,cards:[{id:'pack_sun',entityId:'c_sun',originalKey:'c_sun',set:'Tarot',edition:'base',sellCost:1n}]};renderShop(inventoryState,false);};
  });
  for(const count of [1,2,3,4,5,6,10,30]){
   await page.evaluate(count=>renderInventory(count),count);
   const bounds=await page.evaluate(()=>{const region=document.getElementById('joker_region_inferred').getBoundingClientRect();return [...document.querySelectorAll('#shop_owned [data-kind=owned]')].map(el=>{const b=el.getBoundingClientRect();return b.left>=region.left-.01&&b.right<=region.right+.01;});});
   assert.ok(bounds.every(Boolean),`${width} / ${count}: Joker cards leave their dedicated region`);
   assert.ok(await page.evaluate(()=>{const r=document.getElementById('consumable_region_inferred').getBoundingClientRect();return [...document.querySelectorAll('#shop_owned [data-kind=consumable]')].every(el=>{const b=el.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right&&b.left>=0&&b.right<=innerWidth;});}),'Consumables stay in their own region');
  }
  await page.evaluate(()=>renderInventory(5));await page.screenshot({path:`artifacts/inventory-layout/jokers-${width}.png`});
  for(const touch of [false,true]){
   await page.evaluate(()=>renderInventory(2));let b=await page.locator('#shop_owned [data-kind=owned] .shop-card').first().boundingBox(),stage=await page.locator('#stage').boundingBox(),scale=stage.width/1536;
   const from={x:b.x+b.width/2,y:b.y+b.height/2},to={x:stage.x+980*scale,y:from.y};
   const cdp=touch?await page.context().newCDPSession(page):null;
   const down=async()=>touch?cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:1}]}):(await page.mouse.move(from.x,from.y),await page.mouse.down());
   const move=async pos=>touch?cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...pos,id:1}]}):page.mouse.move(pos.x,pos.y,{steps:6});
   const up=async()=>touch?cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}):page.mouse.up();
   await down();await move(to);await page.waitForTimeout(450);assert.equal(await page.locator('#shop_action_zones').count(),0,'quick drag must never reveal sale zones');await up();
   assert.equal(await page.evaluate(()=>inventoryActions[0]?.[0]),'REORDER_JOKERS');
   await page.evaluate(()=>renderInventory(2));await down();await page.locator('#shop_sell_zone:visible').waitFor();
   const sell=await page.locator('#shop_sell_zone').boundingBox();await move({x:sell.x+sell.width/2,y:sell.y+sell.height/2});if(width===1536&&!touch)await page.screenshot({path:'artifacts/inventory-layout/stationary-hold-sale.png'});await up();
   assert.deepEqual(await page.evaluate(()=>inventoryActions),[['SELL_OWNED_CARD',{area:'jokers',cardId:'owned_0'}]]);assert.equal(await page.locator('#shop_action_zones').count(),0);await cdp?.detach();
  }
  await page.evaluate(()=>renderVouchers());
  const titleGeometry=await page.locator('.ticket-main').evaluateAll(nodes=>nodes.map(main=>{const a=main.querySelector('.shop-art').getBoundingClientRect(),n=main.querySelector('.shop-card-name'),b=n.getBoundingClientRect(),m=main.getBoundingClientRect();return {clear:b.left>=a.right,inside:b.right<=m.right,center:Math.abs((b.left+b.right)/2-(a.right+m.right)/2)<4*(m.width/155),wrap:n.scrollWidth<=n.clientWidth&&n.scrollHeight<=n.clientHeight};}));
  assert.ok(titleGeometry.every(g=>g.clear&&g.inside&&g.center&&g.wrap),'voucher titles must fit centered between art and tearoff: '+JSON.stringify(titleGeometry));
  await page.screenshot({path:`artifacts/inventory-layout/vouchers-${width}.png`});
  await page.evaluate(()=>renderArcana());const skip=await page.locator('#pack_skip').boundingBox(),pack=await page.locator('#pack_screen').boundingBox(),stage=await page.locator('#stage').boundingBox();assert.ok(skip.x>=pack.x&&skip.x+skip.width<=pack.x+pack.width);assert.ok(skip.x+skip.width<stage.x+1210*stage.width/1536);await page.screenshot({path:`artifacts/inventory-layout/arcana-${width}.png`});
  await page.close();console.log(`inventory region/hold-vs-drag mouse+touch/voucher wrap/Arcana skip ${width}x${height} PASS`);
 }
}finally{await browser.close();}
