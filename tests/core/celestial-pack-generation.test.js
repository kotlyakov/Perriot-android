import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createApkRng,createApkMathState,nextApkMathRandom} from '../../src/core/apk-rng.js';
import {createApkShopContext,generateApkCelestialPack} from '../../src/core/apk-shop.js';

const fixture=JSON.parse(readFileSync(new URL('../fixtures/celestial-native.json',import.meta.url),'utf8'));
const handOrder=['Flush Five','Flush House','Five of a Kind','Straight Flush','Four of a Kind','Full House','Flush','Straight','Three of a Kind','Two Pair','Pair','High Card'];
function context(mode){
 const playedHands={Pair:4,Flush:4};
 const visibleHandOrder=mode==='softlock'?handOrder:handOrder.slice(3);
 if(mode==='softlock')for(const hand of handOrder.slice(0,3))playedHands[hand]=1;
 if(mode==='telescope_zero')Object.assign(playedHands,{Pair:0,Flush:0});
 const ownedCentreIds=['owned','showman'].includes(mode)?['c_pluto','c_saturn']:[];
 if(mode==='showman')ownedCentreIds.push('j_ring_master');
 const bannedCentreIds=mode==='telescope_banned'?['c_jupiter']:mode==='blackhole_banned'?['c_black_hole']:[];
 return createApkShopContext({ante:2,playedHands,visibleHandOrder,ownedCentreIds,
  usedVoucherIds:mode.startsWith('telescope')?['v_telescope']:[],bannedCentreIds,reducedMotion:true});
}

test('Celestial pack IDs and keyed streams match all 64 native LuaJIT fixtures',()=>{
 for(const expected of fixture.cases){
  const result=generateApkCelestialPack(createApkRng(expected.seed,createApkMathState(17)),context(expected.mode),{size:expected.size,instancePrefix:'fixture'});
  assert.deepEqual(result.cards.map(card=>card.entityId),expected.centreIds,`${expected.seed}/${expected.size}/${expected.mode}`);
  for(const [key,value] of Object.entries(expected.streams))assert.equal(result.rng.streams[key],value,`${expected.seed}/${expected.size}/${expected.mode}/${key}`);
  assert.deepEqual(result.rng.streams,expected.streams);
  let mathState=result.rng.mathState;
  for(const expectedDraw of expected.followingMath){const draw=nextApkMathRandom(mathState);assert.equal(draw.value,expectedDraw,`${expected.seed}/${expected.size}/${expected.mode}/raw math`);mathState=draw.state;}
  assert.equal(new Set(result.cards.map(card=>card.id)).size,result.cards.length);
 }
});

test('Celestial pack generator rejects invalid sizes and preserves its inputs',()=>{
 const rng=createApkRng('PACKSAFE'),ctx=context('base'),beforeRng=structuredClone(rng),beforeContext=structuredClone(ctx);
 for(const size of [0,1,2,4,6,3.5])assert.throws(()=>generateApkCelestialPack(rng,ctx,{size}));
 generateApkCelestialPack(rng,ctx,{size:3});assert.deepEqual(rng,beforeRng);assert.deepEqual(ctx,beforeContext);
});

test('Celestial pack materialization consumes unconditional native raw draw even in reduced motion',()=>{
 const ctx=createApkShopContext({ante:2,reducedMotion:true,playedHands:{'Five of a Kind':1,'Flush House':1,'Flush Five':1}});
 const result=generateApkCelestialPack(createApkRng('AAAAAAA1',createApkMathState(17)),ctx,{size:3});
 assert.deepEqual(result.cards.map(card=>card.entityId),['c_saturn','c_ceres','c_pluto']);
 assert.equal(nextApkMathRandom(result.rng.mathState).value,0.2098773323377312);
});
