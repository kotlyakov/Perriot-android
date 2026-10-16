import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {bossTarget} from '../../src/core/boss-effects.js';
const reload=s=>deserializeState(serializeState(s));
const act=(s,type,rest={})=>{const r=dispatch(s,{type,expectedRevision:s.revision,...rest});assert.equal(r.error,null);return r.state;};
const j=(key,i)=>({id:'repeat-'+i,entityId:key,sellCost:2n,creationOrdinal:i+1});
function fixture({reference=true,boss,glass=false}={}){
 let s=createRun('REPEAT-SAVE-5',{runId:'repeat-save5',money:4n,referenceRng:reference,referenceShop:reference});
 s.jokers=['j_hanging_chad','j_hack','j_dusk','j_splash','j_bull'].map(j);s.nextJokerCreationOrdinal=6;
 if(boss){const ante=['bl_final_heart','bl_final_bell','bl_final_leaf'].includes(boss)?8:3;s.round.ante=ante;s.round.blindId='boss';s.apkShop.context.ante=ante;s.apkBlinds.ante=ante;s.apkBlinds.tagContext.ante=ante;s.apkBlinds.bossId=boss;s.apkBlinds.bossesUsed[boss]=1;s.round.target=bossTarget(s);}
 s=act(s,'START_BLIND');s.round.handsRemaining=1;
 const first=boss==='bl_final_bell'?s.bossState.forcedCardId:s.hand[0],second=s.hand.find(id=>id!==first);
 s.cards[first].rank=2;s.cards[first].enhancement='lucky';s.cards[second].rank=3;s.cards[second].enhancement=glass?'glass':'lucky';
 if(reference)s.apkShop.context=currentApkShopContext(s);
 return {s,ids:[first,second]};
}
test('repeated Lucky rows above five save in order and pay trace money exactly once',()=>{
 const {s,ids}=fixture(),before=s.money,r=act(s,'PLAY_HAND',{cardIds:ids});
 assert.ok(r.lastScore.luckyRolls.length>5);assert.deepEqual(reload(r),r);
 const earned=r.lastScore.trace.filter(e=>e.type==='score_money').reduce((n,e)=>n+e.amount,0n);
 assert.equal(r.money,before+earned);assert.equal(r.runStats.handsPlayed,s.runStats.handsPlayed+1);
 assert.deepEqual(reload(reload(r)),r);
});
test('repeat marker and ordered Lucky evidence reject added, missing and foreign metadata',()=>{
 const {s,ids}=fixture(),r=act(s,'PLAY_HAND',{cardIds:ids}),raw=JSON.parse(serializeState(r));
 for(const mutate of [
  p=>p.state.lastScore.trace.splice(p.state.lastScore.trace.findIndex(e=>e.type==='score_repeat'),1),
  p=>p.state.lastScore.trace.find(e=>e.type==='score_repeat').effectSourceId='foreign',
  p=>p.state.lastScore.trace.find(e=>e.type==='score_repeat').sourceId=p.state.hand[0],
  p=>p.state.lastScore.trace.find(e=>e.type==='score_repeat').extra=1,
  p=>p.state.lastScore.luckyRolls.pop(),
  p=>p.state.lastScore.luckyRolls.reverse(),
  p=>p.state.lastScore.luckyRolls[0].multTriggered=!p.state.lastScore.luckyRolls[0].multTriggered,
  p=>delete p.state.lastScore.scoringRoundBefore,
  p=>p.state.lastScore.scoringRoundBefore.handsRemaining=2,
 ]){const p=structuredClone(raw);mutate(p);assert.throws(()=>deserializeState(JSON.stringify(p)));}
});
test('mixed repeated Lucky and Glass save through APK and chronological effects RNG',()=>{
 for(const reference of [true,false]){const {s,ids}=fixture({reference,glass:true}),r=act(s,'PLAY_HAND',{cardIds:ids});assert.equal(r.lastScore.glassRolls.length,1);assert.deepEqual(reload(r),r);}
});
test('postscore Heart, Bell, Leaf and last-hand Needle preserve repeated score replay',()=>{
 for(const boss of ['bl_final_heart','bl_final_bell','bl_final_leaf','bl_needle']){
  const {s,ids}=fixture({boss,glass:true}),r=act(s,'PLAY_HAND',{cardIds:ids});assert.deepEqual(reload(r),r,boss);
  assert.equal(r.round.handsRemaining,0);assert.equal((r.lastScore.glassRolls??[]).length,boss==='bl_final_leaf'?0:1);
 }
});
test('continuing repeat hands authenticate redraws, later discards and mandatory APK provenance',()=>{
 for(const boss of ['bl_final_heart','bl_final_bell','bl_wheel','bl_hook']){
  const {s,ids}=fixture({boss,glass:true});s.round.handsRemaining=3;
  if(boss==='bl_wheel'||boss==='bl_hook'){s.round.ante=9;s.apkShop.context.ante=9;s.apkBlinds.ante=9;s.apkBlinds.tagContext.ante=9;s.roundNumber=27;s.round.target=bossTarget(s);}
  const r=act(s,'PLAY_HAND',{cardIds:ids});assert.equal(r.phase,'playing',boss);assert.deepEqual(reload(r),r,boss);
  const selected=boss==='bl_final_bell'?r.bossState.forcedCardId:r.hand[0],later=act(r,'DISCARD',{cardIds:[selected]});assert.deepEqual(reload(later),later,boss);
  const p=JSON.parse(serializeState(r));delete p.state.lastScore.actionRng;assert.throws(()=>deserializeState(JSON.stringify(p)),boss+' requires provenance');
 }
});
test('negative slot expansion persists more than five Lucky evaluations and early wins do not trigger Dusk',()=>{
 const {s,ids}=fixture();s.jokers.push({...j('j_sock_and_buskin',5),edition:'negative'});s.nextJokerCreationOrdinal=7;
 for(const id of ids)s.cards[id].rank=11;
 const r=act(s,'PLAY_HAND',{cardIds:ids});assert.ok(r.lastScore.luckyRolls.length>5);assert.deepEqual(reload(r),r);
 const {s:early,ids:earlyIds}=fixture();early.round.handsRemaining=3;early.round.score=early.round.target-1n;
 const won=act(early,'PLAY_HAND',{cardIds:earlyIds});assert.equal(won.phase,'round_won');assert.equal(won.round.handsRemaining,2);
 assert.equal(won.lastScore.trace.some(e=>e.type==='score_repeat'&&e.effectSourceId==='repeat-2'),false);assert.deepEqual(reload(won),won);
});
