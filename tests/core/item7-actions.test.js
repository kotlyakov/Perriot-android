import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch,replayEffectActions} from '../../src/core/run.js';
import {createShop} from '../../src/core/shop.js';
import {bossTarget} from '../../src/core/boss-effects.js';
const act=(s,type,fields={})=>{const action={type,expectedRevision:s.revision,...fields},result=dispatch(s,action);assert.equal(result.error,null);return {state:result.state,action};};
function buy(key){let s=createRun('REVIEW7',{runId:'review7',money:100n,referenceRng:true,referenceShop:true});s.phase='shop';s.shop=createShop({offers:{main:[{id:'offer',entityId:key,originalKey:key,set:'Joker',edition:'base',cost:4n,sellCost:2n}],vouchers:[],boosters:[]}});s=act(s,'BUY_SHOP_CARD',{offerId:'offer'}).state;s.phase='blind_selection';s.shop=null;s.apkShop.context.usedCentreIds=[key];return s;}
test('Turtle terminal play uses identical passive transitions during authenticated replay',()=>{
 let s=act(buy('j_turtle_bean'),'START_BLIND').state;
 for(let i=0;i<4;i++)s=act(s,'PLAY_HAND',{cardIds:s.hand.slice(0,1)}).state;
 assert.equal(s.phase,'game_over');assert.equal(s.round.handSize,12);
 const replay=replayEffectActions(s.effectReplay.before,s.effectReplay.actions),expected=structuredClone(s);delete expected.effectReplay;
 assert.deepEqual(replay,expected);
});
test('Heart deals to the final passive hand size when Juggler is disabled and reactivated',()=>{
 let s=createRun('HEART0',{runId:'heart7',money:100n,referenceRng:true,referenceShop:true});
 s.round.ante=8;s.round.blindId='boss';s.round.handSize=9;s.apkShop.context.ante=8;s.apkBlinds.ante=8;s.apkBlinds.tagContext.ante=8;s.apkBlinds.bossId='bl_final_heart';s.apkBlinds.bossesUsed.bl_final_heart=1;s.round.target=bossTarget(s);
 s.jokers=[{id:'j1',entityId:'j_juggler',sellCost:2n,creationOrdinal:1},{id:'j2',entityId:'j_joker',sellCost:2n,creationOrdinal:2}];s.nextJokerCreationOrdinal=3;
 s=act(s,'START_BLIND').state;assert.equal(s.hand.length,s.round.handSize);
 s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;assert.equal(s.hand.length,s.round.handSize);assert.equal(s.round.handSize,9);
});
test('Chaos replenishes its free reroll on every newly entered shop',()=>{
 let s=buy('j_chaos');s.phase='round_won';s.round.score=300n;
 s=act(s,'CASH_OUT').state;assert.equal(s.shop.freeRerolls,1);
 s=act(s,'REROLL_SHOP').state;assert.equal(s.shop.freeRerolls,0);
 s=act(s,'LEAVE_SHOP').state;s.phase='round_won';s.round.score=s.round.target;
 s=act(s,'CASH_OUT').state;assert.equal(s.shop.freeRerolls,1);
});
