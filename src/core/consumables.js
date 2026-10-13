import {generateApkFoolCard,generateApkTarotConsumables} from './apk-shop.js';
import {quoteShopCard} from './shop-pricing.js';
import catalogue from '../content/apk-shop-catalog.js';
import {supportsConsumable,canManageInventory} from './inventory.js';
import {APK_HAND_NAMES,currentApkShopContext} from './apk-shop-state.js';
import {APK_BASE_CARD_IDS} from './apk-deck.js';
import {nextApkMathRandom,nextApkRandom} from './apk-rng.js';
import {originalJokerKey} from '../content/jokers.js';

const centres=new Map(catalogue.centres.map(c=>[c.key,c]));
const handIds=Object.fromEntries(Object.entries(APK_HAND_NAMES).map(([id,name])=>[name,id]));
const totalKeys=['tarot','planet','spectral','tarot_planet','all'];
const emptyTotals=()=>Object.fromEntries(totalKeys.map(key=>[key,0]));
const counter=value=>Number.isSafeInteger(value)&&value>=0;
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const blocked=(code,reason)=>({available:false,code,reason});
const moneyTarots=new Set(['c_hermit','c_temperance']);
const generatorTarots=new Map([['c_emperor','Tarot'],['c_high_priestess','Planet']]);
const wheelKey='c_wheel_of_fortune';
const creationSpace=(state,card)=>{const cards=state.consumables??[],remaining=cards.filter(c=>c.id!==card.id);return (state.consumableSlots??2)+cards.filter(c=>c.edition==='negative').length-remaining.length;};
const generatedCount=(state,card)=>Math.min(2,Math.max(0,creationSpace(state,card)));
const deckTarots=new Map([
 ['c_hanged_man',{minimum:1,maximum:2}],
 ['c_death',{minimum:2,maximum:2}],
]);
const baseTarots=new Map([
 ['c_strength',{minimum:1,maximum:2}],
 ['c_star',{minimum:1,maximum:3,suit:'diamonds'}],
 ['c_moon',{minimum:1,maximum:3,suit:'clubs'}],
 ['c_sun',{minimum:1,maximum:3,suit:'hearts'}],
 ['c_world',{minimum:1,maximum:3,suit:'spades'}],
]);
const enhancementTarots=new Map([
 ['c_magician',{enhancement:'lucky',maximum:2}],
 ['c_empress',{enhancement:'mult',maximum:2}],
 ['c_heirophant',{enhancement:'bonus',maximum:2}],
 ['c_lovers',{enhancement:'wild',maximum:1}],
 ['c_chariot',{enhancement:'steel',maximum:1}],
 ['c_justice',{enhancement:'glass',maximum:1}],
 ['c_tower',{enhancement:'stone',maximum:1}],
 ['c_devil',{enhancement:'gold',maximum:1}],
]);
const hasFoolSpace=(state,card)=>creationSpace(state,card)>0;
const generatedFoolId=card=>`fool:${card.id}`;
export function wheelSucceeds(roll,normal=1){return Number.isFinite(roll)&&roll>=0&&roll<=1&&Number.isFinite(normal)&&normal>=0&&roll<normal/4;}
export function wheelEdition(roll){if(!Number.isFinite(roll)||roll<0||roll>1)throw new RangeError('Invalid Wheel edition roll');return roll>.85?'polychrome':roll>.5?'holographic':roll>0?'foil':'base';}
const wheelEligible=state=>(state.jokers??[]).filter(joker=>(joker.edition??'base')==='base');
const wheelOrderKnown=jokers=>jokers.length<=1||jokers.every(joker=>Number.isSafeInteger(joker.creationOrdinal)&&joker.creationOrdinal>=1)&&new Set(jokers.map(joker=>joker.creationOrdinal)).size===jokers.length;
export function supportsConsumableEffect(card){const centre=centres.get(card?.entityId);return supportsConsumable(card)&&!!(centre?.set==='Planet'&&handIds[centre.handType]||centre?.key==='c_black_hole'||centre?.key==='c_fool'||centre?.key===wheelKey||moneyTarots.has(centre?.key)||enhancementTarots.has(centre?.key)||deckTarots.has(centre?.key)||baseTarots.has(centre?.key)||generatorTarots.has(centre?.key));}

