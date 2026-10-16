import {isBossCardDebuffed,isBossHandDebuffed,chooseHookDiscards} from './boss-effects.js';
import { evaluateHand } from './hands.js';
import { HANDS } from '../content/hands.js';
import { SUPPORTED_JOKERS, handRecognitionOptions, heldJokerEffects, independentEffect, originalJokerKey, supportsJoker, scoredJokerEffects } from '../content/jokers.js';
import {nextApkRandom} from './apk-rng.js';
import {randomInt} from './rng.js';
import {addExact,floorExact,multiplyExact} from './numbers.js';

export function scoreHand(state, playedCards, {legacyRng=false} = {}) {
  const hasStone=playedCards.some(c=>c.enhancement==='stone')||(state.hand??[]).some(id=>state.cards[id]?.enhancement==='stone');
  let actionRng=!legacyRng&&hasStone&&state.rng?.apk?structuredClone(state.rng.apk):null;
  const actionBefore=actionRng&&structuredClone(actionRng),rngDraws=[];
  function rankGetter(card,phase='recognition',jokerId){
    if(card.enhancement!=='stone')return card.rank;
    if(!actionRng)return -1;
    const draw=nextApkRandom(actionRng,undefined,100,1000000);actionRng=draw.rng;
    rngDraws.push({phase,cardId:card.id,...(jokerId?{jokerId}:{}),value:-draw.value});
    return -draw.value;
  }
  // The authoritative action begins at the native preplay career-face pass.
  if(actionRng)for(const card of playedCards)if(!isBossCardDebuffed(state,card))rankGetter(card,'career');
  let hookContext;
  if(actionRng&&!state.bossState?.disabled&&state.bossState?.id==='bl_hook'){
    const held=state.hand.filter(id=>!playedCards.some(card=>card.id===id));
    const hook=chooseHookDiscards(actionRng,held);actionRng=hook.rng;
    hookContext={hookHeldCardIdsBefore:[...held],hookDiscardCardIds:[...hook.cardIds]};
    rngDraws.push(...hook.cardIds.map(cardId=>({phase:'boss_press_play',key:'hook',cardId})));
    state={...state,hand:state.hand.filter(id=>!hook.cardIds.includes(id)),discardPile:[...(state.discardPile??[]),...held.filter(id=>hook.cardIds.includes(id))]};
  }
  const actionProvenance=()=>actionRng?{actionRng:{version:1,contract:'play-score-v1',before:actionBefore,after:structuredClone(actionRng),draws:rngDraws,...hookContext}}:{};
  const hand = evaluateHand(playedCards,{isCardDebuffed:card=>isBossCardDebuffed(state,card),...handRecognitionOptions(state.jokers),...(actionRng?{rankGetter}:{})});
  if (!state || !state.handLevels || typeof state.handLevels !== 'object' || !Array.isArray(state.jokers)) throw new TypeError('Invalid scoring state');
  const playedIds=new Set(playedCards.map(card=>card.id));
  const heldCards = state.hand === undefined ? [] : state.hand.filter(id=>!playedIds.has(id)).map(id=>state.cards[id]);
  for (const card of [...playedCards,...heldCards]) {
    evaluateHand([card]); // Refuse unsupported held recognition/effects too.
    if ((card.edition !== undefined && card.edition !== 'base') || card.seal !== undefined || card.debuffed === true) throw new Error('Unsupported card modifier');
  }
  const jokerIds = new Set();
  for (const joker of state.jokers) {
    if (!joker || typeof joker.id !== 'string' || !joker.id || jokerIds.has(joker.id) || !SUPPORTED_JOKERS.includes(joker.entityId)) throw new Error('Invalid or unsupported joker');
    if (!supportsJoker(joker,{owned:true})) throw new Error('Unsupported joker modifier');
    jokerIds.add(joker.id);
  }
  if(isBossHandDebuffed(state,playedCards,hand.handId))return {...hand,playedCardIds:playedCards.map(c=>c.id),scoringCardIds:[],...actionProvenance(),heldCardIds:heldCards.map(c=>c.id),...(actionRng&&state.round?{scoringRoundBefore:{handsRemaining:state.round.handsRemaining,discardsRemaining:state.round.discardsRemaining},scoringPilesBefore:{drawPile:[...(state.drawPile??[])],discardPile:[...(state.discardPile??[])],...(state.hangedShortfallCardIds?{hangedShortfallCardIds:[...state.hangedShortfallCardIds],hangedShortfallRevision:state.hangedShortfallEpoch?.revision??state.revision}:{})}}:{}),handDebuffed:true,chips:0n,mult:0n,score:0n,trace:[
    {type:'score_step',phase:'base',sourceId:`hand:${hand.handId}`,operation:'base',before:{chips:0n,mult:0n},after:{chips:0n,mult:0n}},
    {type:'score_total',phase:'total',chips:0n,mult:0n,score:0n}]};
  const level = state.handLevels[hand.handId] ?? 1;
  if (!Number.isSafeInteger(level) || level < 1) throw new RangeError('Invalid hand level');
  const definition = HANDS[hand.handId];
  let chips = BigInt(definition.chips) + BigInt(level-1)*BigInt(definition.chipGain);
  let mult = BigInt(definition.mult) + BigInt(level-1)*BigInt(definition.multGain);
  if(!state.bossState?.disabled&&state.bossState?.id==='bl_flint'){
    chips=(chips+1n)/2n;
    mult=(mult+1n)/2n;
    if(mult<1n)mult=1n;
  }
  const trace = [{type:'score_step',phase:'base',sourceId:`hand:${hand.handId}`,operation:'base',before:{chips:0n,mult:0n},after:{chips,mult}}];
  const splash=state.jokers.some(j=>!j.debuffed&&originalJokerKey(j.entityId)==='j_splash'),nativeScoring=new Set(hand.scoringCardIds);
  const scoringCardIds=playedCards.filter(card=>splash||nativeScoring.has(card.id)||card.enhancement==='stone').map(card=>card.id);
  const scoringSet = new Set(scoringCardIds);
  let luckyRng,luckyRngBefore,luckyKind;const luckyRolls=[];
  let glassRng,glassRngBefore,glassKind;const glassRolls=[];
  const luckySnapshot=rng=>({lucky_mult:rng.streams.lucky_mult??null,lucky_money:rng.streams.lucky_money??null});
  const glassSnapshot=rng=>({glass:rng.streams.glass??null});
  function luckyRoll(key,bound){
    if(!luckyRng){
      if(state.rng?.apk){luckyKind='apk';luckyRng=actionRng??state.rng.apk;}
      else if(state.rng?.effects){luckyKind='effects';luckyRng=state.rng.effects;}
      else throw new TypeError('Missing Lucky Card RNG');
      luckyRngBefore=luckyKind==='apk'?luckySnapshot(luckyRng):structuredClone(luckyRng);
    }
    if(luckyKind==='apk'){const draw=nextApkRandom(actionRng??luckyRng,key);luckyRng=draw.rng;if(actionRng){actionRng=draw.rng;rngDraws.push({phase:'scored_card',key,value:draw.value});}return draw.value;}
    const draw=randomInt(luckyRng,bound);luckyRng=draw.rng;return draw.value/bound;
  }
  function glassRoll(){
    if(!glassRng){
      if(state.rng?.apk){glassKind='apk';glassRng=actionRng??state.rng.apk;}
      else if(state.rng?.effects){glassKind='effects';glassRng=state.rng.effects;}
      else throw new TypeError('Missing Glass Card RNG');
      glassRngBefore=glassKind==='apk'?glassSnapshot(glassRng):structuredClone(glassRng);
    }
    if(glassKind==='apk'){const draw=nextApkRandom(actionRng??glassRng,'glass');glassRng=draw.rng;if(actionRng){actionRng=draw.rng;rngDraws.push({phase:'destruction',key:'glass',value:draw.value});}return draw.value;}
    const draw=randomInt(glassRng,4);glassRng=draw.rng;return draw.value/4;
  }
  function apply(effect,phase,sourceId,effectSourceId){
    const before={chips,mult};
    if(effect.operation==='add_chips')chips+=effect.amount;
    else if(effect.operation==='multiply_mult')mult=multiplyExact(mult,effect.amount);
    else mult=addExact(mult,effect.amount);
    trace.push({type:'score_step',phase,sourceId,operation:effect.operation,before,after:{chips,mult},...(effectSourceId?{effectSourceId}:{})});
  }
  for (const card of playedCards) {
    if (!scoringSet.has(card.id) || isBossCardDebuffed(state,card)) continue;
    const before = {chips,mult};
    chips += card.enhancement==='stone'?50n:BigInt(card.rank===14 ? 11 : Math.min(card.rank,10));
    trace.push({type:'score_step',phase:'scored_card',sourceId:card.id,operation:'add_chips',before,after:{chips,mult}});
    if(card.enhancement==='bonus')apply({operation:'add_chips',amount:30n},'scored_card',card.id);
    if(card.enhancement==='mult')apply({operation:'add_mult',amount:4n},'scored_card',card.id);
    if(card.enhancement==='lucky'){
      const multRoll=luckyRoll('lucky_mult',5),multTriggered=multRoll<1/5;if(multTriggered)apply({operation:'add_mult',amount:20n},'scored_card',card.id);
      const moneyRoll=luckyRoll('lucky_money',15),moneyTriggered=moneyRoll<1/15;if(moneyTriggered)trace.push({type:'score_money',phase:'scored_card',sourceId:card.id,amount:20n});
      luckyRolls.push({cardId:card.id,multRoll,moneyRoll,multTriggered,moneyTriggered});
    }
    if(card.enhancement==='glass')apply({operation:'multiply_mult',amount:2n},'scored_card',card.id);
    for(const joker of state.jokers)if(!joker.debuffed){
      if(actionRng&&card.enhancement==='stone'){
        const key=originalJokerKey(joker.entityId),get=()=>rankGetter(card,'scored_joker',joker.id);
        if(['j_scary_face','j_smiley','j_scholar'].includes(key))get();
        if(key==='j_walkie_talkie')void(get()===10||get()===4);
        if(key==='j_fibonacci')void(get()===2||get()===3||get()===5||get()===8||get()===14);
        if(key==='j_even_steven')void(get()<=10&&get()>=0&&get()%2===0);
        if(key==='j_odd_todd')void((get()<=10&&get()>=0&&get()%2===1)||get()===14);
      }
      for(const effect of scoredJokerEffects(joker.entityId,card))apply(effect,'scored_card',card.id,joker.id);
    }
  }
  for(const card of heldCards){
    // Native held Joker predicates query the card before checking its debuff.
    if(actionRng&&card.enhancement==='stone')for(const joker of state.jokers)if(!joker.debuffed&&['j_baron','j_shoot_the_moon'].includes(originalJokerKey(joker.entityId)))rankGetter(card,'held_joker',joker.id);
    if(isBossCardDebuffed(state,card))continue;
    if(card.enhancement==='steel')apply({operation:'multiply_mult',amount:{n:3n,d:2n}},'held_card',card.id);
    for(const joker of state.jokers)if(!joker.debuffed)for(const effect of heldJokerEffects(joker.entityId,card,heldCards))apply(effect,'held_card',card.id,joker.id);
  }
  const moneyJokers=state.jokers.some(j=>['j_bull','j_bootstraps'].includes(originalJokerKey(j.entityId)));
  if(moneyJokers&&typeof state.money!=='bigint')throw new TypeError('Missing scoring money');
  // Native get_p_dollars buffers Lucky income before independent Joker evaluation.
  let moneyBeforeCards=state.money??0n;
  if(!state.bossState?.disabled&&state.bossState?.id==='bl_tooth')moneyBeforeCards-=BigInt(playedCards.length);
  if(!state.bossState?.disabled&&state.bossState?.id==='bl_ox'&&state.bossState.oxHand===hand.handId)moneyBeforeCards=0n;
  const scoringMoney=moneyBeforeCards+trace.reduce((sum,event)=>sum+(event.type==='score_money'?event.amount:0n),0n);
  const rankCounts = new Map();
  for (const card of playedCards)if(card.enhancement!=='stone')rankCounts.set(card.rank,(rankCounts.get(card.rank)??0)+1);
  for (const joker of state.jokers) {
    if(joker.debuffed)continue;
    if(joker.edition==='foil')apply({operation:'add_chips',amount:50n},'edition',joker.id);
    if(joker.edition==='holographic')apply({operation:'add_mult',amount:10n},'edition',joker.id);
    const effect=independentEffect(joker.entityId,[...rankCounts.values()],{playedCards,handId:hand.handId,jokerCount:state.jokers.length,
      handsRemaining:state.round?.handsRemaining,discardsRemaining:state.round?.discardsRemaining,heldCards,jokerSlots:state.jokerSlots??5,
      scoringCards:playedCards.filter(card=>scoringSet.has(card.id)),isCardDebuffed:card=>isBossCardDebuffed(state,card),playingCards:Object.values(state.cards??{}),money:scoringMoney,drawCount:state.drawPile?.length??0,
      otherSellCost:originalJokerKey(joker.entityId)==='j_swashbuckler'?state.jokers.filter(other=>other!==joker).reduce((sum,other)=>{if(typeof other.sellCost!=='bigint'||other.sellCost<0n)throw new TypeError('Missing Joker sell value');return sum+other.sellCost;},0n):0n,
      negativeCount:state.jokers.filter(card=>card.edition==='negative').length,stencilCount:state.jokers.filter(card=>originalJokerKey(card.entityId)==='j_stencil').length});
    if(effect)apply(effect,'independent',joker.id);
    if(joker.edition==='polychrome')apply({operation:'multiply_mult',amount:{n:3n,d:2n}},'edition',joker.id);
  }
  for(const card of playedCards)if(scoringSet.has(card.id)&&card.enhancement==='glass'&&!isBossCardDebuffed(state,card)){
    const roll=glassRoll(),destroyed=roll<1/4;glassRolls.push({cardId:card.id,roll,destroyed});
  }
  const score = floorExact(multiplyExact(chips,mult));
  trace.push({type:'score_total',phase:'total',chips,mult,score});
  const bellGlass=(actionRng||glassRolls.length>0&&glassKind==='apk')&&!state.bossState?.disabled&&state.bossState?.id==='bl_final_bell';
  return {...hand,...actionProvenance(),playedCardIds:playedCards.map(c=>c.id),scoringCardIds,chips,mult,score,trace,...(actionRng||bellGlass||heldCards.some(card=>card.enhancement==='steel')||state.jokers.some(j=>['j_blackboard','j_raised_fist','j_baron','j_shoot_the_moon','j_blue_joker'].includes(originalJokerKey(j.entityId)))?{heldCardIds:heldCards.map(card=>card.id)}:{}),...(actionRng||bellGlass||state.jokers.some(j=>originalJokerKey(j.entityId)==='j_blue_joker')?{scoringPilesBefore:{drawPile:[...(state.drawPile??[])],discardPile:[...(state.discardPile??[])],...(state.hangedShortfallCardIds?{hangedShortfallCardIds:[...state.hangedShortfallCardIds],hangedShortfallRevision:state.hangedShortfallEpoch?.revision??state.revision}:{})}}:{}),...(moneyJokers?{scoringMoneyBefore:state.money}:{}),...(state.round&&(actionRng||bellGlass||state.jokers.some(j=>['j_acrobat','j_banner','j_mystic_summit','j_blue_joker'].includes(originalJokerKey(j.entityId))))?{scoringRoundBefore:{handsRemaining:state.round.handsRemaining,discardsRemaining:state.round.discardsRemaining}}:{}),...(luckyRolls.length?{luckyRolls,luckyRngKind:luckyKind,luckyRngBefore,luckyRngAfter:luckyKind==='apk'?{...luckySnapshot(luckyRng),mathState:[...luckyRng.mathState]}:luckyRng}:{}),...(glassRolls.length?{glassRolls,glassRngKind:glassKind,glassRngBefore,glassRngAfter:glassKind==='apk'?{...glassSnapshot(glassRng),mathState:[...glassRng.mathState]}:glassRng,glassDestroyedCards:glassRolls.filter(roll=>roll.destroyed).map(roll=>structuredClone(playedCards.find(card=>card.id===roll.cardId)))}:{})};
}



