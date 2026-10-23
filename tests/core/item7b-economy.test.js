import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../../src/core/run.js';
import {createApkRng} from '../../src/core/apk-rng.js';
import {generateApkEffectCards,createApkShopContext} from '../../src/core/apk-shop.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {applyItem7EconomyContext,applyItem7SoldJoker} from '../../src/core/joker-item7-economy.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
const j=(key,id=key,extra={})=>({id,entityId:key,originalKey:key,set:'Joker',edition:'base',cost:4n,sellCost:2n,...extra});
const fresh=()=>createRun('ITEM7B-ECONOMY',{runId:'item7b-economy',money:4n,referenceRng:true,referenceShop:true});
// Native used_jokers records physical ownership even when find_joker omits debuffed passives.
test('debuffed Showman remains owned for duplicate exclusion without enabling its passive',()=>{
 const s=fresh();s.jokers=[j('j_ring_master','showman',{debuffed:true})];
 const context=currentApkShopContext(s);
 assert.ok(context.ownedCentreIds.includes('j_ring_master'));
 const ban=catalogue.centres.filter(c=>c.set==='Tarot'&&c.key!=='c_empress').map(c=>c.key);
 context.ownedCentreIds.push('c_empress');context.bannedCentreIds=ban;
 const result=generateApkEffectCards(s.rng.apk,context,{set:'Tarot',count:1,append:'car',instancePrefix:'c'});
 assert.equal(result.cards[0].entityId,'c_strength');
});
test('active Showman bypasses duplicates but never bans or locks',()=>{
 const context=createApkShopContext({ownedCentreIds:['j_ring_master','c_empress'],bannedCentreIds:catalogue.centres.filter(c=>c.set==='Tarot'&&c.key!=='c_empress').map(c=>c.key)});
 assert.equal(generateApkEffectCards(createApkRng('SHOWMAN'),context,{set:'Tarot',count:2,append:'car',instancePrefix:'c'}).cards.map(c=>c.entityId).join(','),'c_empress,c_empress');
 context.bannedCentreIds.push('c_empress');
 assert.equal(generateApkEffectCards(createApkRng('SHOWMAN'),context,{set:'Tarot',count:1,append:'car',instancePrefix:'c'}).cards[0].entityId,'c_strength');
});
test('Invisible strips ephemeral slicing/debuff state only according to native physical copy contract',()=>{
 const s=fresh();s.nextJokerCreationOrdinal=2;s.jokers=[j('j_joker','chosen',{creationOrdinal:1,extraValue:5n,mult:17,gettingSliced:true})];
 applyItem7SoldJoker(s,j('j_invisible','sold',{invisibleRounds:2}),[]);
 assert.equal(s.jokers.length,2);assert.equal(s.jokers[1].extraValue,5n);assert.equal(s.jokers[1].mult,17);
 assert.notEqual(s.jokers[1].creationOrdinal,1);assert.equal(s.jokers[1].gettingSliced,undefined);
});
test('two copying Riff-raff callbacks reserve original available slots before negative editions arrive',()=>{
 const s=fresh();s.jokers=[j('j_blueprint'),j('j_riff_raff'),j('j_joker'),j('j_egg')];
 // Both activations see the initial single spare slot and a reservation from the first callback.
 // High editionRate cannot force Negative; search a deterministic seed with a negative first Joker.
 let chosen;
 for(let i=0;i<2000;i++){
  const rng=createApkRng('RESERVE'+i),out=generateApkEffectCards(rng,currentApkShopContext(s),{set:'Joker',count:1,append:'rif',rarity:0,instancePrefix:'probe',materialize:true});
  if(out.cards[0].edition==='negative'){chosen=rng;break;}
 }
 assert.ok(chosen);s.rng.apk=chosen;
 applyItem7EconomyContext(s,{type:'setting_blind'},[]);
 assert.equal(s.jokers.length,5);assert.equal(s.jokers[4].edition,'negative');
});

test('Invisible chooses the same physical Joker after visual reordering',()=>{
 for(let seed=0;seed<20;seed++){
  const a=fresh();a.rng.apk=createApkRng('INVISIBLE-ORDER'+seed);a.nextJokerCreationOrdinal=4;
  a.jokers=[j('j_joker','old',{creationOrdinal:1}),j('j_egg','new',{creationOrdinal:3})];
  const b=structuredClone(a);b.jokers.reverse();
  for(const s of [a,b])applyItem7SoldJoker(s,j('j_invisible','sold',{invisibleRounds:2}),[]);
  assert.equal(a.jokers.at(-1).entityId,b.jokers.at(-1).entityId);
  assert.deepEqual(a.rng,b.rng);
 }
});

test('Perkeo selects by physical creation order and gives each copy a new identity',()=>{
 for(let seed=0;seed<20;seed++){
  const a=fresh();a.rng.apk=createApkRng('PERKEO-ORDER'+seed);a.nextJokerCreationOrdinal=5;a.jokers=[j('j_perkeo','perkeo',{creationOrdinal:1})];
  a.consumables=[{id:'tarot',entityId:'c_empress',originalKey:'c_empress',set:'Tarot',edition:'base',cost:3n,sellCost:1n,creationOrdinal:2},{id:'planet',entityId:'c_mercury',originalKey:'c_mercury',set:'Planet',edition:'base',cost:3n,sellCost:1n,creationOrdinal:4}];
  const b=structuredClone(a);b.consumables.reverse();
  for(const s of [a,b])applyItem7EconomyContext(s,{type:'ending_shop'},[]);
  assert.equal(a.consumables.at(-1).entityId,b.consumables.at(-1).entityId);
  assert.equal(a.consumables.at(-1).creationOrdinal,5);
  assert.equal(a.consumables.at(-1).edition,'negative');
  assert.deepEqual(a.rng,b.rng);
 }
});

test('unknown or duplicate physical selection order fails before drawing or copying',()=>{
 for(const ordinals of [[undefined,undefined],[1,undefined],[1,1],[1,0]]){
  const s=fresh();s.jokers=ordinals.map((creationOrdinal,i)=>j('j_joker','candidate'+i,creationOrdinal===undefined?{}:{creationOrdinal}));
  const before=structuredClone(s),events=[];
  assert.throws(()=>applyItem7SoldJoker(s,j('j_invisible','sold',{invisibleRounds:2}),events),/creation identit/i);
  assert.deepEqual(s,before);assert.deepEqual(events,[]);
 }
});

test('negative Invisible cannot copy when inventory was already over capacity before sale',()=>{
 const s=fresh();s.jokers=Array.from({length:6},(_,i)=>j('j_joker','j'+i,{creationOrdinal:i+1}));s.nextJokerCreationOrdinal=8;
 const before=structuredClone(s),events=[];
 applyItem7SoldJoker(s,j('j_invisible','sold',{edition:'negative',invisibleRounds:2}),events);
 assert.deepEqual(s,before);assert.deepEqual(events,[]);
});

test('ambiguous Invisible sale rejects the complete reducer transaction atomically',async()=>{
 const {dispatch}=await import('../../src/core/run.js');
 const s=fresh();s.jokers=[j('j_invisible','sold',{invisibleRounds:2}),j('j_joker','first'),j('j_egg','second')];
 const before=structuredClone(s);
 const result=dispatch(s,{type:'SELL_OWNED_CARD',expectedRevision:s.revision,area:'jokers',cardId:'sold'});
 assert.equal(result.error?.code,'INVALID_STATE');assert.equal(result.state,s);assert.deepEqual(result.events,[]);assert.deepEqual(s,before);
});
