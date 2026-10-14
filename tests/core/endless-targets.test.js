import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as progression from '../../src/core/blind-progression.js';
import {bossTarget,canEnterBoss} from '../../src/core/boss-effects.js';
const fixtures=JSON.parse(readFileSync(new URL('../../scripts/reference-rng/showdown-fixtures.json',import.meta.url)));
test('native finite targets match every default Ante1–38 before BigInt conversion',()=>{
 assert.equal(typeof progression.nativeBlindTarget,'function');
 for(const row of fixtures.targets.filter(row=>row.ante<39)){
  assert.equal(progression.blindBase(row.ante),BigInt(Number(row.base)),`base Ante${row.ante}`);
  assert.equal(progression.nativeBlindTarget(row.ante,1.5),BigInt(Number(row.big)),`Big Ante${row.ante}`);
  assert.equal(progression.nativeBlindTarget(row.ante,6),BigInt(Number(row.six)),`6x Ante${row.ante}`);
 }
});
test('native multiplication rounding differs from multiplying the converted BigInt',()=>{
 assert.equal(typeof progression.nativeBlindTarget,'function');
 const row=fixtures.targets.find(row=>Number.isFinite(Number(row.base))&&BigInt(Number(row.base))*6n!==BigInt(Number(row.six)));
 assert.ok(row);assert.notEqual(progression.nativeBlindTarget(row.ante,6),progression.blindBase(row.ante)*6n);
});
test('native first non-finite Ante39 is explicit, without a finite safe-integer cap',()=>{
 assert.equal(typeof progression.nativeBlindTarget,'function');
 assert.equal(fixtures.targets.at(-1).base,'NaN');
 assert.throws(()=>progression.nativeBlindTarget(39),RangeError);
 for(const ante of [0,-1,1.5,NaN,Infinity])assert.throws(()=>progression.nativeBlindTarget(ante),RangeError);
 for(const multiplier of [0,-1,NaN,Infinity,'6'])assert.throws(()=>progression.nativeBlindTarget(8,multiplier),RangeError);
});
test('target helper admits showdown multipliers independently of lifecycle admission',()=>{
 for(const id of ['bl_final_bell','bl_final_leaf','bl_final_acorn','bl_final_heart','bl_final_vessel']){
  const state={round:{ante:8},apkBlinds:{bossId:id,playedCardIds:[]}};
  assert.equal(bossTarget(state),id==='bl_final_vessel'?300000n:100000n);
  assert.equal(canEnterBoss(state),false);
 }
 assert.equal(bossTarget({round:{ante:9},apkBlinds:{bossId:'bl_wall'}}),440000n);
 assert.equal(bossTarget({round:{ante:8},apkBlinds:{bossId:'bl_final_vessel'},bossState:{id:'bl_final_vessel',disabled:true}}),100000n);
});
