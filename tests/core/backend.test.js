import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackend} from '../../src/persistence/backend.js';
import {createRepository} from '../../src/persistence/repository.js';
import {createRun} from '../../src/core/run.js';
import {serializeState} from '../../src/persistence/save.js';
test('undefined native read is failure, not an absent save, and backup can recover',()=>{
 const text=serializeState(createRun('seed',{runId:'r',money:4n}));
 const native={read:slot=>slot==='backup'?text:undefined,writeCurrent(){throw Error('must not write');},writeBackup(){throw Error('must not write');}};
 const repo=createRepository(createBackend({native}));assert.equal(repo.load().status,'recovery');
 assert.throws(()=>repo.save(createRun('new',{runId:'new',money:4n})));
 native.read=()=>undefined;assert.equal(repo.load().status,'error');
});
test('native unsuccessful writes throw while browser missing data is correctly empty',()=>{
 const native={read:()=>'',writeCurrent:()=>false,writeBackup:()=>undefined};
 const io=createBackend({native});assert.throws(()=>io.write('current','x'));assert.throws(()=>io.write('backup','x'));
 const data=new Map(),browser=createBackend({storage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
 assert.equal(browser.read('current'),'');browser.write('current','abc');assert.equal(browser.read('current'),'abc');
});
