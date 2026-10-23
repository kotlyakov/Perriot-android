import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {generateApkArcanaPack} from '../../src/core/arcana-pack-generation.js';
import {applyItem7EconomyContext} from '../../src/core/joker-item7-economy.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
const act=(s,type,fields={})=>dispatch(s,{type,expectedRevision:s.revision,...fields});
const reload=s=>deserializeState(serializeState(s));
const offer=(key,id=key)=>{const c=catalogue.centres.find(c=>c.key===key);return {id,entityId:key,originalKey:key,set:c.set,edition:'base',cost:BigInt(c.cost),sellCost:BigInt(Math.max(1,Math.floor(c.cost/2)))};};
function shop(pack='p_arcana_normal_1',seed='ARCANA8A'){
 let s=createRun(seed,{runId:'arcana8a',money:50n,referenceRng:true,referenceShop:true});s=act(s,'START_BLIND').state;s.phase='round_won';s.round.score=s.round.target;s=act(s,'CASH_OUT').state;s.shop.boosters=[offer(pack,'pack')];return s;
}
function open(pack,seed){const r=act(shop(pack,seed),'OPEN_BOOSTER',{offerId:'pack'});assert.equal(r.error,null);return r.state;}
function withCard(s,key){s=structuredClone(s);s.packState.cards[0]=offer(key,s.packState.cards[0].id);s.apkShop.context=currentApkShopContext(s);return s;}
test('all eight Arcana identities open: exact generator, draw from deck without shuffle, one payment and reload',()=>{
 for(const c of catalogue.centres.filter(c=>c.set==='Booster'&&c.kind==='Arcana')){
  const s=shop(c.key),before=structuredClone(s),generated=generateApkArcanaPack(s.rng.apk,currentApkShopContext(s),{boosterId:c.key,instancePrefix:'pack_'+(s.revision+1)});
  const r=act(s,'OPEN_BOOSTER',{offerId:'pack'});assert.equal(r.error,null);const n=r.state;
  assert.equal(n.money,s.money-BigInt(c.cost));assert.equal(n.phase,'pack');assert.deepEqual(n.packState.cards,generated.cards);assert.deepEqual(n.rng.apk,generated.rng);
  assert.deepEqual(new Set(n.hand),new Set(s.drawPile.slice(-s.round.handSize)));assert.deepEqual(n.drawPile,s.drawPile.slice(0,-s.round.handSize));
  assert.deepEqual(reload(n),n);assert.deepEqual(s,before);assert.equal(act(n,'OPEN_BOOSTER',{offerId:'pack'}).error.code,'INVALID_PHASE');
 }
});
test('targeted pack Tarot changes selected real playing cards and restores the surviving hand on closure',()=>{
 const s=withCard(open(),'c_empress'),targets=s.hand.slice(0,2),r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id,targetCardIds:targets});assert.equal(r.error,null);
 assert.equal(r.state.phase,'shop');assert.equal(r.state.hand.length,0);for(const id of targets)assert.equal(r.state.cards[id].enhancement,'mult');assert.equal(r.state.consumableUsage.c_empress.count,1);assert.deepEqual(reload(r.state),r.state);
});
test('Mega targeted use retains hand and second choice through reload; skip pays no refund',()=>{
 let s=withCard(open('p_arcana_mega_1'),'c_strength');const target=s.hand[0],rank=s.cards[target].rank,r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id,targetCardIds:[target]});assert.equal(r.error,null);s=r.state;
 assert.equal(s.packState.choicesRemaining,1);assert.equal(s.packState.cards.length,4);assert.equal(s.cards[target].rank,rank===14?2:rank+1);assert.equal(s.hand.length,8);assert.deepEqual(reload(s),s);
 const skipped=act(s,'SKIP_PACK');assert.equal(skipped.error,null);assert.equal(skipped.state.hand.length,0);assert.equal(skipped.state.money,s.money);assert.deepEqual(skipped.state.rng,s.rng);assert.deepEqual(reload(skipped.state),skipped.state);
});
test('pack Hanged Man removes targets permanently, no refill or stale round shortfall, close and reload',()=>{
 const s=withCard(open('p_arcana_mega_1'),'c_hanged_man'),targets=s.hand.slice(0,2),r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id,targetCardIds:targets});assert.equal(r.error,null);assert.equal(r.state.hand.length,6);assert.equal(r.state.hangedShortfallCardIds,undefined);assert.ok(targets.every(id=>!r.state.cards[id]));assert.deepEqual(reload(r.state),r.state);const closed=act(r.state,'SKIP_PACK');assert.equal(closed.error,null);assert.equal(closed.state.drawPile.length,50);assert.deepEqual(reload(closed.state),closed.state);
});
test('invalid targets, insufficient funds and stale actions reject without mutation',()=>{
 const s=open();
 // Use a known targeted card to avoid relying on random contents.
 const targeted=withCard(s,'c_death'),before=structuredClone(targeted),r=act(targeted,'USE_PACK_CARD',{cardId:targeted.packState.cards[0].id,targetCardIds:[targeted.hand[0]]});assert.ok(r.error);assert.deepEqual(targeted,before);
 for(const change of [s=>s.money=0n]){const s=shop();change(s);const before=structuredClone(s),r=act(s,'OPEN_BOOSTER',{offerId:'pack'});assert.ok(r.error);assert.equal(r.state,s);assert.deepEqual(s,before);}
 assert.equal(dispatch(s,{type:'SKIP_PACK',expectedRevision:s.revision-1}).error.code,'STALE_ACTION');
});
test('Omen Arcana opening generates normally and admits a usable Spectral card across reload',()=>{
 const s=shop();s.apkShop.context.usedVoucherIds=['v_omen_globe'];const before=structuredClone(s),generated=generateApkArcanaPack(s.rng.apk,currentApkShopContext(s),{boosterId:'p_arcana_normal_1',instancePrefix:'pack_'+(s.revision+1)});
 const opened=act(s,'OPEN_BOOSTER',{offerId:'pack'});assert.equal(opened.error,null);assert.deepEqual(opened.state.packState.cards,generated.cards);assert.deepEqual(opened.state.rng.apk,generated.rng);assert.equal(opened.state.money,s.money-4n);assert.deepEqual(s,before);assert.deepEqual(reload(opened.state),opened.state);
 const spectral=withCard(opened.state,'c_familiar');assert.deepEqual(reload(spectral),spectral);const used=act(spectral,'USE_PACK_CARD',{cardId:spectral.packState.cards[0].id});assert.equal(used.error,null);assert.equal(Object.keys(used.state.cards).length,Object.keys(spectral.cards).length+2);assert.equal(used.state.consumableUsage.c_familiar.count,1);assert.equal(used.state.phase,'shop');assert.deepEqual(reload(used.state),used.state);
});
test('full owned slots block pack generators without spending choice; other pack Tarots bypass slots',()=>{
 for(const key of ['c_emperor','c_high_priestess','c_fool']){
  let s=withCard(open(),key);s.consumables=[offer('c_pluto','owned1'),offer('c_mercury','owned2')];s.lastTarotPlanet='c_strength';s.apkShop.context=currentApkShopContext(s);const r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id});assert.ok(r.error,key);assert.equal(r.state,s);
 }
 const s=withCard(open(),'c_hermit');s.consumables=[offer('c_pluto','owned1'),offer('c_mercury','owned2')];s.apkShop.context=currentApkShopContext(s);const r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id});assert.equal(r.error,null);assert.equal(r.state.consumables.length,2);
});
test('pack generators create only available slots; owned consumables do not spend pack choices',()=>{
 let s=withCard(open('p_arcana_mega_1'),'c_emperor');s.consumables=[offer('c_hermit','owned')];s.apkShop.context=currentApkShopContext(s);let r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id});assert.equal(r.error,null);assert.equal(r.state.consumables.length,2);assert.deepEqual(reload(r.state),r.state);
 s=withCard(open('p_arcana_mega_1'),'c_empress');s.consumables=[offer('c_hermit','owned')];s.apkShop.context=currentApkShopContext(s);r=act(s,'USE_CONSUMABLE',{cardId:'owned'});assert.equal(r.error,null);assert.equal(r.state.packState.choicesRemaining,2);assert.equal(r.state.phase,'pack');assert.deepEqual(reload(r.state),r.state);
});
test('Arcana target hand reorder/sort works while play and discard stay forbidden',()=>{
 let s=open();const order=[...s.hand].reverse();let r=act(s,'REORDER_HAND',{cardIds:order});assert.equal(r.error,null);assert.deepEqual(r.state.hand,order);s=r.state;r=act(s,'SET_SORT',{mode:'suit'});assert.equal(r.error,null);assert.deepEqual(reload(r.state),r.state);assert.ok(act(s,'PLAY_HAND',{cardIds:s.hand.slice(0,1)}).error);assert.ok(act(s,'DISCARD',{cardIds:s.hand.slice(0,1)}).error);
});
test('save rejects Arcana wrong family, cardinality, missing draw provenance and forged hand',()=>{
 const s=open();for(const change of [x=>x.packState.cards[0]=offer('c_familiar',x.packState.cards[0].id),x=>x.packState.choicesRemaining=2,x=>delete x.packState.handDraw,x=>{x.hand.pop();}]){const n=structuredClone(s);change(n);assert.throws(()=>reload(n),/Invalid save data/);}
});
test('skip returns cards in native prepend order and triggers Red Card exactly once',()=>{
 const s=open();s.jokers=[{...offer('j_red_card','red'),mult:0}];s.apkShop.context=currentApkShopContext(s);const expected=[...[...s.hand].reverse(),...s.drawPile],r=act(s,'SKIP_PACK');assert.equal(r.error,null);assert.deepEqual(r.state.drawPile,expected);assert.equal(r.state.jokers[0].mult,3);assert.deepEqual(reload(r.state),r.state);assert.ok(act(r.state,'SKIP_PACK').error);
});
test('remaining pack centres are excluded from generated Tarot choices',()=>{
 let s=withCard(open('p_arcana_mega_1'),'c_emperor');s.apkShop.context=currentApkShopContext(s);const packKeys=s.packState.cards.map(c=>c.entityId);assert.ok(packKeys.every(key=>s.apkShop.context.usedCentreIds.includes(key)));
 const r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id});assert.equal(r.error,null);assert.equal(r.state.consumables.length,2);assert.ok(r.state.consumables.every(card=>!packKeys.includes(card.entityId)));assert.deepEqual(reload(r.state),r.state);
});
test('Hanged Man notifies Canio and Glass Joker inside pack without a scoring hand',()=>{
 const s=withCard(open('p_arcana_mega_1'),'c_hanged_man'),id=s.hand[0];s.cards[id].rank=12;s.cards[id].enhancement='glass';s.jokers=[{...offer('j_caino','canio'),cainoXMult:1},{...offer('j_glass','glass'),xMult:1}];s.apkShop.context=currentApkShopContext(s);
 const r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id,targetCardIds:[id]});assert.equal(r.error,null);assert.equal(r.state.jokers[0].cainoXMult,2);assert.equal(r.state.jokers[1].xMult,1.75);assert.deepEqual(reload(r.state),r.state);
});
test('owned targeted Tarot can change Arcana hand without spending choices',()=>{
 const s=open('p_arcana_mega_1');s.consumables=[offer('c_empress','owned')];s.apkShop.context=currentApkShopContext(s);const r=act(s,'USE_CONSUMABLE',{cardId:'owned',targetCardIds:[s.hand[0]]});assert.equal(r.error,null);assert.equal(r.state.packState.choicesRemaining,2);assert.equal(r.state.cards[s.hand[0]].enhancement,'mult');assert.deepEqual(reload(r.state),r.state);
});
test('short and empty decks open/close without losing cards or blocking progress',()=>{
 for(const size of [0,1,3]){const s=shop(),all=Object.keys(s.cards),keep=all.slice(0,size);s.destroyedCardIds=all.slice(size);s.cards=Object.fromEntries(keep.map(id=>[id,s.cards[id]]));s.drawPile=keep;s.apkShop.context=currentApkShopContext(s);
  const r=act(s,'OPEN_BOOSTER',{offerId:'pack'});assert.equal(r.error,null);assert.equal(r.state.hand.length,size);assert.deepEqual(reload(r.state),r.state);const skip=act(r.state,'SKIP_PACK');assert.equal(skip.error,null);assert.equal(skip.state.drawPile.length,size);assert.deepEqual(reload(skip.state),skip.state);
 }
});
test('all twenty-two Tarot effects and rare Soul are usable from an Arcana pack',()=>{
 const keys=catalogue.centres.filter(c=>c.set==='Tarot').map(c=>c.key).concat('c_soul');assert.equal(keys.length,23);
 for(const key of keys){
  const s=withCard(open('p_arcana_mega_1'),key);s.lastTarotPlanet='c_pluto';s.jokers=[{...offer('j_joker','base'),creationOrdinal:s.nextJokerCreationOrdinal++}];s.apkShop.context=currentApkShopContext(s);
  const one=['c_lovers','c_chariot','c_justice','c_tower','c_devil'],two=['c_magician','c_empress','c_heirophant','c_hanged_man','c_death','c_strength'],three=['c_star','c_moon','c_sun','c_world'];
  const count=one.includes(key)?1:two.includes(key)?2:three.includes(key)?3:0;
  const r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id,targetCardIds:s.hand.slice(0,count)});assert.equal(r.error,null,key);assert.equal(r.state.packState.choicesRemaining,1);assert.equal(r.state.consumableUsage[key].count,1);assert.deepEqual(reload(r.state),r.state,key);
 }
});
test('prior round Hanged shortfall does not corrupt later pack destruction provenance',()=>{
 let s=createRun('HANGEDPACK',{runId:'hangedpack',money:50n,referenceRng:true,referenceShop:true});s=act(s,'START_BLIND').state;s.consumables=[offer('c_hanged_man','first-hanged')];s.apkShop.context=currentApkShopContext(s);
 s=act(s,'USE_CONSUMABLE',{cardId:'first-hanged',targetCardIds:s.hand.slice(0,1)}).state;s.phase='round_won';s.round.score=s.round.target;s=act(s,'CASH_OUT').state;assert.deepEqual(reload(s),s);
 s.shop.boosters=[offer('p_arcana_mega_1','pack')];s=act(s,'OPEN_BOOSTER',{offerId:'pack'}).state;s=withCard(s,'c_hanged_man');const r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id,targetCardIds:s.hand.slice(0,1)});assert.equal(r.error,null);assert.deepEqual(reload(r.state),r.state);const closed=act(r.state,'SKIP_PACK');assert.equal(closed.error,null);assert.deepEqual(reload(closed.state),closed.state);
});

