import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';

const act=(s,type,cardIds)=>dispatch(s,{type,expectedRevision:s.revision,...(cardIds?{cardIds}:{})});
test('run summary records actual played and discarded cards through a loss',()=>{
 let s=createRun('summary',{runId:'summary',money:4n});
 assert.deepEqual(s.runSummary,{bestHand:0n,cardsPlayed:0,cardsDiscarded:0,cardsPurchased:0,rerolls:0});
 s=act(s,'START_BLIND').state;
 s=act(s,'DISCARD',s.hand.slice(0,2)).state;
 s.round.handsRemaining=1;s.round.target=1000000n;
 const result=act(s,'PLAY_HAND',s.hand.slice(0,3));
 assert.equal(result.error,null);assert.equal(result.state.phase,'game_over');
 assert.equal(result.state.runSummary.cardsPlayed,3);
 assert.equal(result.state.runSummary.cardsDiscarded,2);
 assert.equal(result.state.runSummary.bestHand,result.state.lastScore.score);
 assert.equal(s.runSummary.cardsPlayed,0);
 const rejected=act(result.state,'PLAY_HAND',[]);assert.equal(rejected.state.runSummary.cardsPlayed,3);
});

test('summary survives loss save/reload and preserves counters across resume',async()=>{
 const {serializeState,deserializeState}=await import('../../src/persistence/save.js');
 let s=createRun('summary-save',{runId:'summary-save',money:4n});s=act(s,'START_BLIND').state;
 s=act(s,'DISCARD',s.hand.slice(0,2)).state;s=deserializeState(serializeState(s));
 s.round.handsRemaining=1;s.round.target=1000000n;s=act(s,'PLAY_HAND',s.hand.slice(0,3)).state;
 assert.deepEqual(deserializeState(serializeState(s)).runSummary,s.runSummary);
 assert.equal(s.runSummary.cardsDiscarded,2);assert.equal(s.runSummary.cardsPlayed,3);
});

test('summary records purchases, free rerolls and forced discards without counting generated rewards',async()=>{
 const {recordRunSummary,createRunSummary}=await import('../../src/core/run-summary.js');
 const previous={phase:'shop',runSummary:createRunSummary()},next={lastScore:{score:10n}};
 recordRunSummary(previous,next,[{type:'shop_card_bought'},{type:'voucher_redeemed'},{type:'booster_opened'},{type:'shop_rerolled',cost:0n},{type:'cards_forced_discarded',cardIds:['a','b']},{type:'playing_card_added'}]);
 assert.equal(next.runSummary.cardsPurchased,3);assert.equal(next.runSummary.rerolls,1);assert.equal(next.runSummary.cardsDiscarded,2);
 assert.equal(previous.runSummary.cardsPurchased,0);
});

test('seeded and challenge runs keep their own totals despite career exclusions',async()=>{
 const {createProfile,updateProfile}=await import('../../src/core/profile.js');
 for(const options of [{},{challengeId:'omelette'}]){
  let s=createRun('summary-modes',{runId:'summary-modes',money:4n,...options});s=act(s,'START_BLIND').state;
  const profile=updateProfile(createProfile(),null,s,[],{seeded:!options.challengeId});const result=act(s,'PLAY_HAND',s.hand.slice(0,1));assert.equal(result.error,null);assert.equal(result.state.runSummary.cardsPlayed,1);const updated=updateProfile(profile,s,result.state,result.events);assert.equal(updated.career.c_cards_played,0);
 }
});

test('free tag pack openings do not count as purchased cards',async()=>{
 const {recordRunSummary,createRunSummary}=await import('../../src/core/run-summary.js');
 const opened=[{type:'booster_opened',entityId:'p_arcana_mega_1'}];
 for(const phase of ['blind_selection','pack']){
  const next={};recordRunSummary({phase,runSummary:createRunSummary()},next,opened);assert.equal(next.runSummary.cardsPurchased,0);
 }
 const next={};recordRunSummary({phase:'shop',runSummary:createRunSummary()},next,opened);assert.equal(next.runSummary.cardsPurchased,1);
});