export function validConsumableUsage(state){
 const hasUsage=Object.hasOwn(state,'consumableUsage'),hasTotals=Object.hasOwn(state,'consumableUsageTotal');
 if(hasUsage!==hasTotals)return false;
 if(Object.hasOwn(state,'lastTarotPlanet')&&state.lastTarotPlanet!==null&&!['Tarot','Planet'].includes(centres.get(state.lastTarotPlanet)?.set))return false;
 if(Object.hasOwn(state,'consumableUsage')){
  if(!record(state.consumableUsage))return false;
  for(const [key,usage] of Object.entries(state.consumableUsage)){
   const centre=centres.get(key);
   if(!centre?.consumeable||!record(usage)||Object.keys(usage).length!==3||!counter(usage.count)||usage.count<1||usage.order!==centre.order||usage.set!==centre.set)return false;
  }
 }
 if(Object.hasOwn(state,'consumableUsageTotal')){
  const totals=state.consumableUsageTotal;
  if(!record(totals)||Object.keys(totals).length!==totalKeys.length||!totalKeys.every(key=>counter(totals[key])))return false;
  const expected=emptyTotals();
  for(const usage of Object.values(state.consumableUsage)){
   const set=usage.set.toLowerCase();if(!['tarot','planet','spectral'].includes(set))return false;
   expected[set]+=usage.count;
  }
  expected.tarot_planet=expected.tarot+expected.planet;expected.all=expected.tarot_planet+expected.spectral;
  if(!totalKeys.every(key=>counter(expected[key])&&totals[key]===expected[key]))return false;
 }
 return true;
}

