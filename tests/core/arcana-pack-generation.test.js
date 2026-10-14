import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createApkRng,createApkMathState,nextApkMathRandom} from '../../src/core/apk-rng.js';
import {createApkShopContext} from '../../src/core/apk-shop.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {generateApkArcanaPack,getArcanaBoosterConfig,supportsArcanaBooster} from '../../src/core/arcana-pack-generation.js';

// Independently executed APK get_current_pool/create_card in pinned native LuaJIT.
// Only numerical outcomes are retained; see docs/apk-findings/arcana-packs.md.
const nativeCases=JSON.parse(readFileSync(new URL('../fixtures/arcana-native.json',import.meta.url),'utf8')).cases;
const tarotIds=catalogue.centres.filter(c=>c.set==='Tarot'&&!c.omit&&!c.skip_pool&&!c.wip).map(c=>c.key);
function context(mode){
 const ownedCentreIds=mode.includes('owned')?['c_fool','c_magician','c_soul','c_black_hole']:[];
 if(mode.includes('showman'))ownedCentreIds.push('j_ring_master');
 return createApkShopContext({ante:2,ownedCentreIds,usedVoucherIds:mode.includes('omen')?['v_omen_globe']:[],
 bannedCentreIds:mode==='empty'?tarotIds:mode.includes('ban_soul')?['c_soul']:mode==='ban_hole_omen'?['c_black_hole']:[]});
}
test('all eight Arcana identities preserve native card counts and choices',()=>{
 const ids=catalogue.centres.filter(c=>c.set==='Booster'&&c.kind==='Arcana').map(c=>c.key);
 assert.equal(ids.length,8);
 for(const id of ids){assert.equal(supportsArcanaBooster(id),true);assert.deepEqual(getArcanaBoosterConfig(id),{size:id.includes('normal')?3:5,choices:id.includes('mega')?2:1});}
 assert.equal(supportsArcanaBooster('p_celestial_normal_1'),false);
 assert.throws(()=>getArcanaBoosterConfig('p_arcana_normal_9'));
});
test('Arcana contents, pool resamples and following math draws match 140 native cases',()=>{
 for(const expected of nativeCases){
  const input=createApkRng(expected.seed,createApkMathState(17)),ctx=context(expected.mode);
  const before=structuredClone({input,ctx});
  const result=generateApkArcanaPack(input,ctx,{boosterId:expected.size===3?'p_arcana_normal_1':'p_arcana_mega_1',instancePrefix:'oracle'});
  const label=expected.seed+'/'+expected.size+'/'+expected.mode;
  assert.deepEqual(result.cards.map(c=>c.entityId),expected.ids,label);
  assert.deepEqual(result.rng.streams,expected.streams,label+'/streams');
  let state=result.rng.mathState;for(const value of expected.followingMath){const next=nextApkMathRandom(state);assert.equal(next.value,value,label+'/math');state=next.state;}
  assert.deepEqual({input,ctx},before,label+'/immutable');
  assert.equal(new Set(result.cards.map(c=>c.id)).size,expected.size);
  assert.ok(result.cards.every(c=>c.originalKey===c.entityId&&['Tarot','Spectral'].includes(c.set)&&c.edition==='base'));
 }
});
test('Arcana bans suppress Soul polls and exhausted Tarot pool retains native Strength fallback',()=>{
 const banned=generateApkArcanaPack(createApkRng('ARC291'),context('ban_soul'),{boosterId:'p_arcana_normal_1'});
 assert.equal(banned.rng.streams.soul_Tarot2,undefined);
 const empty=generateApkArcanaPack(createApkRng('ARCANA42'),context('empty'),{boosterId:'p_arcana_normal_1'});
 assert.deepEqual(empty.cards.map(c=>c.entityId),['c_strength','c_strength','c_strength']);
});
test('Arcana generated cards immediately suppress duplicates and Showman restores them',()=>{
 const allOwned=tarotIds.filter(id=>id!=='c_strength');
 const ctx=createApkShopContext({ante:2,ownedCentreIds:allOwned,bannedCentreIds:['c_soul']});
 const normal=generateApkArcanaPack(createApkRng('PACK'),ctx,{boosterId:'p_arcana_normal_1'});
 assert.deepEqual(normal.cards.map(c=>c.entityId),['c_strength','c_strength','c_strength']);
 const showman=generateApkArcanaPack(createApkRng('PIERROT1'),{...ctx,ownedCentreIds:[...allOwned,'j_ring_master']},{boosterId:'p_arcana_mega_1'});
 assert.ok(showman.cards.some(c=>c.entityId!=='c_strength'));
});
test('Arcana rejects invalid input and reduced motion does not skip materialization math draws',()=>{
 const rng=createApkRng('ARCANA42'),ctx=createApkShopContext();
 for(const options of [{},{boosterId:'p_celestial_normal_1'},{boosterId:'p_arcana_normal_1',instancePrefix:''}])assert.throws(()=>generateApkArcanaPack(rng,ctx,options));
 const opts={boosterId:'p_arcana_normal_1'};
 assert.deepEqual(generateApkArcanaPack(rng,ctx,opts),generateApkArcanaPack(rng,{...ctx,reducedMotion:true},opts));
});

test('Arcana rare oracle seeds yield Soul and Omen Black Hole without substitute cards',()=>{
 const first=(seed,mode)=>generateApkArcanaPack(createApkRng(seed),context(mode),{boosterId:'p_arcana_normal_1'}).cards[0].entityId;
 assert.equal(first('ARC291','base'),'c_soul');
 assert.equal(first('ARC1746','omen'),'c_soul');
 assert.equal(first('ARC1618','omen'),'c_black_hole');
});
test('Arcana tracks offered identities as used and never compacts the native pool',()=>{
 const usedCentreIds=tarotIds.filter(id=>id!=='c_strength');
 const result=generateApkArcanaPack(createApkRng('ARCANA42'),createApkShopContext({ante:2,usedCentreIds,bannedCentreIds:['c_soul']}),{boosterId:'p_arcana_normal_1'});
 assert.deepEqual(result.cards.map(c=>c.entityId),['c_strength','c_strength','c_strength']);
 assert.ok(Object.keys(result.rng.streams).some(key=>key.startsWith('Tarotar12_resample')));
});
