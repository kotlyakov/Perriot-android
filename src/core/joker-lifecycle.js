import {applyItem7AfterScore,applyItem7PlayingCardsAdded} from './joker-item7-lifecycle.js';
import {createPlayingCard,APK_BASE_CARD_IDS,playingCardOrdinal} from './apk-deck.js';
import {nextApkMathRandom,nextApkSeed,createApkMathState} from './apk-rng.js';
import {jokerEffectContext} from './joker-contexts.js';
const fronts=[...APK_BASE_CARD_IDS].sort((a,b)=>playingCardOrdinal(a)-playingCardOrdinal(b)).map(id=>{
 const [,suit,rank]=/^card_(clubs|diamonds|hearts|spades)_(\d+)$/.exec(id);return {suit,rank:Number(rank)};
});
function raw(state,count){
 if(count===0)return;
 if(!state.rng?.apk)throw new TypeError('Joker lifecycle requires native RNG');
 for(let i=0;i<count;i++)state.rng.apk={...state.rng.apk,mathState:nextApkMathRandom(state.rng.apk.mathState).state};
}
function createdEvent(events,card,context){events.push({type:'playing_card_created',sourceId:context.source.id,targetId:context.target.id,cardId:card.id,card:structuredClone(card)});}

// Mutates a caller-owned transaction clone, never the live preview state.
// Constructors run synchronously; initial materialization callbacks run FIFO
// after every before activation, before the next scoring effect boundary.
// The callback interleaves other before effects with DNA in inventory order.
export function applyJokerBeforeScore(state,playedIds,events,beforeContext){
 const created=[];
 const source=(state.round?.handsPlayed??0)===0&&playedIds.length===1?state.cards[playedIds[0]]:null;
 for(let index=0;index<state.jokers.length;index++){
  const context=jokerEffectContext(state.jokers,index);
  beforeContext?.(context);
  if(!source||context?.target.entityId!=='j_dna')continue;
  raw(state,3);
  const payload=Object.fromEntries(['rank','suit','enhancement','edition','seal'].filter(key=>Object.hasOwn(source,key)&&(key!=='enhancement'||source[key]!=='base')).map(key=>[key,source[key]]));
  const copy=createPlayingCard(state,payload,{area:'hand'});
  if(Object.hasOwn(source,'permaBonus'))copy.permaBonus=source.permaBonus;
  created.push(copy);createdEvent(events,copy,context);
 }
 raw(state,created.length);
 applyItem7PlayingCardsAdded(state,created,events);
 return created;
}

export function applyJokerBlindStart(state,events,{contexts=state.jokers.map((_,index)=>jokerEffectContext(state.jokers,index)),scheduled=false}={}){
 const created=[];
 for(const context of contexts){
  if(context?.target.entityId!=='j_marble'||!scheduled&&(context.source.gettingSliced||context.target.gettingSliced))continue;
  if(!state.rng?.apk)throw new TypeError('Joker lifecycle requires native RNG');
  const seed=nextApkSeed(state.rng.apk,'marb_fr');
  const draw=nextApkMathRandom(createApkMathState(seed.value),fronts.length);
  state.rng.apk={...seed.rng,mathState:draw.state};
  raw(state,3);
  const card=createPlayingCard(state,{...fronts[draw.value-1],enhancement:'stone'},{area:'drawPile'});
  raw(state,1); // Native start_materialize's immediate juice, including reduced motion.
  created.push(card);createdEvent(events,card,context);
  applyItem7PlayingCardsAdded(state,[card],events);
 }
 return created;
}

export function applyJokerAfterScore(state,events){
 applyItem7AfterScore(state,events);
 const remove=[];
 // Copied after effects are intentionally absent; native lifetime mutations
 // are guarded by not context.blueprint. Removal callbacks run after discovery.
 for(const joker of state.jokers){
  if(joker.entityId!=='j_selzer'||joker.debuffed)continue;
  const before=joker.repeatHandsRemaining??10;
  if(!Number.isSafeInteger(before)||before<1||before>10)throw new TypeError('Invalid Seltzer lifetime');
  if(before===1)remove.push(joker);
  else{joker.repeatHandsRemaining=before-1;events.push({type:'joker_counter_changed',sourceId:joker.id,counter:'repeatHandsRemaining',before,after:before-1});}
 }
 for(const joker of remove){
  raw(state,1); // Final outer removal callback calls native juice_up once.
  state.jokers=state.jokers.filter(owned=>owned!==joker);
  events.push({type:'joker_removed',sourceId:joker.id,joker:structuredClone(joker),reason:'depleted'});
 }
}
