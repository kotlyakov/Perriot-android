import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfileStore} from '../../src/persistence/profile-store.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const run=id=>createRun('PROFILE',{runId:id,money:4n,referenceRng:true,referenceShop:true});
function memory(initial={}){const data={...initial};return {data,read:s=>data[s]??'',write(s,t){data[s]=t;}};}
test('profile store starts without writes and isolates three resumable runs',()=>{
 const io=memory(),store=createProfileStore(io);assert.equal(store.load().status,'empty');assert.deepEqual(io.data,{});
 const one=run('one');store.reset(one,{seeded:false});assert.equal(deserializeState(io.data.current).runId,'one');
 store.selectProfile('2');assert.equal(store.load().status,'empty');store.reset(run('two'),{seeded:true});
 store.selectProfile('1');assert.equal(store.load().state.runId,'one');
 const restored=createProfileStore(io);assert.equal(restored.load().state.runId,'one');assert.equal(restored.activeId,'1');
 restored.selectProfile('2');assert.equal(restored.load().state.runId,'two');
});
test('failed atomic profile save leaves run and profile unchanged and can retry',()=>{
 const io=memory(),store=createProfileStore(io);store.load();const before=run('atomic');store.reset(before,{seeded:false});
 const text=io.data.current,profile=store.getProfile(),next=dispatch(before,{type:'START_BLIND',expectedRevision:0});assert.ifError(next.error);
 const write=io.write;io.write=()=>{throw Error('disk full');};assert.throws(()=>store.save(next.state,next.events));assert.equal(io.data.current,text);assert.deepEqual(store.getProfile(),profile);
 io.write=write;store.save(next.state,next.events);assert.equal(store.load().state.revision,1);
});
test('legacy run migrates without inventing historical wins; damaged primary requires recovery',()=>{
 const io=memory({current:serializeState(run('legacy'))}),store=createProfileStore(io);assert.equal(store.load().state.runId,'legacy');
 store.save(run('legacy'),[]);assert.equal(store.getProfile().runs.legacy.seeded,true);
 const safe=io.data.current;io.data.backup=safe;io.data.current='damaged';const recovered=createProfileStore(io);assert.equal(recovered.load().status,'recovery');assert.throws(()=>recovered.save(run('no')));assert.equal(io.data.current,'damaged');assert.equal(recovered.restoreBackup().runId,'legacy');
});
test('concurrent profile writers and malformed profile envelopes cannot overwrite data',()=>{
 const io=memory(),a=createProfileStore(io),b=createProfileStore(io);a.load();b.load();a.reset(run('a'),{seeded:false});assert.throws(()=>b.reset(run('b')));
 const raw=JSON.parse(io.data.current);raw.account.profiles['1'].profile.version=999;io.data.current=JSON.stringify(raw);delete io.data.backup;
 assert.equal(createProfileStore(io).load().status,'corrupt');
});
test('backup with empty selected profile recovers without inventing a run',()=>{
 const io=memory(),store=createProfileStore(io);store.load();store.reset(run('reserved'),{seeded:false});store.selectProfile('2');
 io.data.backup=io.data.current;io.data.current='damaged';const restore=createProfileStore(io);assert.equal(restore.load().status,'recovery');assert.equal(restore.restoreBackup(),null);assert.equal(restore.load().status,'empty');restore.selectProfile('1');assert.equal(restore.load().state.runId,'reserved');
});

test('one visible player can rename atomically without changing progress or current run',()=>{
 const io=memory(),store=createProfileStore(io);store.load();store.reset(run('named'),{seeded:false});
 const before=store.getProfile();store.renameProfile('  Артур  ');
 const restored=createProfileStore(io);assert.equal(restored.load().state.runId,'named');assert.equal(restored.getProfiles().find(p=>p.id===restored.activeId).name,'Артур');assert.deepEqual(restored.getProfile(),before);
 for(const name of ['', ' '.repeat(3),'x'.repeat(11),null])assert.throws(()=>restored.renameProfile(name));
 const write=io.write;io.write=()=>{throw Error('disk full');};assert.throws(()=>restored.renameProfile('Другое имя'));assert.equal(restored.getProfiles().find(p=>p.id===restored.activeId).name,'Артур');io.write=write;
 restored.renameProfile('Новое имя');assert.equal(restored.getProfiles().find(p=>p.id===restored.activeId).name,'Новое имя');
});
