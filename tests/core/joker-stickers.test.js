import test from 'node:test';
import assert from 'node:assert/strict';
const api=await import('../../src/core/joker-stickers.js').catch(()=>({}));
const state=(jokers=[])=>({rentalTiming:'round_start',jokers,money:10n,phase:'playing',round:{handsRemaining:2,discardsRemaining:3,handSize:8},hand:[],drawPile:[]});
const card=(fields={})=>({id:'joker',entityId:'j_joker',...fields});

test('sticker boundary accepts plain/false flags and valid compatible combinations',()=>{
 assert.equal(typeof api.validJokerStickers,'function');
 for(const value of [card(),card({eternal:false,perishable:false,rental:false}),card({eternal:true,rental:true}),card({perishable:true,perishRounds:5,rental:true}),card({perishable:true,perishRounds:0,debuffed:true})])assert.equal(api.validJokerStickers(value),true);
 for(const value of [null,card({eternal:1}),card({rental:'yes'}),card({perishable:true}),card({perishable:true,perishRounds:-1}),card({perishable:true,perishRounds:6}),card({perishable:true,perishRounds:1.5}),card({perishable:false,perishRounds:5}),card({eternal:true,perishable:true,perishRounds:5}),card({entityId:'j_ceremonial',perishable:true,perishRounds:5}),card({entityId:'j_gros_michel',eternal:true})])assert.equal(api.validJokerStickers(value),false,JSON.stringify(value));
});

test('perishable lasts exactly five terminal rounds without charging rental at the end',()=>{
 assert.equal(typeof api.applyJokerStickerEndRound,'function');
 const j=card({perishable:true,perishRounds:5,rental:true}),s=state([j]),events=[];
 for(let remaining=4;remaining>=0;remaining--){api.applyJokerStickerEndRound(s,events);assert.equal(j.perishRounds,remaining);assert.equal(j.debuffed===true,remaining===0);}
 assert.equal(s.money,10n);assert.equal(events.filter(e=>e.type==='joker_rental_paid').length,0);assert.equal(events.filter(e=>e.type==='joker_expired').length,1);
 api.applyJokerStickerEndRound(s,events);assert.equal(j.perishRounds,0);assert.equal(s.money,10n);assert.equal(events.filter(e=>e.type==='joker_expired').length,1);
});

test('boss suppression and expired timer compose without reviving a card',()=>{
 assert.equal(typeof api.setJokerBossDebuff,'function');
 const j=card({perishable:true,perishRounds:1,rental:true}),s=state([j]),events=[];
 api.setJokerBossDebuff(j,true);api.applyJokerStickerEndRound(s,events);assert.equal(j.perishRounds,0);assert.equal(s.money,10n);
 api.setJokerBossDebuff(j,false);assert.equal(j.debuffed,true);assert.equal(api.isPerished(j),true);
 const fresh=card({perishable:true,perishRounds:4});api.setJokerBossDebuff(fresh,true);assert.equal(fresh.debuffed,true);api.setJokerBossDebuff(fresh,false);assert.equal(fresh.debuffed,false);assert.equal(api.isPerished(fresh),false);
});

test('expiry removes active hand/discard passives and retains negative inventory slots',()=>{
 const j=card({entityId:'j_merry_andy',perishable:true,perishRounds:1,edition:'negative'}),s=state([j]),events=[];s.round.handSize=7;s.round.discardsRemaining=4;s.jokerSlots=5;s.bossState={baseHandSize:7};
 api.applyJokerStickerEndRound(s,events);assert.equal(s.round.handSize,8);assert.equal(s.round.discardsRemaining,1);assert.equal(s.round.handsRemaining,2);assert.equal(s.bossState.baseHandSize,8);assert.equal(s.jokerSlots,5);assert.equal(j.edition,'negative');assert.equal(s.jokers.length,1);
 assert.deepEqual(events.find(e=>e.type==='joker_capacity_changed'),{type:'joker_capacity_changed',handSize:1,discards:-3});
});

test('a pre-debuffed passive does not lose capacity twice on expiry',()=>{
 const j=card({entityId:'j_juggler',perishable:true,perishRounds:1,debuffed:true}),s=state([j]),events=[];
 api.applyJokerStickerEndRound(s,events);assert.equal(s.round.handSize,8);assert.equal(events.some(e=>e.type==='joker_capacity_changed'),false);
});

test('one-Joker option preserves lifetime interleaving without rental after queued removal',()=>{
 const a=card({id:'a',perishable:true,perishRounds:2,rental:true}),b=card({id:'b',perishable:true,perishRounds:3,rental:true}),s=state([a,b]),events=[];
 api.applyJokerStickerEndRound(s,events,{jokers:[a]});assert.equal(a.perishRounds,1);assert.equal(b.perishRounds,3);assert.equal(s.money,10n);
 s.jokers=s.jokers.filter(j=>j!==b);api.applyJokerStickerEndRound(s,events,{jokers:[b]});assert.equal(s.money,10n);assert.equal(s.jokers.length,1);
});

test('malformed sticker batch rejects before changing money or any timer',()=>{
 const a=card({perishable:true,perishRounds:2,rental:true}),b=card({id:'bad',perishable:true,perishRounds:-1}),s=state([a,b]),before=structuredClone(s),events=[];
 assert.throws(()=>api.applyJokerStickerEndRound(s,events));assert.deepEqual(s,before);assert.deepEqual(events,[]);
});

test('copying a perishable card preserves lifetime and remains independent',()=>{
 const j=card({perishable:true,perishRounds:2,rental:true}),copy=structuredClone(j);copy.id='copy';const s=state([j,copy]);api.applyJokerStickerEndRound(s,[],{jokers:[copy]});assert.equal(j.perishRounds,2);assert.equal(copy.perishRounds,1);assert.equal(s.money,10n);
});

test('start rent validates entire batch before charging and never advances lifetime',()=>{
 const a=card({rental:true,perishable:true,perishRounds:2}),bad=card({id:'bad',rental:true,perishable:true,perishRounds:-1}),s=state([a,bad]),before=structuredClone(s),events=[];
 assert.throws(()=>api.applyJokerRentalStartRound(s,events));assert.deepEqual(s,before);assert.deepEqual(events,[]);
 s.jokers=[a];api.applyJokerRentalStartRound(s,events);assert.equal(s.money,7n);assert.equal(a.perishRounds,2);
});
test('legacy checkpoint without timing marker retains authenticated historical end rent',()=>{
 const s=state([card({rental:true})]);delete s.rentalTiming;api.applyJokerStickerEndRound(s);assert.equal(s.money,7n);
});
