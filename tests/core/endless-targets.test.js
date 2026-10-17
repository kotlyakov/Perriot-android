import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as progression from '../../src/core/blind-progression.js';
import * as field from '../../src/ui/field.js';
import {flameHeight} from '../../src/ui/flame.js';
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
 for(const ante of [39,40,1000])for(const mult of [1,1.5,2,6])assert.ok(Number.isNaN(progression.nativeBlindTarget(ante,mult)));
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

test('native number formatting and unordered NaN comparisons match executed formatter and packing fixtures',()=>{
 assert.equal(typeof field.displayBlindTarget,'function');
 assert.equal(fixtures.numeric.length,32);
 for(const row of fixtures.numeric){
  const target=progression.nativeBlindTarget(row.ante,row.multiplier);
  assert.equal(field.displayBlindTarget(target),row.display);
  assert.equal(0n>=target,row.zeroGte);assert.equal(10n**300n>=target,row.largeGte);
  if(row.ante>=39){assert.equal(row.packed,'return {["chips"]=nan,}');assert.equal(row.unpackOk,true);assert.equal(row.unpackedType,'nil');assert.equal(row.unpackedValue,'nil');assert.equal(flameHeight(10n**300n,target),0);}
  else {assert.equal(typeof target,'bigint');assert.equal(target,BigInt(Number(row.value)));assert.equal(row.unpackedType,'number');}
 }
 for(const row of fixtures.format)assert.equal(field.displayBlindTarget(BigInt(row.value)),row.display);
});
test('disabled Vessel target reproduces binary64 division of native sixfold target',()=>{
 const differences=[];
 for(const row of fixtures.vesselDivision){
  const actual=bossTarget({round:{ante:row.ante},apkBlinds:{bossId:'bl_final_vessel'},bossState:{disabled:true}});
  assert.ok(Object.is(actual,row.disabled==='NaN'?NaN:BigInt(Number(row.disabled))),`Ante${row.ante}`);
  assert.equal(field.displayBlindTarget(actual),row.display);
  if(row.disabled!==row.freshDouble)differences.push(row.ante);
 }
 assert.deepEqual(differences,[20,24,31,35,37]);
});
