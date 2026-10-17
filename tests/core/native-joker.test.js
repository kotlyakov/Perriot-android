import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreHand} from '../../src/core/score.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const suits=['clubs','diamonds','hearts','spades'];
const cards=(ranks,flush=false)=>ranks.map((rank,i)=>({id:'c'+i,rank,suit:flush?'spades':suits[i%4]}));
const score=(keys,ranks,flush=false)=>scoreHand({handLevels:{},jokers:keys.map((entityId,i)=>({id:'j'+i,entityId}))},cards(ranks,flush));
for(const [key,ranks,flush,operation,amount] of [
 ['j_joker',[14],false,'add_mult',4n],['j_jolly',[8,8],false,'add_mult',8n],['j_zany',[8,8,8],false,'add_mult',12n],['j_mad',[8,8,7,7],false,'add_mult',10n],['j_crazy',[2,3,4,5,6],false,'add_mult',12n],['j_droll',[2,4,6,8,10],true,'add_mult',10n],
 ['j_sly',[8,8],false,'add_chips',50n],['j_wily',[8,8,8],false,'add_chips',100n],['j_clever',[8,8,7,7],false,'add_chips',80n],['j_devious',[2,3,4,5,6],false,'add_chips',100n],['j_crafty',[2,4,6,8,10],true,'add_chips',80n],
 ['j_half',[14],false,'add_mult',20n],['j_abstract',[14],false,'add_mult',3n],['j_duo',[8,8],false,'multiply_mult',2n],['j_trio',[8,8,8],false,'multiply_mult',3n],['j_family',[8,8,8,8],false,'multiply_mult',4n],['j_order',[2,3,4,5,6],false,'multiply_mult',3n],['j_tribe',[2,4,6,8,10],true,'multiply_mult',2n],
])test('native independent trigger '+key,()=>{
 const result=score([key],ranks,flush),e=result.trace.find(e=>e.phase==='independent');assert.equal(e.operation,operation);
 const target=operation.includes('mult')?'mult':'chips';assert.equal(operation.startsWith('multiply')?e.after[target]/e.before[target]:e.after[target]-e.before[target],amount);
 if(!['j_joker','j_half','j_abstract'].includes(key))assert.equal(score([key],[14]).trace.filter(e=>e.phase==='independent').length,0);
});
test('native scored effects run per scoring card, left to right and in joker order',()=>{
 const r=score(['j_scholar','j_fibonacci','j_even_steven','j_odd_todd'],[14,14,2]);assert.equal(r.chips,134n);assert.equal(r.mult,26n);
 assert.deepEqual(r.trace.filter(e=>e.effectSourceId).map(e=>[e.sourceId,e.effectSourceId,e.operation]),[['c0','j0','add_chips'],['c0','j0','add_mult'],['c0','j1','add_mult'],['c0','j3','add_chips'],['c1','j0','add_chips'],['c1','j0','add_mult'],['c1','j1','add_mult'],['c1','j3','add_chips']]);
 assert.equal(score(['j_even_steven'],[14]).mult,1n);assert.equal(score(['j_odd_todd'],[13]).chips,15n);
});
test('round-state Jokers use the counters before PLAY_HAND spends the current hand',()=>{
 const base={handLevels:{},hand:[],cards:{},jokerSlots:5,round:{handsRemaining:1,discardsRemaining:3}};
 let r=scoreHand({...base,jokers:[{id:'a',entityId:'j_acrobat'},{id:'b',entityId:'j_banner'},{id:'c',entityId:'j_mystic_summit'}]},cards([14]));
 assert.deepEqual(r.trace.filter(e=>e.phase==='independent').map(e=>[e.sourceId,e.operation,e.after.chips,e.after.mult]),[
  ['a','multiply_mult',16n,3n],['b','add_chips',106n,3n],
 ]);
 r=scoreHand({...base,round:{handsRemaining:2,discardsRemaining:0},jokers:[{id:'a',entityId:'j_acrobat'},{id:'b',entityId:'j_banner'},{id:'c',entityId:'j_mystic_summit'}]},cards([14]));
 assert.deepEqual(r.trace.filter(e=>e.phase==='independent').map(e=>[e.sourceId,e.operation]),[['c','add_mult']]);
 assert.equal(r.mult,16n);
});
test('Blackboard and Joker Stencil match held-card and effective-capacity boundaries',()=>{
 const held={h1:{id:'h1',rank:7,suit:'clubs'},h2:{id:'h2',rank:9,suit:'spades'}};
 const base={handLevels:{},hand:Object.keys(held),cards:held,jokerSlots:5,round:{handsRemaining:2,discardsRemaining:2}};
 let r=scoreHand({...base,jokers:[{id:'board',entityId:'j_blackboard'},{id:'stencil',entityId:'j_stencil'}]},cards([14]));
 assert.deepEqual(r.trace.filter(e=>e.phase==='independent').map(e=>[e.sourceId,e.operation]),[['board','multiply_mult'],['stencil','multiply_mult']]);
 assert.equal(r.mult,12n); // Blackboard x3, Stencil x(3 empty + itself).
 r=scoreHand({...base,cards:{...held,h2:{...held.h2,suit:'hearts'}},jokers:[{id:'board',entityId:'j_blackboard'}]},cards([14]));
 assert.equal(r.trace.some(e=>e.sourceId==='board'),false);
 const full=Array.from({length:5},(_,i)=>({id:'j'+i,entityId:i===0?'j_stencil':'j_joker'}));
 r=scoreHand({...base,jokers:full},cards([14]));assert.equal(r.trace.some(e=>e.sourceId==='j0'&&e.operation==='multiply_mult'),false);
 const negative=full.map((j,i)=>i===4?{...j,edition:'negative'}:j);
 r=scoreHand({...base,jokers:negative},cards([14]));assert.equal(r.trace.find(e=>e.sourceId==='j0'&&e.operation==='multiply_mult').after.mult,2n);
});
test('Raised Fist uses the lowest non-Stone held rank and a debuffed tie stays silent',()=>{
 const state={handLevels:{},jokerSlots:5,round:{handsRemaining:2,discardsRemaining:2},jokers:[{id:'fist',entityId:'j_raised_fist'}],
  hand:['ace','stone','low'],cards:{ace:{id:'ace',rank:14,suit:'clubs'},stone:{id:'stone',rank:2,suit:'spades',enhancement:'stone'},low:{id:'low',rank:4,suit:'hearts'}}};
 let r=scoreHand(state,cards([10]));const effect=r.trace.find(e=>e.sourceId==='low'&&e.effectSourceId==='fist');assert.equal(effect.operation,'add_mult');assert.equal(effect.after.mult-effect.before.mult,8n);
 const tied={...state,hand:['low','tie'],cards:{low:state.cards.low,tie:{id:'tie',rank:4,suit:'spades'}}};
 r=scoreHand({...tied,bossState:{id:'bl_goad'}},cards([10]));assert.equal(r.trace.some(e=>e.effectSourceId==='fist'),false);
});
test('Baron and Shoot the Moon trigger per held card in card then Joker order',()=>{
 const held={queen:{id:'queen',rank:12,suit:'hearts'},king:{id:'king',rank:13,suit:'clubs',enhancement:'steel'}};
 const state={handLevels:{},hand:Object.keys(held),cards:held,jokerSlots:5,round:{handsRemaining:2,discardsRemaining:2},drawPile:[],
  jokers:[{id:'moon',entityId:'j_shoot_the_moon'},{id:'baron',entityId:'j_baron'}]};
 let r=scoreHand(state,cards([10]));
 assert.deepEqual(r.trace.filter(e=>e.phase==='held_card').map(e=>[e.sourceId,e.effectSourceId??'card',e.operation]),[
  ['queen','moon','add_mult'],['king','card','multiply_mult'],['king','baron','multiply_mult'],
 ]);
 assert.deepEqual(r.mult,{n:63n,d:2n});
 r=scoreHand({...state,bossState:{id:'bl_plant'}},cards([10]));assert.equal(r.trace.some(e=>e.phase==='held_card'),false);
});
test('Blue Joker uses the pre-draw deck and Flower Pot uses only scoring-card suit coverage',()=>{
 const base={handLevels:{},hand:[],cards:{},jokerSlots:5,round:{handsRemaining:2,discardsRemaining:2}};
 let r=scoreHand({...base,drawPile:['a','b','c'],jokers:[{id:'blue',entityId:'j_blue_joker'}]},cards([14]));
 assert.equal(r.trace.find(e=>e.sourceId==='blue').after.chips-r.trace.find(e=>e.sourceId==='blue').before.chips,6n);
 const fourSuits=suits.map((suit,i)=>({id:'p'+i,rank:8,suit}));
 r=scoreHand({...base,drawPile:[],jokers:[{id:'pot',entityId:'j_flower_pot'}]},fourSuits);assert.equal(r.trace.find(e=>e.sourceId==='pot').operation,'multiply_mult');
 r=scoreHand({...base,drawPile:[],bossState:{id:'bl_goad'},jokers:[{id:'pot',entityId:'j_flower_pot'}]},fourSuits);assert.equal(r.trace.find(e=>e.sourceId==='pot').operation,'multiply_mult');
 const wild=[...fourSuits.slice(0,3),{...fourSuits[3],suit:'diamonds',enhancement:'wild'}];
 r=scoreHand({...base,drawPile:[],jokers:[{id:'pot',entityId:'j_flower_pot'}]},wild);assert.equal(r.trace.find(e=>e.sourceId==='pot').operation,'multiply_mult');
 r=scoreHand({...base,drawPile:[],bossState:{id:'bl_goad'},jokers:[{id:'pot',entityId:'j_flower_pot'}]},wild);assert.equal(r.trace.some(e=>e.sourceId==='pot'),false);
});
test('money, sell-value and full-deck Jokers derive their values from pre-score state',()=>{
 const deckCards={stone1:{id:'stone1',rank:2,suit:'clubs',enhancement:'stone'},stone2:{id:'stone2',rank:3,suit:'hearts',enhancement:'stone'},steel1:{id:'steel1',rank:4,suit:'clubs',enhancement:'steel'},steel2:{id:'steel2',rank:5,suit:'hearts',enhancement:'steel'},steel3:{id:'steel3',rank:6,suit:'spades',enhancement:'steel'}};
 const base={handLevels:{},hand:[],cards:deckCards,drawPile:[],jokerSlots:5,round:{handsRemaining:2,discardsRemaining:2},money:12n};
 let r=scoreHand({...base,jokers:[{id:'bull',entityId:'j_bull'}]},cards([14]));assert.equal(r.trace.find(e=>e.sourceId==='bull').after.chips-r.trace.find(e=>e.sourceId==='bull').before.chips,24n);
 r=scoreHand({...base,jokers:[{id:'boots',entityId:'j_bootstraps'}]},cards([14]));assert.equal(r.trace.find(e=>e.sourceId==='boots').after.mult-r.trace.find(e=>e.sourceId==='boots').before.mult,4n);
 r=scoreHand({...base,jokers:[{id:'stone',entityId:'j_stone'}]},cards([14]));assert.equal(r.trace.find(e=>e.sourceId==='stone').after.chips-r.trace.find(e=>e.sourceId==='stone').before.chips,50n);
 r=scoreHand({...base,jokers:[{id:'steel',entityId:'j_steel_joker'}]},cards([14]));assert.deepEqual(r.trace.find(e=>e.sourceId==='steel').after.mult,{n:8n,d:5n});
 r=scoreHand({...base,jokers:[{id:'swash',entityId:'j_swashbuckler',sellCost:2n},{id:'left',entityId:'j_joker',sellCost:3n},{id:'right',entityId:'j_joker',sellCost:4n}]},cards([14]));assert.equal(r.trace.find(e=>e.sourceId==='swash').after.mult-r.trace.find(e=>e.sourceId==='swash').before.mult,7n);
 for(const key of ['j_bull','j_bootstraps']){r=scoreHand({...base,money:-2n,jokers:[{id:'money',entityId:key}]},cards([14]));assert.equal(r.trace.some(e=>e.sourceId==='money'),false);}
});
test('money-dependent Joker score stores a strict pre-score balance for save replay',()=>{
 let s=createRun('bull-save',{runId:'bull-save',money:12n});s=act(s,'START_BLIND').state;s.jokers=[{id:'bull',entityId:'j_bull',cost:6n,sellCost:3n}];
 const r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);assert.equal(r.state.lastScore.scoringMoneyBefore,12n);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
 r.state.lastScore.scoringMoneyBefore=13n;assert.throws(()=>serializeState(r.state));
 s=createRun('bull-gold',{runId:'bull-gold',money:12n});s=act(s,'START_BLIND').state;s.jokers=[{id:'bull',entityId:'j_bull',cost:6n,sellCost:3n}];s.cards[s.hand[1]].enhancement='gold';s.round.target=1n;
 const won=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(won.state.phase,'round_won');assert.equal(won.state.money,15n);assert.equal(won.state.lastScore.scoringMoneyBefore,12n);assert.deepEqual(deserializeState(serializeState(won.state)),won.state);
});
test('native suit and face effects do not score kickers without Splash',()=>{
 for(const [key,suit,operation,amount] of [['j_greedy_joker','diamonds','add_mult',3n],['j_lusty_joker','hearts','add_mult',3n],['j_wrathful_joker','spades','add_mult',3n],['j_gluttenous_joker','clubs','add_mult',3n],['j_arrowhead','spades','add_chips',50n],['j_onyx_agate','clubs','add_mult',7n]]){
 const s={handLevels:{},jokers:[{id:'j',entityId:key}]};const r=scoreHand(s,[{id:'a',rank:14,suit}]);const e=r.trace.find(e=>e.effectSourceId);assert.equal(e.operation,operation);const target=operation.includes('mult')?'mult':'chips';assert.equal(e.after[target]-e.before[target],amount);
 assert.equal(scoreHand(s,[{id:'a',rank:14,suit:suit==='clubs'?'hearts':'clubs'}]).trace.filter(e=>e.effectSourceId).length,0);
 }
 assert.equal(score(['j_scary_face'],[11]).chips,45n);assert.equal(score(['j_smiley'],[11]).mult,6n);assert.equal(score(['j_walkie_talkie'],[4]).score,95n);
 const plain=score(['j_scary_face'],[8,8,11]);assert.equal(plain.chips,26n);
 const splash=score(['j_scary_face','j_splash'],[8,8,11]);assert.equal(splash.chips,66n);
});
test('integer editions occur before own independent effect and multiplied effects preserve order',()=>{
 const s={handLevels:{},jokers:[{id:'a',entityId:'j_duo',edition:'holographic'},{id:'b',entityId:'j_joker',edition:'foil'}]};
 const r=scoreHand(s,cards([8,8]));assert.equal(r.chips,76n);assert.equal(r.mult,28n);assert.equal(r.score,2128n);
 assert.deepEqual(r.trace.filter(e=>e.phase==='edition'||e.phase==='independent').map(e=>[e.sourceId,e.operation]),[['a','add_mult'],['a','multiply_mult'],['b','add_chips'],['b','add_mult']]);
 const poly=scoreHand({...s,jokers:[{id:'a',entityId:'j_joker',edition:'polychrome'}]},cards([14]));assert.deepEqual(poly.mult,{n:15n,d:2n});
});
const offer=(id='j_joker',edition='base')=>({id:'native_offer',entityId:id,originalKey:id,set:'Joker',cost:4n,sellCost:2n,edition});
function shop(){let s=createRun('AAAAAAA1',{runId:'native-buy',money:20n,referenceRng:true,referenceShop:true});s.phase='round_won';s.round.score=300n;return dispatch(s,{type:'CASH_OUT',expectedRevision:0}).state;}
const act=(s,type,fields)=>dispatch(s,{type,expectedRevision:s.revision,...fields});
test('buy and sell native Joker once with persisted identity and RNG unchanged',()=>{
 const s=shop();s.shop.main=[offer()];const before=structuredClone(s),r=act(s,'BUY_SHOP_CARD',{offerId:'native_offer'});assert.equal(r.error,null);assert.equal(r.state.money,s.money-4n);assert.equal(r.state.jokers[0].entityId,'j_joker');assert.deepEqual(r.state.rng,s.rng);assert.deepEqual(s,before);
 assert.deepEqual(deserializeState(serializeState(r.state)),r.state);assert.equal(act(r.state,'BUY_SHOP_CARD',{offerId:'native_offer'}).error.code,'OFFER_NOT_FOUND');
 const sold=act(r.state,'SELL_JOKER',{jokerId:'native_offer'});assert.equal(sold.error,null);assert.equal(sold.state.money,r.state.money+2n);assert.equal(sold.state.jokers.length,0);assert.deepEqual(deserializeState(serializeState(sold.state)),sold.state);
});
test('native capacity, unsupported effects and unaffordable actions reject before payment',()=>{
 const s=shop();s.shop.main=[offer()];s.jokers=Array.from({length:5},(_,i)=>({...offer(),id:'owned'+i}));assert.equal(act(s,'BUY_SHOP_CARD',{offerId:'native_offer'}).error.code,'NO_SPACE');
 s.shop.main[0].edition='negative';const r=act(s,'BUY_SHOP_CARD',{offerId:'native_offer'});assert.equal(r.error,null);assert.equal(r.state.jokers.length,6);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
 for(const bad of [offer('j_vampire'),{...offer(),rental:true},{...offer(),perishable:true}]){s.jokers=[];s.shop.main=[bad];const before=structuredClone(s),r=act(s,'BUY_SHOP_CARD',{offerId:bad.id});assert.equal(r.error.code,'UNSUPPORTED_CONTENT');assert.strictEqual(r.state,s);assert.deepEqual(s,before);}
 s.shop.main=[offer()];s.money=0n;assert.equal(act(s,'BUY_SHOP_CARD',{offerId:'native_offer'}).error.code,'INSUFFICIENT_FUNDS');
});
test('full played hand survives save so Half Joker cannot score a five-card high-card hand',()=>{
 let s=createRun('save-half',{runId:'save-half',money:4n});s=act(s,'START_BLIND').state;s.jokers=[{id:'half',entityId:'j_half',cost:5n,sellCost:2n}];
 const rankIds=[14,13,9,6,3].map((r,i)=>Object.values(s.cards).find(c=>c.rank===r&&c.suit===suits[i%4]).id);s.hand=rankIds;s.drawPile=Object.keys(s.cards).filter(id=>!rankIds.includes(id));s.round.handSize=5;
 const r=act(s,'PLAY_HAND',{cardIds:rankIds});assert.equal(r.error,null);assert.equal(r.state.lastScore.mult,1n);assert.deepEqual(r.state.lastScore.playedCardIds,rankIds);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
});
test('native purchase refuses broken identity metadata and card-ID collisions before charging',()=>{
 for(const change of [o=>delete o.originalKey,o=>delete o.set,o=>o.set='Tarot',o=>o.originalKey='j_zany',o=>o.id='card_clubs_2']){
  const s=shop(),o=offer();change(o);s.shop.main=[o];const before=structuredClone(s),r=act(s,'BUY_SHOP_CARD',{offerId:o.id});assert.ok(r.error);assert.strictEqual(r.state,s);assert.deepEqual(s,before);
 }
});