// Read-only capability query for an owned card. Purchase-and-use must acquire it first.
export function canUseConsumable(state,card,targetCardIds=[]){
 if(!canManageInventory(state))return blocked('INVALID_PHASE','Расходная карта недоступна в текущей фазе.');
 if(!counter(state.revision)||state.revision===Number.MAX_SAFE_INTEGER)return blocked('INVALID_STATE','Некорректная версия состояния.');
 const cards=state.consumables??[];
 if(!Array.isArray(cards)||cards.some(c=>!c||typeof c.id!=='string'||!c.id)||new Set(cards.map(c=>c.id)).size!==cards.length)return blocked('INVALID_STATE','Некорректный набор расходных карт.');
 const owned=cards.find(c=>c.id===card?.id);
 if(!owned)return blocked('CARD_NOT_FOUND','Карта больше не принадлежит игроку.');
 const centre=centres.get(owned.entityId);
 if(!supportsConsumableEffect(owned))return blocked('USE_UNAVAILABLE','Эффект этой расходной карты ещё не реализован.');
 const targetRule=enhancementTarots.has(centre.key)?{minimum:1,maximum:enhancementTarots.get(centre.key).maximum}:deckTarots.get(centre.key)??baseTarots.get(centre.key);
 if(targetRule){
  const {minimum,maximum}=targetRule;
  if(!Array.isArray(targetCardIds)||targetCardIds.length<minimum||targetCardIds.length>maximum||new Set(targetCardIds).size!==targetCardIds.length||targetCardIds.some(id=>typeof id!=='string'||!state.hand?.includes(id)||!state.cards?.[id]))return blocked('INVALID_TARGETS',minimum===maximum?(minimum===1?'Выберите одну карту в руке.':'Выберите две карты в руке.'):maximum===3?'Выберите от одной до трёх карт в руке.':'Выберите одну или две карты в руке.');
 }
 let shopContext=null;
 try{if(state.apkShop){if(!record(state.apkShop.context))throw new TypeError('Missing shop context');shopContext=currentApkShopContext(state);}}catch{return blocked('INVALID_STATE','Некорректное состояние магазина.');}
 if(generatorTarots.has(centre.key)&&!owned.debuffed&&generatedCount(state,owned)>0){
  if(!shopContext)return blocked('USE_UNAVAILABLE','Создание расходных карт требует забега с нативным генератором.');
  const ids=Array.from({length:generatedCount(state,owned)},(_,index)=>`generated:${state.revision}:${index+1}`),occupied=[...Object.keys(state.cards??{}),...(state.jokers??[]).map(c=>c?.id),...cards.filter(c=>c!==owned).map(c=>c.id),...(state.shop?['main','vouchers','boosters'].flatMap(area=>state.shop[area]??[]):[]).map(c=>c?.id)];
  if(ids.some(id=>occupied.includes(id)))return blocked('INVALID_STATE','Идентификатор созданной карты уже используется.');
 }
 if(centre.key===wheelKey&&!owned.debuffed){
  const eligible=wheelEligible(state);
  if(!eligible.length)return blocked('USE_UNAVAILABLE','Нет джокера без издания.');
  if(!wheelOrderKnown(eligible))return blocked('USE_UNAVAILABLE','Для старого сохранения неизвестен порядок создания джокеров.');
  if(!state.rng?.apk||!state.apkShop)return blocked('USE_UNAVAILABLE','Колесо Фортуны требует забега с нативным генератором.');
  try{const context=currentApkShopContext(state);for(const joker of eligible){const c=centres.get(joker.originalKey??originalJokerKey(joker.entityId));if(!c||c.set!=='Joker'||typeof joker.cost!=='bigint'||typeof joker.sellCost!=='bigint'||!Number.isSafeInteger(context.inflation)||!Number.isSafeInteger(context.discountPercent))throw new TypeError();}}catch{return blocked('INVALID_STATE','Некорректное состояние джокеров или магазина.');}
 }
 if(centre.key==='c_fool'){
  const previous=state.lastTarotPlanet,target=centres.get(previous);
  if(!previous||previous==='c_fool'||!['Tarot','Planet'].includes(target?.set))return blocked('USE_UNAVAILABLE','Сначала используйте другую карту Таро или Планеты.');
  if(!owned.debuffed&&hasFoolSpace(state,owned)&&shopContext?.bannedCentreIds.includes(previous))return blocked('USE_UNAVAILABLE','Создание из запрещённого пула ещё не реализовано.');
  const createdId=generatedFoolId(owned),occupied=[...Object.keys(state.cards??{}),...(state.jokers??[]).map(card=>card?.id),...cards.filter(card=>card!==owned).map(card=>card?.id)];
  if(!owned.debuffed&&hasFoolSpace(state,owned)&&occupied.includes(createdId))return blocked('INVALID_STATE','Идентификатор созданной карты уже используется.');
 }
 const affected=owned.debuffed||centre.set==='Tarot'?[]:centre.key==='c_black_hole'?Object.keys(APK_HAND_NAMES):[handIds[centre.handType]];
 if(!record(state.handLevels)||Object.keys(state.handLevels).length!==Object.keys(APK_HAND_NAMES).length||!Object.keys(APK_HAND_NAMES).every(id=>Number.isSafeInteger(state.handLevels[id])&&state.handLevels[id]>=1)||affected.some(id=>state.handLevels[id]===Number.MAX_SAFE_INTEGER)||!validConsumableUsage(state))return blocked('INVALID_STATE','Некорректный уровень комбинации или счётчик использования.');
 if(!owned.debuffed&&moneyTarots.has(centre.key)&&(typeof state.money!=='bigint'||centre.key==='c_temperance'&&(!Array.isArray(state.jokers)||state.jokers.some(joker=>typeof joker?.sellCost!=='bigint'||joker.sellCost<0n))))return blocked('INVALID_STATE','Некорректная сумма денег или стоимость джокера.');
 const totals=state.consumableUsageTotal??emptyTotals();
 const incremented=centre.set==='Planet'?['planet','tarot_planet','all']:centre.set==='Tarot'?['tarot','tarot_planet','all']:['spectral','all'];
 if(state.consumableUsage?.[centre.key]?.count===Number.MAX_SAFE_INTEGER||incremented.some(key=>totals[key]===Number.MAX_SAFE_INTEGER))return blocked('INVALID_STATE','Переполнение счётчика использования.');
 try{if(state.apkShop)currentApkShopContext(state);}catch{return blocked('INVALID_STATE','Некорректное состояние магазина.');}
 return {available:true,code:null,reason:null};
}

