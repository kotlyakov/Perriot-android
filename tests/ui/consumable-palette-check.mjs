import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:1536,height:688},reducedMotion:'reduce'});
 await page.goto(process.env.PREVIEW_URL);
 const result=await page.evaluate(async()=>{
  const {createRun}=await import('/src/core/run.js'),{renderShop}=await import('/src/ui/shop-screen.js');
  const sets=['Tarot','Planet','Spectral'],ids=['c_fool','c_mercury','c_soul'];
  const cards=sets.map((set,i)=>({id:'palette_'+set,entityId:ids[i],originalKey:ids[i],set,edition:'base',cost:3n,sellCost:1n}));
  const state=createRun('PALETTE',{runId:'palette',money:100n,referenceRng:true,referenceShop:true});
  state.consumables=cards;state.consumableSlots=3;
  function colors(selector){return [...document.querySelectorAll(selector)].map(card=>{
   const style=getComputedStyle(card);return {set:card.dataset.cardSet,ink:getComputedStyle(card.querySelector('.shop-art')).color,border:style.borderColor,paper:style.backgroundColor,filter:style.filter,opacity:style.opacity};
  });}
  const snapshots=[];
  for(const phase of ['playing','shop','pack'])for(const edition of ['base','foil','holographic','polychrome','negative'])for(const busy of [false,true]){
   for(const card of cards)card.edition=edition;
   state.phase=phase;
   state.shop={main:cards,vouchers:[],boosters:['p_arcana_normal_1','p_celestial_normal_1','p_spectral_normal_1'].map((entityId,i)=>({id:'booster_'+i,entityId,originalKey:entityId,set:'Booster',cost:4n,sellCost:2n})),rerollBase:5n,rerollIncrease:0n,freeRerolls:0};
   // Soul remains Spectral when it appears among Tarot pack cards.
   state.packState={sourceEntityId:'p_arcana_normal_1',cards,choicesRemaining:1};
   renderShop(state,busy);
   const owned=colors('#shop_owned .shop-card');
   snapshots.push({phase,edition,busy,owned,offered:phase==='shop'?colors('#shop_screen [data-kind=main] .shop-card'):phase==='pack'?colors('#pack_screen .shop-card'):[],boosters:phase==='shop'?colors('#shop_screen [data-kind=booster] .shop-card'):[]});
  }
  return snapshots;
 });
 for(const snapshot of result){
  for(const group of [snapshot.owned,snapshot.offered,snapshot.boosters]){
   if(!group.length)continue;
   assert.deepEqual(group.map(card=>card.set),['Tarot','Planet','Spectral']);
   assert.equal(new Set(group.map(card=>card.ink)).size,3,`${snapshot.phase}: art inks must distinguish all types`);
   assert.equal(new Set(group.map(card=>card.paper)).size,3,`${snapshot.phase}: card paper must distinguish all types`);
   for(const card of group){assert.equal(card.ink,card.border);assert.equal(card.filter,'none');assert.equal(card.opacity,'1');}
  }
  assert.deepEqual(snapshot.offered.length?snapshot.offered:snapshot.owned,snapshot.owned,'Owned and offered cards share the same type colors');
 }
 for(let i=0;i<result.length;i+=2)assert.deepEqual(result[i].owned,result[i+1].owned,'Input lock preserves card type colors');
 console.log('consumable palette: shop, owned game cards, mixed Arcana pack and boosters retain three distinct inks/papers, including disabled cards');
}finally{await browser.close();}
