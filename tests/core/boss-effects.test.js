import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {scoreHand} from '../../src/core/score.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const effects=await import('../../src/core/boss-effects.js').catch(()=>({}));
const create=()=>createRun('AAAAAAA1',{runId:'boss',money:4n,referenceRng:true,referenceShop:true});
function pending(id){const s=create();s.apkBlinds.bossId=id;s.apkBlinds.bossesUsed.bl_window=0;s.apkBlinds.bossesUsed[id]=1;s.round.blindId='boss';s.round.target=600n;return s;}
const act=(s,type,cardIds)=>dispatch(s,{type,cardIds,expectedRevision:s.revision});
test('all eight ante-one bosses can start, retain full selection pool and save/resume',()=>{
 assert.deepEqual(effects.FIRST_ANTE_BOSSES?.length,8);
 for(const id of effects.FIRST_ANTE_BOSSES){const s=pending(id),r=act(s,'START_BLIND');assert.equal(r.error,null);assert.equal(r.state.bossState.id,id);assert.equal(r.state.hand.length,id==='bl_manacle'?7:8);assert.equal(r.state.roundNumber,3);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);}
});
test('debuffed cards still form a flush but award no card chips or card-triggered joker effects',()=>{
 for(const [boss,suit] of [['bl_club','clubs'],['bl_goad','spades'],['bl_window','diamonds'],['bl_head','hearts']]){
  const s=act(pending(boss),'START_BLIND').state;s.jokers=[{id:'ind',entityId:'j_joker'},{id:'card',entityId:'j_scholar'}];
  const cards=[2,4,7,9,14].map(rank=>s.cards[`card_${suit}_${rank}`]);const score=scoreHand(s,cards);
  assert.equal(score.handId,'flush');assert.equal(score.score,35n*8n);assert.equal(score.trace.filter(t=>t.phase==='scored_card').length,0);
 }
});
test('Psychic consumes an underfilled hand for zero without scoring jokers and resumes exactly',()=>{
 const s=act(pending('bl_psychic'),'START_BLIND').state;s.jokers=[{id:'ind',entityId:'j_joker'}];const r=act(s,'PLAY_HAND',s.hand.slice(0,4));
 assert.equal(r.error,null);assert.equal(r.state.lastScore.score,0n);assert.equal(r.state.round.handsRemaining,3);assert.equal(r.state.round.score,0n);assert.equal(r.state.lastScore.handDebuffed,true);assert.equal(r.state.hand.length,8);
 assert.deepEqual(deserializeState(serializeState(r.state)),r.state);assert.ok(scoreHand(s,s.hand.slice(0,5).map(id=>s.cards[id])).score>0n);
});
test('Pillar snapshots previously played cards, discards do not enter ante history',()=>{
 const s=create(),started=act(s,'START_BLIND').state;const played=started.hand.slice(0,1),discarded=started.hand.slice(1,2);
 const after=act(started,'PLAY_HAND',played).state,next=act(after,'DISCARD',discarded).state;assert.deepEqual(next.apkBlinds.playedCardIds,played);
 const boss=pending('bl_pillar');boss.apkBlinds.playedCardIds=played;const active=act(boss,'START_BLIND').state;
 assert.equal(effects.isBossCardDebuffed(active,active.cards[played[0]]),true);assert.equal(effects.isBossCardDebuffed(active,active.cards[discarded[0]]),false);
 const score=scoreHand(active,[active.cards[played[0]]]);assert.equal(score.trace.filter(t=>t.phase==='scored_card').length,0);
});
test('Hook removes two unplayed cards without spending a discard, advances RNG and survives reload',()=>{
 const s=act(pending('bl_hook'),'START_BLIND').state,before=structuredClone(s),ids=s.hand.slice(0,3);const r=act(s,'PLAY_HAND',ids),forced=r.events.find(e=>e.type==='cards_forced_discarded');
 assert.equal(r.error,null);assert.equal(forced.cardIds.length,2);assert.ok(forced.cardIds.every(id=>s.hand.includes(id)&&!ids.includes(id)));assert.equal(r.state.round.discardsRemaining,s.round.discardsRemaining);assert.equal(r.state.discardPile.length,5);assert.equal(r.state.drawPile.length,s.drawPile.length-5);assert.ok(r.state.rng.apk.streams.hook);assert.deepEqual(s,before);
 assert.deepEqual(deserializeState(serializeState(r.state)),r.state);assert.deepEqual(act(deserializeState(serializeState(s)),'PLAY_HAND',ids),r);
});
test('boss completion restores Manacle hand size and pays five dollars; next ante remains gated',()=>{
 const s=act(pending('bl_manacle'),'START_BLIND').state;s.phase='round_won';s.round.score=600n;s.round.handsRemaining=1;
 const cash=act(s,'CASH_OUT');assert.equal(cash.error,null);assert.equal(cash.state.money,10n);assert.equal(cash.state.round.handSize,8);assert.equal(cash.state.bossState,undefined);assert.deepEqual(deserializeState(serializeState(cash.state)),cash.state);
 const next=act(cash.state,'LEAVE_SHOP');assert.equal(next.state,cash.state);assert.ok(next.error);
});
test('old saves lack ante history and cannot enter boss; malformed boss state is rejected',()=>{
 const s=pending('bl_window');delete s.apkBlinds.playedCardIds;assert.ok(act(s,'START_BLIND').error);
 const active=act(pending('bl_window'),'START_BLIND').state;for(const mutate of [s=>s.bossState.id='bl_hook',s=>s.bossState.extra=1,s=>s.bossState.baseHandSize=7,s=>s.bossState.playedBeforeBoss=['missing']]){const copy=structuredClone(active);mutate(copy);assert.throws(()=>serializeState(copy));}
});
