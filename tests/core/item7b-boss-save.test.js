import test from 'node:test';
import assert from 'node:assert/strict';
import {createShop} from '../../src/core/shop.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {initializeItem7Joker} from '../../src/core/joker-item7-lifecycle.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const reload=s=>deserializeState(serializeState(s));
function act(s,type,rest={}){const r=dispatch(s,{type,expectedRevision:s.revision,...rest});assert.equal(r.error,null,JSON.stringify(r.error));return r.state;}
function setup(keys){let s=createRun('ITEM7B-JOURNAL',{runId:'7b-journal',money:25n,referenceRng:true,referenceShop:true});s.jokers=keys.map((entityId,i)=>initializeItem7Joker(s,{id:'j'+i,entityId,creationOrdinal:i+1,sellCost:2n}));s.nextJokerCreationOrdinal=keys.length+1;return act(s,'START_BLIND');}
test('preplay Yorick discard authenticates its mutable counter and resumes deterministically',()=>{
 const before=setup(['j_yorick']);
 const discarded=act(before,'DISCARD',{cardIds:[before.hand[0]]});assert.equal(discarded.jokers[0].yorickDiscards,22);
 const raw=JSON.parse(serializeState(discarded));
 for(const mutate of [p=>p.state.jokers[0].xMult=99,p=>p.state.jokers[0].yorickDiscards=23,p=>p.state.money='999']){const p=structuredClone(raw);mutate(p);assert.throws(()=>deserializeState(JSON.stringify(p)));}
 assert.equal(discarded.effectReplay.version,2);assert.deepEqual(reload(discarded),discarded);
 const cardIds=[discarded.hand[0]];assert.deepEqual(act(reload(discarded),'PLAY_HAND',{cardIds}),act(discarded,'PLAY_HAND',{cardIds}));
});
test('sale after scoring retains replay when inventory clears visible lastScore',()=>{
 let s=setup(['j_yorick','j_joker']);s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});
 s=act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:s.jokers[1].id});assert.equal(s.lastScore,null);
 const raw=JSON.parse(serializeState(s));raw.state.jokers[0].xMult=99;assert.throws(()=>deserializeState(JSON.stringify(raw)));
 assert.equal(s.effectReplay.version,2);assert.deepEqual(reload(s),s);
});
for(const keys of [['j_ceremonial','j_marble','j_riff_raff','j_joker','j_joker'],['j_ceremonial','j_joker','j_blueprint','j_marble','j_riff_raff']])test(`blind-start slices preserve reserved slots and Marble copy adjacency: ${keys.join('/')}`,()=>{
 const s=setup(keys);
 assert.equal(s.jokers.length,5);
 assert.deepEqual(s.jokers.filter(j=>/^j[0-4]$/.test(j.id)).map(j=>j.id),['j0','j2','j3','j4']);
 assert.equal(Object.keys(s.cards).length,keys.includes('j_blueprint')?54:52);
 assert.equal(s.jokers[0].mult,4);
 assert.deepEqual(reload(s),s);
});

for(const [key,field] of [['j_idol','idolCard'],['j_mail','mailRank'],['j_ancient','ancientSuit'],['j_castle','castleSuit']])test(`acquiring ${key} retains its initialized round target without another draw`,()=>{
 const s=createRun('LATE-TARGET',{runId:'late-target',money:25n,referenceRng:true,referenceShop:true});
 s.phase='shop';s.shop=createShop({offers:{main:[{id:'target-offer',entityId:key,originalKey:key,set:'Joker',edition:'base',cost:4n,sellCost:2n}],vouchers:[],boosters:[]}});
 const initial=structuredClone(s.round[field]),beforeRng=structuredClone(s.rng);assert.notEqual(initial,undefined);
 const next=act(s,'BUY_SHOP_CARD',{offerId:'target-offer'});assert.deepEqual(next.round[field],initial);assert.deepEqual(next.rng,beforeRng);
 const rng=structuredClone(next.rng);const existing=structuredClone(next.round[field]);
 const reordered=act(next,'REORDER_JOKERS',{cardIds:next.jokers.map(j=>j.id)});
 assert.deepEqual(reordered.round[field],existing);assert.deepEqual(reordered.rng,rng);
});

test('native round targets exist unowned, survive blind selection, and refresh at settlement',()=>{
 let s=createRun('TARGET-BOUNDARY',{runId:'target-boundary',money:25n,referenceRng:true,referenceShop:true});
 const fields=['idolCard','mailRank','ancientSuit','castleSuit'];const targets=Object.fromEntries(fields.map(key=>[key,structuredClone(s.round[key])]));
 assert.ok(fields.every(key=>s.round[key]!==undefined));
 s=act(s,'START_BLIND');assert.deepEqual(Object.fromEntries(fields.map(key=>[key,s.round[key]])),targets);
 const rng=structuredClone(s.rng.apk),ancient=s.round.ancientSuit;s.round.score=s.round.target-1n;
 s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(s.phase,'round_won');
 assert.notEqual(s.round.ancientSuit,ancient);
 for(const key of ['idol1','mail1','anc1','cas1'])assert.notEqual(s.rng.apk.streams[key],rng.streams[key],key);
 assert.deepEqual(reload(s),s);
 const paid=act(s,'CASH_OUT');for(const key of fields)assert.deepEqual(paid.round[key],s.round[key]);
});
