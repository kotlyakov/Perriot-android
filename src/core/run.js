import {applyItem7FirstDraw} from './joker-item7-creation.js';
import {applyItem7PlayingCardsAdded,item7CapacityDeltas} from './joker-item7-lifecycle.js';
import {item7EconomyModifiers} from './joker-item7-economy.js';
import {finishItem7Action} from './joker-item7-actions.js';
import {applyItem7BlindStart,finishItem7BlindStart,applyItem7EndRound,applyItem7Discard,applyItem7CardsDestroyed,resetItem7RoundTargets} from './joker-item7-lifecycle.js';
import {applyItem7EconomyContext,queueItem7BlindEconomy} from './joker-item7-economy.js';
import {isCardFace} from './card-faces.js';
import {applyJokerBlindStart,applyJokerAfterScore} from './joker-lifecycle.js';
import {applyDiscardSeals} from './card-effects.js';
import {hasEffectMechanisms} from './playing-card-modifiers.js';
import {handRecognitionOptions,SCORED_RETRIGGER_JOKERS,originalJokerKey} from '../content/jokers.js';
import {applySkipBlind} from './skip-blind.js';
import {applyConsumableAction} from './consumables.js';
import {applyCelestialPackAction} from './celestial-pack.js';
import {canEnterBoss,chooseHookDiscards,chooseHeartJoker,chooseBellCard,shuffleAcornJokers,isBossCardDebuffed,resolveMostPlayedHand} from './boss-effects.js';
import {applyInventoryAction} from './inventory.js';
import {chooseNextAnteBlinds} from './blind-progression.js';
import {chooseApkBoss} from './apk-blinds.js';
import {createApkTagContext,chooseApkTag,chooseApkOrbitalHand} from './apk-tags.js';
import {sortHand,SORT_MODES} from './sort.js';
import {getCashout,settleRoundSuccess} from './cashout.js';
import { createRng, randomInt } from './rng.js';
import { scoreHand } from './score.js';
import { HANDS } from '../content/hands.js';
import {createApkRng,nextApkRandom} from './apk-rng.js';
import {evaluateHand} from './hands.js';
import {APK_BASE_CARD_IDS,shuffleApkDeck} from './apk-deck.js';
import {applyShopAction,createShop,stampJokerCreationOrdinals} from './shop.js';
import {createApkShopContext,chooseApkVoucher,generateApkShop} from './apk-shop.js';
import {APK_HAND_NAMES,currentApkShopContext} from './apk-shop-state.js';

export function createRun(seed, {runId,deckId='red',money,referenceRng=false,referenceShop=false,reducedMotion=false}={}) {
  if (typeof seed!=='string' || !seed || seed.length>1000) throw new TypeError('Invalid seed');
  if (typeof runId!=='string' || !runId || runId.length>120 || !['red','blue'].includes(deckId) || typeof money!=='bigint') throw new TypeError('Invalid run options');
  if(typeof referenceRng!=='boolean'||typeof referenceShop!=='boolean'||typeof reducedMotion!=='boolean'||referenceShop&&!referenceRng)throw new TypeError('Invalid reference shop options');
  const cards = {};
  for (const suit of ['clubs','diamonds','hearts','spades']) {
    for (let rank=2;rank<=14;rank++) {
      const id=`card_${suit}_${rank}`;cards[id]={id,rank,suit};
    }
  }
  const state={
    schemaVersion:1,runId,seed,revision:0,phase:'blind_selection',deckId,cards,
    winAnte:8,won:false,winNotified:false,winPending:false,
    hand:[],drawPile:Object.keys(cards),discardPile:[],jokers:[],
    handLevels:Object.fromEntries(Object.keys(HANDS).map(id=>[id,1])),
    discoveredHands:Object.keys(HANDS).slice(0,9),
    rng:{deck:createRng(`${seed}:deck`),effects:createRng(`${seed}:effects`)},money,
    round:{handsPlayed:0,blindId:'small',ante:1,target:300n,score:0n,handsRemaining:deckId==='blue'?5:4,discardsRemaining:deckId==='red'?4:3,handSize:8},
    lastScore:null,sortMode:'rank',mostPlayedHand:'high_card',nextJokerCreationOrdinal:1,
    consumableUsage:{},consumableUsageTotal:{tarot:0,planet:0,spectral:0,tarot_planet:0,all:0},lastTarotPlanet:null,
  };
  if(referenceRng){
    let rng=createApkRng(seed);
    if(referenceShop){
      const boss=chooseApkBoss(rng);rng=boss.rng;
      const context=createApkShopContext({reducedMotion}),voucher=chooseApkVoucher(rng,context);rng=voucher.rng;
      const tagContext=createApkTagContext(),small=chooseApkTag(rng,tagContext),big=chooseApkTag(small.rng,tagContext);rng=big.rng;
      state.apkBlinds={version:1,ante:1,bossId:boss.bossId,bossesUsed:boss.bossesUsed,
        tags:{small:small.tagId,big:big.tagId},orbitalHands:{},tagContext,playedCardIds:[]};
      state.runStats={handsPlayed:0,unusedDiscards:0,skips:0};state.roundNumber=1;state.apkShop={version:1,voucherId:voucher.voucherId,firstShopBuffoon:false,context};
    }
    const shuffled=shuffleApkDeck(cards,rng,'shuffle');state.drawPile=shuffled.cardIds;state.rng.apk=shuffled.rng;
    resetItem7RoundTargets(state);
    // The initial blind screen fixes all three orbital hands after the deck shuffle.
    if(state.apkBlinds)for(const id of ['small','big','boss']){
      const selected=chooseApkOrbitalHand(state.rng.apk,state.apkBlinds.tagContext);
      state.apkBlinds.orbitalHands[id]=selected.hand;state.rng.apk=selected.rng;
    }
  }
  return state;
}

