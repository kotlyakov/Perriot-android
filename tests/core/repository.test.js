import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState} from '../../src/persistence/save.js';
import {createRepository} from '../../src/persistence/repository.js';
const fresh=()=>createRun('storage',{runId:'r',money:4n});
const started=()=>dispatch(fresh(),{type:'START_BLIND',expectedRevision:0}).state;
// The fake replaces only physical I/O; codec and repository are real.
function fixture(values={}) { const data={...values};return {data,io:{read:slot=>data[slot]??'',write:(slot,text)=>{data[slot]=text;}}}; }
test('save retains previous valid state as backup and resumes current',()=>{
 const f=fixture(),repo=createRepository(f.io);assert.equal(repo.load().status,'empty');
 repo.save(fresh());repo.save(started());
 assert.equal(createRepository(f.io).load().state.phase,'playing');
 assert.equal(createRepository(f.io).restoreBackup().phase,'blind_selection');
});
test('corrupt current offers validated backup and blocks save until explicit restore',()=>{
 const f=fixture({current:'bad',backup:serializeState(started())}),repo=createRepository(f.io);
 assert.equal(repo.load().status,'recovery');assert.throws(()=>repo.save(fresh()));assert.equal(f.data.current,'bad');
 assert.deepEqual(repo.restoreBackup(),started());assert.equal(repo.load().status,'current');
});
test('both corrupt or read failure preserve bytes and do not silently start new run',()=>{
 const f=fixture({current:'bad',backup:'worse'}),repo=createRepository(f.io);
 assert.equal(repo.load().status,'corrupt');assert.throws(()=>repo.save(fresh()));assert.deepEqual(f.data,{current:'bad',backup:'worse'});
 assert.equal(createRepository({read(){throw Error('disk');},write(){throw Error('disk');}}).load().status,'error');
});
test('invalid new save and write failure do not replace healthy current',()=>{
 const original=serializeState(fresh()),f=fixture({current:original});let fail='backup';
 const io={...f.io,write(slot,text){if(slot===fail)throw Error('full');f.io.write(slot,text);}};
 const repo=createRepository(io);repo.load();assert.throws(()=>repo.save(started()));assert.equal(f.data.current,original);
 fail='current';assert.throws(()=>repo.save(started()));assert.equal(f.data.current,original);
 assert.equal(createRepository(f.io).load().state.phase,'blind_selection');
 const bad=started();bad.hand.push('missing');assert.throws(()=>repo.save(bad));assert.equal(f.data.current,original);
});
test('a different writer cannot be overwritten using an outdated repository',()=>{
 const f=fixture({current:serializeState(fresh())}),repo=createRepository(f.io);repo.load();
 f.data.current=serializeState(started());assert.throws(()=>repo.save(fresh()));assert.equal(createRepository(f.io).load().state.phase,'playing');
});
test('explicit reset starts a run while keeping previous valid save as backup',()=>{
 const f=fixture({current:serializeState(started())}),repo=createRepository(f.io);repo.load();repo.reset(fresh());
 assert.equal(repo.load().state.phase,'blind_selection');assert.equal(createRepository(f.io).restoreBackup().phase,'playing');
});
test('unreadable current still offers a good backup, and unreadable backup does not block current',()=>{
 const text=serializeState(started());
 const brokenCurrent={read(slot){if(slot==='current')throw Error('bad utf8');return text;},write(){}};
 assert.equal(createRepository(brokenCurrent).load().status,'recovery');
 const brokenBackup={read(slot){if(slot==='backup')throw Error('bad utf8');return text;},write(){}};
 assert.equal(createRepository(brokenBackup).load().status,'current');
});
test('restore does not overwrite a healthy current written since recovery was offered',()=>{
 const f=fixture({current:'bad',backup:serializeState(fresh())}),repo=createRepository(f.io);
 assert.equal(repo.load().status,'recovery');f.data.current=serializeState(started());
 assert.throws(()=>repo.restoreBackup());assert.equal(createRepository(f.io).load().state.phase,'playing');
});
test('explicit restore can replace an unreadable current using validated backup',()=>{
 const text=serializeState(started()),f=fixture({backup:text});let unreadable=true;
 const repo=createRepository({read(slot){if(slot==='current' && unreadable)throw Error('bad utf8');return f.io.read(slot);},write(slot,value){f.io.write(slot,value);if(slot==='current')unreadable=false;}});
 assert.equal(repo.load().status,'recovery');assert.deepEqual(repo.restoreBackup(),started());assert.equal(repo.load().status,'current');
});
