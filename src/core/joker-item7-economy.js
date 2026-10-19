// Source contracts: native Card:add/remove_from_deck, calculate_joker and set_cost.
import {addItem7DoubleTag} from './joker-double-tags.js';
import {initializeItem7Joker} from './joker-item7-lifecycle.js';
import {stampJokerCreationOrdinals} from './shop.js';
import * as generation from './apk-shop.js';
import {currentApkShopContext} from './apk-shop-state.js';
import {jokerEffectContext} from './joker-contexts.js';
import {nextApkRandom,nextApkSeed,nextApkMathRandom,createApkMathState} from './apk-rng.js';
import {disableBoss} from './boss-effects.js';
import {quoteShopCard} from './shop-pricing.js';
import catalogue from '../content/apk-shop-catalog.js';
const centres=new Map(catalogue.centres.map(c=>[c.key,c]));
const active=state=>(state.jokers??[]).filter(j=>!j.debuffed);
export function item7EconomyModifiers(state){
 const cards=active(state),count=key=>cards.filter(j=>j.entityId===key).length;
 return {bankruptAt:-20n*BigInt(count('j_credit_card')),interestAmount:1n+BigInt(count('j_to_the_moon')),probabilityNormal:2**count('j_oops'),astronomer:count('j_astronomer')>0,showman:count('j_ring_master')>0,chaosCount:count('j_chaos')};
}
function change(joker,key,after,events,fallback){const before=joker[key]??fallback;joker[key]=after;events.push({type:'joker_counter_changed',sourceId:joker.id,counter:key,before,after});}
function value(card,amount,sourceId,events){const before=card.sellCost;card.extraValue=(card.extraValue??0n)+amount;card.sellCost+=amount;events.push({type:'card_sell_value_changed',sourceId,cardId:card.id,before,after:card.sellCost});}
export const item7ConsumableSpace=state=>Math.max(0,(state.consumableSlots??2)+(state.consumables??[]).filter(c=>c.edition==='negative').length-(state.consumables??[]).length);
const freeJokers=state=>(state.jokerSlots??5)+state.jokers.filter(c=>c.edition==='negative').length-state.jokers.length;
function raw(state,count=1){if(!state.rng?.apk)throw new TypeError('Native RNG required');for(let i=0;i<count;i++)state.rng.apk={...state.rng.apk,mathState:nextApkMathRandom(state.rng.apk.mathState).state};}
function element(state,cards,key){
 // Native pseudorandom_element sorts card tables by sort_id, not display position.
 if(cards.length>1&&typeof cards[0]==='object'){
  if(cards.some(card=>!Number.isSafeInteger(card.creationOrdinal)||card.creationOrdinal<1)||new Set(cards.map(card=>card.creationOrdinal)).size!==cards.length)throw new TypeError('Invalid card creation identities');
  cards=[...cards].sort((a,b)=>a.creationOrdinal-b.creationOrdinal);
 }
 const seed=nextApkSeed(state.rng.apk,key),draw=nextApkMathRandom(createApkMathState(seed.value),cards.length);state.rng.apk={...seed.rng,mathState:draw.state};return cards[draw.value-1];}
