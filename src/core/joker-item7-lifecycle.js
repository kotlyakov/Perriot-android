import {nextApkRandom,nextApkMathRandom} from './apk-rng.js';
import {canonicalCards} from './apk-deck.js';
import {jokerEffectContext} from './joker-contexts.js';
import {isCardFace} from './card-faces.js';
import {isCardSuit} from './card-suits.js';
import {isBossCardDebuffed,disableBoss} from './boss-effects.js';
import {evaluateHand} from './hands.js';
import {handRecognitionOptions} from '../content/jokers.js';

const defaults={};
for(const id of ['j_ride_the_bus','j_trousers','j_green_joker','j_flash','j_red_card','j_ceremonial'])defaults[id]={mult:0};
for(const id of ['j_runner','j_square','j_castle','j_wee'])defaults[id]={chips:0};
for(const id of ['j_lucky_cat','j_vampire','j_obelisk','j_constellation','j_hologram','j_campfire','j_glass','j_hit_the_road','j_throwback','j_madness'])defaults[id]={xMult:1};
Object.assign(defaults,{j_popcorn:{mult:20},j_ice_cream:{chips:100},j_ramen:{xMult:2},j_yorick:{xMult:1,yorickDiscards:23},j_caino:{cainoXMult:1},j_turtle_bean:{turtleHandSize:5},j_invisible:{invisibleRounds:0},j_rocket:{rocketDollars:1n},j_loyalty_card:{loyaltyRemaining:5}});
const counterFields=new Set([...Object.values(defaults).flatMap(Object.keys),'extraValue','toDoPokerHand']);
export const ITEM7_JOKER_DEFAULTS=Object.freeze(Object.fromEntries(Object.entries(defaults).map(([id,value])=>[id,Object.freeze(value)])));
export function initializeItem7Joker(state,joker){for(const [key,value] of Object.entries(defaults[joker.entityId]??{}))joker[key]??=value;if(joker.entityId==='j_todo_list'&&!joker.toDoPokerHand)resetToDoHand(state,joker);return joker;}
export function validItem7Ability(joker){
 const own=defaults[joker.entityId]??{};
 for(const key of counterFields){
  if(!Object.hasOwn(joker,key))continue;
  const value=joker[key];
  if(key==='extraValue'){if(typeof value!=='bigint'||value<0n)return false;continue;}
  if(key==='toDoPokerHand'){if(joker.entityId!=='j_todo_list'||!['High Card','Pair','Two Pair','Three of a Kind','Straight','Flush','Full House','Four of a Kind','Straight Flush','Five of a Kind','Flush House','Flush Five'].includes(value))return false;continue;}
  if(!Object.hasOwn(own,key)||typeof value!==typeof own[key])return false;
  if(typeof value==='bigint'){if(value<1n)return false;continue;}
  if(!Number.isFinite(value)||value<0||value>Number.MAX_SAFE_INTEGER)return false;
  if(!['xMult','cainoXMult'].includes(key)&&!Number.isSafeInteger(value))return false;
  if(['xMult','cainoXMult'].includes(key)&&value<1)return false;
  if(key==='loyaltyRemaining'&&value>5||key==='yorickDiscards'&&(value<1||value>23)||key==='turtleHandSize'&&(value<1||value>5))return false;
 }
 return true;
}
function change(joker,key,after,events){const before=joker[key]??defaults[joker.entityId]?.[key]??0;if(before===after)return;joker[key]=after;events.push({type:'joker_counter_changed',sourceId:joker.id,counter:key,before,after});}
function remove(state,joker,events,reason){state.jokers=state.jokers.filter(j=>j!==joker);events.push({type:'joker_removed',sourceId:joker.id,joker:structuredClone(joker),reason});}
function random(state,key,min,max){if(!state.rng?.apk)throw new TypeError('Joker lifecycle requires native RNG');const draw=nextApkRandom(state.rng.apk,key,min,max);state.rng.apk=draw.rng;return draw.value;}
function rank(state,card){if(card.enhancement!=='stone')return card.rank;const draw=nextApkMathRandom(state.rng.apk.mathState,100,1000000);state.rng.apk={...state.rng.apk,mathState:draw.state};return -draw.value;}
function face(state,card){return isCardFace(card,state.jokers,{debuffed:isBossCardDebuffed(state,card),rankGetter:card=>rank(state,card)});}
function money(state,value,events,sourceId){const before=state.money;state.money+=value;events.push({type:'money_changed',before,after:state.money,delta:value,sourceId});}
function own(state,fn){for(const joker of [...state.jokers])if(!joker.debuffed){initializeItem7Joker(state,joker);fn(joker);}}
function contexts(state){return state.jokers.map((_,i)=>jokerEffectContext(state.jokers,i)).filter(Boolean);}
export function item7CapacityDeltas(jokers=[]){
 const result={handSize:0,hands:0,discards:0};
 for(const j of jokers){if(j.debuffed)continue;const id=j.entityId;
  if(id==='j_juggler')result.handSize++;
  if(id==='j_drunkard')result.discards++;
  if(id==='j_merry_andy'){result.discards+=3;result.handSize--;}
  if(id==='j_troubadour'){result.handSize+=2;result.hands--;}
  if(id==='j_stuntman')result.handSize-=2;
  if(id==='j_turtle_bean')result.handSize+=j.turtleHandSize??5;
 }
 return result;
}
// Call once after blind counters and boss state exist. Slices are queued until all
// activations inspect their original neighbours, matching native event callbacks.
export function applyItem7BlindStart(state,events,{deferRemoval=false}={}){
 const sliced=new Set();
 for(const context of contexts(state)){
  const {source,target,copied}=context;if(source.gettingSliced||target.gettingSliced)continue;
  initializeItem7Joker(state,target);const id=target.entityId;
  if(id==='j_burglar'){state.round.discardsRemaining=0;state.round.handsRemaining+=3;state.round.burglarHandsGranted=(state.round.burglarHandsGranted??0)+3;}
  if(id==='j_chicot'&&!copied&&state.round.blindId==='boss'&&state.bossState){disableBoss(state,events);}
  if(id==='j_madness'&&!copied&&state.round.blindId!=='boss'){
   change(target,'xMult',target.xMult+.5,events);
   const choices=state.jokers.filter(j=>j!==target&&!j.eternal&&!j.gettingSliced).sort((a,b)=>(a.creationOrdinal??state.jokers.indexOf(a))-(b.creationOrdinal??state.jokers.indexOf(b)));
   if(choices.length){const victim=choices[random(state,'madness',1,choices.length)-1];victim.gettingSliced=true;sliced.add(victim);}
  }
  if(id==='j_ceremonial'&&!copied){const next=state.jokers[state.jokers.indexOf(target)+1];if(next&&!next.eternal&&!next.gettingSliced){next.gettingSliced=true;sliced.add(next);change(target,'mult',target.mult+Number(next.sellCost??0n)*2,events);}}
 }
 const pending={sliced:[...sliced]};if(!deferRemoval)finishItem7BlindStart(state,events,pending);return pending;
}
export function finishItem7BlindStart(state,events,pending){for(const joker of pending.sliced)if(state.jokers.includes(joker))remove(state,joker,events,'sliced');}
export function applyItem7AfterScore(state,events){
 // Loyalty follows the global play clock even while its effect is debuffed.
 for(const j of state.jokers)if(j.entityId==='j_loyalty_card')change(j,'loyaltyRemaining',((j.loyaltyRemaining??5)+5)%6,events);
 own(state,j=>{if(j.entityId==='j_ice_cream'){if(j.chips<=5)remove(state,j,events,'depleted');else change(j,'chips',j.chips-5,events);}});}
