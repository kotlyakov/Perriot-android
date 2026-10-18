import {APK_BASE_CARD_IDS,createPlayingCard,playingCardOrdinal} from './apk-deck.js';
import {nextApkRandom,nextApkSeed,nextApkMathRandom,createApkMathState} from './apk-rng.js';
import {jokerEffectContext} from './joker-contexts.js';
import {createItem7Cards} from './joker-item7-economy.js';
import {isBossCardDebuffed} from './boss-effects.js';
import {sortHand} from './sort.js';
const fronts=[...APK_BASE_CARD_IDS].sort((a,b)=>playingCardOrdinal(a)-playingCardOrdinal(b)).map(id=>{const [,suit,rank]=/^card_(clubs|diamonds|hearts|spades)_(\d+)$/.exec(id);return {suit,rank:Number(rank)};});
function raw(state,count=1){for(let i=0;i<count;i++)state.rng.apk={...state.rng.apk,mathState:nextApkMathRandom(state.rng.apk.mathState).state};}
// Caller owns an action clone. Run this once at the native first-hand-drawn boundary.
export function applyItem7FirstDraw(state,events){
 const created=[];
 for(let index=0;index<state.jokers.length;index++){
  const context=jokerEffectContext(state.jokers,index);if(context?.target.entityId!=='j_certificate')continue;
  const seed=nextApkSeed(state.rng.apk,'cert_fr'),front=nextApkMathRandom(createApkMathState(seed.value),fronts.length);state.rng.apk={...seed.rng,mathState:front.state};
  raw(state,4); // Constructor discard position (3), immediate materialize juice (1).
  const seal=nextApkRandom(state.rng.apk,'certsl');state.rng.apk=seal.rng;
  const card=createPlayingCard(state,{...fronts[front.value-1],seal:seal.value>.75?'red':seal.value>.5?'blue':seal.value>.25?'gold':'purple'},{area:'hand'});
  if(isBossCardDebuffed(state,card))card.debuffed=true;
  sortHand(state);raw(state); // Activating source juice after silent seal assignment.
  created.push(card);events.push({type:'playing_card_created',sourceId:context.source.id,targetId:context.target.id,cardId:card.id,card:structuredClone(card)});
 }
 return created;
}
// handsPlayed must still have its preplay value. Native destruction discovery
// stops at the first successful owner; copies cannot destroy or create.
export function applyItem7SixthSense(state,playedIds,events){
 if((state.round?.handsPlayed??0)!==0||playedIds.length!==1)return [];
 const card=state.cards[playedIds[0]];if(!card)return [];
 let sourceId=null;
 for(let index=0;index<state.jokers.length;index++){
  const context=jokerEffectContext(state.jokers,index);if(context?.target.entityId!=='j_sixth_sense'||context.copied)continue;
  if(card.enhancement==='stone'){raw(state);continue;}
  if(card.rank!==6)continue;
  sourceId??=context.source.id;createItem7Cards(state,{set:'Spectral',append:'sixth',sourceId:context.source.id},events);break;
 }
 if(sourceId===null)return [];
 const snapshot=structuredClone(card),id=card.id;
 const prior=state.destroyedCardIds??APK_BASE_CARD_IDS.filter(key=>!Object.hasOwn(state.cards,key));state.destroyedCardIds=[...prior,id];
 for(const area of ['hand','drawPile','discardPile'])if(state[area])state[area]=state[area].filter(key=>key!==id);
 delete state.cards[id];events.push({type:'playing_card_destroyed',sourceId,cardId:id,card:snapshot,reason:'sixth_sense'});return [snapshot];
}
