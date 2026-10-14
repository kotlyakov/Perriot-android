import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {blindBase} from '../../src/core/blind-progression.js';
import {deserializeState,serializeState} from '../../src/persistence/save.js';
import {chooseHookDiscards} from '../../src/core/boss-effects.js';
import {nextApkRandom} from '../../src/core/apk-rng.js';
function hook(){let s=createRun('HOOKPREPLAY',{runId:'hook-preplay',money:10n,referenceRng:true,referenceShop:true});s.round.ante=3;s.round.blindId='boss';s.round.target=blindBase(3)*2n;s.apkShop.context.ante=3;s.apkBlinds.ante=3;s.apkBlinds.tagContext.ante=3;s.apkBlinds.bossId='bl_hook';s.apkBlinds.bossesUsed.bl_hook=1;s=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision}).state;s.hand=['card_clubs_2','card_clubs_13','card_diamonds_13'];s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));return s;}
// Native press_play removes Hook's forced cards before evaluate_play.
test('Hook-discarded cards cannot trigger held Steel, Raised Fist or Baron during the hand',()=>{
 for(const entityId of ['j_baron','j_raised_fist']){
  const s=hook();s.jokers=[{id:'j',entityId}];s.cards.card_clubs_13.enhancement='steel';s.cards.card_diamonds_13.enhancement='steel';s.apkShop.context.enhancementIds=['m_steel'];const before=structuredClone(s);
  const r=dispatch(s,{type:'PLAY_HAND',expectedRevision:s.revision,cardIds:['card_clubs_2']});assert.equal(r.error,null);assert.equal(r.state.lastScore.mult,1n);assert.equal(r.state.lastScore.score,7n);assert.equal(r.state.lastScore.trace.some(e=>e.phase==='held_card'),false);assert.deepEqual(r.state.lastScore.heldCardIds,[]);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);assert.deepEqual(s,before);
 }
});
test('Hook random choices precede Lucky and preserve their combined global RNG',()=>{
 const s=hook();s.cards.card_clubs_2.enhancement='lucky';s.apkShop.context.enhancementIds=['m_lucky'];const hookRng=chooseHookDiscards(s.rng.apk,s.hand.slice(1)).rng;const mult=nextApkRandom(hookRng,'lucky_mult'),money=nextApkRandom(mult.rng,'lucky_money');
 const r=dispatch(s,{type:'PLAY_HAND',expectedRevision:s.revision,cardIds:['card_clubs_2']});assert.equal(r.error,null);assert.deepEqual(r.state.rng.apk,money.rng);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
});
