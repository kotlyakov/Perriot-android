import {changeHandSize} from './hand-size.js';
// Native Card:use_consumeable branches; invoked only on an action transaction clone.
import catalogue from '../content/apk-shop-catalog.js';
import {createPlayingCard,playingCardOrdinal,canonicalCards,validatePlayingCardIdentities,APK_BASE_CARD_IDS,shuffleApkDeck} from './apk-deck.js';
import {nextApkSeed,createApkMathState,nextApkMathRandom} from './apk-rng.js';
import {applyItem7CardsDestroyed,applyItem7PlayingCardsAdded} from './joker-item7-lifecycle.js';
import {createItem7Cards,repriceItem7Cards} from './joker-item7-economy.js';
import {stampJokerCreationOrdinals} from './shop.js';
import {currentApkShopContext} from './apk-shop-state.js';
const keys=new Set(['c_familiar','c_grim','c_incantation','c_ankh','c_hex','c_ectoplasm','c_immolate','c_wraith','c_sigil','c_ouija','c_cryptid']);
const handEffects=new Set(['c_familiar','c_grim','c_incantation','c_immolate','c_sigil','c_ouija']);
const creators={c_familiar:3,c_grim:2,c_incantation:4,c_cryptid:2};
const suits=['spades','hearts','diamonds','clubs'];
const enhancements=catalogue.centres.filter(c=>c.set==='Enhanced'&&c.key!=='m_stone').sort((a,b)=>a.order-b.order).map(c=>c.key.slice(2));
const no=(code,reason)=>({available:false,code,reason});
export const supportsSpectralEffect=key=>keys.has(key);
const editionless=state=>state.jokers.filter(j=>(j.edition??'base')==='base');
const capacity=state=>(state.jokerSlots??5)+state.jokers.filter(j=>j.edition==='negative').length;
export function spectralCapability(state,card,targetIds=[]){
 const key=card.entityId;
 if(!keys.has(key))return {available:true};
 if(!Array.isArray(state.jokers)||state.jokers.some(j=>!j||typeof j.id!=='string'))return no('INVALID_STATE','Некорректный набор джокеров.');
 if(handEffects.has(key)&&(!['playing','pack'].includes(state.phase)||!Array.isArray(state.hand)||state.hand.length<=1))return no('USE_UNAVAILABLE','Нужно не менее двух карт в руке.');
 if(key==='c_cryptid'&&(!['playing','pack'].includes(state.phase)||!Array.isArray(targetIds)||targetIds.length!==1||!Array.isArray(state.hand)||!state.hand.includes(targetIds[0])||!state.cards?.[targetIds[0]]))return no('INVALID_TARGETS','Выберите одну карту в руке.');
 if(key==='c_ankh'&&(!state.jokers?.length||capacity(state)<=1))return no('USE_UNAVAILABLE','Нужен джокер и не менее двух слотов.');
 if((key==='c_hex'||key==='c_ectoplasm')&&!editionless(state).length)return no('USE_UNAVAILABLE','Нет джокера без издания.');
 if(key==='c_wraith'&&state.jokers.length>=capacity(state))return no('USE_UNAVAILABLE','Нет места для нового джокера.');
 if(card.debuffed)return {available:true};
 if(!state.rng?.apk)return no('USE_UNAVAILABLE','Эффект требует нативного генератора.');
 try{
  if(handEffects.has(key)||key==='c_cryptid'){
   validatePlayingCardIdentities(state);canonicalCards(state.hand.map(id=>state.cards[id]));
   const count=creators[key]??0;if((state.nextPlayingCardOrdinal??53)+count>Number.MAX_SAFE_INTEGER||Object.keys(state.cards).length+count>10000)throw new RangeError();
  }
  if(['c_ankh','c_hex','c_ectoplasm'].includes(key)){
   const choices=key==='c_ankh'?state.jokers:editionless(state);
   if(choices.length>1&&(choices.some(j=>!Number.isSafeInteger(j.creationOrdinal)||j.creationOrdinal<1)||new Set(choices.map(j=>j.creationOrdinal)).size!==choices.length))throw new TypeError();
  }
  if(['c_ankh','c_hex','c_ectoplasm','c_wraith'].includes(key))currentApkShopContext(state);
  if(['c_immolate','c_wraith'].includes(key)&&typeof state.money!=='bigint')throw new TypeError();
  if(key==='c_ectoplasm'&&(!Number.isSafeInteger(state.ectoMinus??1)||(state.ectoMinus??1)<1||(state.ectoMinus??1)===Number.MAX_SAFE_INTEGER))throw new RangeError();
  const delta=state.spectralHandSizeDelta??0;if(!Number.isSafeInteger(delta)||delta>0||key==='c_ectoplasm'&&!Number.isSafeInteger(delta-(state.ectoMinus??1))||key==='c_ouija'&&!Number.isSafeInteger(delta-1))throw new RangeError();
 }catch{return no('INVALID_STATE','Некорректное состояние спектрального эффекта.');}
 return {available:true};
}
function raw(state,count=1){for(let i=0;i<count;i++)state.rng.apk={...state.rng.apk,mathState:nextApkMathRandom(state.rng.apk.mathState).state};}
function element(state,values,key,ordinal){
 if(ordinal)values=[...values].sort((a,b)=>ordinal(a)-ordinal(b));
 const seed=nextApkSeed(state.rng.apk,key),draw=nextApkMathRandom(createApkMathState(seed.value),values.length);
 state.rng.apk={...seed.rng,mathState:draw.state};return values[draw.value-1];
}
function handCost(state,cost,events,sourceId){changeHandSize(state,-cost);state.spectralHandSizeDelta=(state.spectralHandSizeDelta??0)-cost;events.push({type:'spectral_hand_size_changed',delta:-cost,total:state.spectralHandSizeDelta,sourceId});}
function destroyPlaying(state,ids,events,sourceId){
 const removed=new Set(ids),cards=ids.map(id=>state.cards[id]);
 applyItem7CardsDestroyed(state,cards.map(card=>({...card,shattered:card.enhancement==='glass'})),events);
 state.destroyedCardIds=[...(state.destroyedCardIds??APK_BASE_CARD_IDS.filter(id=>!Object.hasOwn(state.cards,id))),...ids];
 state.spectralDestroyedCardIds=[...(state.spectralDestroyedCardIds??[]),...ids];
 if(state.packState&&state.spectralShortfallEpoch?.consumed)delete state.spectralShortfallEpoch;
 if(!state.packState){state.spectralShortfallCardIds=[...(state.spectralShortfallCardIds??[]),...ids];state.spectralShortfallEpoch={cardIds:[...state.spectralShortfallCardIds],revision:state.revision+1,ante:state.round.ante,blindId:state.round.blindId,handsRemaining:state.round.handsRemaining,consumed:false};}
 for(const id of [...ids].reverse()){raw(state);delete state.cards[id];events.push({type:'playing_card_destroyed',cardId:id,sourceId});}
 for(const area of ['hand','drawPile','discardPile'])state[area]=state[area].filter(id=>!removed.has(id));
 if(state.apkBlinds?.playedCardIds)state.apkBlinds.playedCardIds=state.apkBlinds.playedCardIds.filter(id=>!removed.has(id));
 for(const field of ['playedBeforeBoss','hiddenCardIds','pareidoliaHiddenCardIds'])if(state.bossState?.[field])state.bossState[field]=state.bossState[field].filter(id=>!removed.has(id));
 if(removed.has(state.bossState?.forcedCardId))state.bossState.forcedCardId=null;
 if(state.bossState?.hiddenFaceRanks)for(const id of ids)delete state.bossState.hiddenFaceRanks[id];
}
function removeJokers(state,selected,events,sourceId){
 const removed=state.jokers.filter(j=>j!==selected&&!j.eternal);
 for(const joker of removed){raw(state);events.push({type:'joker_removed',sourceId,joker:structuredClone(joker),reason:'spectral'});}
 const ids=new Set(removed.map(j=>j.id));state.jokers=state.jokers.filter(j=>!ids.has(j.id));
 if(state.bossState?.hiddenJokerIds)state.bossState.hiddenJokerIds=state.bossState.hiddenJokerIds.filter(id=>!ids.has(id));
 if(ids.has(state.bossState?.heartDebuffedJokerId))state.bossState.heartDebuffedJokerId=null;
}
function created(state,payload,events,sourceId){raw(state,3);const card=createPlayingCard(state,payload,{area:'hand'});raw(state);events.push({type:'playing_card_created',sourceId,cardId:card.id,card:structuredClone(card)});return card;}
export function applySpectralEffect(state,card,targetIds,events){
 const key=card.entityId;if(!keys.has(key)||card.debuffed)return;
 if(handEffects.has(key)&&state.bossState?.id==='bl_mark'&&!state.bossState.hiddenFaceRanks)state.bossState.hiddenFaceRanks=Object.fromEntries(state.bossState.hiddenCardIds.map(id=>{const c=state.cards[id];return [id,playingCardOrdinal(id)>52||c.rank>=11&&c.rank<=13?c.rank:Number(id.match(/_(\d+)$/)?.[1])];}));
 if(['c_familiar','c_grim','c_incantation'].includes(key)){
  const victim=element(state,state.hand,'random_destroy',playingCardOrdinal);raw(state);destroyPlaying(state,[victim],events,card.id);
  const added=[],stream=key.slice(2)+'_create';
  for(let i=0;i<creators[key];i++){
   const rank=key==='c_grim'?14:element(state,key==='c_familiar'?[11,12,13]:[2,3,4,5,6,7,8,9,10],stream),suit=element(state,suits,stream),enhancement=element(state,enhancements,'spe_card');
   added.push(created(state,{rank,suit,enhancement},events,card.id));
  }
  applyItem7PlayingCardsAdded(state,added,events);
 }
 if(key==='c_immolate'){const result=shuffleApkDeck(state.hand.map(id=>state.cards[id]),state.rng.apk,'immolate');state.rng.apk=result.rng;raw(state);destroyPlaying(state,result.cardIds.slice(0,5),events,card.id);const before=state.money;state.money+=20n;events.push({type:'money_changed',sourceId:card.id,before,after:state.money,delta:20n});}
 if(key==='c_cryptid'){
  const source=state.cards[targetIds[0]],payload=Object.fromEntries(['rank','suit','enhancement','edition','seal'].filter(k=>Object.hasOwn(source,k)).map(k=>[k,source[k]])),added=[];
  for(let i=0;i<2;i++){const copy=created(state,payload,events,card.id);if(Object.hasOwn(source,'permaBonus')){copy.permaBonus=source.permaBonus;events.at(-1).card.permaBonus=source.permaBonus;}added.push(copy);}
  applyItem7PlayingCardsAdded(state,added,events);
 }
 if(key==='c_sigil'||key==='c_ouija'){
  const property=key==='c_sigil'?'suit':'rank',value=element(state,key==='c_sigil'?suits:[2,3,4,5,6,7,8,9,10,11,12,13,14],key.slice(2));
  for(const id of state.hand){const c=state.cards[id],before={rank:c.rank,suit:c.suit};c[property]=value;events.push({type:'playing_card_changed',cardId:id,before,after:{rank:c.rank,suit:c.suit},sourceId:card.id});}
  if(key==='c_ouija')handCost(state,1,events,card.id);raw(state,1+2*state.hand.length);
 }
 if(key==='c_ectoplasm'||key==='c_hex'){
  const chosen=element(state,editionless(state),key.slice(2),j=>j.creationOrdinal??0);chosen.edition=key==='c_hex'?'polychrome':'negative';events.push({type:'joker_edition_changed',sourceId:card.id,jokerId:chosen.id,edition:chosen.edition});
  if(key==='c_hex')removeJokers(state,chosen,events,card.id);
  else{const cost=state.ectoMinus??1;handCost(state,cost,events,card.id);state.ectoMinus=cost+1;}
  raw(state,2);repriceItem7Cards(state);
 }
 if(key==='c_ankh'){
  const chosen=element(state,state.jokers,'ankh_choice',j=>j.creationOrdinal??0);removeJokers(state,chosen,events,card.id);
  raw(state,3);
  if(chosen.entityId==='j_todo_list')element(state,currentApkShopContext(state).visibleHandOrder,'to_do');
  const copy=structuredClone(chosen),occupied=new Set([...Object.keys(state.cards),...state.jokers.map(j=>j.id),...(state.consumables??[]).map(c=>c.id)]);let n=1;while(occupied.has(`spectral:${state.revision}:ankh:${n}`))n++;copy.id=`spectral:${state.revision}:ankh:${n}`;
  if(copy.edition==='negative')copy.edition='base';delete copy.creationOrdinal;delete copy.gettingSliced;stampJokerCreationOrdinals(state,[copy]);raw(state);state.jokers.push(copy);repriceItem7Cards(state);events.push({type:'joker_created',sourceId:card.id,cardId:copy.id,entityId:copy.entityId,set:'Joker'});
 }
 if(key==='c_wraith'){createItem7Cards(state,{set:'Joker',count:1,append:'wra',rarity:.99,sourceId:card.id},events);raw(state);if(state.money!==0n){const before=state.money;state.money=0n;events.push({type:'money_changed',sourceId:card.id,before,after:0n,delta:-before});}}
}
