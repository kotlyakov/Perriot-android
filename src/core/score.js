import {applyItem7SixthSense} from './joker-item7-creation.js';
import {createItem7Cards,item7ConsumableSpace} from './joker-item7-economy.js';
import APK_SHOP_CATALOG from '../content/apk-shop-catalog.js';
import {ITEM7_SCORE_JOKERS,item7Probability,item7BeforeScore,item7ScoredEffects,item7HeldEffects,item7IndependentEffect} from './joker-score-effects.js';
import {applyJokerBeforeScore} from './joker-lifecycle.js';
import {applyDiscardSeals} from './card-effects.js';
import {jokerEffectContext} from './joker-contexts.js';
import {hasEffectMechanisms,validPlayingCardModifiers} from './playing-card-modifiers.js';
import {isBossCardDebuffed,isBossHandDebuffed,chooseHookDiscards} from './boss-effects.js';
import { evaluateHand } from './hands.js';
import { HANDS } from '../content/hands.js';
import { SUPPORTED_JOKERS, SCORED_RETRIGGER_JOKERS, scoredJokerRepetitions, handRecognitionOptions, heldJokerEffects, independentEffect, originalJokerKey, supportsJoker, scoredJokerEffects } from '../content/jokers.js';
import {nextApkRandom} from './apk-rng.js';
import {randomInt} from './rng.js';
import {addExact,floorExact,multiplyExact} from './numbers.js';

