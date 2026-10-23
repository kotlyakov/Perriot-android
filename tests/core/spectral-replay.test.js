import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {bossTarget} from '../../src/core/boss-effects.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
const act=(s,type,fields={})=>{const r=dispatch(s,{type,expectedRevision:s.revision,...fields});assert.equal(r.error,null);return r.state;};
const reload=s=>assert.deepEqual(deserializeState(serializeState(s)),s);
const owned=(key,id=key)=>({id,entityId:key,originalKey:key,set:'Spectral',edition:'base',cost:4n,sellCost:2n});
function fresh(keys,boss,jokers=[]){let s=createRun('SPECTRALREPLAY',{runId:'spectralreplay',money:12n,referenceRng:true,referenceShop:true});if(boss){s.round.blindId='boss';const ante=boss.startsWith('bl_final_')?8:5;s.round.ante=ante;s.roundNumber=ante*3;s.apkBlinds.ante=ante;s.apkBlinds.tagContext.ante=ante;s.apkShop.context.ante=ante;s.apkBlinds.bossId=boss;s.apkBlinds.bossesUsed[boss]=1;s.round.target=bossTarget(s);}s.jokers=jokers;s.nextJokerCreationOrdinal=jokers.length+1;s.apkShop.context=currentApkShopContext(s);s=act(s,'START_BLIND');s.consumables=keys.map((key,i)=>owned(key,'owned'+i));s.apkShop.context=currentApkShopContext(s);return s;}
test('owned Spectral transformations retain authenticated save through subsequent play and discard',()=>{
 for(const key of ['c_familiar','c_grim','c_incantation','c_cryptid','c_sigil','c_ouija','c_immolate']){
  let s=fresh([key]);s=act(s,'USE_CONSUMABLE',{cardId:'owned0',targetCardIds:key==='c_cryptid'?[s.hand[0]]:[]});reload(s);
  s=act(s,'PLAY_HAND',{cardIds:s.hand.slice(0,1)});reload(s);if(s.phase==='playing'){s=act(s,'DISCARD',{cardIds:s.hand.slice(0,1)});reload(s);}
 }
});
test('consecutive owned Immolates refill an emptied selecting hand without spending a hand or discard',()=>{
 let s=fresh(['c_immolate','c_immolate']);const hands=s.round.handsRemaining,discards=s.round.discardsRemaining;
 s=act(s,'USE_CONSUMABLE',{cardId:'owned0'});assert.equal(s.hand.length,3);reload(s);
 s=act(s,'USE_CONSUMABLE',{cardId:'owned1'});assert.equal(s.hand.length,8);assert.equal(s.drawPile.length,36);assert.equal(s.round.handsRemaining,hands);assert.equal(s.round.discardsRemaining,discards);reload(s);
 s=act(s,'PLAY_HAND',{cardIds:s.hand.slice(0,1)});reload(s);
});

test('Serpent empty-hand consumable refill uses full initial hand then three after a discard',()=>{
 for(const priorDiscard of [false,true]){let s=fresh(['c_immolate','c_immolate'],'bl_serpent');if(priorDiscard)s=act(s,'DISCARD',{cardIds:[s.hand[0]]});s=act(s,'USE_CONSUMABLE',{cardId:'owned0'});s=act(s,'USE_CONSUMABLE',{cardId:'owned1'});assert.equal(s.hand.length,priorDiscard?3:8);reload(s);}
});
test('exhausting the last held cards with no draw pile settles round loss',()=>{
 let s=fresh(['c_immolate']);const keep=s.hand.slice(0,3),remove=Object.keys(s.cards).filter(id=>!keep.includes(id));s.hand=keep;s.drawPile=[];s.destroyedCardIds=remove;for(const id of remove)delete s.cards[id];s.apkShop.context=currentApkShopContext(s);s=act(s,'USE_CONSUMABLE',{cardId:'owned0'});assert.equal(s.phase,'game_over');assert.equal(s.round.handsRemaining,4);reload(s);
});

test('Heart keeps the disabled Joker through an empty-hand consumable redraw',()=>{
 const jokers=['j_joker','j_greedy_joker'].map((key,i)=>({id:'j'+i,entityId:key,originalKey:key,set:'Joker',edition:'base',cost:4n,sellCost:2n,creationOrdinal:i+1}));let s=fresh(['c_immolate','c_immolate'],'bl_final_heart',jokers);const disabled=s.bossState.heartDebuffedJokerId,stream=s.rng.apk.streams.crimson_heart;s=act(s,'USE_CONSUMABLE',{cardId:'owned0'});s=act(s,'USE_CONSUMABLE',{cardId:'owned1'});assert.equal(s.hand.length,8);assert.equal(s.bossState.heartDebuffedJokerId,disabled);assert.equal(s.rng.apk.streams.crimson_heart,stream);reload(s);
});

test('Bell empty-hand consumable redraw records the accepted revision and a live forced target',()=>{
 let s=fresh(['c_immolate','c_immolate'],'bl_final_bell');s=act(s,'USE_CONSUMABLE',{cardId:'owned0'});s=act(s,'USE_CONSUMABLE',{cardId:'owned1'});assert.equal(s.hand.length,8);assert.equal(s.bossState.bellChoice.revision,s.revision);assert.ok(s.hand.includes(s.bossState.forcedCardId));reload(s);
});