function drawToLimit(state, events,action='START_BLIND') {
  const boss=state.bossState;
  if(boss&&!boss.disabled&&boss.id==='bl_final_heart'&&action!=='DISCARD'){
    // Heart's choice consumes no card-dependent RNG. Resolve its passive
    // transition before dealing so the final hand fills the actual capacity.
    const before=item7CapacityDeltas(state.jokers);
    const choice=chooseHeartJoker(state.rng.apk,state.jokers);state.rng.apk=choice.rng;
    for(const joker of state.jokers)joker.debuffed=joker.id===choice.jokerId;
    boss.heartDebuffedJokerId=choice.jokerId;
    const after=item7CapacityDeltas(state.jokers),handSize=after.handSize-before.handSize,discards=after.discards-before.discards;
    state.round.handSize+=handSize;boss.baseHandSize+=handSize;
    state.round.discardsRemaining=Math.max(0,state.round.discardsRemaining+discards);
    if(handSize||discards)events.push({type:'joker_capacity_changed',handSize,discards});
  }
  const serpent=!state.bossState?.disabled&&state.bossState?.id==='bl_serpent'&&action!=='START_BLIND';
  const count=Math.min(serpent?3:Math.max(0,state.round.handSize-state.hand.length),state.drawPile.length);
  const ids=state.rng.apk?Array.from({length:count},()=>state.drawPile.pop()):state.drawPile.splice(0,count);
  if(boss && !boss.disabled && ['bl_house','bl_wheel','bl_fish','bl_mark'].includes(boss.id)){
    boss.hiddenCardIds??=[];
    if(boss.id==='bl_mark'&&!boss.hiddenFaceRanks)boss.hiddenFaceRanks=Object.fromEntries(boss.hiddenCardIds.map(id=>{
      const rank=state.cards[id].rank;return [id,rank>=11&&rank<=13?rank:Number(id.match(/_(\d+)$/)?.[1])];
    }));
    for(const id of ids){
      let hidden=boss.id==='bl_house'&&action==='START_BLIND'||boss.id==='bl_fish'&&action==='PLAY_HAND'||boss.id==='bl_mark'&&isCardFace(state.cards[id],state.jokers,{debuffed:false});
      if(boss.id==='bl_wheel'){const draw=nextApkRandom(state.rng.apk,'wheel');state.rng.apk=draw.rng;hidden=draw.value<item7EconomyModifiers(state).probabilityNormal/7;}
      if(hidden){boss.hiddenCardIds.push(id);if(boss.id==='bl_mark'){boss.hiddenFaceRanks??={};boss.hiddenFaceRanks[id]=state.cards[id].rank;if(state.jokers.some(j=>j.entityId==='j_pareidolia'&&!j.debuffed)){boss.pareidoliaHiddenCardIds??=[];boss.pareidoliaHiddenCardIds.push(id);}}}
    }
  }
  state.hand.push(...ids);sortHand(state);
  if (ids.length) events.push({type:'cards_drawn',cardIds:[...ids]});
  if(boss&&!boss.disabled&&boss.id==='bl_final_bell'&&!state.hand.includes(boss.forcedCardId)){
    boss.bellChoice={cardIds:[...state.hand],streamBefore:state.rng.apk.streams.cerulean_bell??null,revision:state.revision+(action==='START_BLIND'?0:1)};
    const choice=chooseBellCard(state.rng.apk,state.hand.map(id=>state.cards[id]));state.rng.apk=choice.rng;boss.forcedCardId=choice.cardId;
  }
}

