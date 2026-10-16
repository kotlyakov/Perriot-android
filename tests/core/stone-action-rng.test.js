import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {APK_BLINDS_BY_ID} from '../../src/content/apk-blinds.js';
import {evaluateHand} from '../../src/core/hands.js';
import {scoreHand} from '../../src/core/score.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {createApkRng,createApkMathState,nextApkRandom} from '../../src/core/apk-rng.js';
import {currentApkShopContext,APK_HAND_NAMES} from '../../src/core/apk-shop-state.js';
import {bossTarget} from '../../src/core/boss-effects.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {HANDS} from '../../src/content/hands.js';
const fixtures=JSON.parse(gunzipSync(readFileSync(new URL('../../scripts/reference-rng/stone-score-fixtures.json.gz',import.meta.url)))).cases;
const enhancement={'Stone Card':'stone','Lucky Card':'lucky','Glass Card':'glass','Steel Card':'steel',base:'base'};
const card=c=>({id:c.id,rank:c.rank,suit:c.suit.toLowerCase(),enhancement:enhancement[c.enhancement]??'base'});
const reload=s=>deserializeState(serializeState(s));
const act=(s,type,extra={})=>{const r=dispatch(s,{type,expectedRevision:s.revision,...extra});assert.equal(r.error,null);return r.state;};
function active(boss){
 let s=createRun('STONE21',{runId:'stone-action',money:20n,referenceRng:true,referenceShop:true});
 if(boss){const ante=['bl_final_heart','bl_final_bell'].includes(boss)?8:Math.max(2,APK_BLINDS_BY_ID[boss].minAnte);s.round.ante=ante;s.round.blindId='boss';s.apkShop.context.ante=ante;s.apkBlinds.ante=ante;s.apkBlinds.tagContext.ante=ante;s.apkBlinds.bossId=boss;s.apkBlinds.bossesUsed[boss]=1;s.round.target=bossTarget(s);}
 if(boss==='bl_final_heart'){s.jokers=[{id:'joker_1',entityId:'j_joker',sellCost:2n,creationOrdinal:1},{id:'joker_2',entityId:'j_joker',sellCost:2n,creationOrdinal:2}];s.nextJokerCreationOrdinal=3;}
 s=act(s,'START_BLIND');return s;
}
function stonePlay(boss,extra=false){let s=active(boss);const id=boss==='bl_final_bell'?s.bossState.forcedCardId:s.hand[0];s.cards[id].enhancement='stone';const ids=[id];if(extra){const glass=s.hand.find(x=>x!==id);s.cards[glass].enhancement='glass';s.jokers.push({id:'splash',entityId:'j_splash',sellCost:2n,creationOrdinal:s.nextJokerCreationOrdinal++});ids.push(glass);}s.apkShop.context=currentApkShopContext(s);assert.deepEqual(reload(s),s);return {before:s,after:act(s,'PLAY_HAND',{cardIds:ids})};}

