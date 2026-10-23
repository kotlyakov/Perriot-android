import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {scoreHand} from '../../src/core/score.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {canUseConsumable} from '../../src/core/consumables.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {describeShopItem} from '../../src/content/shop-display.js';
import {readFileSync} from 'node:fs';
import {APK_BOSSES} from '../../src/content/apk-blinds.js';
import {blindBase} from '../../src/core/blind-progression.js';

const centre=key=>catalogue.centres.find(card=>card.key===key);
const levels=()=>Object.fromEntries(['high_card','pair','two_pair','three_of_a_kind','straight','flush','full_house','four_of_a_kind','straight_flush','five_of_a_kind','flush_house','flush_five'].map(id=>[id,1]));
const card=(id,rank,suit,enhancement)=>({id,rank,suit,...(enhancement?{enhancement}:{})});
const chariot=()=>{const c=centre('c_chariot');return {id:'chariot',entityId:c.key,originalKey:c.key,set:c.set,edition:'base',cost:3n,sellCost:1n};};
const reload=state=>deserializeState(serializeState(state));
function scoringState(held=[],jokers=[],bossState){return {handLevels:levels(),jokers,bossState,hand:held.map(c=>c.id),cards:Object.fromEntries(held.map(c=>[c.id,c]))};}
function run(){let state=createRun('STEEL019',{runId:'steel',money:4n,referenceRng:true,referenceShop:true});state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;state.consumables=[chariot()];state.apkShop.context=currentApkShopContext(state);return state;}
const use=(state,targetCardIds)=>dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:'chariot',targetCardIds});

test('Steel cards left in hand multiply Mult exactly in hand order and floor only final score',()=>{
 const held=[card('steel-a',3,'hearts','steel'),card('steel-b',4,'spades','steel')],played=[card('played',2,'clubs')];
 const result=scoreHand(scoringState(held),played);
 assert.deepEqual(result.mult,{n:9n,d:4n});assert.equal(result.chips,7n);assert.equal(result.score,15n);
 assert.deepEqual(result.trace.filter(e=>e.phase==='held_card').map(e=>[e.sourceId,e.operation,e.before.mult,e.after.mult]),[
  ['steel-a','multiply_mult',1n,{n:3n,d:2n}],
  ['steel-b','multiply_mult',{n:3n,d:2n},{n:9n,d:4n}],
 ]);
});

test('Steel held effects occur after scored cards and before independent Jokers without early rounding',()=>{
 const held=[card('steel',3,'hearts','steel')],played=[card('played',2,'clubs')],jokers=[{id:'joker',entityId:'j_joker'}];
 const result=scoreHand(scoringState(held,jokers),played);
 assert.deepEqual(result.mult,{n:11n,d:2n});assert.equal(result.score,38n);
 assert.deepEqual(result.trace.slice(1,-1).map(e=>[e.phase,e.sourceId,e.operation]),[
  ['scored_card','played','add_chips'],['held_card','steel','multiply_mult'],['independent','joker','add_mult'],
 ]);
});

test('played or boss-debuffed Steel cards do not apply held effects',()=>{
 const playedSteel=card('played-steel',2,'clubs','steel');
 let result=scoreHand(scoringState(),[playedSteel]);assert.equal(result.mult,1n);assert.equal(result.trace.some(e=>e.phase==='held_card'),false);
 const heldSteel=card('held-steel',3,'clubs','steel');result=scoreHand(scoringState([heldSteel],[],{id:'bl_club',playedBeforeBoss:[]}),[card('played',2,'hearts')]);
 assert.equal(result.mult,1n);assert.equal(result.trace.some(e=>e.phase==='held_card'),false);
});

test('face-down Steel stays mechanically active until a boss actually debuffs it',()=>{
 const steel=card('hidden-steel',3,'hearts','steel'),result=scoreHand(scoringState([steel],[],{id:'bl_house',hiddenCardIds:['hidden-steel'],playedBeforeBoss:[]}),[card('played',2,'clubs')]);
 assert.deepEqual(result.mult,{n:3n,d:2n});assert.equal(result.trace.some(event=>event.phase==='held_card'&&event.sourceId==='hidden-steel'),true);
});

