import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreHand} from '../../src/core/score.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {describeShopItem} from '../../src/content/shop-display.js';
const cards=(ranks,suit='spades')=>ranks.map((rank,i)=>({id:'p'+i,rank,suit}));
const state=keys=>({handLevels:{},hand:[],cards:{},jokers:keys.map((entityId,i)=>({id:'j'+i,entityId}))});
test('Four Fingers activates four-card Straight Flush and excludes the unrelated fifth scoring card',()=>{
 const played=[...cards([2,3,4,5]),{id:'k',rank:13,suit:'hearts'}];
 const r=scoreHand(state(['j_four_fingers']),played);assert.equal(r.handId,'straight_flush');assert.deepEqual(r.scoringCardIds,['p0','p1','p2','p3']);assert.equal(r.score,912n);
 const plain=scoreHand(state([]),played);assert.equal(plain.handId,'high_card');assert.deepEqual(plain.scoringCardIds,['k']);
});
test('Shortcut activates repeated single-rank gaps; its Straight still triggers existing combination Jokers',()=>{
 const played=cards([2,4,6,8,10]).map((c,i)=>({...c,suit:['clubs','diamonds','hearts','spades','clubs'][i]}));
 const r=scoreHand(state(['j_shortcut','j_order']),played);assert.equal(r.handId,'straight');assert.equal(r.mult,12n);assert.equal(r.score,720n);
});
test('Four Fingers and Shortcut compose and preserve the native four-card Royal display',()=>{
 const r=scoreHand(state(['j_four_fingers','j_shortcut']),cards([10,11,12,13]));assert.equal(r.handId,'straight_flush');assert.equal(r.isRoyal,true);
 for(const key of ['j_four_fingers','j_shortcut'])assert.equal(describeShopItem({entityId:key}).canBuy,true);
});
function playing(){let s=createRun('four-save',{runId:'four-save',money:10n});s=dispatch(s,{type:'START_BLIND',expectedRevision:0}).state;s.jokers=[{id:'four',entityId:'j_four_fingers',cost:7n,sellCost:3n}];s.hand=['card_spades_2','card_spades_3','card_spades_4','card_spades_5','card_hearts_13','card_hearts_2','card_hearts_3','card_hearts_4'];s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));return s;}
test('modifier scoring survives run dispatch and strict save replay',()=>{
 const s=playing(),r=dispatch(s,{type:'PLAY_HAND',expectedRevision:s.revision,cardIds:s.hand.slice(0,5)});assert.equal(r.error,null);assert.equal(r.state.lastScore.handId,'straight_flush');assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
});
test('Arm lowers the recognized modifier hand rather than the ordinary high-card fallback',()=>{
 const s=playing();s.bossState={id:'bl_arm'};s.handLevels.straight_flush=3;s.handLevels.high_card=3;
 const r=dispatch(s,{type:'PLAY_HAND',expectedRevision:s.revision,cardIds:s.hand.slice(0,5)});assert.equal(r.error,null);assert.equal(r.state.handLevels.straight_flush,2);assert.equal(r.state.handLevels.high_card,3);
});