test('actual native scoring-loop fixtures preserve chronological Stone/keyed draws and score',()=>{
 for(const [index,f] of fixtures.entries()){
  const played=f.playedSpecs.map(card).sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1))),held=f.heldSpecs.map(card),all=[...played,...held];
  const debuffed=[...f.playedSpecs,...f.heldSpecs].filter(c=>c.debuffed).map(c=>c.id);
  const s={handLevels:Object.fromEntries(Object.keys(HANDS).map(k=>[k,1])),jokers:(Array.isArray(f.jokers)?f.jokers:[]).map(j=>({id:j.id,entityId:j.key,sellCost:2n,...(j.debuffed?{debuffed:true}:{})})),cards:Object.fromEntries(all.map(c=>[c.id,c])),hand:all.map(c=>c.id),drawPile:[],discardPile:[],money:20n,round:{handsRemaining:1,discardsRemaining:3},rng:{apk:createApkRng(f.runSeed,createApkMathState(f.seed))},...(f.options.denied?{bossState:{id:'bl_mouth',firstHand:'pair'}}:debuffed.length?{bossState:{id:'bl_pillar',playedBeforeBoss:debuffed}}:{})};
  const actual=scoreHand(s,played),label=`native case ${index}, ${JSON.stringify(f.jokers)}, ${JSON.stringify(f.options)}`;
  assert.deepEqual(actual.actionRng.before.mathState,f.before,label);
  assert.deepEqual(actual.actionRng.draws.map(d=>d.key?d.value:-d.value),f.draws.map(d=>d.value),label);
  assert.deepEqual(actual.actionRng.after.mathState,f.after,label);
  assert.equal(actual.chips,BigInt(f.chips),label);assert.equal(Number(actual.mult?.n??actual.mult)/Number(actual.mult?.d??1),f.mult,label);assert.equal(actual.score,BigInt(f.score),label);
  assert.deepEqual(actual.scoringCardIds,f.options.denied?[]:f.scoringOrder,label);
  assert.equal(APK_HAND_NAMES[actual.handId],f.recognizedHand,label);
  assert.deepEqual(actual.glassRolls?.filter(r=>r.destroyed).map(r=>r.cardId)??[],f.destroyed,label);
  const {seed,hashed_seed,...streams}=f.streams;assert.deepEqual(actual.actionRng.after.streams,streams,label);
  assert.deepEqual(s.rng.apk.mathState,f.before,'pure scoring leaves caller RNG unchanged');
 }
});
test('Stone action snapshot survives roundtrip and rejects raw/provenance tampering',()=>{
 const {after}=stonePlay();assert.ok(after.lastScore.actionRng.draws.length);assert.deepEqual(reload(after),after);
 for(const mutate of [s=>s.rng.apk.mathState[0]='0000000000000000',s=>s.lastScore.actionRng.after.mathState[0]='0000000000000000',s=>s.lastScore.actionRng.before.mathState[0]='0000000000000000',s=>s.lastScore.actionRng.draws[0].value--,s=>s.lastScore.actionRng.contract='unknown']){const forged=structuredClone(after);mutate(forged);assert.throws(()=>serializeState(forged),/Invalid save data/);}
});
test('Stone and Stone+Glass replay exact post-score Heart/Bell/Wheel transitions and later discards',()=>{
 for(const boss of ['bl_final_heart','bl_final_bell','bl_wheel','bl_hook','bl_eye','bl_psychic'])for(const extra of [false,true]){
  const {after}=stonePlay(boss,extra);assert.deepEqual(reload(after),after,`${boss} glass:${extra}`);
  if(after.phase==='playing'){
   const id=boss==='bl_final_bell'?after.bossState.forcedCardId:after.hand[0];const discarded=act(after,'DISCARD',{cardIds:[id]});assert.deepEqual(reload(discarded),discarded,`${boss} discard glass:${extra}`);
   const forged=structuredClone(discarded);forged.rng.apk=nextApkRandom(forged.rng.apk).rng;assert.throws(()=>serializeState(forged),/Invalid save data/);
  }
 }
});

test('legacy score without action provenance retains old Stone-free draw contract',()=>{
 const {before}=stonePlay();const id=before.hand[0];before.cards[id].enhancement='stone';
 const oldScore=scoreHand(before,[before.cards[id]],{legacyRng:true});assert.equal(oldScore.actionRng,undefined);
 const after=act(before,'PLAY_HAND',{cardIds:[id]});after.lastScore=oldScore;after.rng.apk=structuredClone(before.rng.apk);
 assert.deepEqual(reload(after),after);
});

// Force the rare negative-ID collision deterministically. Native stores these
// groups at negative table keys, outside the positive returned rank list.
test('recognition preserves collision-dependent extra getters without inventing a Stone pair',()=>{
 const cards=[{id:'a',rank:2,suit:'spades',enhancement:'stone'},{id:'b',rank:3,suit:'spades',enhancement:'stone'}];
 let calls=0;const hand=evaluateHand(cards,{rankGetter:()=>{calls++;return -100;}});
 assert.equal(calls,34);assert.equal(hand.handId,'high_card');assert.deepEqual(hand.scoringCardIds,['a']);
});
test('Hook career queries precede the keyed discard draw and recognition follows it',()=>{
 const {before,after}=stonePlay('bl_hook');const p=after.lastScore.actionRng;assert.deepEqual(p.before,before.rng.apk);
 assert.equal(p.draws[0].phase,'career');assert.deepEqual(p.draws.slice(1,3).map(d=>d.phase),['boss_press_play','boss_press_play']);assert.equal(p.draws[3].phase,'recognition');
 assert.deepEqual(reload(after),after);
});

test('boss-rejected Stone hand retains Hanged shortfall replay facts',()=>{
 let s=active('bl_psychic');const [stone,destroy]=s.hand;s.cards[stone].enhancement='stone';
 s.consumables=[{id:'hanged',entityId:'c_hanged_man',originalKey:'c_hanged_man',set:'Tarot',edition:'base',cost:3n,sellCost:1n}];s.apkShop.context=currentApkShopContext(s);
 s=act(s,'USE_CONSUMABLE',{cardId:'hanged',targetCardIds:[destroy]});assert.deepEqual(reload(s),s);
 s=act(s,'PLAY_HAND',{cardIds:[stone]});assert.equal(s.lastScore.handDebuffed,true);assert.deepEqual(s.lastScore.scoringPilesBefore.hangedShortfallCardIds,[destroy]);assert.deepEqual(reload(s),s);
});
