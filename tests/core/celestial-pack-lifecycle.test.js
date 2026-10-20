import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {bossTarget} from '../../src/core/boss-effects.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';

const centre=key=>catalogue.centres.find(card=>card.key===key);
const offer=(key,id=key)=>{const c=centre(key);return {id,entityId:key,originalKey:key,set:c.set,edition:'base',cost:BigInt(c.cost),sellCost:BigInt(Math.max(1,Math.floor(c.cost/2)))};};
const act=(state,type,fields={})=>dispatch(state,{type,expectedRevision:state.revision,...fields});
const reload=state=>deserializeState(serializeState(state));
function shop(pack='p_celestial_normal_1'){
 let state=createRun('CELEST13',{runId:'celestial13',money:30n,referenceRng:true,referenceShop:true});
 state=act(state,'START_BLIND').state;state.phase='round_won';state.round.score=state.round.target;state=act(state,'CASH_OUT').state;
 state.shop.boosters=[offer(pack,'pack')];return state;
}

test('opening a Celestial pack pays once, preserves the shop, bypasses consumable slots and reloads',()=>{
 const state=shop();state.consumables=[offer('c_pluto','held1'),offer('c_mercury','held2')];const before=structuredClone(state);
 const opened=act(state,'OPEN_BOOSTER',{offerId:'pack'});assert.equal(opened.error,null);assert.equal(opened.state.phase,'pack');assert.equal(opened.state.money,state.money-4n);assert.equal(opened.state.revision,state.revision+1);
 assert.equal(opened.state.shop.boosters.length,0);assert.deepEqual(opened.state.shop.main,state.shop.main);assert.deepEqual(opened.state.consumables,state.consumables);
 assert.equal(opened.state.packState.version,1);assert.equal(opened.state.packState.sourceEntityId,'p_celestial_normal_1');assert.equal(opened.state.packState.cards.length,3);assert.equal(opened.state.packState.choicesRemaining,1);
 assert.ok(opened.state.packState.cards.every(card=>['Planet','Spectral'].includes(card.set)));assert.deepEqual(reload(opened.state),opened.state);assert.deepEqual(state,before);
 assert.equal(dispatch(opened.state,{type:'SKIP_PACK',expectedRevision:state.revision}).error.code,'STALE_ACTION');
});

test('pack selection uses the Planet immediately; Mega keeps exactly two choices across reload',()=>{
 let state=act(shop('p_celestial_mega_1'),'OPEN_BOOSTER',{offerId:'pack'}).state;assert.equal(state.packState.cards.length,5);assert.equal(state.packState.choicesRemaining,2);
 const first=state.packState.cards[0],levels=structuredClone(state.handLevels),money=state.money,rng=structuredClone(state.rng);
 let used=act(state,'USE_PACK_CARD',{cardId:first.id});assert.equal(used.error,null);assert.equal(used.state.phase,'pack');assert.equal(used.state.packState.choicesRemaining,1);assert.equal(used.state.packState.cards.length,4);assert.equal(used.state.money,money);assert.deepEqual(used.state.rng,rng);
 assert.ok(Object.values(used.state.handLevels).some((level,index)=>level!==Object.values(levels)[index]));state=reload(used.state);
 const second=state.packState.cards[0];used=act(state,'USE_PACK_CARD',{cardId:second.id});assert.equal(used.error,null);assert.equal(used.state.phase,'shop');assert.equal(Object.hasOwn(used.state,'packState'),false);assert.equal(used.state.revision,state.revision+1);assert.deepEqual(reload(used.state),used.state);
});

test('skipping a Celestial pack closes it without refund, RNG polling or shop replacement',()=>{
 const opened=act(shop(),'OPEN_BOOSTER',{offerId:'pack'}).state,before=structuredClone(opened),skipped=act(opened,'SKIP_PACK');assert.equal(skipped.error,null);
 assert.equal(skipped.state.phase,'shop');assert.equal(skipped.state.money,opened.money);assert.deepEqual(skipped.state.rng,opened.rng);assert.deepEqual(skipped.state.shop,opened.shop);assert.equal(Object.hasOwn(skipped.state,'packState'),false);assert.deepEqual(opened,before);assert.deepEqual(reload(skipped.state),skipped.state);
});

