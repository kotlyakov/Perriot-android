import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createApkRng,createApkMathState,nextApkMathRandom} from '../../src/core/apk-rng.js';
import {generateApkRemainingPack,getRemainingBoosterConfig,supportsRemainingBooster} from '../../src/core/booster-generation.js';
const oracle=JSON.parse(gunzipSync(readFileSync(new URL('../fixtures/booster-native.json.gz',import.meta.url))));
const owned=['j_joker','j_greedy_joker','j_lusty_joker','c_incantation','c_familiar','c_soul','c_black_hole'];
function context(mode){
 const ctx={ante:2};
 if(['owned','showman'].includes(mode))ctx.ownedCentreIds=[...owned,...(mode==='showman'?['j_ring_master']:[])];
 if(mode==='banned')ctx.bannedCentreIds=['j_joker','j_greedy_joker','c_soul','c_familiar','m_bonus'];
 if(['stake','eternal'].includes(mode))Object.assign(ctx,{modifiers:{all_eternal:mode==='eternal',enable_eternals_in_shop:true,enable_perishables_in_shop:true,enable_rentals_in_shop:true},inflation:2,discountPercent:25,editionRate:4});
 if(mode==='empty')ctx.bannedCentreIds=catalogue.centres.filter(c=>['Joker','Spectral'].includes(c.set)).map(c=>c.key);
 return ctx;
}
const booster=(kind,size)=>`p_${kind.toLowerCase()}_${size===(kind==='Standard'?3:2)?'normal':'mega'}_1`;
test('all sixteen remaining native booster identities retain pack counts and choices',()=>{
 const ids=catalogue.centres.filter(c=>c.set==='Booster'&&['Standard','Buffoon','Spectral'].includes(c.kind));
 assert.equal(ids.length,16);
 for(const c of ids){assert.equal(supportsRemainingBooster(c.key),true);assert.deepEqual(getRemainingBoosterConfig(c.key),{size:c.key.includes('_normal_')?(c.kind==='Standard'?3:2):(c.kind==='Standard'?5:4),choices:c.key.includes('_mega_')?2:1,kind:c.kind});}
 for(const id of ['p_arcana_normal_1','p_celestial_normal_1','p_standard_normal_9',null]){assert.equal(supportsRemainingBooster(id),false);assert.throws(()=>getRemainingBoosterConfig(id));}
});
test('remaining packs match all independent native cards, pricing, streams and following raw draws',()=>{
 assert.equal(oracle.jitInterpreterEqual,true);
 for(const expected of oracle.cases){
  const input=createApkRng(expected.seed,createApkMathState(17)),ctx=context(expected.mode),before=structuredClone({input,ctx});
  const {cards,rng}=generateApkRemainingPack(input,ctx,{boosterId:booster(expected.kind,expected.size),instancePrefix:'oracle'});
  const label=[expected.seed,expected.kind,expected.size,expected.mode].join('/');
  const summary=cards.map(c=>Object.fromEntries(Object.entries(c).filter(([key])=>!['id','originalKey','set','enhancement'].includes(key)).map(([key,value])=>[key,typeof value==='bigint'?Number(value):value])));
  assert.deepEqual(summary,expected.cards,label+'/cards');
  assert.deepEqual(rng.streams,expected.streams,label+'/streams');
  let state=rng.mathState;for(const value of expected.followingMath){const next=nextApkMathRandom(state);assert.equal(next.value,value,label+'/math');state=next.state;}
  assert.deepEqual({input,ctx},before,label+'/immutable');
  assert.equal(new Set(cards.map(c=>c.id)).size,expected.size);
  for(const card of cards){assert.equal(card.originalKey,card.entityId);if(expected.kind==='Standard'){assert.equal(card.set,card.entityId==='c_base'?'Base':'Enhanced');assert.equal(card.enhancement,card.entityId==='c_base'?undefined:card.entityId.slice(2));}}
 }
});
test('oracle exercises all standard enhancements, seals, editions, rare spectral and stake stickers',()=>{
 const cards=oracle.cases.flatMap(c=>c.cards);
 for(const id of ['m_bonus','m_mult','m_wild','m_glass','m_steel','m_stone','m_gold','m_lucky','c_soul','c_black_hole'])assert.ok(cards.some(c=>c.entityId===id),id);
 for(const seal of ['red','blue','gold','purple'])assert.ok(cards.some(c=>c.seal===seal),seal);
 for(const edition of ['base','foil','holographic','polychrome','negative'])assert.ok(cards.some(c=>c.edition===edition),edition);
 for(const sticker of ['eternal','perishable','rental'])assert.ok(cards.some(c=>c[sticker]),sticker);
 assert.ok(cards.some(c=>c.toDoPokerHand));
});
test('remaining packs validate input and reduced motion preserves the synchronous RNG boundary',()=>{
 const rng=createApkRng('PACK');
 for(const options of [{},{boosterId:'p_arcana_normal_1'},{boosterId:'p_standard_normal_1',instancePrefix:''}])assert.throws(()=>generateApkRemainingPack(rng,{},options));
 for(const kind of ['Standard','Buffoon','Spectral']){
  const opts={boosterId:booster(kind,kind==='Standard'?5:4)};
  assert.deepEqual(generateApkRemainingPack(rng,{},opts),generateApkRemainingPack(rng,{reducedMotion:true},opts));
 }
 assert.throws(()=>generateApkRemainingPack(null,{}, {boosterId:'p_standard_normal_1'}));
});
