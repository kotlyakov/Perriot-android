import test from 'node:test';
import assert from 'node:assert/strict';
import {item7EconomyModifiers,applyItem7EconomyContext,item7SaleCapability} from '../../src/core/joker-item7-economy.js';
import {getJokerCashoutBonuses} from '../../src/core/joker-cashout.js';
const j=(entityId,extra={})=>({id:entityId,entityId,cost:4n,sellCost:2n,...extra});
const state=jokers=>({jokers,consumables:[],cards:{},round:{blindId:'small',discardsUsed:0,discardsRemaining:3},consumableUsage:{},money:4n});
test('passive modifiers stack physical active cards, never copied effects',()=>{
 const s=state([j('j_credit_card'),j('j_credit_card',{id:'second'}),j('j_to_the_moon'),j('j_oops'),j('j_oops',{id:'second-oops'}),j('j_blueprint'),j('j_chaos'),j('j_astronomer'),j('j_ring_master'),j('j_oops',{debuffed:true})]);
 assert.deepEqual(item7EconomyModifiers(s),{bankruptAt:-40n,interestAmount:2n,probabilityNormal:4,astronomer:true,showman:true,chaosCount:1});
 assert.equal(item7EconomyModifiers(state([])).probabilityNormal,1);
});
test('reroll, card sale and booster skip mutate only their native counters',()=>{
 const s=state([j('j_flash'),j('j_campfire'),j('j_red_card'),j('j_flash',{id:'debuff',debuffed:true}),j('j_blueprint')]),events=[];
 applyItem7EconomyContext(s,{type:'reroll_shop'},events);
 applyItem7EconomyContext(s,{type:'selling_card'},events);
 applyItem7EconomyContext(s,{type:'skipping_booster'},events);
 assert.equal(s.jokers[0].mult,2);assert.equal(s.jokers[1].xMult,1.25);assert.equal(s.jokers[2].mult,3);assert.equal(s.jokers[3].mult,undefined);
 assert.equal(events.length,3);
});
test('round end Egg/Gift grows all sell values; boss upgrades Rocket and resets Campfire',()=>{
 const s=state([j('j_egg'),j('j_gift'),j('j_rocket'),j('j_campfire',{xMult:1.75}),j('j_invisible')]);s.consumables=[{id:'tarot',sellCost:1n}];
 applyItem7EconomyContext(s,{type:'end_of_round'},[]);
 assert.equal(s.jokers[0].sellCost,6n);assert.equal(s.jokers[0].extraValue,4n);assert.equal(s.consumables[0].sellCost,2n);assert.equal(s.jokers[2].rocketDollars,undefined);assert.equal(s.jokers[4].invisibleRounds,1);
 s.round.blindId='boss';applyItem7EconomyContext(s,{type:'end_of_round'},[]);
 assert.equal(s.jokers[2].rocketDollars,3n);assert.equal(s.jokers[3].xMult,1);assert.equal(s.jokers[4].invisibleRounds,2);
});
test('cashout derives Rocket, unique planets and unused discards without copied bonuses',()=>{
 const s=state([j('j_rocket',{rocketDollars:7n}),j('j_satellite'),j('j_delayed_grat'),j('j_blueprint')]);s.consumableUsage={c_mercury:{set:'Planet',count:4},c_mars:{set:'Planet',count:1},c_fool:{set:'Tarot',count:1}};
 assert.deepEqual(getJokerCashoutBonuses(s).map(x=>x.amount),[7n,2n,6n]);
 s.round.discardsUsed=1;assert.equal(getJokerCashoutBonuses(s).length,2);s.round.discardsUsed=0;s.round.discardsRemaining=0;assert.equal(getJokerCashoutBonuses(s).length,2);
});
test('Diet Cola sale is available with native double-tag queue',()=>{
 assert.equal(item7SaleCapability(state([]),j('j_diet_cola')).available,true);
 assert.equal(item7SaleCapability(state([]),j('j_diet_cola',{debuffed:true})).available,true);
 assert.equal(item7SaleCapability(state([]),j('j_joker')).available,true);
});
import {createRun,dispatch} from '../../src/core/run.js';
import {canUseConsumable} from '../../src/core/consumables.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {applyItem7SoldJoker,createItem7Cards} from '../../src/core/joker-item7-economy.js';
function nativeRun(){return createRun('ITEM7ECON',{runId:'item7-economy',money:4n,referenceRng:true,referenceShop:true});}
const judgement={id:'judgement',entityId:'c_judgement',originalKey:'c_judgement',set:'Tarot',edition:'base',cost:3n,sellCost:1n};
test('Judgement creates a native Joker with jud streams and consumes once',()=>{
 const s=nativeRun();s.consumables=[judgement];s.apkShop.context=currentApkShopContext(s);const before=structuredClone(s);
 const result=dispatch(s,{type:'USE_CONSUMABLE',expectedRevision:s.revision,cardId:judgement.id});
 assert.equal(result.error,null);assert.deepEqual(s,before);assert.equal(result.state.jokers.length,1);assert.equal(result.state.consumables.length,0);assert.ok(result.state.rng.apk.streams.Joker1jud1||result.state.rng.apk.streams.Joker2jud1||result.state.rng.apk.streams.Joker3jud1);assert.equal(result.state.consumableUsage.c_judgement.count,1);
});
test('Judgement respects full slots, negative slots and debuff without consuming RNG',()=>{
 const s=nativeRun();s.jokers=Array.from({length:5},(_,i)=>({...j('j_joker'),id:`joker${i}`,originalKey:'j_joker',set:'Joker',edition:'base'}));s.consumables=[judgement];s.apkShop.context=currentApkShopContext(s);
 assert.equal(canUseConsumable(s,judgement).available,false);s.jokers[0].edition='negative';assert.equal(canUseConsumable(s,judgement).available,true);
 s.consumables[0]={...judgement,debuffed:true};const result=dispatch(s,{type:'USE_CONSUMABLE',expectedRevision:s.revision,cardId:judgement.id});assert.equal(result.error,null);assert.equal(result.state.jokers.length,5);assert.deepEqual(result.state.rng,s.rng);
});
test('Riff-raff common creation and full inventory consume only eligible draws',()=>{
 const s=nativeRun();s.jokers=[{...j('j_riff_raff'),originalKey:'j_riff_raff',set:'Joker',edition:'base'}];const events=[];
 applyItem7EconomyContext(s,{type:'setting_blind'},events);assert.equal(s.jokers.length,3);assert.equal(events.length,2);assert.ok(s.rng.apk.streams.Joker1rif1);assert.equal(s.rng.apk.streams.rarity1rif,undefined);
 const rng=structuredClone(s.rng);s.consumables=Array.from({length:2},(_,i)=>({...judgement,id:`c${i}`}));assert.deepEqual(createItem7Cards(s,{append:'car',sourceId:'x'},[]),[]);assert.deepEqual(s.rng,rng);
});
test('Invisible Joker strips copied negative edition and resets its own round counter',()=>{
 const s=nativeRun();s.jokers=[{...j('j_invisible',{invisibleRounds:9}),originalKey:'j_invisible',set:'Joker',edition:'negative',creationOrdinal:1}];const events=[];
 applyItem7SoldJoker(s,j('j_invisible',{id:'sold',invisibleRounds:2}),events);assert.equal(s.jokers.length,2);assert.equal(s.jokers[1].edition,'base');assert.equal(s.jokers[1].invisibleRounds,0);assert.notEqual(s.jokers[1].id,s.jokers[0].id);
});

