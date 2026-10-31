import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRun,dispatch,replayEffectActions} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const fresh=()=>createRun('MECHANICS061',{runId:'mechanics061',money:10n,referenceRng:true,referenceShop:true});
const old=kind=>readFileSync(new URL(`../fixtures/mechanics-legacy-060-${kind}.json`,import.meta.url),'utf8').trim();
test('new runs explicitly select mechanics version 1 and round-trip',()=>{
 const s=fresh();assert.equal(s.mechanicsVersion,1);assert.deepEqual(deserializeState(serializeState(s)),s);
});
test('unchanged 0.4.60 fixtures remain byte-identical and do not migrate on read',()=>{
 for(const kind of ['death','wheel','bones','purple','sort']){const text=old(kind),s=deserializeState(text);assert.equal(s.mechanicsVersion,undefined);assert.equal(serializeState(s),text);}
});
test('first accepted legacy action records mechanics transition and authenticates its replay',()=>{
 const s=deserializeState(old('bones')),r=dispatch(s,{type:'CASH_OUT',expectedRevision:s.revision});assert.ifError(r.error);
 assert.equal(s.mechanicsVersion,undefined);assert.equal(r.state.mechanicsVersion,1);
 assert.equal(r.state.effectReplay.actions.at(-1).mechanicsVersion,1);
 assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
 const replay=replayEffectActions(r.state.effectReplay.before,r.state.effectReplay.actions);assert.equal(replay.mechanicsVersion,1);
});
test('failed and stale actions leave legacy state object and version unchanged',()=>{
 const s=deserializeState(old('sort'));for(const action of [{type:'SET_SORT',mode:'bad',expectedRevision:s.revision},{type:'SET_SORT',mode:'rank',expectedRevision:s.revision-1}]){const r=dispatch(s,action);assert.ok(r.error);assert.equal(r.state,s);assert.equal(s.mechanicsVersion,undefined);}
});
test('unknown state or action mechanics versions are rejected',()=>{
 const s=fresh(),payload=JSON.parse(serializeState(s));payload.state.mechanicsVersion=2;assert.throws(()=>deserializeState(JSON.stringify(payload)));
 const r=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision,mechanicsVersion:2});assert.ok(r.error);assert.equal(r.state,s);
});
