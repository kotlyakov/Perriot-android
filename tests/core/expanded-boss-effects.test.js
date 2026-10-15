import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../../src/core/run.js';
import {scoreHand} from '../../src/core/score.js';
import {APK_BOSSES} from '../../src/content/apk-blinds.js';
const effects=await import('../../src/core/boss-effects.js');
const state=(id,ante=2)=>{const s=createRun('AAAAAAA1',{runId:'expanded_boss',money:4n,referenceRng:true,referenceShop:true});s.apkBlinds.bossId=id;s.mostPlayedHand='high_card';s.round.ante=ante;s.bossState={id,playedBeforeBoss:[],playedHands:[],firstHand:null};return s;};
const cards=(s,...ranks)=>ranks.map((rank,i)=>s.cards[`card_${['clubs','hearts','spades','diamonds'][i%4]}_${rank}`]);

test('ordinary bosses enter eligible non-showdown antes; all five showdown lifecycles are admitted',()=>{
 assert.deepEqual(effects.SUPPORTED_BOSSES,APK_BOSSES.map(b=>b.id));
 for(const boss of APK_BOSSES.filter(b=>!b.showdown))for(const ante of [1,2,8])assert.equal(effects.canEnterBoss(state(boss.id,ante)),boss.minAnte<=ante&&ante!==8);
 for(const ante of [0,9,1.5])assert.equal(effects.canEnterBoss(state('bl_wall',ante)),false);
 for(const boss of APK_BOSSES.filter(b=>b.showdown))assert.equal(effects.canEnterBoss(state(boss.id)),false);
 const s=state('bl_plant');s.cards.card_clubs_2.id='other';assert.equal(effects.canEnterBoss(s),false);
 assert.equal(effects.canEnterFirstAnteBoss(state('bl_wall',1)),false);
 assert.equal(effects.canEnterFirstAnteBoss(state('bl_hook',1)),true);
});
test('boss targets use ante base and individual APK multipliers',()=>{
 assert.equal(typeof effects.bossTarget,'function');
 assert.equal(effects.bossTarget(state('bl_wall',2)),3200n);
 assert.equal(effects.bossTarget(state('bl_needle',8)),50000n);
 assert.equal(effects.bossTarget(state('bl_plant',4)),10000n);
 assert.equal(effects.bossTarget(state('bl_final_vessel',8)),300000n);
 assert.equal(effects.bossTarget(state('bl_wall',9)),440000n);
});
test('Plant debuffs only J Q K; recognition and independent jokers remain active',()=>{
 const s=state('bl_plant');s.jokers=[{id:'ind',entityId:'j_joker'}];
 for(const rank of [2,10,14])assert.equal(effects.isBossCardDebuffed(s,cards(s,rank)[0]),false);
 for(const rank of [11,12,13])assert.equal(effects.isBossCardDebuffed(s,cards(s,rank)[0]),true);
 const result=scoreHand(s,cards(s,12,12));assert.equal(result.handId,'pair');assert.equal(result.score,60n);assert.equal(result.trace.filter(e=>e.phase==='scored_card').length,0);
});
test('Eye rejects previously played hand IDs without mutating history',()=>{
 const s=state('bl_eye');s.bossState.playedHands=['pair'];s.jokers=[{id:'ind',entityId:'j_joker'}];const before=structuredClone(s);
 assert.equal(effects.isBossHandDebuffed(s,cards(s,3,3),'pair'),true);
 const result=scoreHand(s,cards(s,3,3));assert.equal(result.handDebuffed,true);assert.equal(result.score,0n);assert.equal(result.trace.some(e=>e.phase==='independent'),false);
 assert.ok(scoreHand(s,cards(s,3)).score>0n);assert.deepEqual(s,before);
});
test('Mouth allows first hand and its repeats, rejecting a different hand without mutation',()=>{
 const s=state('bl_mouth');assert.ok(scoreHand(s,cards(s,4,4)).score>0n);assert.equal(s.bossState.firstHand,null);
 s.bossState.firstHand='pair';assert.ok(scoreHand(s,cards(s,5,5)).score>0n);assert.equal(scoreHand(s,cards(s,14)).score,0n);
});
test('Flint halves level-adjusted base values with upward rounding before cards and jokers',()=>{
 const s=state('bl_flint');s.jokers=[{id:'ind',entityId:'j_joker'}];
 const high=scoreHand(s,cards(s,2));assert.deepEqual(high.trace[0].after,{chips:3n,mult:1n});assert.equal(high.score,25n);
 s.handLevels.pair=2;const pair=scoreHand(s,cards(s,4,4));assert.deepEqual(pair.trace[0].after,{chips:13n,mult:2n});assert.equal(pair.score,126n);
});
test('hidden-card UI IDs do not affect recognition, score, or card modifiers',()=>{
 const s=state('bl_house'),played=cards(s,11,11);const expected=scoreHand(s,played);s.bossState.hiddenCardIds=played.map(c=>c.id);
 assert.deepEqual(scoreHand(s,played),expected);assert.ok(played.every(c=>!Object.hasOwn(c,'hidden')));
});
test('Ox target resolves a unique APK-name count maximum and rejects native runtime-dependent ties',()=>{
 assert.equal(typeof effects.resolveMostPlayedHand,'function');
 assert.equal(effects.resolveMostPlayedHand({'High Card':3,Pair:4,Flush:2}),'pair');
 assert.equal(effects.resolveMostPlayedHand({'High Card':0,Pair:0,Flush:1}),'flush');
 assert.equal(effects.resolveMostPlayedHand({'High Card':4,Pair:4}),null);
 assert.equal(effects.resolveMostPlayedHand({}),null);
 assert.throws(()=>effects.resolveMostPlayedHand({Pair:-1}));
 assert.throws(()=>effects.resolveMostPlayedHand({Pair:1.5}));
 assert.throws(()=>effects.resolveMostPlayedHand({Imaginary:2}));
});
test('Ox entry requires a resolved native target while other bosses tolerate an unresolved snapshot',()=>{
 const s=state('bl_ox',6);assert.equal(effects.canEnterBoss(s),true);
 for(const value of [null,undefined,'Imaginary']){s.mostPlayedHand=value;assert.equal(effects.canEnterBoss(s),false);}
 s.apkBlinds.bossId='bl_wall';assert.equal(effects.canEnterBoss(s),true);
});
