import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createApkRng,createApkMathState,nextApkMathRandom} from '../../src/core/apk-rng.js';
import {createApkShopContext,generateApkEffectCards} from '../../src/core/apk-shop.js';

const fixtures=JSON.parse(readFileSync(new URL('../fixtures/soul-native.json',import.meta.url),'utf8'));
const legends=catalogue.centres.filter(c=>c.set==='Joker'&&c.rarity===4).map(c=>c.key);
test('Soul legendary identity, edition, keyed streams and raw juice match 714 native APK cases',()=>{
 const observed=new Set(),editions=new Set();
 for(const expected of fixtures.cases){
  const mode=expected.mode,ownedCentreIds=mode.includes('owned')?['j_caino','j_triboulet']:[];
  if(mode.includes('showman'))ownedCentreIds.push('j_ring_master');
  const context=createApkShopContext({ante:expected.ante,ownedCentreIds,
   bannedCentreIds:mode==='empty'?legends:mode==='banned'?['j_perkeo','j_chicot']:[],
   lockedCentreIds:mode==='locked'?legends:[],modifiers:{all_eternal:mode==='all_eternal'}});
  const rng=createApkRng(expected.seed,createApkMathState(17));
  const before=structuredClone({rng,context});
  const result=generateApkEffectCards(rng,context,{set:'Joker',count:1,append:'sou',legendary:true,materialize:false,instancePrefix:'soul-native'});
  const [card]=result.cards,label=expected.seed+'/'+mode;
  assert.equal(card.entityId,expected.id,label+'/identity');
  assert.equal(card.edition,expected.edition,label+'/edition');
  assert.equal(!!card.eternal,expected.eternal,label+'/eternal');
  assert.deepEqual(result.rng.streams,expected.streams,label+'/streams');
  // The native Soul callback juices the used card after creating the Joker.
  let state=nextApkMathRandom(result.rng.mathState).state;
  for(const value of expected.followingMath){const next=nextApkMathRandom(state);assert.equal(next.value,value,label+'/math');state=next.state;}
  assert.deepEqual({rng,context},before,label+'/immutable');
  observed.add(card.entityId);editions.add(card.edition);
 }
 assert.deepEqual([...observed].sort(),[...legends,'j_joker'].sort());
 assert.deepEqual([...editions].sort(),['base','foil','holographic','negative','polychrome']);
});