export function applyItem7EndRound(state,events,{gameOver=false}={}){
 let saved=false;
 own(state,j=>{
  const id=j.entityId;
  if(id==='j_todo_list')resetToDoHand(state,j);
  if(id==='j_hit_the_road')change(j,'xMult',1,events);
  if(id==='j_popcorn'){if(j.mult<=4)remove(state,j,events,'depleted');else change(j,'mult',j.mult-4,events);}
  if(id==='j_turtle_bean'){if(j.turtleHandSize<=1)remove(state,j,events,'depleted');else change(j,'turtleHandSize',j.turtleHandSize-1,events);}
  if(id==='j_gros_michel'||id==='j_cavendish'){
   const normal=2**state.jokers.filter(x=>x.entityId==='j_oops'&&!x.debuffed).length;
   if(random(state,id==='j_gros_michel'?'gros_michel':'cavendish')<normal/(id==='j_gros_michel'?6:1000)){
    remove(state,j,events,'extinct');if(id==='j_gros_michel'){state.apkShop??={};state.apkShop.context??={};state.apkShop.context.poolFlags??={};state.apkShop.context.poolFlags.gros_michel_extinct=true;}
   }
  }
  if(id==='j_mr_bones'&&gameOver&&state.round.score*4n>=state.round.target){saved=true;remove(state,j,events,'saved');}
 });
 return {saved};
}
// Cards remain in state.cards until the reducer applies the returned removals.
// `forced` is Hook's discard context: it suppresses Burnt, but not card effects.
export function applyItem7Discard(state,cardIds,events,{forced=false}={}){
 const cards=cardIds.map(id=>state.cards[id]),removed=[];
 const first=(state.round.discardsUsed??0)===0;
 if(first&&!forced)for(const c of contexts(state))if(c.target.entityId==='j_burnt'){
  const handId=evaluateHand(cards,{...handRecognitionOptions(state.jokers),isCardDebuffed:card=>isBossCardDebuffed(state,card)}).handId;
  state.handLevels[handId]++;events.push({type:'hand_level_changed',handId,levels:1,level:state.handLevels[handId],sourceId:c.source.id});
 }
 for(const card of cards)for(const c of contexts(state)){
  const {source,target:j,copied}=c;initializeItem7Joker(state,j);const id=j.entityId,debuffed=isBossCardDebuffed(state,card);
  if(id==='j_mail'&&!debuffed&&rank(state,card)===(state.round.mailRank))money(state,5n,events,source.id);
  if(copied)continue;
  if(id==='j_ramen'){const after=Math.round((j.xMult-.01)*100)/100;if(after<=1)remove(state,j,events,'depleted');else change(j,'xMult',after,events);}
  if(id==='j_yorick'){if(j.yorickDiscards<=1){change(j,'yorickDiscards',23,events);change(j,'xMult',j.xMult+1,events);}else change(j,'yorickDiscards',j.yorickDiscards-1,events);}
  if(id==='j_trading'&&first&&cards.length===1){money(state,3n,events,j.id);if(!removed.includes(card))removed.push(card);}
  if(id==='j_castle'&&!debuffed&&isCardSuit(card,state.round.castleSuit??'spades',{debuffed,jokers:state.jokers}))change(j,'chips',j.chips+3,events);
  if(id==='j_hit_the_road'&&!debuffed&&rank(state,card)===11)change(j,'xMult',j.xMult+.5,events);
 }
 for(const c of contexts(state)){
  if(c.target.entityId==='j_green_joker'&&!c.copied)change(c.target,'mult',Math.max(0,(c.target.mult??0)-1),events);
  if(c.target.entityId==='j_faceless'&&cards.filter(card=>face(state,card)).length>=3)money(state,5n,events,c.source.id);
 }
 return removed;
}
export function applyItem7CardsDestroyed(state,cards,events,{hangedMan=false}={}){
 own(state,j=>{
  if(j.entityId==='j_caino'){const faces=cards.filter(card=>face(state,card)).length;if(faces)change(j,'cainoXMult',j.cainoXMult+faces,events);}
  if(j.entityId==='j_glass'){const glasses=cards.filter(card=>card.shattered||hangedMan&&card.enhancement==='glass').length;if(glasses)change(j,'xMult',j.xMult+.75*glasses,events);}
 });
}
export function applyItem7PlayingCardsAdded(state,cards,events){if(cards.length)own(state,j=>{if(j.entityId==='j_hologram'&&!j.gettingSliced)change(j,'xMult',j.xMult+.25*cards.length,events);});}

