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
