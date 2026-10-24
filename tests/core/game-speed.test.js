import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=(await readFile(new URL('../../src/ui/game-speed.js',import.meta.url),'utf8')).replaceAll('export ','');
function load(overrides={}){const context=vm.createContext({...overrides});vm.runInContext(source+'\nglobalThis.api={GAME_SPEEDS,getGameSpeed,setGameSpeed,gameDuration};',context);return context.api;}
test('speed restores only approved values, scales presentation and persists before updating',()=>{
 const writes=[],api=load({localStorage:{getItem:()=> '2',setItem:(...args)=>writes.push(args)}});
 assert.equal(api.getGameSpeed(),2);assert.equal(api.gameDuration(480),240);api.setGameSpeed(.5);assert.equal(api.gameDuration(480),960);assert.deepEqual(writes,[['pierrot.game-speed','0.5']]);
 for(const value of [null,'', '0','3','NaN','Infinity'])assert.equal(load({localStorage:{getItem:()=>value}}).getGameSpeed(),1);
 assert.throws(()=>api.setGameSpeed(3));assert.equal(api.getGameSpeed(),.5);
 const broken=load({localStorage:{getItem:()=> '1',setItem:()=>{throw Error('disk full');}}});assert.throws(()=>broken.setGameSpeed(4));assert.equal(broken.getGameSpeed(),1);
});
test('native bridge works without DOM storage and rejects failed writes',()=>{
 let saved='4',works=true;const api=load({CardStorage:{read:slot=>{assert.equal(slot,'game-speed');return saved;},writeGameSpeed:value=>{if(works)saved=value;return works;}}});
 assert.equal(api.getGameSpeed(),4);api.setGameSpeed(2);assert.equal(saved,'2');works=false;assert.throws(()=>api.setGameSpeed(.5));assert.equal(api.getGameSpeed(),2);
});
