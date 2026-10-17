import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {canUseConsumable} from '../../src/core/consumables.js';
import {scoreHand} from '../../src/core/score.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {describeShopItem} from '../../src/content/shop-display.js';
import {nextApkRandom} from '../../src/core/apk-rng.js';
import {APK_BOSSES} from '../../src/content/apk-blinds.js';
import {blindBase} from '../../src/core/blind-progression.js';

const centre=key=>catalogue.centres.find(card=>card.key===key);
const magician=()=>{const c=centre('c_magician');return {id:'magician',entityId:c.key,originalKey:c.key,set:c.set,edition:'base',cost:3n,sellCost:1n};};
const reload=state=>deserializeState(serializeState(state));
function run(seed='MAGICIAN'){let state=createRun(seed,{runId:'magician',money:4n,referenceRng:true,referenceShop:true});state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;state.consumables=[magician()];return state;}
function bossRun(id,seed='LUCKY0018',ante=3){let state=createRun(seed,{runId:'lucky-boss',money:4n,referenceRng:true,referenceShop:true});state.round.ante=ante;state.round.blindId='boss';state.round.target=blindBase(ante)*BigInt(APK_BOSSES.find(b=>b.id===id).mult);state.apkShop.context.ante=ante;state.apkBlinds.ante=ante;state.apkBlinds.tagContext.ante=ante;state.apkBlinds.bossId=id;state.apkBlinds.bossesUsed[id]=1;state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;state.cards[state.hand[0]].enhancement='lucky';state.apkShop.context.enhancementIds=['m_lucky'];return state;}

test('Magician converts one or two unique current hand cards to Lucky',()=>{
 for(const count of [1,2]){const state=run(),targets=state.hand.slice(0,count);state.cards[targets[0]].enhancement='bonus';const before=structuredClone(state),result=dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:'magician',targetCardIds:targets});
  assert.equal(canUseConsumable(state,state.consumables[0],targets).available,true);assert.equal(result.error,null);assert.deepEqual(targets.map(id=>result.state.cards[id].enhancement),Array(count).fill('lucky'));assert.deepEqual(result.events.filter(e=>e.type==='card_enhanced').map(e=>e.enhancement),Array(count).fill('lucky'));assert.deepEqual(state,before);assert.deepEqual(reload(result.state),result.state);
 }
 for(const targets of [[],['missing']]){const state=run(),before=structuredClone(state),result=dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:'magician',targetCardIds:targets});assert.equal(result.error.code,'INVALID_TARGETS');assert.equal(result.state,state);assert.deepEqual(state,before);}
});

test('Lucky Card rolls Mult before independent money and leaves preview state unchanged',()=>{
 const state=createRun('LUCKY0018',{runId:'lucky',money:4n,referenceRng:true,referenceShop:true}),card={id:'lucky',rank:14,suit:'spades',enhancement:'lucky'},before=structuredClone(state);
 const result=scoreHand(state,[card]);assert.equal(result.chips,16n);assert.equal(result.mult,21n);assert.equal(result.score,336n);
 assert.deepEqual(result.trace.slice(1,-1).map(e=>[e.type,e.operation,e.sourceId,e.amount]),[
  ['score_step','add_chips','lucky',undefined],['score_step','add_mult','lucky',undefined],['score_money',undefined,'lucky',20n],
 ]);
 assert.equal(result.luckyRolls[0].multRoll,0.16233118421935533);assert.equal(result.luckyRolls[0].moneyRoll,0.04223758985756576);assert.equal(result.luckyRolls[0].multTriggered,true);assert.equal(result.luckyRolls[0].moneyTriggered,true);
 assert.deepEqual(result.luckyRngBefore,{lucky_mult:null,lucky_money:null});assert.notDeepEqual(result.luckyRngAfter,result.luckyRngBefore);assert.deepEqual(state,before);
});

test('Lucky money remains independent when Mult misses and accepted play commits RNG and $20',()=>{
 let state=run('MONEY0016');const id=state.hand[0];state.cards[id].enhancement='lucky';state.consumables=[];state.apkShop.context.enhancementIds=['m_lucky'];const preview=scoreHand(state,[state.cards[id]]);assert.equal(preview.mult,1n);assert.equal(preview.trace.some(e=>e.type==='score_money'),true);assert.equal(preview.luckyRolls[0].multRoll,0.7969492796318125);assert.equal(preview.luckyRolls[0].moneyRoll,0.05199472695143137);
 const beforeMoney=state.money,result=dispatch(state,{type:'PLAY_HAND',expectedRevision:state.revision,cardIds:[id]});assert.equal(result.error,null);assert.equal(result.state.money,beforeMoney+20n);assert.deepEqual({lucky_mult:result.state.rng.apk.streams.lucky_mult,lucky_money:result.state.rng.apk.streams.lucky_money,mathState:result.state.rng.apk.mathState},preview.luckyRngAfter);assert.equal(nextApkRandom(result.state.rng.apk).value,nextApkRandom({...state.rng.apk,streams:{...state.rng.apk.streams,lucky_mult:preview.luckyRngAfter.lucky_mult,lucky_money:preview.luckyRngAfter.lucky_money},mathState:preview.luckyRngAfter.mathState}).value);assert.deepEqual(result.events.filter(e=>e.type==='money_changed'),[{type:'money_changed',before:beforeMoney,after:beforeMoney+20n,delta:20n}]);assert.deepEqual(reload(result.state),result.state);
});