test('a pack opened from the boss shop retains the next-ante generation context on reload',()=>{
 const state=shop();state.round.blindId='boss';state.round.target=bossTarget(state);state.round.score=state.round.target;state.apkShop.context.ante=2;
 const opened=act(state,'OPEN_BOOSTER',{offerId:'pack'});assert.equal(opened.error,null);assert.equal(opened.state.apkShop.context.ante,2);assert.deepEqual(reload(opened.state),opened.state);
});

test('save rejects impossible Celestial contents and size/choice combinations',()=>{
 const opened=act(shop(),'OPEN_BOOSTER',{offerId:'pack'}).state,raw=JSON.parse(serializeState(opened));
 const unsupported=structuredClone(raw);Object.assign(unsupported.state.packState.cards[0],{entityId:'c_familiar',originalKey:'c_familiar',set:'Spectral'});assert.throws(()=>deserializeState(JSON.stringify(unsupported)),/Invalid save data/);
 const tooMany=structuredClone(raw),copy=structuredClone(tooMany.state.packState.cards[0]);copy.id='forged-fourth';tooMany.state.packState.cards.push(copy);assert.throws(()=>deserializeState(JSON.stringify(tooMany)),/Invalid save data/);
 const mega=act(shop('p_celestial_mega_1'),'OPEN_BOOSTER',{offerId:'pack'}).state,wrongChoice=JSON.parse(serializeState(mega));wrongChoice.state.packState.choicesRemaining=1;assert.throws(()=>deserializeState(JSON.stringify(wrongChoice)),/Invalid save data/);
});

test('unknown packs, bad phases, missing cards and insufficient funds reject atomically',()=>{
 for(const change of [s=>{Object.assign(s.shop.boosters[0],{entityId:'p_unknown_booster',originalKey:'p_unknown_booster'});},s=>{s.money=0n;},s=>{s.phase='playing';}]){const state=shop();change(state);const before=structuredClone(state),result=act(state,'OPEN_BOOSTER',{offerId:'pack'});assert.ok(result.error);assert.equal(result.state,state);assert.deepEqual(state,before);}
 const opened=act(shop(),'OPEN_BOOSTER',{offerId:'pack'}).state;
 for(const action of [{type:'USE_PACK_CARD',cardId:'missing'},{type:'SKIP_PACK',extra:true}]){const before=structuredClone(opened),result=act(opened,action.type,action);assert.ok(result.error);assert.equal(result.state,opened);assert.deepEqual(opened,before);}
});

test('remaining Standard, Buffoon and Spectral families open, pay once, reload and skip',()=>{
 for(const [key,count,hasHand] of [['p_standard_normal_1',3,false],['p_buffoon_normal_1',2,false],['p_spectral_normal_1',2,true]]){
  const s=shop(key),before=structuredClone(s),opened=act(s,'OPEN_BOOSTER',{offerId:'pack'});assert.equal(opened.error,null,key);const n=opened.state;assert.equal(n.money,s.money-4n);assert.equal(n.packState.cards.length,count);assert.equal(n.packState.choicesRemaining,1);assert.equal(n.hand.length,hasHand?s.round.handSize:0);assert.deepEqual(reload(n),n);assert.deepEqual(s,before);
  const skipped=act(n,'SKIP_PACK');assert.equal(skipped.error,null);assert.equal(skipped.state.phase,'shop');assert.equal(skipped.state.hand.length,0);assert.equal(skipped.state.money,n.money);assert.deepEqual(skipped.state.rng,n.rng);assert.deepEqual(reload(skipped.state),skipped.state);
 }
});