test('Chariot accepts exactly one unique current hand target and rejects invalid targets atomically',()=>{
 const valid=run(),target=valid.hand[0];assert.equal(canUseConsumable(valid,valid.consumables[0],[target]).available,true);
 for(const targets of [[],valid.hand.slice(0,2),[valid.drawPile[0]],['missing']]){const state=run(),before=structuredClone(state),result=use(state,targets);assert.equal(result.error.code,'INVALID_TARGETS');assert.equal(result.state,state);assert.deepEqual(state,before);}
});

test('Chariot overwrites one enhancement with Steel, persists identity, and spends no RNG',()=>{
 const state=run(),target=state.hand[0],rng=structuredClone(state.rng);state.cards[target].enhancement='wild';state.apkShop.context=currentApkShopContext(state);
 const result=use(state,[target]);assert.equal(result.error,null);assert.equal(result.state.cards[target].enhancement,'steel');
 assert.deepEqual(result.events.filter(e=>e.type==='card_enhanced'),[{type:'card_enhanced',cardId:target,enhancement:'steel',sourceId:'chariot'}]);
 assert.deepEqual(result.state.consumableUsage.c_chariot,{count:1,order:centre('c_chariot').order,set:'Tarot'});assert.equal(result.state.lastTarotPlanet,'c_chariot');
 assert.deepEqual(result.state.apkShop.context.enhancementIds,['m_steel']);assert.deepEqual(result.state.rng,rng);assert.deepEqual(reload(result.state),result.state);
});

test('debuffed Chariot consumes and counts without changing its target',()=>{
 const state=run(),target=state.hand[0],before=structuredClone(state.cards[target]);state.consumables[0].debuffed=true;
 const result=use(state,[target]);assert.equal(result.error,null);assert.deepEqual(result.state.cards[target],before);assert.equal(result.state.consumables.length,0);assert.deepEqual(result.events.filter(e=>e.type==='card_enhanced'),[]);assert.equal(result.state.consumableUsage.c_chariot.count,1);
});

test('Steel score replay roundtrips and rejects forged or non-normalized fractions',()=>{
 let state=run(),steelId=state.hand[0],playedId=state.hand[1];state=use(state,[steelId]).state;
 state=dispatch(state,{type:'PLAY_HAND',expectedRevision:state.revision,cardIds:[playedId]}).state;assert.deepEqual(state.lastScore.mult,{n:3n,d:2n});assert.deepEqual(reload(state),state);
 const payload=JSON.parse(serializeState(state));
 for(const mutate of [p=>p.state.lastScore.mult={n:'6',d:'4'},p=>p.state.lastScore.trace.find(e=>e.phase==='held_card').after.mult={n:'5',d:'2'},p=>p.state.lastScore.mult={n:'3',d:'0'}]){const copy=structuredClone(payload);mutate(copy);assert.throws(()=>deserializeState(JSON.stringify(copy)));}
});

test('Hook discards a held Steel source before scoring and replay omits its effect',()=>{
 let state=createRun('HOOKSTEEL5',{runId:'steel-hook',money:4n,referenceRng:true,referenceShop:true});state.round.ante=3;state.round.blindId='boss';state.round.target=blindBase(3)*BigInt(APK_BOSSES.find(b=>b.id==='bl_hook').mult);state.apkShop.context.ante=3;state.apkBlinds.ante=3;state.apkBlinds.tagContext.ante=3;state.apkBlinds.bossId='bl_hook';state.apkBlinds.bossesUsed.bl_hook=1;state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;
 const [steelId,playedId]=state.hand;state.cards[steelId].enhancement='steel';state.apkShop.context.enhancementIds=['m_steel'];state=dispatch(state,{type:'PLAY_HAND',expectedRevision:state.revision,cardIds:[playedId]}).state;
 assert.equal(state.lastScore.trace.some(event=>event.phase==='held_card'&&event.sourceId===steelId),false);assert.equal(state.discardPile.includes(steelId),true);assert.deepEqual(reload(state),state);
});

test('Chariot shop copy describes the implemented held Steel effect',()=>{
 assert.equal(describeShopItem(chariot()).description,'Усиливает 1 выбранную карту до Стальной: пока она остаётся в руке, она даёт ×1,5 к множителю.');
});

test('Steel cards have their own held-effect marker instead of borrowed artwork',()=>{
 const css=readFileSync(new URL('../../web/styles.css',import.meta.url),'utf8');assert.match(css,/data-enhancement=steel[^\n]+×1\.5 В РУКЕ/);
});