export function scoreHand(state, playedCards, {legacyRng=false,armTriggered} = {}) {
  const hasItem7=state.jokers.some(j=>ITEM7_SCORE_JOKERS.includes(j.entityId)||j.entityId==='j_oops'||j.entityId==='j_smeared');
  const hasMechanisms=hasEffectMechanisms(state)||hasItem7;
  const originalState=state,lifecycleEvents=[];if(hasMechanisms){state=structuredClone(state);playedCards=playedCards.map(c=>state.cards?.[c.id]??structuredClone(c));}
  const hasRetrigger=state.jokers.some(j=>SCORED_RETRIGGER_JOKERS.includes(originalJokerKey(j.entityId)));
  if(state.jokers.some(j=>!j.debuffed&&originalJokerKey(j.entityId)==='j_dusk'))scoredJokerRepetitions('j_dusk',playedCards[0],{handsRemaining:state.round?.handsRemaining});
  let effectsRng=(hasRetrigger||hasMechanisms)&&!state.rng?.apk?state.rng?.effects:null;
  const hasStone=playedCards.some(c=>c.enhancement==='stone')||(state.hand??[]).some(id=>state.cards[id]?.enhancement==='stone');
  let actionRng=!legacyRng&&(hasStone||hasRetrigger||hasMechanisms)&&state.rng?.apk?structuredClone(state.rng.apk):null;
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
    if(hasMechanisms&&hook.cardIds.some(id=>state.cards[id].seal==='purple')){state.rng.apk=actionRng;applyDiscardSeals(state,hook.cardIds,lifecycleEvents);actionRng=state.rng.apk;}
  }
  const actionProvenance=()=>actionRng?{actionRng:{version:hasMechanisms?2:1,contract:hasMechanisms?'play-effects-v2':'play-score-v1',before:actionBefore,after:structuredClone(actionRng),draws:rngDraws,...hookContext}}:{};
  const hand = evaluateHand(playedCards,{isCardDebuffed:card=>isBossCardDebuffed(state,card),...handRecognitionOptions(state.jokers),...(actionRng?{rankGetter}:{})});
  if (!state || !state.handLevels || typeof state.handLevels !== 'object' || !Array.isArray(state.jokers)) throw new TypeError('Invalid scoring state');
  const playedIds=new Set(playedCards.map(card=>card.id));
  let heldCards = state.hand === undefined ? [] : state.hand.filter(id=>!playedIds.has(id)).map(id=>state.cards[id]);
  for (const card of [...playedCards,...heldCards]) {
    evaluateHand([card]); // Refuse unsupported held recognition/effects too.
    if (!validPlayingCardModifiers(card) || card.debuffed === true) throw new Error('Unsupported card modifier');
  }
  const jokerIds = new Set();
  for (const joker of state.jokers) {
    if (!joker || typeof joker.id !== 'string' || !joker.id || jokerIds.has(joker.id) || !SUPPORTED_JOKERS.includes(joker.entityId)) throw new Error('Invalid or unsupported joker');
    if (!supportsJoker(joker,{owned:true})) throw new Error('Unsupported joker modifier');
    jokerIds.add(joker.id);
  }
  const handDebuffed=isBossHandDebuffed(state,playedCards,hand.handId);
  // Every native Blind has a debuff table: debuff_hand resets press_play's
  // trigger first. Only rejected hands, Arm/Ox, Flint and scored-card debuffs
  // can set it again before Matador's exclusive debuffed/main paths.
  const bossActive=!!state.bossState&&!state.bossState.disabled;
  const blindTriggered=bossActive&&(handDebuffed||state.bossState.id==='bl_flint'||
    state.bossState.id==='bl_arm'&&(armTriggered??((state.handLevels[hand.handId]??1)>1))||
    state.bossState.id==='bl_ox'&&state.bossState.oxHand===hand.handId);
  const debuffedMoney=[];
  if(handDebuffed)for(let index=0;index<state.jokers.length;index++){
    const context=jokerEffectContext(state.jokers,index);
    if(context?.target.entityId==='j_matador')debuffedMoney.push({type:'score_money',phase:'independent',sourceId:context.source.id,amount:8n});
  }
  if(handDebuffed)return {...hand,playedCardIds:playedCards.map(c=>c.id),scoringCardIds:[],...actionProvenance(),heldCardIds:heldCards.map(c=>c.id),...(actionRng&&state.round?{scoringRoundBefore:{handsRemaining:state.round.handsRemaining,discardsRemaining:state.round.discardsRemaining},scoringPilesBefore:{drawPile:[...(state.drawPile??[])],discardPile:[...(state.discardPile??[])],...(state.hangedShortfallCardIds?{hangedShortfallCardIds:[...state.hangedShortfallCardIds],hangedShortfallRevision:state.hangedShortfallEpoch?.revision??state.revision}:{})}}:{}),handDebuffed:true,chips:0n,mult:0n,score:0n,trace:[
    {type:'score_step',phase:'base',sourceId:`hand:${hand.handId}`,operation:'base',before:{chips:0n,mult:0n},after:{chips:0n,mult:0n}},
    ...debuffedMoney,{type:'score_total',phase:'total',chips:0n,mult:0n,score:0n}]};
  let createdPlayingCards=[];
  function item7Roll(key){
    if(actionRng){const draw=nextApkRandom(actionRng,key);actionRng=draw.rng;rngDraws.push({phase:'joker_effect',key,value:draw.value});return draw.value;}
    if(state.rng?.effects){const draw=randomInt(effectsRng??state.rng.effects,1000000);effectsRng=draw.rng;return draw.value/1000000;}
    throw new TypeError('Missing Joker effect RNG');
  }
  const splash=state.jokers.some(j=>!j.debuffed&&originalJokerKey(j.entityId)==='j_splash'),nativeScoring=new Set(hand.scoringCardIds);
  const scoringCardIds=playedCards.filter(card=>splash||nativeScoring.has(card.id)||card.enhancement==='stone').map(card=>card.id);
  const scoringSet = new Set(scoringCardIds);
  const beforeScoreMoney=[];
  const item7Options={money:(amount,sourceId)=>beforeScoreMoney.push({type:'score_money',phase:'before',sourceId,amount}),create:options=>{if(actionRng)state.rng.apk=actionRng;createItem7Cards(state,options,lifecycleEvents);if(actionRng)actionRng=state.rng.apk;},blindTriggered,handId:hand.handId,playedCards,scoringCards:playedCards.filter(c=>scoringSet.has(c.id)),isDebuffed:card=>isBossCardDebuffed(state,card),roll:item7Roll,rankGetter:card=>rankGetter(card,'joker_effect')};
  if(hasMechanisms){
    if(actionRng)state.rng.apk=actionRng;
    const vampired=new Set();
    createdPlayingCards=applyJokerBeforeScore(state,playedCards.map(c=>c.id),lifecycleEvents,context=>{
      if(!hasItem7)return;
      if(actionRng)actionRng=state.rng.apk;
      item7BeforeScore(state,item7Options,[context],vampired);
      if(actionRng)state.rng.apk=actionRng;
    });
    if(actionRng)actionRng=state.rng.apk;
    heldCards=state.hand===undefined?[]:state.hand.filter(id=>!playedIds.has(id)).map(id=>state.cards[id]);
  }
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
  const trace = [...beforeScoreMoney,{type:'score_step',phase:'base',sourceId:`hand:${hand.handId}`,operation:'base',before:{chips:0n,mult:0n},after:{chips,mult}}];
  let luckyRng,luckyRngBefore,luckyKind;const luckyRolls=[];
  let glassRng,glassRngBefore,glassKind;const glassRolls=[];
  const luckySnapshot=rng=>({lucky_mult:rng.streams.lucky_mult??null,lucky_money:rng.streams.lucky_money??null});
  const glassSnapshot=rng=>({glass:rng.streams.glass??null});
  function luckyRoll(key,bound){
    if(!luckyRng){
      if(state.rng?.apk){luckyKind='apk';luckyRng=actionRng??state.rng.apk;}
      else if(state.rng?.effects){luckyKind='effects';luckyRng=effectsRng??state.rng.effects;}
      else throw new TypeError('Missing Lucky Card RNG');
      luckyRngBefore=luckyKind==='apk'?luckySnapshot(luckyRng):structuredClone(luckyRng);
    }
    if(luckyKind==='apk'){const draw=nextApkRandom(actionRng??luckyRng,key);luckyRng=draw.rng;if(actionRng){actionRng=draw.rng;rngDraws.push({phase:'scored_card',key,value:draw.value});}return draw.value;}
    const draw=randomInt(effectsRng??luckyRng,bound);luckyRng=draw.rng;if(effectsRng)effectsRng=draw.rng;return draw.value/bound;
  }
  function glassRoll(){
    if(!glassRng){
      if(state.rng?.apk){glassKind='apk';glassRng=actionRng??state.rng.apk;}
      else if(state.rng?.effects){glassKind='effects';glassRng=effectsRng??state.rng.effects;}
      else throw new TypeError('Missing Glass Card RNG');
      glassRngBefore=glassKind==='apk'?glassSnapshot(glassRng):structuredClone(glassRng);
    }
    if(glassKind==='apk'){const draw=nextApkRandom(actionRng??glassRng,'glass');glassRng=draw.rng;if(actionRng){actionRng=draw.rng;rngDraws.push({phase:'destruction',key:'glass',value:draw.value});}return draw.value;}
    const draw=randomInt(effectsRng??glassRng,4);glassRng=draw.rng;if(effectsRng)effectsRng=draw.rng;return draw.value/4;
  }
  function apply(effect,phase,sourceId,effectSourceId){
    if(effect.operation==='money'){trace.push({type:'score_money',phase,sourceId,amount:effect.amount,...(effectSourceId?{effectSourceId}:{})});return;}
    const before={chips,mult};
    if(effect.operation==='add_chips')chips+=effect.amount;
    else if(effect.operation==='multiply_mult')mult=multiplyExact(mult,effect.amount);
    else mult=addExact(mult,effect.amount);
    trace.push({type:'score_step',phase,sourceId,operation:effect.operation,before,after:{chips,mult},...(effectSourceId?{effectSourceId}:{})});
  }
  for (const card of playedCards) {
    if (!scoringSet.has(card.id)) continue;
    if(isBossCardDebuffed(state,card)){item7Options.blindTriggered=true;continue;}
    const queue=[null,...(card.seal==='red'?[card.id]:[])];
    for(let index=0;index<state.jokers.length;index++){
      const context=jokerEffectContext(state.jokers,index);if(!context)continue;
      const {source,target:joker}=context;
      if(actionRng&&card.enhancement==='stone'){
        const key=originalJokerKey(joker.entityId),get=()=>rankGetter(card,'repetition',joker.id);
        if(key==='j_hack')void(get()===2||get()===3||get()===4||get()===5);
      }
      const count=scoredJokerRepetitions(joker.entityId,card,{firstScoringCardId:scoringCardIds[0],handsRemaining:state.round?.handsRemaining,jokers:state.jokers,rankGetter:card=>rankGetter(card,'repetition',source.id)});
      for(let i=0;i<count;i++)queue.push(source.id);
    }
    for(const source of queue){
    if(source)trace.push({type:'score_repeat',phase:'scored_card',sourceId:card.id,effectSourceId:source});
    const before = {chips,mult};
    chips += (card.enhancement==='stone'?50n:BigInt(card.rank===14 ? 11 : Math.min(card.rank,10)))+BigInt(card.permaBonus??0);
    let luckyTriggered=false;
    trace.push({type:'score_step',phase:'scored_card',sourceId:card.id,operation:'add_chips',before,after:{chips,mult}});
    if(card.enhancement==='bonus')apply({operation:'add_chips',amount:30n},'scored_card',card.id);
    if(card.enhancement==='mult')apply({operation:'add_mult',amount:4n},'scored_card',card.id);
    if(card.enhancement==='lucky'){
      const multRoll=luckyRoll('lucky_mult',5),multTriggered=multRoll<item7Probability(state)/5;if(multTriggered)apply({operation:'add_mult',amount:20n},'scored_card',card.id);
      const moneyRoll=luckyRoll('lucky_money',15),moneyTriggered=moneyRoll<item7Probability(state)/15;if(moneyTriggered)trace.push({type:'score_money',phase:'scored_card',sourceId:card.id,amount:20n});
      luckyTriggered=multTriggered||moneyTriggered;
      luckyRolls.push({cardId:card.id,multRoll,moneyRoll,multTriggered,moneyTriggered});
    }
    if(card.enhancement==='glass')apply({operation:'multiply_mult',amount:2n},'scored_card',card.id);
    if(card.seal==='gold')trace.push({type:'score_money',phase:'scored_card',sourceId:card.id,amount:3n});
    if(card.edition==='foil')apply({operation:'add_chips',amount:50n},'scored_card',card.id);
    if(card.edition==='holographic')apply({operation:'add_mult',amount:10n},'scored_card',card.id);
    if(card.edition==='polychrome')apply({operation:'multiply_mult',amount:{n:3n,d:2n}},'scored_card',card.id);
    // Native collects individual results before running 8 Ball's creation func.
    // Reserve slots during collection so later copies cannot roll at capacity.
    const pendingCreations=[];
    const scoredOptions={...item7Options,luckyTriggered,consumableSpace:()=>item7ConsumableSpace(state)-pendingCreations.length,create:options=>pendingCreations.push(options)};
    for(let index=0;index<state.jokers.length;index++){
      const context=jokerEffectContext(state.jokers,index);if(!context)continue;
      const {source,target:joker}=context;
      if(actionRng&&card.enhancement==='stone'){
        const key=originalJokerKey(joker.entityId),get=()=>rankGetter(card,'scored_joker',joker.id);
        if(key==='j_scholar')get();
        if(key==='j_walkie_talkie')void(get()===10||get()===4);
        if(key==='j_fibonacci')void(get()===2||get()===3||get()===5||get()===8||get()===14);
        if(key==='j_even_steven')void(get()<=10&&get()>=0&&get()%2===0);
        if(key==='j_odd_todd')void((get()<=10&&get()>=0&&get()%2===1)||get()===14);
      }
      for(const effect of scoredJokerEffects(joker.entityId,card,{jokers:state.jokers,rankGetter:card=>rankGetter(card,'scored_joker',source.id)}))apply(effect,'scored_card',card.id,source.id);
      if(hasItem7)for(const effect of item7ScoredEffects(state,context,card,scoredOptions))apply(effect,'scored_card',card.id,source.id);
    }
    for(const options of pendingCreations)item7Options.create(options);
  }
  }
  for(const card of heldCards){
    function heldEffects(){
      const effects=[];
      const debuffed=isBossCardDebuffed(state,card);
      if(!debuffed&&card.enhancement==='steel')effects.push({effect:{operation:'multiply_mult',amount:{n:3n,d:2n}}});
      for(let index=0;index<state.jokers.length;index++){
        const context=jokerEffectContext(state.jokers,index);if(!context)continue;
        const {source,target}=context;
        if(actionRng&&card.enhancement==='stone'&&['j_baron','j_shoot_the_moon'].includes(originalJokerKey(target.entityId)))rankGetter(card,'held_joker',source.id);
        if(!debuffed)for(const effect of heldJokerEffects(target.entityId,card,heldCards))effects.push({effect,sourceId:source.id});
        if(hasItem7)for(const effect of item7HeldEffects(state,context,card,item7Options))effects.push({effect,sourceId:source.id});
      }
      return effects;
    }
    const first=heldEffects();
    const queue=[null];
    if(first.length){
      if(card.seal==='red')queue.push(card.id);
      for(let index=0;index<state.jokers.length;index++){
        const context=jokerEffectContext(state.jokers,index);
        if(context&&originalJokerKey(context.target.entityId)==='j_mime')queue.push(context.source.id);
      }
    }
    for(let index=0;index<queue.length;index++){
      if(queue[index])trace.push({type:'score_repeat',phase:'held_card',sourceId:card.id,effectSourceId:queue[index]});
      for(const {effect,sourceId} of index?heldEffects():first)apply(effect,'held_card',card.id,sourceId);
    }
  }
  item7Options.currentMoney=()=>moneyBeforeCards+trace.reduce((sum,event)=>sum+(event.type==='score_money'?event.amount:0n),0n);
  const moneyJokers=state.jokers.some(j=>['j_bull','j_bootstraps'].includes(originalJokerKey(j.entityId)));
  if(moneyJokers&&typeof state.money!=='bigint')throw new TypeError('Missing scoring money');
  // Native get_p_dollars buffers Lucky income before independent Joker evaluation.
  let moneyBeforeCards=state.money??0n;
  if(!state.bossState?.disabled&&state.bossState?.id==='bl_tooth')moneyBeforeCards-=BigInt(playedCards.length);
  if(!state.bossState?.disabled&&state.bossState?.id==='bl_ox'&&state.bossState.oxHand===hand.handId)moneyBeforeCards=0n;

  const rankCounts = new Map();
  for (const card of playedCards)if(card.enhancement!=='stone')rankCounts.set(card.rank,(rankCounts.get(card.rank)??0)+1);
  for (let index=0;index<state.jokers.length;index++) {
    const source=state.jokers[index];
    const context=jokerEffectContext(state.jokers,index),joker=context?.target??source;
    if(!source.debuffed&&source.edition==='foil')apply({operation:'add_chips',amount:50n},'edition',source.id);
    if(!source.debuffed&&source.edition==='holographic')apply({operation:'add_mult',amount:10n},'edition',source.id);
    const effect=context&&independentEffect(joker.entityId,[...rankCounts.values()],{playedCards,handId:hand.handId,jokers:state.jokers,jokerCount:state.jokers.length,
      handsRemaining:state.round?.handsRemaining,discardsRemaining:state.round?.discardsRemaining,heldCards,jokerSlots:state.jokerSlots??5,
      scoringCards:playedCards.filter(card=>scoringSet.has(card.id)),isCardDebuffed:card=>isBossCardDebuffed(state,card),playingCards:Object.values(state.cards??{}),money:item7Options.currentMoney(),drawCount:state.drawPile?.length??0,
      otherSellCost:originalJokerKey(joker.entityId)==='j_swashbuckler'?state.jokers.filter(other=>other!==joker).reduce((sum,other)=>{if(typeof other.sellCost!=='bigint'||other.sellCost<0n)throw new TypeError('Missing Joker sell value');return sum+other.sellCost;},0n):0n,
      negativeCount:state.jokers.filter(card=>card.edition==='negative').length,stencilCount:state.jokers.filter(card=>originalJokerKey(card.entityId)==='j_stencil').length});
    const item7Effect=context&&hasItem7&&item7IndependentEffect(state,context,item7Options);
    if(item7Effect)apply(item7Effect,'independent',source.id);
    else if(effect)apply(effect,'independent',source.id);
    if(hasItem7&&APK_SHOP_CATALOG.centres.find(c=>c.key===originalJokerKey(source.entityId))?.rarity===2)for(let otherIndex=0;otherIndex<state.jokers.length;otherIndex++){
      const baseball=jokerEffectContext(state.jokers,otherIndex);if(baseball?.target.entityId==='j_baseball'&&baseball.target!==source)apply({operation:'multiply_mult',amount:{n:3n,d:2n}},'independent',source.id,baseball.source.id);
    }
    if(!source.debuffed&&source.edition==='polychrome')apply({operation:'multiply_mult',amount:{n:3n,d:2n}},'edition',source.id);
  }
  // Native destroying_card discovers Sixth Sense before testing Glass. Keep
  // physical removal in the reducer so both causes share one removed list.
  let sixthDestroyed=[];
  if(state.jokers.some(j=>j.entityId==='j_sixth_sense')){
    if(actionRng)state.rng.apk=actionRng;
    sixthDestroyed=applyItem7SixthSense(state,playedCards.map(c=>c.id),lifecycleEvents,{remove:false});
    if(actionRng)actionRng=state.rng.apk;
  }
  for(const card of playedCards)if(scoringSet.has(card.id)&&card.enhancement==='glass'&&!isBossCardDebuffed(state,card)){
    const roll=glassRoll(),destroyed=sixthDestroyed.some(c=>c.id===card.id)||roll<item7Probability(state)/4;glassRolls.push({cardId:card.id,roll,destroyed});
  }
  const score = floorExact(multiplyExact(chips,mult));
  trace.push({type:'score_total',phase:'total',chips,mult,score});
  const bellGlass=(actionRng||glassRolls.length>0&&glassKind==='apk')&&!state.bossState?.disabled&&state.bossState?.id==='bl_final_bell';
  return {...hand,...(hasItem7?{item7State:{...(Number.isSafeInteger(state.nextJokerCreationOrdinal)?{nextJokerCreationOrdinal:state.nextJokerCreationOrdinal}:{}),jokers:structuredClone(state.jokers),cards:structuredClone(state.cards),handLevels:structuredClone(state.handLevels)}}:{}),...actionProvenance(),...(hasMechanisms?{effectMechanisms:true}:{}),...(createdPlayingCards.length?{createdPlayingCards}:{}),...(lifecycleEvents.length?{lifecycleEvents}:{}),...(state.consumables?.some(c=>!originalState.consumables?.some(old=>old.id===c.id))?{createdConsumables:state.consumables.filter(c=>!originalState.consumables?.some(old=>old.id===c.id))}:{}),playedCardIds:playedCards.map(c=>c.id),scoringCardIds,chips,mult,score,trace,...(actionRng||bellGlass||heldCards.some(card=>card.enhancement==='steel')||state.jokers.some(j=>['j_blackboard','j_raised_fist','j_baron','j_shoot_the_moon','j_blue_joker'].includes(originalJokerKey(j.entityId)))?{heldCardIds:heldCards.map(card=>card.id)}:{}),...(actionRng||bellGlass||state.jokers.some(j=>originalJokerKey(j.entityId)==='j_blue_joker')?{scoringPilesBefore:{drawPile:[...(state.drawPile??[])],discardPile:[...(state.discardPile??[])],...(state.hangedShortfallCardIds?{hangedShortfallCardIds:[...state.hangedShortfallCardIds],hangedShortfallRevision:state.hangedShortfallEpoch?.revision??state.revision}:{})}}:{}),...(moneyJokers?{scoringMoneyBefore:state.money}:{}),...(state.round&&(actionRng||bellGlass||state.jokers.some(j=>['j_acrobat','j_banner','j_mystic_summit','j_blue_joker','j_dusk'].includes(originalJokerKey(j.entityId))))?{scoringRoundBefore:{handsRemaining:state.round.handsRemaining,discardsRemaining:state.round.discardsRemaining}}:{}),...(luckyRolls.length?{luckyRolls,luckyRngKind:luckyKind,luckyRngBefore,luckyRngAfter:luckyKind==='apk'?{...luckySnapshot(luckyRng),mathState:[...luckyRng.mathState]}:luckyRng}:{}),...(glassRolls.length?{glassRolls,glassRngKind:glassKind,glassRngBefore,glassRngAfter:glassKind==='apk'?{...glassSnapshot(glassRng),mathState:[...glassRng.mathState]}:glassRng,glassDestroyedCards:glassRolls.filter(roll=>roll.destroyed).map(roll=>structuredClone(playedCards.find(card=>card.id===roll.cardId)))}:{})};
}