function id(state,source,label){const occupied=new Set([...Object.keys(state.cards??{}),...state.jokers.map(c=>c.id),...(state.consumables??[]).map(c=>c.id),...(state.shop?['main','boosters','vouchers'].flatMap(area=>(state.shop[area]??[]).map(c=>c.id)):[])]);const sourceIndex=[...state.jokers,...(state.consumables??[])].findIndex(c=>c.id===source);const prefix=`item7:${state.revision??0}:${sourceIndex}:${label}`;let index=1;while([...occupied].some(value=>value===`${prefix}:${index}`||value.startsWith(`${prefix}:${index}:`)))index++;return `${prefix}:${index}`;}
// Called inside an action clone. No substitute pool or generator is permitted.
export function createItem7Cards(state,{set='Tarot',count=1,append,sourceId,rarity,materialize,reserved=false},events){
 count=reserved?count:Math.min(count,set==='Joker'?freeJokers(state):item7ConsumableSpace(state));if(count<=0)return [];
 if(!generation.generateApkEffectCards)throw new TypeError('Native effect card generation unavailable');
 const result=generation.generateApkEffectCards(state.rng.apk,currentApkShopContext(state),{set,count,append,rarity,instancePrefix:id(state,sourceId,append),materialize});
 state.rng.apk=result.rng;const area=set==='Joker'?'jokers':'consumables';state[area]??=[];
 for(const card of result.cards){if(set==='Joker'){initializeItem7Joker(state,card);}stampJokerCreationOrdinals(state,[card]);state[area].push(card);events.push({type:set==='Joker'?'joker_created':'consumable_created',sourceId,cardId:card.id,entityId:card.entityId,set:card.set});}
 return result.cards;
}
export function item7SaleCapability(){return {available:true,code:null,reason:null};}
// The caller has removed the sold card. Native duplication checks capacity before removal.
export function applyItem7SoldJoker(state,joker,events,options={}){
 if(joker.debuffed)return;
 if(joker.entityId==='j_luchador'&&state.bossState&&!state.bossState.disabled&&state.round.blindId==='boss')disableBoss(state,events,options);
 if(joker.entityId==='j_diet_cola'){addItem7DoubleTag(state,events);raw(state,2);}
 if(joker.entityId!=='j_invisible'||(joker.invisibleRounds??0)<2||!state.jokers.length||freeJokers(state)<(joker.edition==='negative'?0:1))return;
 const chosen=element(state,state.jokers,'invisible'),copy=structuredClone(chosen);if(chosen.entityId==='j_todo_list')element(state,currentApkShopContext(state).visibleHandOrder,'to_do');copy.id=id(state,joker.id,'invisible');
 if(copy.edition==='negative')copy.edition='base';
 if(copy.entityId==='j_invisible')copy.invisibleRounds=0;
 const context=currentApkShopContext(state),centre=centres.get(copy.originalKey??copy.entityId);
 Object.assign(copy,quoteShopCard({baseCost:BigInt(centre.cost),inflation:BigInt(context.inflation),discountPercent:BigInt(context.discountPercent),set:'Joker',name:centre.name,extraValue:copy.extraValue??0n,edition:copy.edition==='base'?{}:{[copy.edition==='holographic'?'holo':copy.edition]:true},rental:!!copy.rental}));
 delete copy.creationOrdinal;delete copy.gettingSliced;stampJokerCreationOrdinals(state,[copy]);raw(state,3);state.jokers.push(copy);events.push({type:'joker_created',sourceId:joker.id,cardId:copy.id,entityId:copy.entityId,set:'Joker'});
}
// Reserve while discovering native setting_blind callbacks, before a later
// Dagger/Madness can mark the already scheduled source for dissolution.
export function queueItem7BlindEconomy(state,context,events,pending){
 const {source,target}=context,key=target.entityId;
 if(source.gettingSliced||target.gettingSliced)return;
 if(key==='j_riff_raff'){
  const count=Math.min(2,freeJokers(state)-pending.jokerBuffer);
  if(count>0){pending.jokerBuffer+=count;pending.callbacks.push(()=>createItem7Cards(state,{set:'Joker',count,append:'rif',rarity:0,sourceId:source.id,materialize:true,reserved:true},events));}
 }
 if(key==='j_cartomancer'&&item7ConsumableSpace(state)>pending.consumableBuffer){
  pending.consumableBuffer++;
  // Cartomancer's first callback schedules its actual constructor one FIFO later.
  pending.nestedCallbacks.push(()=>createItem7Cards(state,{append:'car',sourceId:source.id,reserved:true},events));
 }
}
export function applyItem7EconomyContext(state,context,events){
 const cards=[...state.jokers],pending=[];let jokerSpace=freeJokers(state),consumableSpace=item7ConsumableSpace(state);
 const reserve=options=>{const area=options.set==='Joker'?'joker':'consumable',available=area==='joker'?jokerSpace:consumableSpace,count=Math.min(options.count??1,available);if(count<=0)return;if(area==='joker')jokerSpace-=count;else consumableSpace-=count;pending.push({...options,count});};
 for(let index=0;index<cards.length;index++){
  const resolved=jokerEffectContext(cards,index);if(!resolved)continue;
  const {source,target:joker,copied}=resolved,key=joker.entityId;
  if(context.type==='using_consumeable'&&context.set==='Planet'&&!copied&&key==='j_constellation')change(joker,'xMult',(joker.xMult??1)+.1,events,1);
  if(context.type==='reroll_shop'&&!copied&&key==='j_flash')change(joker,'mult',(joker.mult??0)+2,events,0);
  if(context.type==='selling_card'&&!copied&&key==='j_campfire')change(joker,'xMult',(joker.xMult??1)+.25,events,1);
  if(context.type==='skipping_booster'&&!copied&&key==='j_red_card')change(joker,'mult',(joker.mult??0)+3,events,0);
  if(context.type==='end_of_round'&&!copied){
   if(key==='j_egg')value(joker,3n,joker.id,events);
   if(key==='j_gift')for(const card of [...state.jokers,...(state.consumables??[])])value(card,1n,joker.id,events);
   if(key==='j_invisible')change(joker,'invisibleRounds',(joker.invisibleRounds??0)+1,events,0);
   if(state.round.blindId==='boss'){
    if(key==='j_rocket')change(joker,'rocketDollars',(joker.rocketDollars??1n)+2n,events,1n);
    if(key==='j_campfire'&&(joker.xMult??1)>1)change(joker,'xMult',1,events,1);
   }
  }
  if(context.type==='setting_blind'&&!source.gettingSliced){
   if(key==='j_riff_raff')reserve({set:'Joker',count:2,append:'rif',rarity:0,sourceId:source.id,materialize:true});
   if(key==='j_cartomancer')reserve({append:'car',sourceId:source.id});
  }
  if(context.type==='open_booster'&&key==='j_hallucination'&&consumableSpace>0){const roll=nextApkRandom(state.rng.apk,'halu'+state.round.ante);state.rng.apk=roll.rng;if(roll.value<item7EconomyModifiers(state).probabilityNormal/2)reserve({append:'hal',sourceId:source.id});}
  if(context.type==='ending_shop'&&key==='j_perkeo'&&state.consumables?.length){const copy=structuredClone(element(state,state.consumables,'perkeo'));copy.id=id(state,source.id,'perkeo');copy.edition='negative';delete copy.creationOrdinal;stampJokerCreationOrdinals(state,[copy]);raw(state,4);state.consumables.push(copy);repriceItem7Cards(state);events.push({type:'consumable_created',sourceId:source.id,cardId:copy.id,entityId:copy.entityId,set:copy.set});}
 }
 for(const options of pending)createItem7Cards(state,options,events);
}

// Astronomer acquisition/removal and sell-value changes use the same native quotation.
export function repriceItem7Cards(state){
 if(!state.apkShop)return;
 const context=currentApkShopContext(state),astronomer=item7EconomyModifiers(state).astronomer;
 for(const card of [...state.jokers,...(state.consumables??[]),...(state.shop?['main','vouchers','boosters'].flatMap(area=>state.shop[area]??[]):[])]){
  const centre=centres.get(card.originalKey??card.entityId);if(!centre)continue;
  Object.assign(card,quoteShopCard({baseCost:BigInt(centre.cost??1),inflation:BigInt(context.inflation),discountPercent:BigInt(context.discountPercent),set:centre.set,name:centre.name,edition:(card.edition??'base')==='base'?{}:{[card.edition==='holographic'?'holo':card.edition]:true},ante:BigInt(context.ante),boosterAnteScaling:!!context.modifiers.booster_ante_scaling,tutorialShopSurcharge:!!context.tutorialShopSurcharge,astronomer,rental:!!card.rental,extraValue:card.extraValue??0n,couponed:!!card.couponed,area:state.shop?.main.includes(card)?'shop_jokers':state.shop?.boosters.includes(card)?'shop_booster':''}));
 }
}