// Keep one trusted checkpoint, never nested histories. PLAY_HAND refreshes the
// scoring checkpoint; other effect transitions retain their mutable provenance.
export function dispatch(state,action,shopOptions={}){
  let result;try{result=dispatchCore(state,action,shopOptions);}catch(error){return {state,events:[],error:{code:'INVALID_STATE',message:error.message}};}
  if(result.error||result.state===state)return result;
  const next=result.state;
  try{finishItem7Action(state,next,action,result.events);}catch(error){return {state,events:[],error:{code:'INVALID_STATE',message:error.message}};}
  let journal;
  if(action.type==='PLAY_HAND'&&(hasEffectMechanisms(state)||state.rng?.apk&&next.phase==='round_won')){
    const before=structuredClone(state);delete before.effectReplay;before.lastScore=null;
    journal={version:hasEffectMechanisms(state)?1:2,before,actions:[structuredClone(action)]};
  }else if(state.effectReplay){
    if(state.effectReplay.actions.length>=10000)return {state,events:[],error:{code:'INVALID_STATE',message:'Effect history limit reached'}};
    const legacyAction=['DISCARD','REORDER_HAND','SET_SORT','CONTINUE_ENDLESS'].includes(action.type);
    const version=state.effectReplay.version===1&&next.lastScore!==null&&legacyAction?1:2;
    journal={...structuredClone(state.effectReplay),version,actions:[...structuredClone(state.effectReplay.actions),structuredClone(action)]};
  }else if(action.type==='DISCARD'&&hasEffectMechanisms(state)&&result.events.some(event=>event.type==='joker_counter_changed')){
    const before=structuredClone(state);delete before.effectReplay;
    journal={version:2,before,actions:[structuredClone(action)]};
  }
  if(journal)next.effectReplay=journal;else delete next.effectReplay;
  return result;
}
export function replayEffectActions(before,actions){
  let state=structuredClone(before);
  for(const action of actions){const result=dispatchCore(state,action);if(result.error)throw new TypeError('Invalid effect action history');if(result.state!==state)finishItem7Action(state,result.state,action,result.events);state=result.state;}
  return state;
}
function dispatchCore(state, action, shopOptions={}) {
  const reject=(code,message)=>({state,events:[],error:{code,message}});
  if (!action || typeof action.type!=='string' || !Number.isSafeInteger(action.expectedRevision)) return reject('INVALID_ACTION','Malformed action');
  if (action.expectedRevision!==state.revision) return reject('STALE_ACTION','State revision has changed');
  if (!Number.isSafeInteger(state.revision) || state.revision<0 || state.revision===Number.MAX_SAFE_INTEGER) return reject('INVALID_STATE','Invalid revision');
  if(state.winPending&&action.type!=='CONTINUE_ENDLESS')return reject('VICTORY_PENDING','Acknowledge victory first');
  if(action.type==='CONTINUE_ENDLESS'){
    if(state.phase!=='round_won'||!state.winPending)return reject('INVALID_PHASE','No victory acknowledgement pending');
    const next=structuredClone(state);next.winPending=false;next.revision++;
    return {state:next,events:[{type:'endless_continued'}],error:null};
  }
  if(['REORDER_JOKERS','REORDER_CONSUMABLES','SELL_OWNED_CARD'].includes(action.type))return applyInventoryAction(state,action);
  if(action.type==='USE_CONSUMABLE')return applyConsumableAction(state,action);
  if(['OPEN_BOOSTER','USE_PACK_CARD','SKIP_PACK'].includes(action.type))return applyCelestialPackAction(state,action);
  if(action.type==='SKIP_BLIND')return applySkipBlind(state,action);
  if(['BUY_SHOP_CARD','SELL_JOKER','REROLL_SHOP','LEAVE_SHOP'].includes(action.type))return applyShopAction(state,action,shopOptions);
  if(action.type==='CASH_OUT') {
    if(state.phase!=='round_won')return reject('INVALID_PHASE','Round has not been won');
    let quote;try{quote=getCashout(state);}catch{return reject('INVALID_STATE','Invalid cashout state');}
    const next=structuredClone(state);
    // Preserve the earned target's native disable provenance after active boss cleanup.
    if(next.bossState?.disabled&&['bl_wall','bl_final_vessel'].includes(next.bossState.id))next.round.bossDisabled=true;
    if(next.bossState){next.round.handSize=next.bossState.baseHandSize;if(next.bossState.id==='bl_final_heart')for(const joker of next.jokers)joker.debuffed=false;delete next.bossState;next.apkBlinds.playedCardIds=[];next.mostPlayedHand=resolveMostPlayedHand(next.apkShop.context.playedHands);}next.money+=quote.total;delete next.cashoutQuote;next.phase='shop';next.revision++;
    next.drawPile=Object.keys(next.cards);next.hand=[];next.discardPile=[];next.lastScore=null;if(state.hangedShortfallCardIds)next.hangedShortfallEpoch={...(state.hangedShortfallEpoch??{cardIds:[...state.hangedShortfallCardIds],revision:state.revision,ante:state.round.ante,blindId:state.round.blindId,handsRemaining:state.round.handsRemaining}),consumed:true,consumedBy:action.type};delete next.hangedShortfallCardIds;
    if(next.apkShop){
      try{
        const context=currentApkShopContext(next);
        if(next.round.blindId==='boss'){
          const voucher=chooseApkVoucher(next.rng.apk,context);next.rng.apk=voucher.rng;next.apkShop.voucherId=voucher.voucherId;
        }
        const shuffled=shuffleApkDeck(Object.values(next.cards),next.rng.apk,'cashout'+context.ante);
        next.drawPile=shuffled.cardIds;next.rng.apk=shuffled.rng;
        if(next.round.blindId==='boss'){
          const selected=chooseNextAnteBlinds(next,next.rng.apk);
          next.nextAnteBlinds=selected.selection;next.rng.apk=selected.rng;
        }
        const generated=generateApkShop(next.rng.apk,context,{voucherId:next.apkShop.voucherId,
          firstShopBuffoon:next.apkShop.firstShopBuffoon,instancePrefix:'shop_'+next.revision});
        next.shop=createShop({offers:generated.offers});stampJokerCreationOrdinals(next,next.shop.main);next.rng.apk=generated.rng;
        next.apkShop.firstShopBuffoon=generated.firstShopBuffoon;
        next.apkShop.context=currentApkShopContext(next);
      }catch{return reject('UNSUPPORTED_SHOP_STATE','Shop generation inputs are unsupported');}
    }
    return {state:next,events:[{type:'cash_out',...quote},{type:'shop_entered'}],error:null};
  }
  if (action.type==='START_BLIND') {
    if (state.phase!=='blind_selection') return reject('INVALID_PHASE','Not selecting a blind');
    if(state.round.blindId==='boss'&&!canEnterBoss(state))return reject('BOSS_UNAVAILABLE','Boss lifecycle is unavailable');
    const next=structuredClone(state);const events=[];
    if(next.round.blindId==='boss'){
      next.bossState={version:1,disabled:false,id:next.apkBlinds.bossId,playedBeforeBoss:[...next.apkBlinds.playedCardIds],baseHandSize:next.round.handSize};
      if(next.bossState.id==='bl_manacle')next.round.handSize--;
      if(next.bossState.id==='bl_serpent')next.bossState.serpentInitialCardCount=next.drawPile.length;
      if(next.bossState.id==='bl_water'){next.bossState.discardsSub=next.round.discardsRemaining;next.round.discardsRemaining=0;}
      if(next.bossState.id==='bl_needle'){next.bossState.startedRevision=next.revision+1;next.bossState.handsSub=next.round.handsRemaining-1;next.round.handsRemaining=1;}
      if(['bl_house','bl_wheel','bl_fish','bl_mark'].includes(next.bossState.id))next.bossState.hiddenCardIds=[];
      if(next.bossState.id==='bl_eye')next.bossState.playedHands=[];
      if(next.bossState.id==='bl_mouth')next.bossState.firstHand=null;
      if(next.bossState.id==='bl_ox')next.bossState.oxHand=next.mostPlayedHand;
      if(next.bossState.id==='bl_final_heart')next.bossState.heartDebuffedJokerId=null;
      if(next.bossState.id==='bl_final_bell'){next.bossState.forcedCardId=null;next.bossState.bellChoice=null;}
      if(next.bossState.id==='bl_final_acorn')next.bossState.hiddenJokerIds=next.jokers.map(j=>j.id);
    }
    next.round.handsPlayed=0;next.round.discardsUsed=0;next.round.handUsage={};delete next.round.burglarHandsGranted;next.phase='playing';if(next.rng?.apk)resetItem7RoundTargets(next,{onlyMissing:true});const pendingSlices=applyItem7BlindStart(next,events,{deferRemoval:true,onContext:(context,pending)=>{
      queueItem7BlindEconomy(next,context,events,pending);
      if(context.target.entityId==='j_marble')pending.callbacks.push(()=>applyJokerBlindStart(next,events,{contexts:[context],scheduled:true}));
    }});
    for(const callback of [...pendingSlices.callbacks,...pendingSlices.nestedCallbacks])callback();
    finishItem7BlindStart(next,events,pendingSlices);
    if(next.rng.apk){
      const shuffled=shuffleApkDeck(next.drawPile.map(id=>next.cards[id]),next.rng.apk,'nr'+next.round.ante);next.drawPile=shuffled.cardIds;next.rng.apk=shuffled.rng;
    }else for(let i=next.drawPile.length-1;i>0;i--) {
      const draw=randomInt(next.rng.deck,i+1);next.rng.deck=draw.rng;
      [next.drawPile[i],next.drawPile[draw.value]]=[next.drawPile[draw.value],next.drawPile[i]];
    }
    if(next.bossState?.id==='bl_final_acorn'){
      const shuffled=shuffleAcornJokers(next.rng.apk,next.jokers);next.jokers=shuffled.jokerIds.map(id=>next.jokers.find(j=>j.id===id));next.rng.apk=shuffled.rng;
    }
    if(next.apkShop)next.roundNumber=(next.round.ante-1)*3+({small:1,big:2,boss:3}[next.round.blindId]);
    next.phase='playing';next.revision++;
    events.push({type:'round_started',blindId:next.round.blindId,target:next.round.target});
    try{
      const created=applyItem7FirstDraw(next,events);applyItem7PlayingCardsAdded(next,created,events);drawToLimit(next,events);
      if(next.bossState?.id==='bl_serpent'){
        // Chicot can disable before the shuffle, initial deal and later Burglar
        // callbacks. Bind subsequent refills to the accepted initial hand.
        next.bossState.serpentInitialCardCount=next.hand.length+next.drawPile.length+next.discardPile.length;
        next.bossState.serpentInitialHandSize=next.hand.length;
        if(next.bossState.disabled){
          const origin=next.bossState.serpentDisableOrigin;
          origin.hand=[...next.hand];origin.drawPile=[...next.drawPile];
          origin.discardPile=[...next.discardPile];origin.destroyedCardIds=[...(next.destroyedCardIds??[])];
          origin.handsRemaining=next.round.handsRemaining;origin.discardsRemaining=next.round.discardsRemaining;
          origin.refillsBefore=0;
        }
      }
      if(next.apkShop)next.apkShop.context=currentApkShopContext(next);
    }catch(error){return reject('UNSUPPORTED_BOSS_STATE',error.message);}
    return {state:next,events,error:null};
  }
  if (!['PLAY_HAND','DISCARD','REORDER_HAND','SET_SORT'].includes(action.type)) return reject('UNKNOWN_ACTION','Unsupported action');
  if (state.phase!=='playing'&&!(state.phase==='pack'&&state.packState?.sourceEntityId.startsWith('p_arcana_')&&['SET_SORT','REORDER_HAND'].includes(action.type))) return reject('INVALID_PHASE','Round is not active');
  if(action.type==='SET_SORT'){
    if(!SORT_MODES.includes(action.mode))return reject('INVALID_SORT','Invalid sort');
    const next=structuredClone(state);next.sortMode=action.mode;sortHand(next);next.revision++;
    return {state:next,events:[{type:'hand_reordered',cardIds:[...next.hand]}],error:null};
  }
  const ids=action.cardIds;
  if (action.type==='REORDER_HAND') {
    if (!Array.isArray(ids) || ids.length!==state.hand.length || new Set(ids).size!==ids.length || ids.some(id=>!state.hand.includes(id))) return reject('INVALID_SELECTION','Expected an exact permutation of held cards');
    const next=structuredClone(state);next.hand=[...ids];next.revision++;
    return {state:next,events:[{type:'hand_reordered',cardIds:[...ids]}],error:null};
  }
  if (!Array.isArray(ids) || ids.length<1 || ids.length>5 || new Set(ids).size!==ids.length || ids.some(id=>typeof id!=='string' || !state.hand.includes(id))) return reject('INVALID_SELECTION','Select 1 to 5 distinct held cards');
  if (action.type==='PLAY_HAND' && state.round.handsRemaining<=0 || action.type==='DISCARD' && state.round.discardsRemaining<=0) return reject('NO_ACTIONS_LEFT','Counter exhausted');
  if(!state.bossState?.disabled&&state.bossState?.id==='bl_final_bell'&&state.bossState.forcedCardId&&!ids.includes(state.bossState.forcedCardId))return reject('FORCED_SELECTION','Include the forced Bell card');
  const selected=new Set(ids);
  const playedIds=state.hand.filter(id=>selected.has(id));
  let score=null,scoringState=state,hookDiscards=null,armTriggered=false;
  if (action.type==='PLAY_HAND') {
    try {
      if(!state.bossState?.disabled&&state.bossState?.id==='bl_hook'&&!state.hand.some(id=>state.cards[id].enhancement==='stone')&&!state.jokers.some(j=>SCORED_RETRIGGER_JOKERS.includes(originalJokerKey(j.entityId)))&&!hasEffectMechanisms(state)){
        try{hookDiscards=chooseHookDiscards(state.rng.apk,state.hand.filter(id=>!selected.has(id)));}catch{return reject('UNSUPPORTED_BOSS_STATE','Invalid Hook card identities');}
        scoringState={...state,hand:state.hand.filter(id=>!hookDiscards.cardIds.includes(id)),discardPile:[...state.discardPile,...state.hand.filter(id=>hookDiscards.cardIds.includes(id))],rng:{...state.rng,apk:hookDiscards.rng}};
      }
      if(!state.bossState?.disabled&&state.bossState?.id==='bl_arm'){
        const handId=evaluateHand(playedIds.map(id=>state.cards[id]),{isCardDebuffed:card=>isBossCardDebuffed(state,card),...handRecognitionOptions(state.jokers)}).handId;
        armTriggered=state.handLevels[handId]>1;
        scoringState={...state,handLevels:{...state.handLevels,[handId]:Math.max(1,state.handLevels[handId]-1)}};
      }
      score=scoreHand(scoringState,playedIds.map(id=>state.cards[id]),{armTriggered});
      if(score.actionRng?.hookDiscardCardIds)hookDiscards={cardIds:score.actionRng.hookDiscardCardIds,rng:score.actionRng.after};
      if(!state.bossState?.disabled&&state.bossState?.id==='bl_eye')score.bossHistory={playedHands:[...state.bossState.playedHands]};
      if(!state.bossState?.disabled&&state.bossState?.id==='bl_mouth')score.bossHistory={firstHand:state.bossState.firstHand};
      if(!state.bossState?.disabled&&state.bossState?.id==='bl_final_bell'&&(score.actionRng||score.glassRngKind==='apk'))score.bossHistory={bellRngBefore:state.rng.apk.streams.cerulean_bell??null};
      if(!state.bossState?.disabled&&state.bossState?.id==='bl_final_heart')score.bossHistory={heartDebuffedJokerId:state.bossState.heartDebuffedJokerId,...((score.actionRng||score.glassRngKind==='apk')?{heartRngBefore:state.rng.apk.streams.crimson_heart??null}:{})};
    }
    catch (error) { return reject('UNSUPPORTED_CONTENT',error.message); }
  }
  if(state.runStats && action.type==='PLAY_HAND' && (state.runStats.handsPlayed>=Number.MAX_SAFE_INTEGER || state.runStats.unusedDiscards>Number.MAX_SAFE_INTEGER-state.round.discardsRemaining))return reject('INVALID_STATE','Run counters exhausted');
  const next=structuredClone(state);const events=[];
  if(score?.item7State)for(const key of ['jokers','cards','handLevels','nextJokerCreationOrdinal'])if(Object.hasOwn(score.item7State,key))next[key]=structuredClone(score.item7State[key]);
  if(score?.createdPlayingCards)for(const card of score.createdPlayingCards){next.cards[card.id]=structuredClone(card);next.hand.push(card.id);next.nextPlayingCardOrdinal=card.creationOrdinal+1;}
  if(score?.createdConsumables){next.consumables??=[];next.consumables.push(...structuredClone(score.createdConsumables));}
  if(score?.lifecycleEvents)events.push(...structuredClone(score.lifecycleEvents));
  if(!state.bossState?.disabled&&state.bossState?.id==='bl_arm'&&scoringState!==state){if(!score.item7State)next.handLevels={...scoringState.handLevels};if(next.handLevels[score.handId]!==state.handLevels[score.handId])events.push({type:'hand_level_changed',handId:score.handId,levels:-1,level:next.handLevels[score.handId]});}
  if(next.bossState?.id==='bl_final_bell'){next.bossState.forcedCardId=null;next.bossState.bellChoice=null;}
  next.hand=next.hand.filter(id=>!selected.has(id));
  if(next.bossState?.hiddenCardIds)next.bossState.hiddenCardIds=next.bossState.hiddenCardIds.filter(id=>next.hand.includes(id));
  if(next.bossState?.pareidoliaHiddenCardIds)next.bossState.pareidoliaHiddenCardIds=next.bossState.pareidoliaHiddenCardIds.filter(id=>next.hand.includes(id));
  if(next.bossState?.hiddenFaceRanks)next.bossState.hiddenFaceRanks=Object.fromEntries(Object.entries(next.bossState.hiddenFaceRanks).filter(([id])=>next.hand.includes(id)));
  if(score&&!next.bossState?.disabled&&next.bossState?.id==='bl_hook'){
    next.rng.apk=hookDiscards.rng;
    const discarded=next.hand.filter(id=>hookDiscards.cardIds.includes(id));
    next.hand=next.hand.filter(id=>!hookDiscards.cardIds.includes(id));next.discardPile.push(...discarded);
    const removed=applyItem7Discard(next,discarded,events,{forced:true});applyItem7CardsDestroyed(next,removed,events);for(const card of removed){delete next.cards[card.id];next.discardPile=next.discardPile.filter(id=>id!==card.id);next.destroyedCardIds=[...(next.destroyedCardIds??[]),card.id];}
    if(discarded.length)events.push({type:'cards_forced_discarded',cardIds:discarded});
  }
  next.discardPile.push(...playedIds);
  if (score) {
    if(score.luckyRngAfter&&!score.actionRng){
      if(score.luckyRngKind==='apk'){
        for(const key of ['lucky_mult','lucky_money']){const value=score.luckyRngAfter[key];if(value===null)delete next.rng.apk.streams[key];else next.rng.apk.streams[key]=value;}
        next.rng.apk.mathState=[...score.luckyRngAfter.mathState];
      }
      else next.rng.effects=structuredClone(score.luckyRngAfter);
    }
    if(score.glassRngAfter&&!score.actionRng){
      if(score.glassRngKind==='apk'){
        const value=score.glassRngAfter.glass;if(value===null)delete next.rng.apk.streams.glass;else next.rng.apk.streams.glass=value;
        next.rng.apk.mathState=[...score.glassRngAfter.mathState];
      }else next.rng.effects=structuredClone(score.glassRngAfter);
    }
    if(score.actionRng)next.rng.apk=structuredClone(score.actionRng.after);
    const shattered=[...new Set([...(score.glassRolls?.filter(roll=>roll.destroyed).map(roll=>roll.cardId)??[]),...(score.lifecycleEvents??[]).filter(event=>event.type==='playing_card_destroyed'&&event.reason==='sixth_sense'&&event.card.enhancement==='glass').map(event=>event.cardId)])];
    if(shattered.length){
      const removed=new Set(shattered);next.discardPile=next.discardPile.filter(id=>!removed.has(id));
      const priorDestroyed=next.destroyedCardIds??APK_BASE_CARD_IDS.filter(id=>!Object.hasOwn(next.cards,id));next.destroyedCardIds=[...priorDestroyed,...shattered];
      applyItem7CardsDestroyed(next,shattered.map(id=>({...next.cards[id],shattered:true})),events);
      for(const id of shattered){delete next.cards[id];events.push({type:'card_shattered',cardId:id});}
      if(next.bossState?.hiddenCardIds)next.bossState.hiddenCardIds=next.bossState.hiddenCardIds.filter(id=>!removed.has(id));
      if(next.apkShop)next.apkShop.context=currentApkShopContext(next);
    }
    if(!next.bossState?.disabled&&next.bossState?.id==='bl_eye'&&!next.bossState.playedHands.includes(score.handId))next.bossState.playedHands.push(score.handId);
    if(!next.bossState?.disabled&&next.bossState?.id==='bl_mouth'&&!next.bossState.firstHand)next.bossState.firstHand=score.handId;
    const beforeMoney=next.money;
    if(!next.bossState?.disabled&&next.bossState?.id==='bl_tooth')next.money-=BigInt(playedIds.length);
    if(!next.bossState?.disabled&&next.bossState?.id==='bl_ox'&&score.handId===next.bossState.oxHand)next.money=0n;
    next.money+=score.trace.reduce((sum,event)=>sum+(event.type==='score_money'?event.amount:0n),0n);
    if(next.money!==beforeMoney)events.push({type:'money_changed',before:beforeMoney,after:next.money,delta:next.money-beforeMoney});
    if(next.apkBlinds?.playedCardIds)for(const id of playedIds)if(Object.hasOwn(next.cards,id)&&!next.apkBlinds.playedCardIds.includes(id))next.apkBlinds.playedCardIds.push(id);
    const sixthDestroyed=(score.lifecycleEvents??[]).filter(event=>event.type==='playing_card_destroyed'&&event.reason==='sixth_sense'&&event.card.enhancement!=='glass').map(event=>event.card);
    if(sixthDestroyed.length){
      applyItem7CardsDestroyed(next,sixthDestroyed,events);
      const removed=new Set(sixthDestroyed.map(card=>card.id));
      const priorDestroyed=next.destroyedCardIds??APK_BASE_CARD_IDS.filter(id=>!Object.hasOwn(next.cards,id));next.destroyedCardIds=[...priorDestroyed,...removed];
      next.discardPile=next.discardPile.filter(id=>!removed.has(id));
      for(const id of removed)delete next.cards[id];
    }
    if(next.runStats)next.runStats.handsPlayed++;
    next.round.handsPlayed=(next.round.handsPlayed??0)+1;next.lastPlayedHand=score.handId;
    next.handUsage??={};next.handUsage[score.handId]=(next.handUsage[score.handId]??0)+1;next.round.handUsage??={};next.round.handUsage[score.handId]=(next.round.handUsage[score.handId]??0)+1;
    next.round.handsRemaining--;next.round.score+=score.score;next.lastScore=score;
    applyJokerAfterScore(next,events);
    if(next.bossState?.hiddenJokerIds)next.bossState.hiddenJokerIds=next.bossState.hiddenJokerIds.filter(id=>next.jokers.some(j=>j.id===id));
    if (!next.discoveredHands.includes(score.handId)) next.discoveredHands.push(score.handId);
    if(next.apkShop){const name=APK_HAND_NAMES[score.handId];next.apkShop.context.playedHands[name]=(next.apkShop.context.playedHands[name]??0)+1;}
    events.push({type:'hand_played',cardIds:[...playedIds]},...structuredClone(score.trace));
    if(!settleRoundSuccess(next,events)&&next.round.handsRemaining===0){const end=applyItem7EndRound(next,events,{gameOver:true});applyItem7EconomyContext(next,{type:'end_of_round'},events);if(end.saved)settleRoundSuccess(next,events,{saved:true,endRoundApplied:true});else next.phase='game_over';
      // APK state_events.lua:112-124 sets won even on a losing win-Ante Boss.
      if(next.round.blindId==='boss'&&next.round.ante===(next.winAnte??8))next.won=true;
      if(next.phase==='game_over')events.push({type:'round_lost',score:next.round.score});}
    if(next.phase!=='playing'&&next.bossState?.id==='bl_serpent'&&next.bossState.disabled)next.bossState.serpentTerminalUnfilledCardIds=[...playedIds,...(state.hangedShortfallCardIds??[])];
  } else {
    const removed=applyItem7Discard(next,playedIds,events);applyItem7CardsDestroyed(next,removed,events);
    for(const card of removed){delete next.cards[card.id];next.discardPile=next.discardPile.filter(id=>id!==card.id);next.destroyedCardIds=[...(next.destroyedCardIds??[]),card.id];}
    applyDiscardSeals(next,playedIds.filter(id=>next.cards[id]),events);
    next.round.discardsUsed=(next.round.discardsUsed??0)+1;next.round.discardsRemaining--;events.push({type:'cards_discarded',cardIds:[...playedIds]});
  }
  if(next.phase==='round_won'&&next.bossState?.id==='bl_final_acorn')next.bossState.hiddenJokerIds=[];
  // Native empty Bell pool errors. Convert at the dispatcher boundary so the
  // accepted clone, counters and RNG are never committed on that error.
  if(next.phase==='playing')try{drawToLimit(next,events,action.type);}catch(error){return reject('UNSUPPORTED_BOSS_STATE',error.message);}
  if(state.hangedShortfallCardIds)next.hangedShortfallEpoch={...(state.hangedShortfallEpoch??{cardIds:[...state.hangedShortfallCardIds],revision:state.revision,ante:state.round.ante,blindId:state.round.blindId,handsRemaining:state.round.handsRemaining}),consumed:true,consumedBy:action.type};delete next.hangedShortfallCardIds;
  if(next.apkShop)next.apkShop.context=currentApkShopContext(next);
  next.revision++;
  return {state:next,events,error:null};
}




