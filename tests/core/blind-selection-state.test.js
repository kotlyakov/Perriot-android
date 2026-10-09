import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {APK_BOSSES} from '../../src/content/apk-blinds.js';
import {getApkTagPool} from '../../src/core/apk-tags.js';
const run=()=>createRun('AAAAAAA1',{runId:'selection',money:4n,referenceRng:true,referenceShop:true});
test('startup stores the full boss usage ledger, two tags and three orbital choices',()=>{
 const s=run(),b=s.apkBlinds;assert.ok(b);assert.equal(b.bossId,'bl_window');
 assert.equal(Object.keys(b.bossesUsed).length,28);assert.equal(b.bossesUsed[b.bossId],1);
 assert.equal(Object.values(b.bossesUsed).reduce((a,b)=>a+b,0),1);
 for(const id of ['small','big'])assert.ok(getApkTagPool(b.tagContext).includes(b.tags[id]));
 for(const id of ['small','big','boss'])assert.ok(b.tagContext.visibleHandOrder.includes(b.orbitalHands[id]));
 assert.deepEqual(run(),s);assert.ok(s.rng.apk.streams.boss);assert.ok(s.rng.apk.streams.Tag1);assert.ok(s.rng.apk.streams.orbital);
});
test('save/load and starting a blind preserve selections without polling again',()=>{
 const s=run(),text=serializeState(s),loaded=deserializeState(text);assert.deepEqual(loaded,s);
 const a=dispatch(s,{type:'START_BLIND',expectedRevision:0}),b=dispatch(loaded,{type:'START_BLIND',expectedRevision:0});
 assert.deepEqual(a,b);assert.deepEqual(a.state.apkBlinds,s.apkBlinds);
 assert.equal(serializeState(loaded),text);
});
test('legacy saves remain untouched and malformed selection states are rejected',()=>{
 const legacy=run();delete legacy.apkBlinds;assert.equal(deserializeState(serializeState(legacy)).apkBlinds,undefined);
 const plain=createRun('OLD',{runId:'old',money:4n,referenceRng:true});assert.equal(plain.apkBlinds,undefined);
 for(const mutate of [b=>b.version=2,b=>b.ante=2,b=>b.bossId='bl_ox',b=>b.bossesUsed.bl_window=-1,b=>delete b.bossesUsed[APK_BOSSES[0].id],b=>b.tags.small='tag_orbital',b=>b.orbitalHands.boss='unknown',b=>b.tagContext.extra=true,b=>b.extra=true]){
  const s=run();mutate(s.apkBlinds);assert.throws(()=>serializeState(s));
 }
});

test('unsupported boss and skip actions cannot change the run or selections',()=>{
 const s=run();for(const type of ['SKIP_BLIND','START_BOSS']){const result=dispatch(s,{type,expectedRevision:0});assert.equal(result.state,s);assert.ok(result.error);assert.deepEqual(result.events,[]);}
});