test('Hallucination creates before Arcana generation and never fires twice',()=>{
 let s;
 for(let i=0;i<30;i++){const candidate=shop('p_arcana_normal_1','HALU8A'+i);candidate.jokers=[{...offer('j_hallucination','hallu'),creationOrdinal:candidate.nextJokerCreationOrdinal++}];candidate.apkShop.context=currentApkShopContext(candidate);const copy=structuredClone(candidate),events=[];applyItem7EconomyContext(copy,{type:'open_booster'},events);if(copy.consumables?.length){s=candidate;break;}}
 assert.ok(s);const expected=structuredClone(s),events=[];applyItem7EconomyContext(expected,{type:'open_booster'},events);const generated=generateApkArcanaPack(expected.rng.apk,currentApkShopContext(expected),{boosterId:'p_arcana_normal_1',instancePrefix:'pack_'+(s.revision+1)});
 const r=act(s,'OPEN_BOOSTER',{offerId:'pack'});assert.equal(r.error,null);assert.deepEqual(r.state.packState.cards,generated.cards);assert.deepEqual(r.state.rng.apk,generated.rng);assert.deepEqual(r.state.consumables,expected.consumables);assert.equal(r.events.filter(e=>e.type==='consumable_created').length,1);assert.ok(!r.state.packState.cards.some(c=>c.entityId===expected.consumables[0].entityId));assert.deepEqual(reload(r.state),r.state);
});
