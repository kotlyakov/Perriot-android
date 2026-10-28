import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {createProfileStore} from '../../src/persistence/profile-store.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const act=(state,type,fields={})=>{const result=dispatch(state,{type,expectedRevision:state.revision,...fields});assert.ifError(result.error);return result.state;};
function longRun(){let state=createRun('PERSISTPERF',{runId:'persistence-perf',money:4n,challengeId:'omelette'});state=act(state,'START_BLIND');for(let i=0;i<200;i++)state=act(state,'SET_SORT',{mode:i%2?'rank':'suit'});return state;}

test('saving the next action does not replay the already authenticated history',()=>{
 const data={},store=createProfileStore({read:key=>data[key]??'',write:(key,text)=>data[key]=text});store.load();let state=longRun();store.save(state);
 state=act(state,'SET_SORT',{mode:'rank'});
 const clone=globalThis.structuredClone;let clones=0;
 globalThis.structuredClone=(...args)=>{clones++;return clone(...args);};
 try{store.save(state);}finally{globalThis.structuredClone=clone;}
 // Count actual cloning work rather than asserting device-dependent milliseconds.
 assert.ok(clones<100,`one new action cloned ${clones} states/objects; old history was replayed`);
 assert.deepEqual(createProfileStore({read:key=>data[key]??'',write(){}}).load().state,state);
});

test('cached replay still rejects state, prefix-action and checkpoint tampering',()=>{
 const state=longRun(),text=serializeState(state);
 for(const mutate of [raw=>raw.state.money='999',raw=>raw.state.effectReplay.actions[50].mode='invalid',raw=>{const before=JSON.parse(raw.state.effectReplay.before);before.state.money='99';raw.state.effectReplay.before=JSON.stringify(before);}]){
  const raw=JSON.parse(text);mutate(raw);assert.throws(()=>deserializeState(JSON.stringify(raw)));
 }
 const loaded=deserializeState(text);loaded.jokers[0].extraValue=999n;loaded.effectReplay.actions[0].type='INVALID';
 assert.deepEqual(deserializeState(text),state);
});
