import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {canUseConsumable} from '../../src/core/consumables.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {describeShopItem} from '../../src/content/shop-display.js';
import {bossTarget} from '../../src/core/boss-effects.js';
import {APK_BASE_CARD_IDS} from '../../src/core/apk-deck.js';

const centre=key=>catalogue.centres.find(card=>card.key===key);
const consumable=key=>{const card=centre(key);return {id:key+'-owned',entityId:key,originalKey:key,set:card.set,edition:'base',cost:BigInt(card.cost),sellCost:1n};};
const reload=state=>deserializeState(serializeState(state));
function run(key){
 let state=createRun('DECK023',{runId:'deck-023',money:4n,referenceRng:true,referenceShop:true});
 state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;
 state.consumables=[consumable(key)];state.apkShop.context=currentApkShopContext(state);return state;
}
const use=(state,targetCardIds)=>dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:state.consumables[0].id,targetCardIds});

test('Hanged Man accepts one or two distinct held cards only and rejects atomically',()=>{
 for(const count of [1,2]){const state=run('c_hanged_man'),targets=state.hand.slice(0,count);assert.equal(canUseConsumable(state,state.consumables[0],targets).available,true);assert.equal(use(state,targets).error,null);}
 for(const select of [state=>[],state=>[state.hand[0],state.hand[0]],state=>state.hand.slice(0,3),state=>[state.drawPile[0]],()=>['missing']]){
  const state=run('c_hanged_man'),before=structuredClone(state),result=use(state,select(state));assert.equal(result.error.code,'INVALID_TARGETS');assert.equal(result.state,state);assert.deepEqual(state,before);
 }
});

test('Hanged Man destroys selected cards without drawing or spending RNG and cleans identity ledgers',()=>{
 const state=run('c_hanged_man'),targets=state.hand.slice(1,3),beforeHand=[...state.hand],beforeRng=structuredClone(state.rng),beforeCount=Object.keys(state.cards).length;
 state.apkBlinds.playedCardIds=[targets[0]];state.bossState={version:1,id:state.apkBlinds.bossId,playedBeforeBoss:[targets[0]],baseHandSize:8,hiddenCardIds:[targets[1]]};
 const result=use(state,[targets[1],targets[0]]);assert.equal(result.error,null);
 assert.deepEqual(result.state.hand,beforeHand.filter(id=>!targets.includes(id)));assert.equal(result.state.hand.length,beforeHand.length-2);assert.equal(Object.keys(result.state.cards).length,beforeCount-2);
 assert.deepEqual(result.state.hangedShortfallCardIds,[targets[1],targets[0]]);assert.deepEqual(result.state.hangedDestroyedCardIds,[targets[1],targets[0]]);assert.deepEqual(result.state.destroyedCardIds,[targets[1],targets[0]]);
 for(const id of targets){assert.equal(Object.hasOwn(result.state.cards,id),false);assert.equal(result.state.drawPile.includes(id),false);assert.equal(result.state.discardPile.includes(id),false);}
 assert.deepEqual(result.state.apkBlinds.playedCardIds,[]);assert.deepEqual(result.state.bossState.playedBeforeBoss,[]);assert.deepEqual(result.state.bossState.hiddenCardIds,[]);
 assert.deepEqual(result.state.rng,beforeRng);assert.deepEqual(result.events.filter(event=>event.type==='playing_card_destroyed'),targets.map(cardId=>({type:'playing_card_destroyed',cardId,sourceId:'c_hanged_man-owned'})));
 const persisted=structuredClone(result.state);delete persisted.bossState;assert.deepEqual(reload(persisted),persisted);
});

