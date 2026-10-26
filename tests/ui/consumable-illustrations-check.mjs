import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1536,height:1150},reducedMotion:'reduce'});
 await page.goto(process.env.PREVIEW_URL);
 const coverage=await page.evaluate(async()=>{
  const {CONSUMABLE_ILLUSTRATIONS}=await import('/src/content/consumable-illustrations.js'),{artwork,renderShop}=await import('/src/ui/shop-screen.js'),{cardMarkup}=await import('/src/ui/field.js'),{createRun}=await import('/src/core/run.js');
  const {default:names}=await import('/src/content/shop-names-ru.js');
  const ids=Object.keys(CONSUMABLE_ILLUSTRATIONS),cards=ids.map((id,i)=>({id:'art_'+i,entityId:id,originalKey:id,set:CONSUMABLE_ILLUSTRATIONS[id].set,edition:'base',cost:3n,sellCost:1n}));
  const samples=['c_fool','c_earth','c_soul'].map(id=>cards.find(card=>card.entityId===id));
  const state=createRun('ARTWORK',{runId:'artwork',money:100n,referenceRng:true,referenceShop:true});
  state.consumables=samples;state.consumableSlots=3;state.shop={main:samples,vouchers:[],boosters:[],rerollBase:5n,rerollIncrease:0n,freeRerolls:0};
  const contexts=[];
  for(const phase of ['playing','shop','pack']){state.phase=phase;state.packState={sourceEntityId:'p_arcana_normal_1',cards:samples,choicesRemaining:1};renderShop(state,false);contexts.push({phase,owned:document.querySelectorAll('#shop_owned svg[data-consumable-id]').length,offered:document.querySelectorAll((phase==='pack'?'#pack_screen':'#shop_screen')+' svg[data-consumable-id]').length});}
  document.body.replaceChildren();document.body.style.cssText='margin:0;background:#193d37;color:#f0e5c8;display:block;overflow:auto;font-family:Georgia,serif';
  const style=document.createElement('style');style.textContent='.sheet{padding:24px;display:grid;grid-template-columns:repeat(11,118px);gap:18px}.sample{height:168px;position:relative;background:#f0e5c8;border:1px solid #b88935;border-radius:4px;color:#143d39}.sample .shop-art{inset:0 0 30px;background:none}.sample label{position:absolute;bottom:3px;left:2px;right:2px;font-size:10px;text-align:center}.courts{display:flex;gap:18px;padding:24px}.court{position:relative;width:96px;height:160px;background:#f0e5c8;color:#143d39;border-radius:5px}.court .face{position:absolute;left:13px;top:8px;width:70px;height:124px}.court .corner{display:none}.court label{position:absolute;bottom:4px;font-size:10px;left:5px}';document.head.append(style);
  const sheet=document.createElement('div');sheet.className='sheet';document.body.append(sheet);
  for(const offer of cards){const el=document.createElement('div');el.className='sample';el.append(artwork(offer,'main'));const label=document.createElement('label');label.textContent=names[offer.entityId];el.append(label);sheet.append(el);}
  const courts=document.createElement('div');courts.className='courts';document.body.append(courts);
  for(const suit of ['spades','hearts','clubs','diamonds'])for(const rank of [11,12,13]){const el=document.createElement('div');el.className='court';el.innerHTML=cardMarkup({suit,rank})+`<label>${suit} ${rank}</label>`;courts.append(el);}
  const bounds=[...document.querySelectorAll('[data-engraving]')].map(g=>({id:g.dataset.engraving,...Object.fromEntries(['x','y','width','height'].map(k=>[k,g.getBBox()[k]]))}));
  const courtBounds=[...courts.querySelectorAll('svg')].map(svg=>({id:svg.dataset.court,...Object.fromEntries(['x','y','width','height'].map(k=>[k,svg.getBBox()[k]]))}));
  return {contexts,bounds,courtBounds,count:ids.length,courts:courts.children.length};
 });
 assert.equal(coverage.count,52);assert.equal(coverage.courts,12);
 for(const context of coverage.contexts){assert.equal(context.owned,3);if(context.phase!=='playing')assert.equal(context.offered,3);}
 for(const b of coverage.bounds){assert.ok(b.x>=4&&b.y>=7&&b.x+b.width<=114&&b.y+b.height<=130,`${b.id} out of artwork bounds: ${JSON.stringify(b)}`);}
 for(const b of coverage.courtBounds)assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=70&&b.y+b.height<=124,`${b.id} court artwork bounds`);
 await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/consumable-courts-original-plates.png',fullPage:true});
 console.log('52 unique consumable engravings +12 courts; bounds and shared shop/owned/pack rendering PASS');
}finally{await browser.close();}
