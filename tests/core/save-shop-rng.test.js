import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../../src/core/run.js';
import {createRng} from '../../src/core/rng.js';
import {createApkRng,nextApkRandom} from '../../src/core/apk-rng.js';
import {createShop,applyShopAction} from '../../src/core/shop.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const legacy=()=>createRun('save-shop',{runId:'strict-save-shop',money:4n});
const extended=()=>{
 const state=legacy();state.phase='shop';state.round.score=state.round.target;
 state.bankruptAt=-20n;state.jokerSlots=5;state.money=-4n;
 state.rng.shop=createRng('shop');state.rng.apk=nextApkRandom(nextApkRandom(createApkRng(state.seed),'__proto__').rng,'shop').rng;
 state.shop=createShop({offers:{main:[{id:'offer:1',entityId:'joker_joker',cost:4n,sellCost:2n,edition:'base'}],vouchers:[],boosters:[]}});
 return state;
};
test('legacy save exact bytes and property set remain compatible',()=>{
 const state=legacy();const expected=JSON.stringify({format:'card-cascade-save',version:1,state:{...state,money:state.money.toString(),round:{...state.round,target:state.round.target.toString(),score:state.round.score.toString()}}});
 assert.equal(serializeState(state),expected);assert.deepEqual(deserializeState(expected),state);
});
test('shop, negative credit balance and original RNG roundtrip without regeneration',()=>{
 const state=extended();const snapshot=structuredClone(state);const restored=deserializeState(serializeState(state));
 assert.deepEqual(restored,snapshot);assert.deepEqual(state,snapshot);
 assert.deepEqual(nextApkRandom(restored.rng.apk,'shop'),nextApkRandom(state.rng.apk,'shop'));
 const action={type:'BUY_SHOP_CARD',expectedRevision:state.revision,offerId:'offer:1'};
 assert.deepEqual(applyShopAction(restored,action),applyShopAction(state,action));
});
test('bought card price and stickers retain exact values',()=>{
 const state=extended();state.jokers=[{id:'owned:1',entityId:'joker_joker',cost:0n,sellCost:9007199254740993n,edition:'base',eternal:true,rental:false,perishable:false,debuffed:false}];
 assert.deepEqual(deserializeState(serializeState(state)),state);
});
test('optional shop and RNG fields reject forged metadata, identities and formats',()=>{
 const original=JSON.parse(serializeState(extended()));
 for(const change of [
 p=>p.state.shop.extra=true,p=>p.state.shop.main[0].cost='01',p=>p.state.shop.main[0].sellCost='-1',
 p=>p.state.shop.main[0].edition='made_up',p=>p.state.shop.main[0].eternal=1,
 p=>p.state.shop.main[0].id=Object.keys(p.state.cards)[0],
 p=>p.state.shop.boosters.push({...p.state.shop.main[0]}),
 p=>p.state.rng.apk.extra=1,p=>p.state.rng.apk.mathState[0]='FFFFFFFFFFFFFFFF',
 p=>p.state.rng.apk.mathState[0]='0123456789abcdef0',p=>p.state.rng.apk.streams.shop=1.01,
 p=>p.state.rng.apk.seed='different',p=>p.state.rng.apk.hashedSeed=0,
 p=>p.state.rng.shop.state=2**32,p=>p.state.bankruptAt='-0',p=>p.state.jokerSlots=1.5,
 ]){const payload=structuredClone(original);change(payload);assert.throws(()=>deserializeState(JSON.stringify(payload)));}
});

test('null shop persists after leaving, and offers cannot reuse owned joker identity',()=>{
 const state=extended();state.shop=null;assert.deepEqual(deserializeState(serializeState(state)),state);
 state.shop=createShop({offers:{main:[{id:'same',entityId:'joker_joker',cost:4n,sellCost:2n}],vouchers:[],boosters:[]}});
 state.jokers=[{id:'same',entityId:'joker_joker'}];assert.throws(()=>serializeState(state));
});