test('Hanged Man may destroy the final playing card and persist an empty deck',()=>{
 const state=run('c_hanged_man'),target=state.hand[0];state.cards={[target]:state.cards[target]};state.hand=[target];state.drawPile=[];state.discardPile=[];state.destroyedCardIds=APK_BASE_CARD_IDS.filter(id=>id!==target);state.apkBlinds.playedCardIds=[];state.apkShop.context=currentApkShopContext(state);
 assert.deepEqual(reload(state),state);const result=use(state,[target]);assert.equal(result.error,null);assert.deepEqual(result.state.cards,{});assert.deepEqual(result.state.hand,[]);assert.equal(result.state.destroyedCardIds.length,52);assert.deepEqual(reload(result.state),result.state);
});

test('save rejects a forged Hanged shortfall after a debuffed non-destructive use',()=>{
 const initial=run('c_hanged_man');initial.consumables[0].debuffed=true;const used=use(initial,initial.hand.slice(0,2));assert.equal(used.error,null);
 const state=used.state,fakeDestroyed=state.drawPile.pop(),moved=state.hand.pop();delete state.cards[fakeDestroyed];state.destroyedCardIds=[fakeDestroyed];state.drawPile.push(moved);state.hangedShortfallCardIds=[fakeDestroyed];
 assert.throws(()=>serializeState(state),/Invalid save data/);
});

test('Serpent overdraw can persist more Hanged deletions than the normal hand size',()=>{
 let state=createRun('SERPENT23',{runId:'serpent-hanged',money:4n,referenceRng:true,referenceShop:true});state.round.ante=5;state.round.blindId='boss';state.apkBlinds.ante=5;state.apkBlinds.tagContext.ante=5;state.apkBlinds.bossId='bl_serpent';state.apkBlinds.bossesUsed.bl_serpent=1;state.round.target=bossTarget(state);state.apkShop.context=currentApkShopContext(state);state.apkShop.context.ante=5;
 state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;for(let index=0;index<2;index++)state=dispatch(state,{type:'DISCARD',expectedRevision:state.revision,cardIds:[state.hand[0]]}).state;assert.equal(state.hand.length,12);
 for(let index=0;index<5;index++){state.consumables=[{...consumable('c_hanged_man'),id:`hanged-${index}`}];state.apkShop.context=currentApkShopContext(state);const result=use(state,state.hand.slice(0,2));assert.equal(result.error,null);state=result.state;}
 assert.equal(state.hand.length,2);assert.equal(state.hangedShortfallCardIds.length,10);assert.deepEqual(reload(state),state);
});

test('Hanged Man persists after a winning hand already shortened the round-won hand',()=>{
 let state=run('c_hanged_man');state.round.target=1n;state=dispatch(state,{type:'PLAY_HAND',expectedRevision:state.revision,cardIds:[state.hand[0]]}).state;assert.equal(state.phase,'round_won');assert.equal(state.hand.length,7);
 const result=use(state,state.hand.slice(0,2));assert.equal(result.error,null);assert.equal(result.state.hand.length,5);assert.deepEqual(reload(result.state),result.state);
});

test('debuffed Hanged Man consumes and counts but destroys nothing',()=>{
 const state=run('c_hanged_man'),targets=state.hand.slice(0,2),before=structuredClone(state.cards);state.consumables[0].debuffed=true;
 const result=use(state,targets);assert.equal(result.error,null);assert.deepEqual(result.state.cards,before);assert.deepEqual(result.events.filter(event=>event.type==='playing_card_destroyed'),[]);assert.equal(result.state.consumableUsage.c_hanged_man.count,1);
});

test('Death requires exactly two distinct held cards and rejects atomically',()=>{
 const valid=run('c_death'),targets=valid.hand.slice(0,2);assert.equal(canUseConsumable(valid,valid.consumables[0],[targets[1],targets[0]]).available,true);assert.equal(use(valid,targets).error,null);
 for(const select of [state=>[],state=>[state.hand[0]],state=>state.hand.slice(0,3),state=>[state.hand[0],state.hand[0]],state=>[state.hand[0],state.drawPile[0]],state=>[state.hand[0],'missing']]){
  const state=run('c_death'),before=structuredClone(state),result=use(state,select(state));assert.equal(result.error.code,'INVALID_TARGETS');assert.equal(result.state,state);assert.deepEqual(state,before);
 }
});