// Own revision validation as well as dispatch validation, so direct calls remain atomic.
export function applyConsumableAction(state,action){
 const reject=(code,message)=>({state,events:[],error:{code,message}});
 if(!action||action.type!=='USE_CONSUMABLE'||!Number.isSafeInteger(action.expectedRevision)||typeof action.cardId!=='string'||!action.cardId)return reject('INVALID_ACTION','Malformed consumable action');
 if(action.expectedRevision!==state.revision)return reject('STALE_ACTION','State revision has changed');
 const card=Array.isArray(state.consumables)?state.consumables.find(c=>c?.id===action.cardId):null;
 const capability=canUseConsumable(state,card,action.targetCardIds);
 if(!capability.available)return reject(capability.code,capability.reason);
 const centre=centres.get(card.entityId),next=structuredClone(state),events=[];
 const previousTarotPlanet=state.lastTarotPlanet??null;
 // Older Mark saves have no draw-time rank snapshot. Capture it before a
 // targeted transformation; current rank may cease to be a face afterwards.
 if(!card.debuffed&&next.bossState?.id==='bl_mark'&&(baseTarots.has(centre.key)||centre.key==='c_death')&&!next.bossState.hiddenFaceRanks){
  next.bossState.hiddenFaceRanks=Object.fromEntries(next.bossState.hiddenCardIds.map(id=>{
   const rank=state.cards[id].rank;return [id,rank>=11&&rank<=13?rank:Number(id.match(/_(\d+)$/)?.[1])];
  }));
 }
 if(!card.debuffed&&baseTarots.has(centre.key))for(const cardId of action.targetCardIds){
  const target=next.cards[cardId],before={rank:target.rank,suit:target.suit},rule=baseTarots.get(centre.key);
  if(rule.suit)target.suit=rule.suit;else target.rank=target.rank===14?2:target.rank+1;
  events.push({type:'playing_card_changed',cardId,before,after:{rank:target.rank,suit:target.suit},sourceId:card.id});
 }
 if(!card.debuffed&&enhancementTarots.has(centre.key))for(const cardId of action.targetCardIds){
  const {enhancement}=enhancementTarots.get(centre.key);next.cards[cardId].enhancement=enhancement;events.push({type:'card_enhanced',cardId,enhancement,sourceId:card.id});
 }
 if(!card.debuffed&&centre.key==='c_hanged_man'){
  const removed=new Set(action.targetCardIds);
  next.hand=next.hand.filter(id=>!removed.has(id));
  const priorDestroyed=next.destroyedCardIds??APK_BASE_CARD_IDS.filter(id=>!Object.hasOwn(next.cards,id));
  next.destroyedCardIds=[...priorDestroyed,...action.targetCardIds];
  next.hangedDestroyedCardIds=[...(next.hangedDestroyedCardIds??[]),...action.targetCardIds];
  next.hangedShortfallCardIds=[...(next.hangedShortfallCardIds??[]),...action.targetCardIds];
  for(const cardId of [...action.targetCardIds].reverse()){delete next.cards[cardId];events.push({type:'playing_card_destroyed',cardId,sourceId:card.id});}
  if(next.apkBlinds?.playedCardIds)next.apkBlinds.playedCardIds=next.apkBlinds.playedCardIds.filter(id=>!removed.has(id));
  if(next.bossState?.playedBeforeBoss)next.bossState.playedBeforeBoss=next.bossState.playedBeforeBoss.filter(id=>!removed.has(id));
  if(next.bossState?.hiddenCardIds)next.bossState.hiddenCardIds=next.bossState.hiddenCardIds.filter(id=>!removed.has(id));
  if(next.bossState?.hiddenFaceRanks)for(const id of removed)delete next.bossState.hiddenFaceRanks[id];
 }
 if(!card.debuffed&&centre.key==='c_death'){
  const selected=new Set(action.targetCardIds),ordered=state.hand.filter(id=>selected.has(id)),[left,right]=ordered;
  const source=next.cards[right],target=next.cards[left];target.rank=source.rank;target.suit=source.suit;
  if(Object.hasOwn(source,'enhancement'))target.enhancement=source.enhancement;else delete target.enhancement;
  events.push({type:'playing_card_copied',cardId:left,sourceCardId:right,sourceId:card.id});
 }
 const affected=card.debuffed||centre.set==='Tarot'?[]:centre.key==='c_black_hole'?Object.keys(APK_HAND_NAMES):[handIds[centre.handType]];
 for(const handId of affected){next.handLevels[handId]++;events.push({type:'hand_level_changed',handId,levels:1,level:next.handLevels[handId]});}
 if(!card.debuffed&&moneyTarots.has(centre.key)){
  let delta;if(centre.key==='c_hermit')delta=next.money<=0n?0n:next.money<20n?next.money:20n;
  else{const total=next.jokers.reduce((sum,joker)=>sum+joker.sellCost,0n);delta=total>50n?50n:total;}
  const before=next.money;next.money+=delta;events.push({type:'money_changed',before,after:next.money,delta});
 }
 if(!card.debuffed&&centre.key===wheelKey){
  let roll=nextApkRandom(next.rng.apk,'wheel_of_fortune');next.rng.apk=roll.rng;
  if(wheelSucceeds(roll.value)){
   const eligible=wheelEligible(next).sort((a,b)=>(a.creationOrdinal??0)-(b.creationOrdinal??0));
   const selected=nextApkRandom(next.rng.apk,'wheel_of_fortune',1,eligible.length);next.rng.apk=selected.rng;
   roll=nextApkRandom(next.rng.apk,'wheel_of_fortune');next.rng.apk=roll.rng;
   const joker=eligible[selected.value-1],edition=wheelEdition(roll.value),context=currentApkShopContext(next),definition=centres.get(joker.originalKey??originalJokerKey(joker.entityId));
   joker.edition=edition;
   Object.assign(joker,quoteShopCard({baseCost:BigInt(definition.cost),inflation:BigInt(context.inflation),discountPercent:BigInt(context.discountPercent),set:'Joker',name:definition.name,edition:edition==='base'?{}:{[edition==='holographic'?'holo':edition]:true},rental:!!joker.rental}));
   events.push({type:'joker_edition_changed',sourceId:card.id,jokerId:joker.id,edition});
   let juice=nextApkMathRandom(next.rng.apk.mathState);next.rng.apk={...next.rng.apk,mathState:juice.state};
   if(edition!=='base'){juice=nextApkMathRandom(next.rng.apk.mathState);next.rng.apk={...next.rng.apk,mathState:juice.state};}
  }else{const juice=nextApkMathRandom(next.rng.apk.mathState);next.rng.apk={...next.rng.apk,mathState:juice.state};}
 }
 let created=null;
 let generatedCards=[];
 if(!card.debuffed&&generatorTarots.has(centre.key)&&generatedCount(state,card)>0){
  const generated=generateApkTarotConsumables(next.rng.apk,currentApkShopContext(next),{set:generatorTarots.get(centre.key),count:generatedCount(state,card),instancePrefix:`generated:${state.revision}`});
  generatedCards=generated.cards;next.rng.apk=generated.rng;
  for(const created of generatedCards)events.push({type:'consumable_created',sourceId:card.id,cardId:created.id,entityId:created.entityId,set:created.set});
 }
 if(!card.debuffed&&centre.key==='c_fool'&&hasFoolSpace(state,card)){
  if(next.apkShop){const generated=generateApkFoolCard(next.rng.apk,currentApkShopContext(next),{centreId:previousTarotPlanet,instanceId:generatedFoolId(card)});created=generated.card;next.rng.apk=generated.rng;}
  else{const copied=centres.get(previousTarotPlanet);created={id:generatedFoolId(card),entityId:copied.key,originalKey:copied.key,set:copied.set,edition:'base',...quoteShopCard({baseCost:BigInt(copied.cost),set:copied.set})};}
  events.push({type:'consumable_created',sourceId:card.id,cardId:created.id,entityId:created.entityId,set:created.set});
 }
 // States predating the first implemented use operation have no possible prior uses.
 next.consumableUsage??={};next.consumableUsageTotal??=emptyTotals();next.lastTarotPlanet??=null;
 const usage=next.consumableUsage[centre.key]??{count:0,order:centre.order,set:centre.set};
 usage.count++;next.consumableUsage[centre.key]=usage;
 if(centre.set==='Planet'){next.consumableUsageTotal.planet++;next.consumableUsageTotal.tarot_planet++;next.lastTarotPlanet=centre.key;}
 else if(centre.set==='Tarot'){next.consumableUsageTotal.tarot++;next.consumableUsageTotal.tarot_planet++;next.lastTarotPlanet=centre.key;}
 else next.consumableUsageTotal.spectral++;
 next.consumableUsageTotal.all++;
 next.consumables=next.consumables.filter(c=>c.id!==card.id);if(created)next.consumables.push(created);next.consumables.push(...generatedCards);next.lastScore=null;next.revision++;
 if(next.apkShop)next.apkShop.context=currentApkShopContext(next);
 events.unshift({type:'consumable_used',cardId:card.id,entityId:centre.key,set:centre.set});
 events.push({type:'consumable_usage_changed',entityId:centre.key,count:usage.count});
 return {state:next,events,error:null};
}

