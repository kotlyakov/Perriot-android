import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch,replayEffectActions} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const fresh=()=>createRun('REPLAY061',{runId:'replay061',money:4n,referenceRng:true,referenceShop:true,challengeId:'omelette'});
const act=(s,type,fields={})=>{const r=dispatch(s,{type,expectedRevision:s.revision,...fields});assert.ifError(r.error);return r.state;};
test('an authentic old 10000-action journal continues and compacts without losing its transition',()=>{
 const before=fresh();delete before.mechanicsVersion;const actions=[{type:'START_BLIND',expectedRevision:0}];for(let i=1;i<10000;i++)actions.push({type:'SET_SORT',mode:i%2?'suit':'rank',expectedRevision:i});
 let s=replayEffectActions(before,actions);s.effectReplay={version:2,before,actions};s=deserializeState(serializeState(s));
 s=act(s,'SET_SORT',{mode:'rank'});assert.equal(s.revision,10001);assert.equal(s.mechanicsVersion,1);assert.ok(s.effectReplay.actions.length<=4);assert.deepEqual(deserializeState(serializeState(s)),s);
});
test('thousands of public sorts retain only their pure final effect and revision count',()=>{
 let s=act(fresh(),'START_BLIND');const initial=structuredClone(s);for(let i=0;i<2000;i++)s=act(s,'SET_SORT',{mode:i%2?'suit':'rank'});
 assert.equal(s.revision,2001);assert.equal(s.sortMode,'suit');assert.ok(s.effectReplay.actions.length<=2);assert.equal(s.effectReplay.actions.at(-1).repeat,2000);
 assert.deepEqual(s.rng,initial.rng);assert.equal(s.money,initial.money);assert.deepEqual(s.jokers,initial.jokers);assert.deepEqual(s.handLevels,initial.handLevels);assert.deepEqual(s.runSummary,initial.runSummary);assert.ok(serializeState(s).length<20000);
 assert.deepEqual(deserializeState(serializeState(s)),s);
});
test('50000 represented pure actions replay without an unbounded loop',()=>{
 const before=fresh(),actions=[{type:'START_BLIND',expectedRevision:0},{type:'SET_SORT',expectedRevision:1,mode:'suit',repeat:49999}];
 const s=replayEffectActions(before,actions);assert.equal(s.revision,50000);assert.equal(s.sortMode,'suit');s.effectReplay={version:2,before,actions};assert.deepEqual(deserializeState(serializeState(s)),s);
});
test('sort compaction never removes a real play or its RNG, score and history',()=>{
 let s=act(fresh(),'START_BLIND');for(let i=0;i<8;i++)s=act(s,'SET_SORT',{mode:i%2?'rank':'suit'});s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});const score=structuredClone(s.lastScore);for(let i=0;i<9;i++)s=act(s,'SET_SORT',{mode:i%2?'rank':'suit'});
 assert.equal(s.effectReplay.actions.filter(a=>a.type==='PLAY_HAND').length,1);assert.equal(s.effectReplay.actions.filter(a=>a.type==='SET_SORT').length,2);assert.deepEqual(s.lastScore,score);assert.deepEqual(deserializeState(serializeState(s)),s);
});
test('sort macros are internal replay metadata, never public actions',()=>{
 const s=act(fresh(),'START_BLIND');const r=dispatch(s,{type:'SET_SORT',mode:'rank',repeat:2,expectedRevision:s.revision});assert.ok(r.error);assert.equal(r.state,s);
});
test('invalid counts, action types, revision and money tampering remain rejected',()=>{
 let s=act(fresh(),'START_BLIND');for(let i=0;i<4;i++)s=act(s,'SET_SORT',{mode:i%2?'rank':'suit'});const text=serializeState(s);
 for(const value of [0,-1,1,1.5,'4',Number.MAX_SAFE_INTEGER]){const p=JSON.parse(text);p.state.effectReplay.actions.at(-1).repeat=value;assert.throws(()=>deserializeState(JSON.stringify(p)),String(value));}
 for(const type of ['START_BLIND','PLAY_HAND','USE_CONSUMABLE']){const p=JSON.parse(text);p.state.effectReplay.actions.at(-1).type=type;assert.throws(()=>deserializeState(JSON.stringify(p)),type);}
 for(const mutate of [p=>p.state.revision++,p=>p.state.money='999999',p=>p.state.effectReplay.actions.at(-1).repeat++]){const p=JSON.parse(text);mutate(p);assert.throws(()=>deserializeState(JSON.stringify(p)));}
});