const ordinaryHands=['Straight','Flush','Full House','Four of a Kind','Straight Flush','High Card','Pair','Two Pair','Three of a Kind'];
function resetToDoHand(state,joker){
 const hands=(state.apkShop?.context?.visibleHandOrder??ordinaryHands).filter(hand=>hand!==joker.toDoPokerHand);
 if(hands.length)joker.toDoPokerHand=hands[random(state,'to_do',1,hands.length)-1];
}
// Call at round setup before first-draw contexts. Native uses physical deck order;
// only owned target effects opt into these streams until global parity is enabled.
export function resetItem7RoundTargets(state,{onlyMissing=false}={}){
 const active=(id,field)=>state.jokers.some(j=>j.entityId===id)&&(!onlyMissing||!Object.hasOwn(state.round,field));
 const cards=canonicalCards(state.cards).map(id=>state.cards[id]).filter(card=>card.enhancement!=='stone');
 const pick=key=>cards.length?cards[random(state,key+state.round.ante,1,cards.length)-1]:null;
 if(active('j_idol','idolCard')){const card=pick('idol');state.round.idolCard={rank:card?.rank??state.round.idolCard?.rank??null,suit:card?.suit??'spades'};}
 if(active('j_mail','mailRank'))state.round.mailRank=pick('mail')?.rank??state.round.mailRank??null;
 if(active('j_ancient','ancientSuit')){const suits=['spades','hearts','clubs','diamonds'].filter(s=>s!==(state.round.ancientSuit??'spades'));state.round.ancientSuit=suits[random(state,'anc'+state.round.ante,1,suits.length)-1];}
 if(active('j_castle','castleSuit'))state.round.castleSuit=pick('cas')?.suit??'spades';
}