test('non-scoring and boss-debuffed Lucky cards consume no RNG',()=>{
 const state=createRun('LUCKY0018',{runId:'lucky-skip',money:4n,referenceRng:true,referenceShop:true}),pair=[{id:'a',rank:8,suit:'clubs'},{id:'b',rank:8,suit:'hearts'},{id:'k',rank:14,suit:'spades',enhancement:'lucky'}],before=structuredClone(state.rng.apk);
 let result=scoreHand(state,pair);assert.equal(result.scoringCardIds.includes('k'),false);assert.equal(result.luckyRolls,undefined);assert.deepEqual(state.rng.apk,before);
 result=scoreHand({...state,bossState:{id:'bl_club'}},[{id:'d',rank:14,suit:'clubs',enhancement:'lucky'}]);assert.equal(result.trace.filter(e=>e.type==='score_money').length,0);assert.equal(result.luckyRolls,undefined);assert.deepEqual(state.rng.apk,before);
});

test('two scoring Lucky cards advance both keyed streams in card order; Splash includes the kicker',()=>{
 const state=createRun('LUCKY0018',{runId:'lucky-order',money:4n,referenceRng:true,referenceShop:true}),cards=[{id:'a',rank:8,suit:'clubs',enhancement:'lucky'},{id:'b',rank:8,suit:'hearts',enhancement:'lucky'},{id:'k',rank:14,suit:'spades',enhancement:'lucky'}];
 let rng=state.rng.apk;const expected=[];for(let i=0;i<2;i++){const mult=nextApkRandom(rng,'lucky_mult');rng=mult.rng;const money=nextApkRandom(rng,'lucky_money');rng=money.rng;expected.push([mult.value,money.value]);}
 const pair=scoreHand(state,cards);assert.deepEqual(pair.luckyRolls.map(r=>[r.multRoll,r.moneyRoll]),expected);assert.deepEqual(pair.luckyRngAfter,{lucky_mult:rng.streams.lucky_mult,lucky_money:rng.streams.lucky_money,mathState:rng.mathState});assert.deepEqual(pair.luckyRolls.map(r=>r.cardId),['a','b']);
 const splash=scoreHand({...state,jokers:[{id:'s',entityId:'joker_splash'}]},cards);assert.deepEqual(splash.luckyRolls.map(r=>r.cardId),['a','b','k']);
});

test('save replay rejects forged Lucky payout, outcome and RNG metadata',()=>{
 let state=run('LUCKY0018');const id=state.hand[0];state.cards[id].enhancement='lucky';state.consumables=[];state.apkShop.context.enhancementIds=['m_lucky'];state=dispatch(state,{type:'PLAY_HAND',expectedRevision:state.revision,cardIds:[id]}).state;const payload=JSON.parse(serializeState(state));
 for(const mutate of [p=>p.state.lastScore.trace.find(e=>e.type==='score_money').amount='40',p=>p.state.lastScore.luckyRolls[0].moneyTriggered=false,p=>p.state.lastScore.luckyRngAfter.lucky_money=0.5]){const copy=structuredClone(payload);mutate(copy);assert.throws(()=>deserializeState(JSON.stringify(copy)));}
});

test('Lucky replay preserves Eye and Mouth pre-score history',()=>{
 for(const id of ['bl_eye','bl_mouth']){const state=bossRun(id),result=dispatch(state,{type:'PLAY_HAND',expectedRevision:state.revision,cardIds:[state.hand[0]]});assert.equal(result.error,null);assert.deepEqual(reload(result.state),result.state);}
});

test('Lucky stream commit preserves Hook advancement',()=>{
 const state=bossRun('bl_hook'),result=dispatch(state,{type:'PLAY_HAND',expectedRevision:state.revision,cardIds:[state.hand[0]]});assert.equal(result.error,null);assert.ok(result.state.rng.apk.streams.hook);assert.deepEqual(reload(result.state),result.state);
});

test('save rejects forged non-Lucky fields in Lucky RNG snapshots',()=>{
 const state=bossRun('bl_wall'),played=dispatch(state,{type:'PLAY_HAND',expectedRevision:state.revision,cardIds:[state.hand[0]]}).state,payload=JSON.parse(serializeState(played));payload.state.lastScore.luckyRngBefore.mathState=[...payload.state.lastScore.luckyRngAfter.mathState];assert.throws(()=>deserializeState(JSON.stringify(payload)));
});

test('Lucky Card codec, shop identity and Russian descriptions are truthful',()=>{
 const state=run(),id=state.hand[0];state.cards[id].enhancement='lucky';state.apkShop.context.enhancementIds=['m_lucky'];assert.deepEqual(reload(state),state);
 assert.equal(describeShopItem(magician()).description,'Усиливает до 2 выбранных карт: каждая получает независимые шансы 1 из 5 на +20 к множителю и 1 из 15 на $20 при подсчёте.');
});