test('Death copies the rightmost selected card onto the left while preserving physical identities',()=>{
 const state=run('c_death'),left=state.hand[1],right=state.hand[5],leftId=state.cards[left].id,rightBefore=structuredClone(state.cards[right]),rng=structuredClone(state.rng);
 state.cards[left].rank=2;state.cards[left].suit='clubs';state.cards[left].enhancement='gold';state.cards[right].rank=13;state.cards[right].suit='hearts';state.cards[right].enhancement='lucky';state.apkShop.context=currentApkShopContext(state);
 const result=use(state,[right,left]);assert.equal(result.error,null);
 assert.deepEqual(result.state.cards[left],{id:leftId,rank:13,suit:'hearts',enhancement:'lucky'});assert.deepEqual(result.state.cards[right],{...rightBefore,rank:13,suit:'hearts',enhancement:'lucky'});
 assert.deepEqual(result.events.filter(event=>event.type==='playing_card_copied'),[{type:'playing_card_copied',cardId:left,sourceCardId:right,sourceId:'c_death-owned'}]);
 assert.deepEqual(result.state.rng,rng);assert.deepEqual(result.state.apkShop.context.enhancementIds,['m_lucky']);assert.deepEqual(reload(result.state),result.state);
});

test('Death removes a prior enhancement when the rightmost source is a base card',()=>{
 const state=run('c_death'),left=state.hand[0],right=state.hand[1];state.cards[left].enhancement='stone';delete state.cards[right].enhancement;state.apkShop.context=currentApkShopContext(state);
 const result=use(state,[left,right]);assert.equal(result.error,null);assert.equal(Object.hasOwn(result.state.cards[left],'enhancement'),false);assert.equal(result.state.cards[left].rank,result.state.cards[right].rank);assert.equal(result.state.cards[left].suit,result.state.cards[right].suit);
});

test('debuffed Death consumes and counts without copying either card',()=>{
 const state=run('c_death'),targets=state.hand.slice(0,2),before=structuredClone(state.cards);state.consumables[0].debuffed=true;
 const result=use(state,targets);assert.equal(result.error,null);assert.deepEqual(result.state.cards,before);assert.deepEqual(result.events.filter(event=>event.type==='playing_card_copied'),[]);assert.equal(result.state.consumableUsage.c_death.count,1);
});

test('Death preserves Mark concealment by identity when a hidden face copies a visible pip',()=>{
 let state=createRun('MARK0',{runId:'death-mark',money:4n,referenceRng:true,referenceShop:true});state.round.ante=2;state.round.blindId='boss';state.apkBlinds.ante=2;state.apkBlinds.tagContext.ante=2;state.apkBlinds.bossId='bl_mark';state.apkBlinds.bossesUsed.bl_mark=1;state.round.target=bossTarget(state);state.consumables=[consumable('c_death')];state.apkShop.context=currentApkShopContext(state);state.apkShop.context.ante=2;
 state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;const hidden=state.bossState.hiddenCardIds[0],pip=state.hand.find(id=>state.cards[id].rank<11);assert.ok(hidden);assert.ok(pip);
 const result=use(state,[pip,hidden]);assert.equal(result.error,null);assert.equal(result.state.cards[hidden].rank,result.state.cards[pip].rank);assert.ok(result.state.bossState.hiddenCardIds.includes(hidden));assert.deepEqual(reload(result.state),result.state);
});

test('Hanged Man and Death expose truthful implemented descriptions',()=>{
 assert.equal(describeShopItem(consumable('c_hanged_man')).description,'Уничтожает до 2 выбранных карт из колоды.');
 assert.equal(describeShopItem(consumable('c_death')).description,'Превращает левую выбранную карту в точную копию правой выбранной карты.');
});