import {addItem7DoubleTag,consumeItem7DoubleTags,item7TagRepetitions} from '../../src/core/joker-double-tags.js';
test('Double tags stack without copying another Double and consume exactly once',()=>{const s={};addItem7DoubleTag(s);assert.equal(consumeItem7DoubleTags(s,'tag_double'),0);assert.equal(s.pendingDoubleTags,2);assert.equal(item7TagRepetitions(s,'tag_orbital'),3);assert.equal(consumeItem7DoubleTags(s,'tag_orbital'),3);assert.equal(consumeItem7DoubleTags(s,'tag_handy'),1);});
test('Diet Cola adds a Double tag on sale, while debuffed Cola does nothing',()=>{const s=nativeRun();applyItem7SoldJoker(s,j('j_diet_cola'),[]);assert.equal(s.pendingDoubleTags,1);applyItem7SoldJoker(s,j('j_diet_cola',{debuffed:true}),[]);assert.equal(s.pendingDoubleTags,1);});
test('Constellation upgrades on every successful Planet use but not Tarot or copied contexts',()=>{const s=state([j('j_constellation'),j('j_blueprint')]);applyItem7EconomyContext(s,{type:'using_consumeable',set:'Planet'},[]);assert.equal(s.jokers[0].xMult,1.1);applyItem7EconomyContext(s,{type:'using_consumeable',set:'Tarot'},[]);assert.equal(s.jokers[0].xMult,1.1);});
test('selling a negative Invisible can duplicate at capacity before losing its extra slot',()=>{const s=nativeRun();s.jokers=Array.from({length:5},(_,i)=>({...j('j_joker'),id:`joker-${i}`,originalKey:'j_joker',edition:'base',set:'Joker',creationOrdinal:i+1}));s.nextJokerCreationOrdinal=7;applyItem7SoldJoker(s,j('j_invisible',{invisibleRounds:2,edition:'negative'}),[]);assert.equal(s.jokers.length,6);});
import {repriceItem7Cards} from '../../src/core/joker-item7-economy.js';
test('Astronomer reprices Planet and Celestial offers, retains extra sell value and removes free prices',()=>{const s=nativeRun();s.jokers=[{...j('j_astronomer'),originalKey:'j_astronomer',set:'Joker'}];s.consumables=[{id:'planet',entityId:'c_mercury',originalKey:'c_mercury',set:'Planet',edition:'base',cost:3n,sellCost:5n,extraValue:4n}];repriceItem7Cards(s);assert.equal(s.consumables[0].cost,0n);assert.equal(s.consumables[0].sellCost,5n);s.jokers=[];repriceItem7Cards(s);assert.equal(s.consumables[0].cost,3n);assert.equal(s.consumables[0].sellCost,5n);});
test('repeated creation from the same scoring source uses distinct bounded IDs',()=>{const s=nativeRun();const source='x'.repeat(120);createItem7Cards(s,{append:'8ba',sourceId:source},[]);createItem7Cards(s,{append:'8ba',sourceId:source},[]);assert.equal(new Set(s.consumables.map(c=>c.id)).size,2);assert.ok(s.consumables.every(c=>c.id.length<120));});
test('Perkeo copies a consumable as negative even at capacity',()=>{const s=nativeRun();s.jokers=[{...j('j_perkeo'),originalKey:'j_perkeo'}];s.nextJokerCreationOrdinal=3;s.consumables=[{...judgement,creationOrdinal:1},{...judgement,id:'second',creationOrdinal:2}];applyItem7EconomyContext(s,{type:'ending_shop'},[]);assert.equal(s.consumables.length,3);assert.equal(s.consumables[2].edition,'negative');assert.equal(s.consumables[2].cost,8n);assert.equal(s.consumables[2].sellCost,4n);});
import {serializeState,deserializeState} from '../../src/persistence/save.js';
test('Judgement generation survives strict save with monotonic creation ordinal',()=>{const s=nativeRun();s.consumables=[judgement];const result=dispatch(s,{type:'USE_CONSUMABLE',expectedRevision:s.revision,cardId:judgement.id});assert.equal(result.error,null);assert.deepEqual(deserializeState(serializeState(result.state)),result.state);assert.ok(result.state.jokers[0].creationOrdinal<result.state.nextJokerCreationOrdinal);});
