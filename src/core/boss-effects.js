import {settleRoundSuccess,captureCashoutQuote} from './cashout.js';
import {sortHand} from './sort.js';
import {canonicalCards} from './apk-deck.js';
import {nativeBlindTarget,divideNativeBlindTarget} from './blind-progression.js';
import {nextApkRandom,nextApkSeed,createApkMathState,nextApkMathRandom,validateApkRng} from './apk-rng.js';
import {APK_BOSSES,APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {APK_HAND_NAMES} from './apk-shop-state.js';
import {isCardSuit} from './card-suits.js';
export const FIRST_ANTE_BOSSES=Object.freeze(['bl_hook','bl_club','bl_manacle','bl_psychic','bl_goad','bl_window','bl_head','bl_pillar']);
export const SUPPORTED_BOSSES=Object.freeze(APK_BOSSES.map(boss=>boss.id));
const suits={bl_club:'clubs',bl_goad:'spades',bl_window:'diamonds',bl_head:'hearts'};
export function canEnterBoss(state){
 const ante=state.round?.ante,boss=APK_BLINDS_BY_ID[state.apkBlinds?.bossId],winAnte=state.winAnte??8;
 const showdown=ante>=2&&ante%winAnte===0;
 if(!Number.isSafeInteger(ante)||ante<1||winAnte!==8||!boss||!SUPPORTED_BOSSES.includes(boss.id)||(boss.showdown!==showdown||!boss.showdown&&boss.minAnte>ante)||!Array.isArray(state.apkBlinds.playedCardIds)||!state.rng?.apk)return false;
 if(boss.id==='bl_ox'&&state.phase!=='shop'&&!Object.hasOwn(APK_HAND_NAMES,state.mostPlayedHand))return false;
 try{
  canonicalCards(state.cards);
  if(['bl_final_heart','bl_final_acorn'].includes(boss.id)){
   const jokers=canonicalJokers(state.jokers);
   if(boss.id==='bl_final_heart'&&jokers.length>1&&jokers.every(joker=>joker.debuffed))return false;
  }
 }catch{return false;}return true;
}
export function bossTarget(state){
 const ante=state.round?.ante,boss=APK_BLINDS_BY_ID[state.apkBlinds?.bossId];
 if(!boss||!APK_BOSSES.includes(boss))throw new RangeError('Unsupported boss target');
 const target=nativeBlindTarget(ante,boss.mult);
 return (state.bossState?.disabled||state.round.bossDisabled)&&['bl_wall','bl_final_vessel'].includes(boss.id)?divideNativeBlindTarget(target,boss.id==='bl_wall'?2:3):target;
}
// Creation ordinals persist through reorder/sale; display order is never an RNG key.
function canonicalJokers(jokers){
 if(!Array.isArray(jokers)||jokers.some(joker=>!joker||typeof joker.id!=='string'||!joker.id||!Number.isSafeInteger(joker.creationOrdinal)||joker.creationOrdinal<1)||
  new Set(jokers.map(joker=>joker.id)).size!==jokers.length||new Set(jokers.map(joker=>joker.creationOrdinal)).size!==jokers.length)throw new TypeError('Invalid Joker creation identities');
 return [...jokers].sort((a,b)=>a.creationOrdinal-b.creationOrdinal);
}
export function chooseBellCard(rng,cards){
 validateApkRng(rng);
 const pool=canonicalCards(cards);
 if(!pool.length)throw new RangeError('Empty Cerulean Bell hand');
 const draw=nextApkRandom(rng,'cerulean_bell',1,pool.length);
 return {cardId:pool[draw.value-1],rng:draw.rng};
}
export function chooseHeartJoker(rng,jokers){
 validateApkRng(rng);
 const ordered=canonicalJokers(jokers);
 if(!ordered.length)return {jokerId:null,rng};
 const pool=ordered.filter(joker=>!joker.debuffed||ordered.length===1);
 if(!pool.length)throw new RangeError('Empty Crimson Heart candidate pool');
 const draw=nextApkRandom(rng,'crimson_heart',1,pool.length);
 return {jokerId:pool[draw.value-1].id,rng:draw.rng};
}
export function shuffleAcornJokers(rng,jokers){
 validateApkRng(rng);
 const canonical=canonicalJokers(jokers).map(joker=>joker.id);
 let jokerIds=jokers.map(joker=>joker.id),current=rng;
 if(jokerIds.length>1)for(let shuffle=0;shuffle<3;shuffle++){
  jokerIds=[...canonical];
  const seed=nextApkSeed(current,'aajk');let mathState=createApkMathState(seed.value);
  for(let count=jokerIds.length;count>1;count--){
   const draw=nextApkMathRandom(mathState,count);mathState=draw.state;
   [jokerIds[count-1],jokerIds[draw.value-1]]=[jokerIds[draw.value-1],jokerIds[count-1]];
  }
  current={...seed.rng,mathState};
 }
 return {jokerIds,rng:current};
}
// Native pairs order depends on the runtime's string hash seed; tied maxima
// cannot be inferred from hand strength, JS insertion order, or the run seed.
export function resolveMostPlayedHand(playedHands){
 if(!playedHands||typeof playedHands!=='object'||Array.isArray(playedHands)||Object.keys(playedHands).some(name=>!Object.values(APK_HAND_NAMES).includes(name)))throw new TypeError('Invalid played-hand counts');
 let maximum=-1,selected=null,tied=false;
 for(const [id,name] of Object.entries(APK_HAND_NAMES)){
  const count=playedHands[name]??0;
  if(!Number.isSafeInteger(count)||count<0)throw new TypeError('Invalid played-hand count');
  if(count>maximum){maximum=count;selected=id;tied=false;}else if(count===maximum)tied=true;
 }
 return tied?null:selected;
}
export function canEnterFirstAnteBoss(state){
 if(!(state.round?.ante===1 && FIRST_ANTE_BOSSES.includes(state.apkBlinds?.bossId) && Array.isArray(state.apkBlinds.playedCardIds) && state.rng?.apk))return false;
 try{canonicalCards(state.cards);}catch{return false;}return true;
}
export function isBossCardDebuffed(state,card){
 const boss=state.bossState;
 return !!boss && !boss.disabled && (boss.id==='bl_final_leaf' || suits[boss.id]&&isCardSuit(card,suits[boss.id],{bypassDebuff:true}) || boss.id==='bl_pillar'&&boss.playedBeforeBoss.includes(card.id) || boss.id==='bl_plant'&&card.enhancement!=='stone'&&card.rank>=11&&card.rank<=13);
}
export function isBossHandDebuffed(state,cards,handId){
 const boss=state.bossState;
 return !!boss && !boss.disabled && (boss.id==='bl_psychic'&&cards.length<5 || boss.id==='bl_eye'&&!!boss.playedHands?.includes(handId) || boss.id==='bl_mouth'&&!!boss.firstHand&&boss.firstHand!==handId);
}
export function chooseHookDiscards(rng,cardIds){
 validateApkRng(rng);
 if(!Array.isArray(cardIds)||cardIds.some(id=>typeof id!=='string'||!id)||new Set(cardIds).size!==cardIds.length)throw new TypeError('Invalid Hook hand');
 const pool=canonicalCards(cardIds.map(id=>{const match=/^card_(clubs|diamonds|hearts|spades)_(\d+)$/.exec(id);return match?{id,suit:match[1],rank:Number(match[2])}:null;})),selected=[];let current=rng;
 for(let i=0;i<Math.min(2,cardIds.length);i++){
  const draw=nextApkRandom(current,'hook',1,pool.length);current=draw.rng;selected.push(pool.splice(draw.value-1,1)[0]);
 }
 return {cardIds:selected,rng:current};
}

// Mutates only the caller's accepted clone; repeated disable never restores twice.
export function disableBoss(state,events){
 const boss=state.bossState;
 if(!boss||boss.disabled||!SUPPORTED_BOSSES.includes(boss.id)||!['playing','round_won'].includes(state.phase))return;
 if(state.phase==='round_won')state.cashoutQuote??=captureCashoutQuote(state);
 if(boss.id==='bl_serpent'){
  // Legacy enabled saves with cards left have a uniquely recoverable initial
  // count. An exhausted legacy deck stays explicitly unknown, with zero draws.
  const actions=(state.deckId==='blue'?5:4)-state.round.handsRemaining+(state.deckId==='red'?4:3)-state.round.discardsRemaining-(state.phase==='round_won'?1:0);
  boss.serpentInitialCardCount??=state.drawPile.length?state.drawPile.length+boss.baseHandSize+3*actions:null;
  boss.serpentDisableOrigin={phase:state.phase,...(state.phase==='round_won'?{earnedRevision:state.cashoutQuote.earnedRevision}:{}),hand:[...state.hand],drawPile:[...state.drawPile],discardPile:[...state.discardPile],destroyedCardIds:[...(state.destroyedCardIds??[])],handsRemaining:state.round.handsRemaining,discardsRemaining:state.round.discardsRemaining};
 }

 if(boss.id==='bl_needle')boss.needleDisableOrigin={phase:state.phase,handsRemaining:state.round.handsRemaining,acceptedRevision:state.revision};
 boss.disabled=true;boss.disabledRevision=state.revision+1;state.lastScore=null;
 if(boss.id==='bl_water')state.round.discardsRemaining+=boss.discardsSub??(state.deckId==='red'?4:3);
 if(boss.id==='bl_needle')state.round.handsRemaining+=boss.handsSub??(state.deckId==='blue'?4:3);
 if(boss.id==='bl_wall')state.round.target=divideNativeBlindTarget(state.round.target,2);
 if(boss.id==='bl_final_vessel')state.round.target=divideNativeBlindTarget(state.round.target,3);
 if(boss.hiddenCardIds)boss.hiddenCardIds=[];
 if(boss.hiddenJokerIds)boss.hiddenJokerIds=[];
 if(Object.hasOwn(boss,'forcedCardId')){boss.forcedCardId=null;boss.bellChoice=null;}
 if(boss.hiddenFaceRanks)boss.hiddenFaceRanks={};
 if(boss.playedHands)boss.playedHands=[];
 if(Object.hasOwn(boss,'firstHand'))boss.firstHand=null;
 if(boss.id==='bl_final_heart'){for(const joker of state.jokers)joker.debuffed=false;boss.heartDebuffedJokerId=null;}
 if(boss.id==='bl_manacle'){
  state.round.handSize=boss.baseHandSize;
  if(state.drawPile.length){
   const id=state.rng.apk?state.drawPile.pop():state.drawPile.shift();
   state.hand.push(id);sortHand(state);events.push({type:'cards_drawn',cardIds:[id]});
  }
 }
 settleRoundSuccess(state,events);
}

// The captured native phase/counter and accepted boundary authenticate timing;
// the disabled revision alone never selects which counter was earned.
export function needleRestorationAfterEarning(state,earnedRevision){
 const boss=state.bossState,origin=boss.needleDisableOrigin,handsSub=boss.handsSub??(state.deckId==='blue'?4:3);
 const validRevision=value=>Number.isSafeInteger(value)&&value>=1;
 if(!origin||Object.keys(origin).length!==3||!['phase','handsRemaining','acceptedRevision'].every(key=>Object.hasOwn(origin,key))||!validRevision(origin.acceptedRevision)||boss.disabledRevision!==origin.acceptedRevision+1||boss.disabledRevision>state.revision||handsSub!==(state.deckId==='blue'?4:3))throw new TypeError('Invalid Needle disable origin');
 if(Object.hasOwn(boss,'startedRevision')&&(!validRevision(boss.startedRevision)||boss.startedRevision>origin.acceptedRevision))throw new TypeError('Invalid Needle start boundary');
 if(origin.phase==='round_won'){
  if(origin.handsRemaining!==0||state.phase!=='round_won'||state.round.handsRemaining!==handsSub||earnedRevision!==undefined&&origin.acceptedRevision<earnedRevision)throw new TypeError('Invalid post-win Needle restoration');
 }else if(origin.phase==='playing'){
  if(origin.handsRemaining!==1||state.round.handsRemaining>1+handsSub||state.phase==='round_won'&&state.round.handsRemaining>handsSub||earnedRevision!==undefined&&boss.disabledRevision>=earnedRevision)throw new TypeError('Invalid pre-win Needle restoration');
 }else throw new TypeError('Invalid Needle disable phase');
 return origin.phase==='round_won'?handsSub:0;
}
