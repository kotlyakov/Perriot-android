import {PROFILE_LIMIT,validateAccount} from './profile-envelope.js';
import {isPerished} from '../core/joker-stickers.js';
import {hasJokerStickers} from '../core/round-end-jokers.js';
import {stakeScaling,runDiscards,validStake} from '../core/stakes.js';
import {DECKS,deckHands,deckDiscards,deckHandSize,deckBlindScale} from '../content/decks.js';
import {voucherModifiers} from '../core/vouchers.js';
import {validateTagState} from '../core/tag-effects.js';
import {realHandSize} from '../core/hand-size.js';
import {validItem7Ability,item7CapacityDeltas} from '../core/joker-item7-lifecycle.js';
import {replayEffectActions} from '../core/run.js';
import {hasEffectMechanisms,validPlayingCardModifiers} from '../core/playing-card-modifiers.js';
import {nativeBlindTarget} from '../core/blind-progression.js';
import {getCashout} from '../core/cashout.js';
import {supportsConsumable} from '../core/inventory.js';
import {validConsumableUsage} from '../core/consumables.js';
import {canEnterBoss,bossTarget,chooseHeartJoker,chooseBellCard,isBossCardDebuffed,needleRestorationAfterEarning} from '../core/boss-effects.js';
import {APK_BOSSES,APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {createApkTagContext,getApkTagPool} from '../core/apk-tags.js';
import { apkPseudoHash, nextApkSeed, nextApkRandom, validateApkRng } from '../core/apk-rng.js';
import { HANDS } from '../content/hands.js';
import { SUPPORTED_JOKERS,SCORED_RETRIGGER_JOKERS,originalJokerKey,supportsJoker } from '../content/jokers.js';
import { evaluateHand } from '../core/hands.js';
import { randomInt } from '../core/rng.js';
import { scoreHand } from '../core/score.js';
import {addExact,compareExact,equalExact,exact,floorExact,multiplyExact} from '../core/numbers.js';
import catalogue from '../content/apk-shop-catalog.js';
import {createApkShopContext} from '../core/apk-shop.js';
import {APK_BASE_CARD_IDS,canonicalCards,identityCard,playingCardOrdinal,validatePlayingCardIdentities} from '../core/apk-deck.js';
const centres=new Map(catalogue.centres.map(c=>[c.key,c]));
const handNames=new Set(catalogue.centres.filter(c=>c.set==='Planet').map(c=>c.handType));

const freeTagPack=state=>state.phase==='pack'&&state.packState?.returnPhase==='blind_selection';
const expectedHandSize=state=>deckHandSize(state.deckId)+(state.spectralHandSizeDelta??0)+item7CapacityDeltas(state.jokers).handSize+voucherModifiers(state).handSize+(state.activeTagHandSize??0);

const LIMIT=2*1024*1024;
const PHASES=['blind_selection','playing','round_won','game_over','shop','pack'];
function requireValue(condition) { if (!condition) throw new TypeError('Invalid save data'); }
function object(value,keys) {
  requireValue(value!==null && typeof value==='object' && !Array.isArray(value));
  requireValue(Object.keys(value).length===keys.length && keys.every(key=>Object.hasOwn(value,key)));
}
function optionalObject(value,required,optional=[]) {
  requireValue(value!==null && typeof value==='object' && !Array.isArray(value));
  requireValue(required.every(key=>Object.hasOwn(value,key)) && Object.keys(value).every(key=>required.includes(key) || optional.includes(key)));
}
function decodeOffer(value,ids,owned=false,consumable=false) {
  optionalObject(value,owned?['id','entityId']:['id','entityId','cost','sellCost'],['cost','sellCost','edition','eternal','rental','perishable','perishRounds','debuffed','originalKey','set','frontKey','toDoPokerHand','creationOrdinal','repeatHandsRemaining','mult','chips','xMult','yorickDiscards','cainoXMult','turtleHandSize','invisibleRounds','rocketDollars','loyaltyRemaining','extraValue','enhancement','seal','couponed']);
  id(value.id);id(value.entityId);requireValue(!ids.has(value.id));ids.add(value.id);
  // Mutable currency counters are serialized decimals; ownership checks need
  // their decoded native type, just like the ability validator below.
  for(const key of ['rocketDollars','extraValue'])if(Object.hasOwn(value,key))value[key]=decimal(value[key]);
  if(owned)requireValue(consumable?supportsConsumable(value):supportsJoker(value,{owned:true}));
  requireValue(validItem7Ability(value));
  for(const key of ['cost','sellCost'])if(Object.hasOwn(value,key))value[key]=decimal(value[key]);
  if(Object.hasOwn(value,'couponed'))requireValue(value.couponed===true);
  if(Object.hasOwn(value,'edition'))requireValue(['base','foil','holographic','polychrome','negative'].includes(value.edition));
  for(const key of ['eternal','rental','perishable','debuffed'])if(Object.hasOwn(value,key))requireValue(typeof value[key]==='boolean');
  if(Object.hasOwn(value,'originalKey') || Object.hasOwn(value,'set')){
    const centre=centres.get(value.originalKey);
    requireValue(value.originalKey===value.entityId && (centre&&value.set===centre.set||value.entityId==='c_base'&&value.set==='Base'));
  }
  if(Object.hasOwn(value,'frontKey'))requireValue(['Base','Enhanced'].includes(value.set) && typeof value.frontKey==='string' && /^[CDHS]_(?:[2-9]|A|J|K|Q|T)$/.test(value.frontKey));
  if(Object.hasOwn(value,'enhancement')||Object.hasOwn(value,'seal'))requireValue(!owned&&['Base','Enhanced'].includes(value.set)&&validPlayingCardModifiers(value));
  if(['Base','Enhanced'].includes(value.set)){requireValue(!owned&&Object.hasOwn(value,'frontKey')&&validPlayingCardModifiers(value));requireValue(value.set==='Base'?value.entityId==='c_base'&&value.enhancement===undefined:(value.enhancement===undefined||typeof value.enhancement==='string'&&value.entityId==='m_'+value.enhancement)&&centres.get(value.entityId)?.set==='Enhanced');}
  if(Object.hasOwn(value,'toDoPokerHand'))requireValue(value.originalKey==='j_todo_list' && handNames.has(value.toDoPokerHand));
  if(Object.hasOwn(value,'creationOrdinal'))integer(value.creationOrdinal,1,Number.MAX_SAFE_INTEGER);
}
function decodeApkShop(value,state) {
  object(value,['version','voucherId','firstShopBuffoon','context']);
  requireValue(value.version===1 && typeof value.firstShopBuffoon==='boolean' && state.rng.apk);
  requireValue(value.voucherId===null || centres.get(value.voucherId)?.set==='Voucher');
  optionalObject(value.context,Object.keys(createApkShopContext()),['tutorialShopSurcharge','activeCentreIds']);
  if(Object.hasOwn(value.context,'activeCentreIds'))requireValue(Array.isArray(value.context.activeCentreIds)&&value.context.activeCentreIds.every(key=>['Joker','Tarot','Planet','Spectral'].includes(centres.get(key)?.set)));
  requireValue(new Set(value.context.usedVoucherIds).size===value.context.usedVoucherIds.length);
  createApkShopContext(value.context); // Validate actual saved inputs without selecting or polling.
  const enhancements=[...new Set(Object.values(state.cards).map(card=>({mult:'m_mult',bonus:'m_bonus',lucky:'m_lucky',wild:'m_wild',steel:'m_steel',glass:'m_glass',stone:'m_stone',gold:'m_gold'})[card.enhancement]).filter(Boolean))];
  requireValue(new Set(value.context.enhancementIds).size===value.context.enhancementIds.length&&value.context.enhancementIds.length===enhancements.length&&value.context.enhancementIds.every(id=>enhancements.includes(id)));
  requireValue(value.context.ante===state.round.ante+(['shop','pack'].includes(state.phase)&&!freeTagPack(state)&&state.round.blindId==='boss'?1:0));
  if(['shop','pack'].includes(state.phase)&&!freeTagPack(state)){
    requireValue(state.shop!==null && state.shop!==undefined);
    const sets={main:['Joker','Tarot','Planet','Spectral','Base','Enhanced'],vouchers:['Voucher'],boosters:['Booster']};
    for(const [area,allowed] of Object.entries(sets))for(const offer of state.shop[area]){
      requireValue(offer.originalKey===offer.entityId && centres.get(offer.originalKey)?.set===offer.set && allowed.includes(offer.set));
    }
  }else requireValue(state.shop===null || state.shop===undefined);
}
function decodeApkBlinds(value,state,pending=false){
  optionalObject(value,['version','ante','bossId','bossesUsed','tags','orbitalHands','tagContext'],['playedCardIds','bossSelectionAnte']);
  if(Object.hasOwn(value,'playedCardIds'))cardList(value.playedCardIds,state);
  requireValue(value.version===1 && Number.isSafeInteger(value.ante)&&value.ante>=state.round.ante&&value.ante<=state.round.ante+voucherModifiers(state).anteReduction && state.apkShop && state.rng.apk);
  const bossAnte=value.bossSelectionAnte??value.ante;
  if(Object.hasOwn(value,'bossSelectionAnte')){integer(value.bossSelectionAnte,-1);requireValue(value.bossSelectionAnte>=state.round.ante&&value.bossSelectionAnte<=value.ante);}
  const boss=APK_BLINDS_BY_ID[value.bossId];
  requireValue(boss && APK_BOSSES.includes(boss) && boss.showdown===(bossAnte>=2&&bossAnte%8===0)&&(boss.showdown||boss.minAnte<=Math.max(1,bossAnte)));
  object(value.bossesUsed,APK_BOSSES.map(b=>b.id));for(const count of Object.values(value.bossesUsed))integer(count);
  requireValue(value.bossesUsed[value.bossId]>=1);
  object(value.tagContext,Object.keys(createApkTagContext()));const context=createApkTagContext(value.tagContext);
  requireValue(context.ante===value.ante);
  object(value.tags,['small','big']);const pool=getApkTagPool(context);
  for(const tag of Object.values(value.tags))requireValue(pool.includes(tag) && tag!=='UNAVAILABLE');
  object(value.orbitalHands,pending?[]:['small','big','boss']);
  for(const hand of Object.values(value.orbitalHands))requireValue(context.visibleHandOrder.includes(hand));
}
function cardList(ids,state){
 requireValue(Array.isArray(ids)&&ids.length<=Object.keys(state.cards).length&&new Set(ids).size===ids.length&&ids.every(id=>Object.hasOwn(state.cards,id)));
}
function decodeBoss(value,state){
 const extras={bl_house:['hiddenCardIds'],bl_wheel:['hiddenCardIds'],bl_fish:['hiddenCardIds'],bl_mark:['hiddenCardIds'],bl_eye:['playedHands'],bl_mouth:['firstHand'],bl_ox:['oxHand'],bl_final_heart:['heartDebuffedJokerId'],bl_final_bell:['forcedCardId','bellChoice'],bl_final_acorn:['hiddenJokerIds']};
 optionalObject(value,['version','id','playedBeforeBoss','baseHandSize',...(extras[value.id]??[])],['disabled','disabledRevision',...(value.id==='bl_mark'?['hiddenFaceRanks','pareidoliaHiddenCardIds']:[]),...(value.id==='bl_water'?['discardsSub']:[]),...(value.id==='bl_needle'?['handsSub','startedRevision','needleDisableOrigin']:[]),...(value.id==='bl_serpent'?['serpentInitialCardCount','serpentInitialHandSize','serpentDisableOrigin','serpentTerminalUnfilledCardIds']:[])]);
 requireValue(value.version===1&&value.id===state.apkBlinds?.bossId&&canEnterBoss(state));
 requireValue(state.round.blindId==='boss'&&['playing','round_won','game_over'].includes(state.phase)&&state.roundNumber===state.round.ante*3&&value.baseHandSize===expectedHandSize(state));
 cardList(value.playedBeforeBoss,state);requireValue(value.playedBeforeBoss.every(id=>state.apkBlinds.playedCardIds.includes(id)));
 if(Object.hasOwn(value,'disabled'))requireValue(typeof value.disabled==='boolean');
 if(Object.hasOwn(value,'disabledRevision')){integer(value.disabledRevision,1,state.revision);requireValue(value.disabled===true);}
 if(value.id==='bl_needle'){
  if(Object.hasOwn(value,'startedRevision'))integer(value.startedRevision,1,state.revision);
  if(value.disabled){requireValue(Object.hasOwn(value,'disabledRevision'));needleRestorationAfterEarning(state);}
  else requireValue(value.needleDisableOrigin===undefined);
 }
 integer(value.baseHandSize,-Number.MAX_SAFE_INTEGER,10000);requireValue(realHandSize(state)===value.baseHandSize-(value.id==='bl_manacle'&&!value.disabled?1:0));
 if(Object.hasOwn(value,'discardsSub'))integer(value.discardsSub,0,10000);
 if(Object.hasOwn(value,'handsSub'))integer(value.handsSub,0,10000);
 if(Object.hasOwn(value,'hiddenCardIds')){
  cardList(value.hiddenCardIds,state);if(value.disabled)requireValue(value.hiddenCardIds.length===0);requireValue(value.hiddenCardIds.every(id=>state.hand.includes(id)));
  if(value.id==='bl_mark'){
   if(value.pareidoliaHiddenCardIds){cardList(value.pareidoliaHiddenCardIds,state);requireValue(value.pareidoliaHiddenCardIds.every(id=>value.hiddenCardIds.includes(id)));}
   if(Object.hasOwn(value,'hiddenFaceRanks')){object(value.hiddenFaceRanks,value.hiddenCardIds);requireValue(Object.entries(value.hiddenFaceRanks).every(([id,rank])=>Number.isInteger(rank)&&(value.pareidoliaHiddenCardIds?.includes(id)?rank>=2&&rank<=14:rank>=11&&rank<=13)));}
   else requireValue(value.hiddenCardIds.every(id=>state.cards[id].rank>=11&&state.cards[id].rank<=13||/^card_(?:clubs|diamonds|hearts|spades)_(?:11|12|13)$/.test(id)));
  }
 }
 if(value.id==='bl_eye')requireValue(Array.isArray(value.playedHands)&&new Set(value.playedHands).size===value.playedHands.length&&value.playedHands.every(id=>Object.hasOwn(HANDS,id)));
 if(value.id==='bl_mouth')requireValue(value.firstHand===null||Object.hasOwn(HANDS,value.firstHand));
 if(value.id==='bl_ox')requireValue(Object.hasOwn(HANDS,value.oxHand)&&value.oxHand===state.mostPlayedHand);
 if(value.id==='bl_final_bell')requireValue(value.forcedCardId===null||typeof value.forcedCardId==='string'&&state.hand.includes(value.forcedCardId));
 if(value.id==='bl_final_bell'){
  if(value.disabled||state.phase!=='playing')requireValue(value.forcedCardId===null&&value.bellChoice===null);
  else{
   const choice=value.bellChoice;object(choice,['cardIds','streamBefore','revision']);integer(choice.revision,1,state.revision);
   const pool=choice.cardIds;requireValue(Array.isArray(pool)&&pool.length>=1&&pool.length<=10000&&new Set(pool).size===pool.length&&pool.every(id=>Object.hasOwn(state.cards,id)||(state.destroyedCardIds??[]).includes(id)));
   const pending=[...(state.hangedShortfallCardIds??[]),...(state.spectralShortfallCardIds??[])],removed=pool.filter(id=>!Object.hasOwn(state.cards,id));
   requireValue(removed.length===pending.length&&removed.every(id=>pending.includes(id))&&pool.filter(id=>Object.hasOwn(state.cards,id)).length===state.hand.length&&state.hand.every(id=>pool.includes(id)));
   if(removed.length)for(const prefix of ['hanged','spectral'])if(state[prefix+'ShortfallCardIds']?.length){const epoch=state[prefix+'ShortfallEpoch'];requireValue(epoch&&!epoch.consumed&&epoch.revision>choice.revision);}
   const stream=choice.streamBefore;requireValue(stream===null||Number.isFinite(stream)&&stream>=0&&stream<=1);
   const rng={...state.rng.apk,streams:{...state.rng.apk.streams}};if(stream===null)delete rng.streams.cerulean_bell;else rng.streams.cerulean_bell=stream;
   // Stable physical IDs preserve native creation order despite Tarot transforms.
   const cards=pool.map(identityCard);
   const expected=chooseBellCard(rng,cards);requireValue(expected.rng.streams.cerulean_bell===state.rng.apk.streams.cerulean_bell&&value.forcedCardId===(removed.includes(expected.cardId)?null:expected.cardId));
  }
 }
 if(value.id==='bl_final_acorn'){
  requireValue(Array.isArray(value.hiddenJokerIds)&&new Set(value.hiddenJokerIds).size===value.hiddenJokerIds.length&&value.hiddenJokerIds.every(id=>typeof id==='string'&&state.jokers.some(j=>j.id===id)));
  if(value.disabled||state.phase==='round_won')requireValue(value.hiddenJokerIds.length===0);
 }
 if(value.id==='bl_final_heart'){
  const chosen=value.heartDebuffedJokerId;
  requireValue(chosen===null||typeof chosen==='string'&&state.jokers.some(j=>j.id===chosen));
  requireValue(state.jokers.every(j=>(j.debuffed===true)===(j.id===chosen||isPerished(j)))&&(!value.disabled||chosen===null));
 }
 if(value.id==='bl_serpent'){
  if(Object.hasOwn(value,'serpentInitialHandSize'))integer(value.serpentInitialHandSize,0,10000);
  if(Object.hasOwn(value,'serpentInitialCardCount')&&value.serpentInitialCardCount!==null)integer(value.serpentInitialCardCount,0,Object.keys(state.cards).length+(state.destroyedCardIds?.length??0));
  if(value.disabled){
   requireValue(Object.hasOwn(value,'disabledRevision')&&Object.hasOwn(value,'serpentInitialCardCount'));
   const origin=value.serpentDisableOrigin;optionalObject(origin,['phase','hand','drawPile','discardPile','destroyedCardIds','handsRemaining','discardsRemaining'],['earnedRevision','refillsBefore']);
   requireValue(['playing','round_won'].includes(origin.phase));
   if(origin.phase==='round_won'){
    integer(origin.earnedRevision,1,value.disabledRevision-1);
    requireValue(state.phase==='round_won'&&origin.earnedRevision===state.cashoutQuote?.earnedRevision&&origin.handsRemaining===state.round.handsRemaining&&origin.discardsRemaining===state.round.discardsRemaining);
   }else requireValue(origin.earnedRevision===undefined);
   integer(origin.handsRemaining,state.round.handsRemaining,Object.hasOwn(origin,'refillsBefore')?10000:deckHands(state.deckId));integer(origin.discardsRemaining,state.round.discardsRemaining,Object.hasOwn(origin,'refillsBefore')?10000:runDiscards(state));
   if(Object.hasOwn(origin,'refillsBefore'))integer(origin.refillsBefore,0,10000);
   const actions=origin.refillsBefore??(deckHands(state.deckId)-origin.handsRemaining+runDiscards(state)-origin.discardsRemaining-(origin.phase==='round_won'?1:0));
   requireValue(actions>=0);
   const count=value.serpentInitialCardCount;
   if(count===null)requireValue(origin.drawPile?.length===0);
   else requireValue(origin.drawPile?.length===Math.max(0,count-(value.serpentInitialHandSize??value.baseHandSize)-3*actions));
   validateDisabledSerpentPiles(state,{...state,handsRemaining:state.round.handsRemaining,discardsRemaining:state.round.discardsRemaining,pendingHangedIds:[...(state.hangedShortfallCardIds??[]),...(state.spectralShortfallCardIds??[])],terminalUnfilledIds:value.serpentTerminalUnfilledCardIds??[],terminal:Object.hasOwn(value,'serpentTerminalUnfilledCardIds')});
   if(Object.hasOwn(value,'serpentTerminalUnfilledCardIds')){
    requireValue(['round_won','game_over'].includes(state.phase)&&value.serpentTerminalUnfilledCardIds.length>=1&&origin.handsRemaining>state.round.handsRemaining);
    if(state.lastScore){
     const pending=['hanged','spectral'].flatMap(prefix=>{const epoch=state[prefix+'ShortfallEpoch'];return epoch?.consumedBy==='PLAY_HAND'&&epoch.handsRemaining===state.round.handsRemaining+1?epoch.cardIds:[];});
     requireValue(JSON.stringify(value.serpentTerminalUnfilledCardIds)===JSON.stringify([...(state.lastScore.playedCardIds??[]),...pending]));
    }
   }else if(['round_won','game_over'].includes(state.phase))requireValue(origin.handsRemaining===state.round.handsRemaining);
  }else requireValue(value.serpentInitialCardCount!==null&&value.serpentDisableOrigin===undefined&&value.serpentTerminalUnfilledCardIds===undefined);
 }
 if(value.id==='bl_water'&&!value.disabled)requireValue(state.round.discardsRemaining===0);
 if(value.id==='bl_needle'&&!value.disabled)requireValue(state.round.handsRemaining<=1+(state.round.burglarHandsGranted??0));
}
// A single disable origin binds later ordinary refills; no action log is kept.
function validateDisabledSerpentPiles(state,target){
 const boss=state.bossState,origin=boss.serpentDisableOrigin,destroyed=target.destroyedCardIds??[];
 const known=new Set([...Object.keys(state.cards),...(state.destroyedCardIds??[])]);
 const list=ids=>requireValue(Array.isArray(ids)&&ids.length<=known.size&&new Set(ids).size===ids.length&&ids.every(id=>known.has(id)));
 for(const ids of [origin.hand,origin.drawPile,origin.discardPile,origin.destroyedCardIds,target.hand,target.drawPile,target.discardPile,destroyed,target.pendingHangedIds,target.terminalUnfilledIds])list(ids);
 const source=[...origin.hand,...origin.drawPile,...origin.discardPile],initialDestroyed=new Set(origin.destroyedCardIds);
 requireValue(new Set([...source,...origin.destroyedCardIds]).size===source.length+origin.destroyedCardIds.length);
 requireValue(origin.destroyedCardIds.every((id,i)=>destroyed[i]===id));
 if(boss.serpentInitialCardCount!==null)requireValue(source.length<=boss.serpentInitialCardCount&&boss.serpentInitialCardCount<=source.length+origin.destroyedCardIds.length);
 const removed=destroyed.filter(id=>!initialDestroyed.has(id)),partition=[...target.hand,...target.drawPile,...target.discardPile,...removed];
 requireValue(partition.length===source.length&&new Set(partition).size===partition.length&&partition.every(id=>source.includes(id)));
 requireValue(target.drawPile.length<=origin.drawPile.length&&target.drawPile.every((id,i)=>origin.drawPile[i]===id));
 requireValue(target.discardPile.length>=origin.discardPile.length&&origin.discardPile.every((id,i)=>target.discardPile[i]===id));
 const actions=origin.handsRemaining-target.handsRemaining+origin.discardsRemaining-target.discardsRemaining;
 requireValue(Number.isSafeInteger(actions)&&actions>=0&&target.handsRemaining<=origin.handsRemaining&&target.discardsRemaining<=origin.discardsRemaining);
 const laterDiscard=target.discardPile.slice(origin.discardPile.length);
 const actionRemovals=laterDiscard.length+removed.filter(id=>!state.hangedDestroyedCardIds?.includes(id)&&!state.spectralDestroyedCardIds?.includes(id)).length;
 requireValue(actionRemovals>=actions&&actionRemovals<=5*actions);
 requireValue(target.pendingHangedIds.every(id=>destroyed.includes(id))&&target.terminalUnfilledIds.every(id=>initialDestroyed.has(id)||laterDiscard.includes(id)||removed.includes(id)));
 const unfilled=new Set([...target.pendingHangedIds,...target.terminalUnfilledIds].filter(id=>!initialDestroyed.has(id)));
 const removals=laterDiscard.length+removed.length-unfilled.size;
 requireValue(removals>=0);
 const refillActions=actions-(target.terminal?1:0);requireValue(refillActions>=0);
 const expectedDraws=refillActions===0?0:Math.min(origin.drawPile.length,Math.max(0,state.round.handSize-origin.hand.length+removals));
 requireValue(origin.drawPile.length-target.drawPile.length===expectedDraws);
}
function decodeShop(shop,ids) {
  if(shop===null)return;
  optionalObject(shop,['main','vouchers','boosters','rerollBase','rerollIncrease','freeRerolls'],['rerollCostOverride']);
  for(const area of ['main','vouchers','boosters']) {
    requireValue(Array.isArray(shop[area]) && shop[area].length<=10000);
    for(const offer of shop[area])decodeOffer(offer,ids);
  }
  shop.rerollBase=decimal(shop.rerollBase);shop.rerollIncrease=decimal(shop.rerollIncrease);integer(shop.freeRerolls,0,10000);
  if(Object.hasOwn(shop,'rerollCostOverride'))shop.rerollCostOverride=decimal(shop.rerollCostOverride);
}
function decodePackState(value,state,ids){
 optionalObject(value,['version','sourceEntityId','cards','choicesRemaining'],['handDraw','returnPhase']);
 if(Object.hasOwn(value,'returnPhase'))requireValue(value.returnPhase==='blind_selection'&&state.shop==null&&state.round.score==='0'&&['p_arcana_mega_1','p_arcana_mega_2','p_celestial_mega_1','p_celestial_mega_2','p_standard_mega_1','p_buffoon_mega_1','p_spectral_normal_1'].includes(value.sourceEntityId));
 const source=centres.get(value.sourceEntityId),kind=source?.kind,handPack=['Arcana','Spectral'].includes(kind);
 requireValue(value.version===1&&source?.set==='Booster'&&['Celestial','Arcana','Standard','Buffoon','Spectral'].includes(kind));
 if(handPack){
  const draw=value.handDraw;optionalObject(draw,['cardIds','handSize'],['createdCardIds','extraDrawIds']);integer(draw.handSize,0,10000);
  const destroyed=[...(state.hangedDestroyedCardIds??[]),...(state.spectralDestroyedCardIds??[])];
  for(const key of ['cardIds','createdCardIds','extraDrawIds'])if(Object.hasOwn(draw,key))requireValue(Array.isArray(draw[key])&&new Set(draw[key]).size===draw[key].length&&draw[key].every(id=>state.hand.includes(id)||destroyed.includes(id)));
  const dealt=[...draw.cardIds,...(draw.createdCardIds??[]),...(draw.extraDrawIds??[])];
  requireValue(new Set(dealt).size===dealt.length&&state.hand.every(id=>dealt.includes(id))&&draw.cardIds.length<=draw.handSize);
  if(draw.createdCardIds)requireValue(draw.createdCardIds.length>0&&draw.createdCardIds.every(id=>playingCardOrdinal(id)>52));
  if(draw.extraDrawIds)requireValue(draw.extraDrawIds.length>0);
  requireValue(draw.cardIds.length===Math.min(draw.handSize,state.drawPile.length+draw.cardIds.length+(draw.extraDrawIds?.length??0)));
 }else requireValue(!Object.hasOwn(value,'handDraw'));
 requireValue(Array.isArray(value.cards)&&value.cards.length>=1&&value.cards.length<=5);
 for(const card of value.cards){
  decodeOffer(card,ids);requireValue(card.originalKey===card.entityId);if(kind==='Standard'&&card.set==='Enhanced')requireValue(card.entityId==='m_'+card.enhancement);
  requireValue(kind==='Arcana'?card.set==='Tarot'||card.entityId==='c_soul'||card.set==='Spectral'&&state.apkShop?.context.usedVoucherIds.includes('v_omen_globe'):kind==='Celestial'?card.set==='Planet'||card.entityId==='c_black_hole':kind==='Spectral'?card.set==='Spectral'||card.entityId==='c_soul'||card.entityId==='c_black_hole':kind==='Buffoon'?card.set==='Joker'&&supportsJoker(card):['Base','Enhanced'].includes(card.set));
 }
 integer(value.choicesRemaining,1,2);
 const mega=value.sourceEntityId.includes('_mega_'),large=mega||value.sourceEntityId.includes('_jumbo_'),size=['Buffoon','Spectral'].includes(kind)?(large?4:2):(large?5:3);
 requireValue(value.choicesRemaining<=(mega?2:1)&&value.cards.length===size-((mega?2:1)-value.choicesRemaining));
 requireValue(state.phase==='pack'&&(state.shop||freeTagPack(state))&&state.apkShop&&state.rng.apk);
}
function decodeApkRng(rng,seed) {
  object(rng,['algorithm','seed','hashedSeed','streams','mathState']);
  validateApkRng(rng);
  requireValue(rng.algorithm==='apk-luajit223-v1' && rng.seed===seed && rng.hashedSeed===apkPseudoHash(seed));
  requireValue(Array.isArray(rng.mathState) && rng.mathState.length===4 && rng.mathState.every(word=>typeof word==='string' && /^[0-9a-f]{16}$/.test(word)));
  requireValue(rng.streams!==null && typeof rng.streams==='object' && !Array.isArray(rng.streams));
  requireValue(Object.keys(rng.streams).length<=10000);
  for(const [key,value] of Object.entries(rng.streams)) {
    requireValue(key.length<=1000);
    requireValue(typeof value==='number' && Number.isFinite(value) && value>=0 && value<=1 && Number(value.toFixed(13))===value);
  }
}
function encodeOffer(offer) {
  const encoded={...offer};
  for(const key of ['cost','sellCost','rocketDollars','extraValue'])if(Object.hasOwn(offer,key)) {requireValue(typeof offer[key]==='bigint');encoded[key]=offer[key].toString();}
  return encoded;
}
function integer(value,min=0,max=Number.MAX_SAFE_INTEGER) { requireValue(Number.isSafeInteger(value) && value>=min && value<=max); }
function id(value) { requireValue(typeof value==='string' && value.length>0 && value.length<=120 && !['__proto__','prototype','constructor'].includes(value)); }
function decimal(value,negative=false) {
  requireValue(typeof value==='string' && value.length<=4096 && /^(0|-?[1-9][0-9]*)$/.test(value));
  const n=BigInt(value);requireValue(negative || n>=0n);return n;
}
function encodeExact(value){return typeof value==='bigint'?value.toString():{n:value.n.toString(),d:value.d.toString()};}
function decodeExact(value){
 if(typeof value==='string')return decimal(value);
 object(value,['n','d']);const raw={n:decimal(value.n,true),d:decimal(value.d)};requireValue(raw.d>0n);const normalized=exact(raw);requireValue(normalized.n===raw.n&&normalized.d===raw.d&&normalized.d!==1n);return normalized;
}
function exactPair(value){object(value,['chips','mult']);return {chips:decimal(value.chips),mult:decodeExact(value.mult)};}
function encodeScore(score) {
  if(score===null)return null;
  return {...score,...(score.item7State?{item7State:JSON.parse(JSON.stringify(score.item7State,(_,v)=>typeof v==='bigint'?v.toString():v))}:{}),...(score.lifecycleEvents?{lifecycleEvents:JSON.parse(JSON.stringify(score.lifecycleEvents,(_,v)=>typeof v==='bigint'?v.toString():v))}:{}),...(score.createdConsumables?{createdConsumables:score.createdConsumables.map(encodeOffer)}:{}),...(Object.hasOwn(score,'scoringMoneyBefore')?{scoringMoneyBefore:score.scoringMoneyBefore.toString()}:{}),chips:score.chips.toString(),mult:encodeExact(score.mult),score:score.score.toString(),trace:score.trace.map(event=>event.type==='score_repeat'?{...event}:event.type==='score_money'?{...event,amount:event.amount.toString()}:event.type==='score_total'
    ? {...event,chips:event.chips.toString(),mult:encodeExact(event.mult),score:event.score.toString()}
    : {...event,before:{chips:event.before.chips.toString(),mult:encodeExact(event.before.mult)},after:{chips:event.after.chips.toString(),mult:encodeExact(event.after.mult)}})};
}
function decodeScore(value,state) {
  if(value===null)return null;
  optionalObject(value,['handId','isRoyal','scoringCardIds','chips','mult','score','trace'],['actionRng','playedCardIds','heldCardIds','scoringMoneyBefore','scoringRoundBefore','scoringPilesBefore','handDebuffed','bossHistory','luckyRolls','luckyRngKind','luckyRngBefore','luckyRngAfter','glassRolls','glassRngKind','glassRngBefore','glassRngAfter','glassDestroyedCards']);
  if(Object.hasOwn(value,'handDebuffed'))requireValue(value.handDebuffed===true);
  const hasAction=Object.hasOwn(value,'actionRng');
  if(hasAction){
    optionalObject(value.actionRng,['version','contract','before','after','draws'],['hookHeldCardIdsBefore','hookDiscardCardIds']);
    requireValue(state.rng.apk&&value.actionRng.version===1&&value.actionRng.contract==='play-score-v1'&&Array.isArray(value.actionRng.draws)&&value.actionRng.draws.length<=2000);
    validateApkRng(value.actionRng.before);validateApkRng(value.actionRng.after);
    for(const snapshot of [value.actionRng.before,value.actionRng.after])requireValue(snapshot.seed===state.rng.apk.seed&&snapshot.hashedSeed===state.rng.apk.hashedSeed);
  }
  const glassDestroyedCards=value.glassDestroyedCards??[];requireValue(Array.isArray(glassDestroyedCards)&&glassDestroyedCards.length<=5);
  const destroyedById=new Map();for(const card of glassDestroyedCards){optionalObject(card,['id','rank','suit','enhancement'],['creationOrdinal']);canonicalCards([card]);if(playingCardOrdinal(card.id)>52)requireValue((state.destroyedCardIds??[]).includes(card.id));id(card.id);requireValue(card.enhancement==='glass'&&!Object.hasOwn(state.cards,card.id)&&!destroyedById.has(card.id));evaluateHand([card]);destroyedById.set(card.id,card);}
  const scoreCards={...state.cards,...Object.fromEntries(destroyedById)};
  if(value.playedCardIds)requireValue(Array.isArray(value.playedCardIds)&&value.playedCardIds.length>=1&&value.playedCardIds.length<=5&&new Set(value.playedCardIds).size===value.playedCardIds.length&&value.playedCardIds.every(id=>Object.hasOwn(scoreCards,id)));
  if(value.heldCardIds){cardList(value.heldCardIds,state);requireValue(value.heldCardIds.every(id=>!value.playedCardIds?.includes(id)&&!state.drawPile.includes(id))&&(state.bossState?.id==='bl_serpent'||value.heldCardIds.length<=state.round.handSize-(value.playedCardIds?.length??value.scoringCardIds.length)));}
  requireValue(Object.hasOwn(HANDS,value.handId) && typeof value.isRoyal==='boolean');
  requireValue(!value.isRoyal || value.handId==='straight_flush');
  requireValue(Array.isArray(value.scoringCardIds) && value.scoringCardIds.length>=0 && value.scoringCardIds.length<=5);
  requireValue(new Set(value.scoringCardIds).size===value.scoringCardIds.length && value.scoringCardIds.every(key=>Object.hasOwn(scoreCards,key)));
  const chips=decimal(value.chips),mult=decodeExact(value.mult),score=decimal(value.score);
  requireValue(score===floorExact(multiplyExact(chips,mult)) && Array.isArray(value.trace) && value.trace.length>=2 && value.trace.length<=10000);
  let previous={chips:0n,mult:0n};
  const trace=value.trace.map((event,i)=>{
    if(i===value.trace.length-1) {
      object(event,['type','phase','chips','mult','score']);
      requireValue(event.type==='score_total' && event.phase==='total');
      const total={...event,chips:decimal(event.chips),mult:decodeExact(event.mult),score:decimal(event.score)};
      requireValue(total.chips===chips && equalExact(total.mult,mult) && total.score===score && previous.chips===chips && equalExact(previous.mult,mult));
      return total;
    }
    if(event.type==='score_repeat'){
      object(event,['type','phase','sourceId','effectSourceId']);
      requireValue(i>0&&event.phase==='scored_card'&&value.scoringCardIds.includes(event.sourceId)&&state.jokers.some(j=>j.id===event.effectSourceId));
      return {...event};
    }
    if(event.type==='score_money'){
      object(event,['type','phase','sourceId','amount']);requireValue(event.phase==='scored_card'&&value.scoringCardIds.includes(event.sourceId));const amount=decimal(event.amount);requireValue(amount===20n);return {...event,amount};
    }
    optionalObject(event,['type','phase','sourceId','operation','before','after'],['effectSourceId']);
    if(event.effectSourceId)requireValue(state.jokers.some(j=>j.id===event.effectSourceId));
    const before=exactPair(event.before),after=exactPair(event.after);
    requireValue(event.type==='score_step' && before.chips===previous.chips && equalExact(before.mult,previous.mult));
    if(i===0) requireValue(event.phase==='base' && event.operation==='base' && event.sourceId===`hand:${value.handId}`);
    else if(event.operation==='balance'){
      requireValue(state.deckId==='plasma'&&event.phase==='deck'&&event.sourceId==='deck:plasma'&&i===value.trace.length-2);
      const balanced=floorExact(multiplyExact(addExact(before.chips,before.mult),{n:1n,d:2n}));
      requireValue(after.chips===balanced&&equalExact(after.mult,balanced));
    }else {
      requireValue(['add_chips','add_mult','multiply_mult'].includes(event.operation));
      requireValue(event.operation==='add_chips' ? after.chips>=before.chips && equalExact(after.mult,before.mult) : compareExact(after.mult,before.mult)>=0 && after.chips===before.chips);
      requireValue(event.phase==='scored_card' ? value.scoringCardIds.includes(event.sourceId) : event.phase==='held_card' ? value.heldCardIds?.includes(event.sourceId) : ['independent','edition'].includes(event.phase) && state.jokers.some(j=>j.id===event.sourceId));
    }
    previous=after;return {...event,before,after};
  });
  const luckyFields=['luckyRolls','luckyRngKind','luckyRngBefore','luckyRngAfter'],hasLucky=luckyFields.some(key=>Object.hasOwn(value,key));
  requireValue(!hasLucky||luckyFields.every(key=>Object.hasOwn(value,key)));
  if(hasLucky){
    requireValue(['apk','effects'].includes(value.luckyRngKind)&&Array.isArray(value.luckyRolls)&&value.luckyRolls.length>=1&&value.luckyRolls.length<=value.trace.length);
    for(const roll of value.luckyRolls){object(roll,['cardId','multRoll','moneyRoll','multTriggered','moneyTriggered']);requireValue(value.scoringCardIds.includes(roll.cardId)&&Number.isFinite(roll.multRoll)&&roll.multRoll>=0&&roll.multRoll<1&&Number.isFinite(roll.moneyRoll)&&roll.moneyRoll>=0&&roll.moneyRoll<1&&typeof roll.multTriggered==='boolean'&&typeof roll.moneyTriggered==='boolean');}
    if(value.luckyRngKind==='apk'){
      requireValue(state.rng.apk);object(value.luckyRngBefore,['lucky_mult','lucky_money']);object(value.luckyRngAfter,['lucky_mult','lucky_money','mathState']);for(const snapshot of [value.luckyRngBefore,value.luckyRngAfter])for(const key of ['lucky_mult','lucky_money'])requireValue(snapshot[key]===null||Number.isFinite(snapshot[key])&&snapshot[key]>=0&&snapshot[key]<=1);validateApkRng({...state.rng.apk,mathState:value.luckyRngAfter.mathState});
      requireValue(['lucky_mult','lucky_money'].every(key=>value.luckyRngAfter[key]===(state.rng.apk.streams[key]??null)));
    }
    else{randomInt(value.luckyRngBefore,1);randomInt(value.luckyRngAfter,1);const shared=value.glassRngKind==='effects'&&state.jokers.some(j=>SCORED_RETRIGGER_JOKERS.includes(originalJokerKey(j.entityId)));requireValue(JSON.stringify(value.luckyRngAfter)===JSON.stringify(shared?value.glassRngBefore:state.rng.effects));}
  }
  const glassFields=['glassRolls','glassRngKind','glassRngBefore','glassRngAfter','glassDestroyedCards'],hasGlass=glassFields.some(key=>Object.hasOwn(value,key));
  const bellGlass=(hasAction||hasGlass&&value.glassRngKind==='apk')&&!state.bossState?.disabled&&state.bossState?.id==='bl_final_bell';
  const heartGlass=(hasAction||hasGlass&&value.glassRngKind==='apk')&&!state.bossState?.disabled&&state.bossState?.id==='bl_final_heart';
  requireValue(!hasGlass||glassFields.every(key=>Object.hasOwn(value,key)));
  if(hasGlass){
    requireValue(['apk','effects'].includes(value.glassRngKind)&&Array.isArray(value.glassRolls)&&value.glassRolls.length>=1&&value.glassRolls.length<=5&&new Set(value.glassRolls.map(roll=>roll.cardId)).size===value.glassRolls.length);
    for(const roll of value.glassRolls){object(roll,['cardId','roll','destroyed']);const source=scoreCards[roll.cardId];requireValue(value.scoringCardIds.includes(roll.cardId)&&source?.enhancement==='glass'&&Number.isFinite(roll.roll)&&roll.roll>=0&&roll.roll<1&&typeof roll.destroyed==='boolean'&&roll.destroyed===(roll.roll<1/4));}
    requireValue(JSON.stringify(glassDestroyedCards.map(card=>card.id))===JSON.stringify(value.glassRolls.filter(roll=>roll.destroyed).map(roll=>roll.cardId)));
    if(value.glassRngKind==='apk'){
      requireValue(state.rng.apk);object(value.glassRngBefore,['glass']);object(value.glassRngAfter,['glass','mathState']);for(const snapshot of [value.glassRngBefore,value.glassRngAfter])requireValue(snapshot.glass===null||Number.isFinite(snapshot.glass)&&snapshot.glass>=0&&snapshot.glass<=1);validateApkRng({...state.rng.apk,mathState:value.glassRngAfter.mathState});
      // Heart's later draw is authenticated below from this score-time state.
      requireValue(value.glassRngAfter.glass===(state.rng.apk.streams.glass??null)&&(hasAction||heartGlass||bellGlass||JSON.stringify(value.glassRngAfter.mathState)===JSON.stringify(state.rng.apk.mathState)));
    }else{randomInt(value.glassRngBefore,1);randomInt(value.glassRngAfter,1);requireValue(JSON.stringify(value.glassRngAfter)===JSON.stringify(state.rng.effects));}
  }else requireValue(glassDestroyedCards.length===0);
  const scoringMoneyBefore=Object.hasOwn(value,'scoringMoneyBefore')?decimal(value.scoringMoneyBefore,true):undefined;
  if(value.scoringRoundBefore){object(value.scoringRoundBefore,['handsRemaining','discardsRemaining']);integer(value.scoringRoundBefore.handsRemaining,1,10000);integer(value.scoringRoundBefore.discardsRemaining,0,10000);requireValue(value.scoringRoundBefore.handsRemaining===state.round.handsRemaining+1&&value.scoringRoundBefore.discardsRemaining>=state.round.discardsRemaining);}
  if(scoringMoneyBefore!==undefined){
    let committedMoney=scoringMoneyBefore;
    if(!state.bossState?.disabled&&state.bossState?.id==='bl_tooth')committedMoney-=BigInt(value.playedCardIds?.length??value.scoringCardIds.length);
    if(!state.bossState?.disabled&&state.bossState?.id==='bl_ox'&&state.bossState.oxHand===value.handId)committedMoney=0n;
    committedMoney+=trace.reduce((sum,event)=>sum+(event.type==='score_money'?event.amount:0n),0n);
    if(state.phase==='round_won')for(const key of state.hand)if(state.cards[key].enhancement==='gold'&&!isBossCardDebuffed(state,state.cards[key]))committedMoney+=3n;
    requireValue(committedMoney===state.money);
  }
  if(value.scoringPilesBefore){
    optionalObject(value.scoringPilesBefore,['drawPile','discardPile'],['hangedShortfallCardIds','hangedShortfallRevision']);
    const before=value.scoringPilesBefore;cardList(before.drawPile,state);cardList(before.discardPile,state);
    requireValue(Array.isArray(value.heldCardIds)&&value.playedCardIds&&value.scoringRoundBefore);
    const shortfall=before.hangedShortfallCardIds??[];
    if(state.bossState?.id==='bl_serpent'&&state.bossState.disabled)validateDisabledSerpentPiles(state,{hand:[...value.heldCardIds,...value.playedCardIds],drawPile:before.drawPile,discardPile:before.discardPile,destroyedCardIds:(state.destroyedCardIds??[]).filter(id=>!destroyedById.has(id)),handsRemaining:value.scoringRoundBefore.handsRemaining,discardsRemaining:value.scoringRoundBefore.discardsRemaining,pendingHangedIds:shortfall,terminalUnfilledIds:[]});

    requireValue(Array.isArray(shortfall)&&new Set(shortfall).size===shortfall.length);
    if(Object.hasOwn(before,'hangedShortfallCardIds')){
      const epoch=state.hangedShortfallEpoch;integer(before.hangedShortfallRevision);
      requireValue(epoch&&epoch.consumed&&epoch.consumedBy==='PLAY_HAND'&&epoch.revision===before.hangedShortfallRevision&&epoch.ante===state.round.ante&&epoch.blindId===state.round.blindId&&epoch.handsRemaining===value.scoringRoundBefore.handsRemaining&&JSON.stringify(epoch.cardIds)===JSON.stringify(shortfall));
      requireValue(shortfall.length>0&&shortfall.every(id=>!Object.hasOwn(scoreCards,id))&&JSON.stringify((state.hangedDestroyedCardIds??[]).slice(-shortfall.length))===JSON.stringify(shortfall));
    }else requireValue(before.hangedShortfallRevision===undefined);
    // Disabling Serpent retains its current hand count until the next ordinary draw.
    if(before.drawPile.length&&state.bossState?.id!=='bl_serpent'){
      const expectedHandSize=state.round.handSize-shortfall.length,playedCount=value.playedCardIds.length;
      const forced=!state.bossState?.disabled&&state.bossState?.id==='bl_hook'?Math.min(2,expectedHandSize-playedCount):0;
      requireValue(expectedHandSize>=playedCount&&value.heldCardIds.length+playedCount+forced===expectedHandSize);
    }
    const partition=[...before.drawPile,...before.discardPile,...value.heldCardIds,...value.playedCardIds];
    requireValue(partition.length===Object.keys(scoreCards).length&&new Set(partition).size===partition.length);
    const drawOffset=state.rng.apk?0:before.drawPile.length-state.drawPile.length;
    requireValue(drawOffset>=0&&state.drawPile.length<=before.drawPile.length&&state.drawPile.every((id,i)=>before.drawPile[i+drawOffset]===id));
    requireValue(before.discardPile.every((id,i)=>state.discardPile[i]===id));
    const survivors=value.playedCardIds.filter(id=>!destroyedById.has(id));
    requireValue(survivors.every((id,i)=>state.discardPile[before.discardPile.length+i]===id));
    const later=state.discardPile.slice(before.discardPile.length+survivors.length),actions=value.scoringRoundBefore.discardsRemaining-state.round.discardsRemaining;
    requireValue(later.length>=actions&&later.length<=actions*5&&later.every(id=>before.drawPile.includes(id)||value.heldCardIds.includes(id)));
    if(!state.bossState?.disabled&&state.bossState?.id==='bl_serpent'){const draws=3*((state.phase==='playing'?1:0)+actions);requireValue(state.drawPile.length===Math.max(0,before.drawPile.length-draws));}
  }
  const replayRound=value.scoringRoundBefore??{handsRemaining:state.round.handsRemaining+1,discardsRemaining:state.round.discardsRemaining};
  let scoringState={...state,round:{...state.round,...replayRound},...(scoringMoneyBefore!==undefined?{money:scoringMoneyBefore}:{})};
  if(hasLucky){
    if(value.luckyRngKind==='apk'){
      const apk=structuredClone(state.rng.apk);for(const key of ['lucky_mult','lucky_money']){const stream=value.luckyRngBefore[key];if(stream===null)delete apk.streams[key];else apk.streams[key]=stream;}
      scoringState={...scoringState,rng:{...state.rng,apk}};
    }else scoringState={...scoringState,rng:{...state.rng,effects:structuredClone(value.luckyRngBefore)}};
  }
  if(hasGlass){
    if(value.glassRngKind==='apk'){
      const apk=structuredClone(scoringState.rng.apk),stream=value.glassRngBefore.glass;if(stream===null)delete apk.streams.glass;else apk.streams.glass=stream;
      scoringState={...scoringState,rng:{...scoringState.rng,apk}};
    }else if(!hasLucky||!state.jokers.some(j=>SCORED_RETRIGGER_JOKERS.includes(originalJokerKey(j.entityId))))scoringState={...scoringState,rng:{...scoringState.rng,effects:structuredClone(value.glassRngBefore)}};
  }
  if(!state.bossState?.disabled&&['bl_eye','bl_mouth'].includes(state.bossState?.id)){
    const history=value.bossHistory;object(history,state.bossState.id==='bl_eye'?['playedHands']:['firstHand']);
    if(state.bossState.id==='bl_eye'){
      requireValue(Array.isArray(history.playedHands)&&new Set(history.playedHands).size===history.playedHands.length&&history.playedHands.every(id=>Object.hasOwn(HANDS,id)));
      const after=[...history.playedHands];if(!after.includes(value.handId))after.push(value.handId);
      requireValue(JSON.stringify(after)===JSON.stringify(state.bossState.playedHands));
    }else{
      requireValue(history.firstHand===null||Object.hasOwn(HANDS,history.firstHand));
      requireValue(state.bossState.firstHand===(history.firstHand??value.handId));
    }
    scoringState={...scoringState,bossState:{...state.bossState,...history}};
  }else if(!state.bossState?.disabled&&state.bossState?.id==='bl_final_heart'){
    const history=value.bossHistory;object(history,heartGlass?['heartDebuffedJokerId','heartRngBefore']:['heartDebuffedJokerId']);
    const chosen=history.heartDebuffedJokerId;
    requireValue(chosen===null||typeof chosen==='string'&&state.jokers.some(j=>j.id===chosen));
    const current=state.bossState.heartDebuffedJokerId;
    if(state.phase==='playing')requireValue(state.jokers.length===0?current===null:current!==null&&(state.jokers.length===1||current!==chosen));
    else requireValue(current===chosen);
    scoringState={...scoringState,jokers:state.jokers.map(j=>({...j,debuffed:j.id===chosen})),bossState:{...state.bossState,...history}};
    if(heartGlass){
      const stream=history.heartRngBefore;requireValue(stream===null||Number.isFinite(stream)&&stream>=0&&stream<=1);
      const beforeHeart={...(hasAction?structuredClone(value.actionRng.after):state.rng.apk),streams:{...(hasAction?value.actionRng.after.streams:state.rng.apk.streams)},mathState:[...(hasAction?value.actionRng.after.mathState:value.glassRngAfter.mathState)]};
      if(stream===null)delete beforeHeart.streams.crimson_heart;else beforeHeart.streams.crimson_heart=stream;
      const afterHeart=state.phase==='playing'?chooseHeartJoker(beforeHeart,scoringState.jokers):{jokerId:chosen,rng:beforeHeart};
      requireValue(afterHeart.jokerId===current&&JSON.stringify(afterHeart.rng)===JSON.stringify(state.rng.apk));
    }
  }else if(bellGlass){
    const history=value.bossHistory;object(history,['bellRngBefore']);
    const stream=history.bellRngBefore;requireValue(stream===null||Number.isFinite(stream)&&stream>=0&&stream<=1);
    let rng={...(hasAction?structuredClone(value.actionRng.after):state.rng.apk),streams:{...(hasAction?value.actionRng.after.streams:state.rng.apk.streams)},mathState:[...(hasAction?value.actionRng.after.mathState:value.glassRngAfter.mathState)]};
    if(stream===null)delete rng.streams.cerulean_bell;else rng.streams.cerulean_bell=stream;
    const polls=(state.phase==='playing'?1:0)+value.scoringRoundBefore.discardsRemaining-state.round.discardsRemaining;
    integer(polls,0,runDiscards(state)+1);
    // Every Bell poll reseeds raw RNG. Only the final candidate pool affects
    // the final target/raw state; prior seed advances come from round counters.
    for(let i=1;i<polls;i++)rng=nextApkSeed(rng,'cerulean_bell').rng;
    const choice=polls?chooseBellCard(rng,state.hand.map(id=>state.cards[id])):{cardId:null,rng};
    requireValue(choice.cardId===state.bossState.forcedCardId&&JSON.stringify(choice.rng)===JSON.stringify(state.rng.apk));
  }else requireValue(value.bossHistory===undefined);
  if(value.scoringPilesBefore)scoringState={...scoringState,drawPile:[...value.scoringPilesBefore.drawPile],discardPile:[...value.scoringPilesBefore.discardPile],...(value.scoringPilesBefore.hangedShortfallCardIds?{hangedShortfallCardIds:[...value.scoringPilesBefore.hangedShortfallCardIds]}:{})};
  scoringState={...scoringState,cards:scoreCards};if(value.heldCardIds)scoringState={...scoringState,hand:[...value.heldCardIds]};
  if(hasAction){
    scoringState={...scoringState,rng:{...scoringState.rng,apk:structuredClone(value.actionRng.before)}};
    if(value.actionRng.hookHeldCardIdsBefore){
      const held=value.actionRng.hookHeldCardIdsBefore,removed=value.actionRng.hookDiscardCardIds;cardList(held,state);cardList(removed,state);
      requireValue(!state.bossState?.disabled&&state.bossState?.id==='bl_hook'&&removed.length===Math.min(2,held.length)&&removed.every(id=>held.includes(id))&&JSON.stringify(held.filter(id=>!removed.includes(id)))===JSON.stringify(value.heldCardIds));
      scoringState={...scoringState,hand:[...held],discardPile:scoringState.discardPile.filter(id=>!removed.includes(id))};
    }else requireValue(value.actionRng.hookDiscardCardIds===undefined);
    if(!heartGlass&&!bellGlass){
      let endpoint=structuredClone(value.actionRng.after);
      if(!state.bossState?.disabled&&state.bossState?.id==='bl_wheel'){
        requireValue(value.scoringPilesBefore&&value.scoringRoundBefore);
        const count=value.scoringPilesBefore.drawPile.length-state.drawPile.length;integer(count,0,Object.keys(scoreCards).length);
        for(let i=0;i<count;i++)endpoint=nextApkRandom(endpoint,'wheel').rng;
      }
      requireValue(JSON.stringify(endpoint)===JSON.stringify(state.rng.apk));
    }
  }
  if(state.rng.apk&&scoringState.jokers.some(j=>SCORED_RETRIGGER_JOKERS.includes(originalJokerKey(j.entityId))))requireValue(hasAction);
  if(!value.handDebuffed&&scoringState.jokers.some(j=>originalJokerKey(j.entityId)==='j_dusk'))requireValue(value.scoringRoundBefore!==undefined);
  const expected=scoreHand(scoringState,(value.playedCardIds??value.scoringCardIds).map(key=>scoreCards[key]),{legacyRng:!hasAction});
  requireValue(!hasAction||JSON.stringify(expected.actionRng)===JSON.stringify(value.actionRng));
  requireValue(expected.handDebuffed===value.handDebuffed && expected.handId===value.handId && expected.isRoyal===value.isRoyal && expected.chips===chips && equalExact(expected.mult,mult) && expected.score===score);
  requireValue(expected.scoringCardIds.length===value.scoringCardIds.length && expected.scoringCardIds.every((key,i)=>key===value.scoringCardIds[i]));
  requireValue(!value.heldCardIds||expected.heldCardIds?.every((key,i)=>key===value.heldCardIds[i])&&expected.heldCardIds.length===value.heldCardIds.length);
  requireValue(expected.trace.length===trace.length && expected.trace.every((event,i)=>{
    const actual=trace[i];
    if(event.phase!==actual.phase||event.type!==actual.type)return false;
    if(event.type==='score_total')return true;
    if(event.type==='score_repeat')return event.sourceId===actual.sourceId&&event.effectSourceId===actual.effectSourceId;
    if(event.type==='score_money')return event.sourceId===actual.sourceId&&event.amount===actual.amount;
    return event.sourceId===actual.sourceId && event.effectSourceId===actual.effectSourceId && event.operation===actual.operation && event.before.chips===actual.before.chips && equalExact(event.before.mult,actual.before.mult) && event.after.chips===actual.after.chips && equalExact(event.after.mult,actual.after.mult);
  }));
  requireValue(!hasLucky||JSON.stringify({rolls:expected.luckyRolls,kind:expected.luckyRngKind,before:expected.luckyRngBefore,after:expected.luckyRngAfter})===JSON.stringify({rolls:value.luckyRolls,kind:value.luckyRngKind,before:value.luckyRngBefore,after:value.luckyRngAfter}));
  requireValue(!hasGlass||JSON.stringify({rolls:expected.glassRolls,kind:expected.glassRngKind,before:expected.glassRngBefore,after:expected.glassRngAfter,destroyed:expected.glassDestroyedCards})===JSON.stringify({rolls:value.glassRolls,kind:value.glassRngKind,before:value.glassRngBefore,after:value.glassRngAfter,destroyed:glassDestroyedCards}));
  requireValue(JSON.stringify(expected.scoringPilesBefore)===JSON.stringify(value.scoringPilesBefore)&&expected.scoringMoneyBefore===scoringMoneyBefore&&(!value.scoringRoundBefore||JSON.stringify(expected.scoringRoundBefore)===JSON.stringify(value.scoringRoundBefore)));
  return {...value,...(scoringMoneyBefore!==undefined?{scoringMoneyBefore}:{}),chips,mult,score,trace};
}
function decode(payload) {
  object(payload,['format','version','state']);requireValue(payload.format==='card-cascade-save' && payload.version===1);
  const state=payload.state;
  if(Object.hasOwn(state,'effectReplay'))return decodeEffectReplay(payload);
  requireValue(state.lastScore===null||!hasEffectMechanisms(state));
  const sortMode=state.sortMode;
  if(Object.hasOwn(state,'sortMode'))requireValue(['rank','suit'].includes(sortMode));
  optionalObject(state,['schemaVersion','runId','seed','revision','phase','deckId','cards','hand','drawPile','discardPile','jokers','handLevels','discoveredHands','rng','money','round','lastScore'],['stake','shop','bankruptAt','jokerSlots','apkShop','sortMode','roundNumber','apkBlinds','bossState','nextAnteBlinds','runStats','consumables','consumableSlots','mostPlayedHand','consumableUsage','consumableUsageTotal','lastTarotPlanet','packState','destroyedCardIds','hangedDestroyedCardIds','hangedShortfallCardIds','hangedShortfallEpoch','nextJokerCreationOrdinal','cashoutQuote','winAnte','won','winNotified','winPending','nextPlayingCardOrdinal','lastPlayedHand','handUsage','startingDeckSize','pendingDoubleTags','spectralDestroyedCardIds','spectralShortfallCardIds','spectralShortfallEpoch','spectralHandSizeDelta','ectoMinus','pendingTags','pendingTagPacks','activeTagHandSize','bossRerollUsed']);
  // Only the default win Ante is supported by the current blind-selection contract.
  if(Object.hasOwn(state,'winAnte'))requireValue(state.winAnte===8);
  for(const key of ['won','winNotified','winPending'])if(Object.hasOwn(state,key))requireValue(typeof state[key]==='boolean');
  if(state.winNotified)requireValue(state.won===true);
  if(state.winPending)requireValue(state.won===true&&state.winNotified===true&&state.phase==='round_won'&&state.round.blindId==='boss'&&state.round.ante===(state.winAnte??8)&&state.cashoutQuote?.earnedRevision===state.revision);
  requireValue(validConsumableUsage(state));
  if(Object.hasOwn(state,'lastPlayedHand'))requireValue(Object.hasOwn(HANDS,state.lastPlayedHand));
  if(Object.hasOwn(state,'mostPlayedHand'))requireValue(state.mostPlayedHand===null||Object.hasOwn(HANDS,state.mostPlayedHand));
  if(Object.hasOwn(state,'stake'))requireValue(validStake(state.stake));
  requireValue(state.schemaVersion===1 && PHASES.includes(state.phase) && Object.hasOwn(DECKS,state.deckId));
  requireValue(typeof state.runId==='string' && state.runId.length>=1 && state.runId.length<=120);
  requireValue(typeof state.seed==='string' && state.seed.length>=1 && state.seed.length<=1000);integer(state.revision);
  requireValue(state.cards!==null && typeof state.cards==='object' && !Array.isArray(state.cards));
  if(Object.hasOwn(state,'handUsage')){requireValue(state.handUsage&&typeof state.handUsage==='object'&&!Array.isArray(state.handUsage));for(const [key,value]of Object.entries(state.handUsage)){requireValue(Object.hasOwn(HANDS,key));integer(value);}}
  if(Object.hasOwn(state,'startingDeckSize'))integer(state.startingDeckSize,0,10000);
  if(Object.hasOwn(state,'pendingDoubleTags'))integer(state.pendingDoubleTags);
  validateTagState(state);
  if(Object.hasOwn(state,'bossRerollUsed'))requireValue(typeof state.bossRerollUsed==='boolean');
  const cardIds=Object.keys(state.cards);requireValue(cardIds.length<=10000);
  for(const key of cardIds) { id(key);optionalObject(state.cards[key],['id','rank','suit'],['enhancement','edition','seal','creationOrdinal','permaBonus']);requireValue(validPlayingCardModifiers(state.cards[key])&&state.cards[key].id===key);if(Object.hasOwn(state.cards[key],'permaBonus'))integer(state.cards[key].permaBonus);evaluateHand([state.cards[key]]); }
  if(Object.hasOwn(state,'destroyedCardIds')){
    const missing=APK_BASE_CARD_IDS.filter(key=>!Object.hasOwn(state.cards,key));
    requireValue(Array.isArray(state.destroyedCardIds)&&state.destroyedCardIds.length>=1&&missing.every(key=>state.destroyedCardIds.includes(key)));
  }
  if(Object.hasOwn(state,'hangedDestroyedCardIds')){
    const destroyed=state.destroyedCardIds??[],uses=state.consumableUsage?.c_hanged_man?.count??0;
    requireValue(Array.isArray(state.hangedDestroyedCardIds)&&state.hangedDestroyedCardIds.length>=1&&new Set(state.hangedDestroyedCardIds).size===state.hangedDestroyedCardIds.length&&state.hangedDestroyedCardIds.every(key=>destroyed.includes(key))&&Math.ceil(state.hangedDestroyedCardIds.length/2)<=uses);
  }
  if(Object.hasOwn(state,'spectralDestroyedCardIds')){
    const destroyed=state.destroyedCardIds??[],uses=['c_familiar','c_grim','c_incantation','c_immolate'].reduce((sum,key)=>sum+(state.consumableUsage?.[key]?.count??0)*(key==='c_immolate'?5:1),0);
    requireValue(Array.isArray(state.spectralDestroyedCardIds)&&state.spectralDestroyedCardIds.length>0&&new Set(state.spectralDestroyedCardIds).size===state.spectralDestroyedCardIds.length&&state.spectralDestroyedCardIds.every(key=>destroyed.includes(key)&&!state.hangedDestroyedCardIds?.includes(key))&&state.spectralDestroyedCardIds.length<=uses);
  }
  if(Object.hasOwn(state,'spectralHandSizeDelta')){integer(state.spectralHandSizeDelta,-Number.MAX_SAFE_INTEGER,0);const ouija=state.consumableUsage?.c_ouija?.count??0,ecto=state.consumableUsage?.c_ectoplasm?.count??0;requireValue(state.spectralHandSizeDelta>=-ouija-ecto*(ecto+1)/2);}
  if(Object.hasOwn(state,'ectoMinus'))integer(state.ectoMinus,1,(state.consumableUsage?.c_ectoplasm?.count??0)+1);
  try{validatePlayingCardIdentities(state);}catch{requireValue(false);}
  requireValue(cardIds.length>0||APK_BASE_CARD_IDS.every(id=>state.destroyedCardIds?.includes(id)));
  const partitions=[state.hand,state.drawPile,state.discardPile];requireValue(partitions.every(Array.isArray));
  const all=partitions.flat();requireValue(all.length===cardIds.length && new Set(all).size===all.length && all.every(key=>Object.hasOwn(state.cards,key)));
  if(Object.hasOwn(state,'runStats')){object(state.runStats,['handsPlayed','unusedDiscards','skips']);for(const count of Object.values(state.runStats))integer(count);}
  if(Object.hasOwn(state,'hangedShortfallEpoch')){
    const epoch=state.hangedShortfallEpoch;optionalObject(epoch,['revision','ante','blindId','handsRemaining','consumed','cardIds'],['consumedBy']);
    requireValue(Array.isArray(epoch.cardIds)&&epoch.cardIds.length>0&&new Set(epoch.cardIds).size===epoch.cardIds.length&&JSON.stringify((state.hangedDestroyedCardIds??[]).slice(-epoch.cardIds.length))===JSON.stringify(epoch.cardIds));
    integer(epoch.revision,0,state.revision);integer(epoch.ante,-1,state.round.ante+voucherModifiers(state).anteReduction);integer(epoch.handsRemaining,0,10000);
    requireValue(['small','big','boss'].includes(epoch.blindId)&&typeof epoch.consumed==='boolean'&&(epoch.consumed?['PLAY_HAND','DISCARD','CASH_OUT'].includes(epoch.consumedBy):epoch.consumedBy===undefined)&&state.hangedDestroyedCardIds?.length);
    if(state.hangedShortfallCardIds)requireValue(!epoch.consumed&&epoch.ante===state.round.ante&&epoch.blindId===state.round.blindId&&epoch.handsRemaining===state.round.handsRemaining&&JSON.stringify(epoch.cardIds)===JSON.stringify(state.hangedShortfallCardIds));
    else requireValue(epoch.consumed);
  }
  if(Object.hasOwn(state,'hangedShortfallCardIds')){
    const destroyed=state.hangedDestroyedCardIds??[],suffix=destroyed.slice(-state.hangedShortfallCardIds.length);
    requireValue(Array.isArray(state.hangedShortfallCardIds)&&state.hangedShortfallCardIds.length>=1&&new Set(state.hangedShortfallCardIds).size===state.hangedShortfallCardIds.length&&state.hangedShortfallCardIds.every(key=>destroyed.includes(key))&&JSON.stringify(suffix)===JSON.stringify(state.hangedShortfallCardIds));
  }
  if(Object.hasOwn(state,'spectralShortfallEpoch')){
    const epoch=state.spectralShortfallEpoch;optionalObject(epoch,['revision','ante','blindId','handsRemaining','consumed','cardIds'],['consumedBy']);
    requireValue(Array.isArray(epoch.cardIds)&&epoch.cardIds.length>0&&new Set(epoch.cardIds).size===epoch.cardIds.length&&JSON.stringify((state.spectralDestroyedCardIds??[]).slice(-epoch.cardIds.length))===JSON.stringify(epoch.cardIds));
    integer(epoch.revision,0,state.revision);integer(epoch.ante,-1,state.round.ante+voucherModifiers(state).anteReduction);integer(epoch.handsRemaining,0,10000);
    requireValue(['small','big','boss'].includes(epoch.blindId)&&typeof epoch.consumed==='boolean'&&(epoch.consumed?['PLAY_HAND','DISCARD','CASH_OUT'].includes(epoch.consumedBy):epoch.consumedBy===undefined)&&state.spectralDestroyedCardIds?.length);
    if(state.spectralShortfallCardIds)requireValue(!epoch.consumed&&epoch.ante===state.round.ante&&epoch.blindId===state.round.blindId&&epoch.handsRemaining===state.round.handsRemaining&&JSON.stringify(epoch.cardIds)===JSON.stringify(state.spectralShortfallCardIds));
    else requireValue(epoch.consumed);
  }
  if(Object.hasOwn(state,'spectralShortfallCardIds')){
    requireValue(['playing','round_won','game_over'].includes(state.phase)&&state.spectralShortfallEpoch&&!state.spectralShortfallEpoch.consumed);
    const destroyed=state.spectralDestroyedCardIds??[],suffix=destroyed.slice(-state.spectralShortfallCardIds.length);
    requireValue(Array.isArray(state.spectralShortfallCardIds)&&state.spectralShortfallCardIds.length>=1&&new Set(state.spectralShortfallCardIds).size===state.spectralShortfallCardIds.length&&state.spectralShortfallCardIds.every(key=>destroyed.includes(key))&&JSON.stringify(suffix)===JSON.stringify(state.spectralShortfallCardIds));
  }
  if(Object.hasOwn(state,'jokerSlots'))integer(state.jokerSlots,0,10000);
  if(Object.hasOwn(state,'bankruptAt'))state.bankruptAt=decimal(state.bankruptAt,true);
  requireValue(Array.isArray(state.jokers) && state.jokers.length<=10000);
  if(Object.hasOwn(state,'nextJokerCreationOrdinal'))integer(state.nextJokerCreationOrdinal,1,Number.MAX_SAFE_INTEGER);
  requireValue(state.jokers.length<=(state.jokerSlots??5)+state.jokers.filter(j=>j.edition==='negative').length);
  const jokerIds=new Set(cardIds);
  for(const joker of state.jokers){decodeOffer(joker,jokerIds,true);requireValue(!isPerished(joker)||joker.debuffed===true);}
  if(Object.hasOwn(state,'consumableSlots'))integer(state.consumableSlots,0,10000);
  if(Object.hasOwn(state,'consumables')){
    // Capacity limits acquisition, not persisted inventory: consuming a
    // Negative generator can legally leave cards above the final limit.
    requireValue(Array.isArray(state.consumables)&&state.consumables.length<=10000);
    for(const card of state.consumables)decodeOffer(card,jokerIds,true,true);
  }
  if(Object.hasOwn(state,'shop'))decodeShop(state.shop,jokerIds);
  if(Object.hasOwn(state,'packState'))decodePackState(state.packState,state,jokerIds);else requireValue(state.phase!=='pack');
  const jokerCards=[...(state.packState?.cards??[]),...state.jokers,...(state.consumables??[]),...(state.shop?['main','vouchers','boosters'].flatMap(area=>state.shop[area]??[]):[])].filter(card=>['Joker','Tarot','Planet','Spectral'].includes(centres.get(card.entityId)?.set));
  const creationOrdinals=jokerCards.filter(card=>Object.hasOwn(card,'creationOrdinal')).map(card=>card.creationOrdinal);
  requireValue(new Set(creationOrdinals).size===creationOrdinals.length);
  if(Object.hasOwn(state,'nextJokerCreationOrdinal'))requireValue(creationOrdinals.every(value=>value<state.nextJokerCreationOrdinal));
  object(state.handLevels,Object.keys(HANDS));for(const level of Object.values(state.handLevels))integer(level,1);
  requireValue(Array.isArray(state.discoveredHands) && new Set(state.discoveredHands).size===state.discoveredHands.length && state.discoveredHands.every(key=>Object.hasOwn(HANDS,key)));
  optionalObject(state.rng,['deck','effects'],['shop','apk']);
  for(const key of ['deck','effects','shop'])if(Object.hasOwn(state.rng,key)) {const rng=state.rng[key];object(rng,['algorithm','state']);randomInt(rng,1);}
  if(Object.hasOwn(state.rng,'apk'))decodeApkRng(state.rng.apk,state.seed);
  state.money=decimal(state.money,true);
  optionalObject(state.round,['blindId','ante','target','score','handsRemaining','discardsRemaining','handSize'],['realHandSize','targetAnte','bossDisabled','handsPlayed','discardsUsed','burglarHandsGranted','handUsage','idolCard','mailRank','ancientSuit','castleSuit']);
  if(Object.hasOwn(state.round,'targetAnte')){integer(state.round.targetAnte,0);requireValue(['shop','pack'].includes(state.phase)&&!freeTagPack(state)&&state.round.targetAnte>state.round.ante&&state.round.targetAnte-state.round.ante<=voucherModifiers(state).anteReduction);}
  for(const key of ['mailRank'])if(Object.hasOwn(state.round,key))requireValue(state.round[key]===null||Number.isSafeInteger(state.round[key])&&state.round[key]>=2&&state.round[key]<=14);
  for(const key of ['ancientSuit','castleSuit'])if(Object.hasOwn(state.round,key))requireValue(['spades','hearts','clubs','diamonds'].includes(state.round[key]));
  if(Object.hasOwn(state.round,'idolCard')){object(state.round.idolCard,['rank','suit']);requireValue((state.round.idolCard.rank===null||Number.isSafeInteger(state.round.idolCard.rank)&&state.round.idolCard.rank>=2&&state.round.idolCard.rank<=14)&&['spades','hearts','clubs','diamonds'].includes(state.round.idolCard.suit));}
  if(Object.hasOwn(state.round,'burglarHandsGranted')){integer(state.round.burglarHandsGranted,0,10000);requireValue(state.round.burglarHandsGranted%3===0);}
  for(const key of ['handsPlayed','discardsUsed'])if(Object.hasOwn(state.round,key))integer(state.round[key]);
  if(Object.hasOwn(state.round,'handUsage')){requireValue(state.round.handUsage&&typeof state.round.handUsage==='object'&&!Array.isArray(state.round.handUsage));for(const [key,value]of Object.entries(state.round.handUsage)){requireValue(Object.hasOwn(HANDS,key));integer(value);}}
  if(Object.hasOwn(state.round,'bossDisabled'))requireValue(state.round.bossDisabled===true&&['shop','pack'].includes(state.phase)&&state.round.blindId==='boss'&&['bl_wall','bl_final_vessel'].includes(state.apkBlinds?.bossId));
  if(Object.hasOwn(state,'roundNumber'))integer(state.roundNumber,-5);
  // These are resource limits rather than base-deck totals: Burglar bonuses
  // survive sale, and acquiring/removing passives can change current counters.
  // Played states additionally authenticate every value through effectReplay.
  const round=state.round;requireValue(['small','big','boss'].includes(round.blindId));integer(round.ante,-1);integer(round.handsRemaining,['shop','pack'].includes(state.phase)&&!freeTagPack(state)&&state.round.targetAnte!==undefined&&state.apkShop?.context.usedVoucherIds.includes('v_hieroglyph')?-1:0,10000);integer(round.discardsRemaining,0,10000);integer(round.handSize,0,10000);if(Object.hasOwn(round,'realHandSize')){integer(round.realHandSize,-Number.MAX_SAFE_INTEGER,10000);requireValue(round.handSize===Math.max(0,round.realHandSize));}if(Object.hasOwn(state,'spectralHandSizeDelta')||Object.hasOwn(round,'realHandSize')||voucherModifiers(state).handSize!==0||Object.hasOwn(state,'activeTagHandSize'))requireValue(realHandSize(state)===expectedHandSize(state)-(state.bossState?.id==='bl_manacle'&&!state.bossState.disabled?1:0));
  if(Object.hasOwn(state,'hangedShortfallCardIds'))requireValue(['playing','round_won','game_over'].includes(state.phase)&&(state.phase==='round_won'||!state.drawPile.length||state.bossState?.id==='bl_serpent'||state.hand.length+state.hangedShortfallCardIds.length===round.handSize));
  // The only nonfinite save value is this exact target tag. Native STR_PACK drops
  // its bare nan field on load; keeping it durable intentionally fixes that corruption.
  if(round.target!==null&&typeof round.target==='object'){
    object(round.target,['native']);requireValue(round.target.native==='NaN'&&state.apkShop);round.target=NaN;
  }else {round.target=decimal(round.target);requireValue(round.target>0n);}
  round.score=decimal(round.score);
  if(Object.hasOwn(state,'apkShop'))decodeApkShop(state.apkShop,state);
  if(Object.hasOwn(state,'apkBlinds'))decodeApkBlinds(state.apkBlinds,state);
  if(Object.hasOwn(state,'nextAnteBlinds')){
    requireValue(['shop','pack'].includes(state.phase)&&round.blindId==='boss'&&state.nextAnteBlinds.playedCardIds?.length===0);
    decodeApkBlinds(state.nextAnteBlinds,{...state,round:{...round,ante:round.ante+1}},true);
  }
  if(Object.hasOwn(state,'bossState'))decodeBoss(state.bossState,state);
  if(round.blindId==='boss'){
    requireValue(canEnterBoss(state)&&Object.is(round.target,bossTarget(state)));
    requireValue(['playing','round_won','game_over'].includes(state.phase)?!!state.bossState:!state.bossState&&realHandSize(state)===expectedHandSize(state));
  }
  if(state.apkShop&&round.blindId!=='boss')requireValue(Object.is(round.target,nativeBlindTarget(round.targetAnte??round.ante,(round.blindId==='big'?1.5:1)*deckBlindScale(state.deckId),stakeScaling(state))));
  if(state.phase==='round_won')requireValue(round.score>=round.target);
  if(['shop','pack'].includes(state.phase))requireValue((freeTagPack(state)?round.score===0n:round.score>=round.target) && (state.packState?.handDraw?state.hand.length<=state.packState.handDraw.handSize+(state.packState.handDraw.createdCardIds?.length??0)+(state.packState.handDraw.extraDrawIds?.length??0):state.hand.length===0) && state.discardPile.length===0 && state.drawPile.length+state.hand.length===cardIds.length && state.lastScore===null);
  if(state.phase==='game_over')requireValue((round.handsRemaining===0||state.hand.length===0&&(round.handSize===0||state.drawPile.length===0)) && !(round.score>=round.target));
  if(state.phase==='playing')requireValue(round.handsRemaining>0 && !(round.score>=round.target) && (state.hand.length+(state.hangedShortfallCardIds?.length??0)+(state.spectralShortfallCardIds?.length??0)>=round.handSize || state.drawPile.length===0 || state.bossState?.id==='bl_serpent'));
  if(state.phase==='blind_selection')requireValue(state.hand.length===0 && state.discardPile.length===0 && round.score===0n);
  if(Object.hasOwn(state,'cashoutQuote')){
    requireValue(state.phase==='round_won');optionalObject(state.cashoutQuote,['moneyBefore','earnedRevision','bonusContext','quote'],['handsRemainingBefore','discardsRemainingBefore']);
    integer(state.cashoutQuote.earnedRevision);optionalObject(state.cashoutQuote.bonusContext,['sources','nineCardIds'],['item7']);
    requireValue(Array.isArray(state.cashoutQuote.bonusContext.sources));for(const row of state.cashoutQuote.bonusContext.sources){object(row,['id','entityId']);id(row.id);}
    requireValue(Array.isArray(state.cashoutQuote.bonusContext.nineCardIds));for(const key of state.cashoutQuote.bonusContext.nineCardIds)id(key);
    const snapshot=state.cashoutQuote,q=snapshot.quote; snapshot.moneyBefore=decimal(snapshot.moneyBefore,true);
    optionalObject(q,['reward','hands','interest','total'],['jokerBonuses','tagReward','handReward','discards']);
    for(const key of ['tagReward','handReward','discards'])if(Object.hasOwn(q,key))q[key]=decimal(q[key]);
    if(Object.hasOwn(snapshot,'discardsRemainingBefore'))integer(snapshot.discardsRemainingBefore,0,10000);
    for(const key of ['reward','hands','interest','total'])q[key]=decimal(q[key]);
    if(!Object.hasOwn(snapshot,'handsRemainingBefore'))snapshot.handsRemainingBefore=Number(q.hands);
    integer(snapshot.handsRemainingBefore,0,10000);
    if(Object.hasOwn(q,'jokerBonuses')){
      requireValue(Array.isArray(q.jokerBonuses)&&q.jokerBonuses.length>0&&q.jokerBonuses.length<=10000);
      for(const row of q.jokerBonuses){object(row,['sourceId','entityId','amount']);id(row.sourceId);row.amount=decimal(row.amount);}
    }
    getCashout(state);
  }
  state.lastScore=decodeScore(state.lastScore,state);
  if(state.lastScore!==null)requireValue(state.lastScore.score<=round.score);
  if(sortMode!==undefined)state.sortMode=sortMode;
  return state;
}
function encodeState(state) {
  requireValue(typeof state.money==='bigint' && (typeof state.round.target==='bigint'||Number.isNaN(state.round.target)) && typeof state.round.score==='bigint');
  const payload={format:'card-cascade-save',version:1,state:{...state,money:state.money.toString(),round:{...state.round,target:Number.isNaN(state.round.target)?{native:'NaN'}:state.round.target.toString(),score:state.round.score.toString()},lastScore:encodeScore(state.lastScore)}};
  if(Object.hasOwn(state,'cashoutQuote')){
    getCashout(state);const snapshot=state.cashoutQuote,q=snapshot.quote;
    payload.state.cashoutQuote={handsRemainingBefore:Object.hasOwn(snapshot,'handsRemainingBefore')?snapshot.handsRemainingBefore:Number(q.hands),...(Object.hasOwn(snapshot,'discardsRemainingBefore')?{discardsRemainingBefore:snapshot.discardsRemainingBefore}:{}),earnedRevision:snapshot.earnedRevision,bonusContext:structuredClone(snapshot.bonusContext),moneyBefore:snapshot.moneyBefore.toString(),quote:{...q,...Object.fromEntries(['reward','hands','interest','total',...['tagReward','handReward','discards'].filter(key=>Object.hasOwn(q,key))].map(key=>[key,q[key].toString()])),...(q.jokerBonuses?{jokerBonuses:q.jokerBonuses.map(row=>({...row,amount:row.amount.toString()}))}:{})}};
  }
  if(Object.hasOwn(state,'bankruptAt')) {requireValue(typeof state.bankruptAt==='bigint');payload.state.bankruptAt=state.bankruptAt.toString();}
  if(state.consumables)payload.state.consumables=state.consumables.map(encodeOffer);
  payload.state.jokers=state.jokers.map(encodeOffer);
  if(Object.hasOwn(state,'shop') && state.shop!==null) {
    requireValue(typeof state.shop.rerollBase==='bigint' && typeof state.shop.rerollIncrease==='bigint'&&(!Object.hasOwn(state.shop,'rerollCostOverride')||typeof state.shop.rerollCostOverride==='bigint'));
    payload.state.shop={...state.shop,main:state.shop.main.map(encodeOffer),vouchers:state.shop.vouchers.map(encodeOffer),boosters:state.shop.boosters.map(encodeOffer),rerollBase:state.shop.rerollBase.toString(),rerollIncrease:state.shop.rerollIncrease.toString(),...(Object.hasOwn(state.shop,'rerollCostOverride')?{rerollCostOverride:state.shop.rerollCostOverride.toString()}:{})};
  }
  if(Object.hasOwn(state,'packState'))payload.state.packState={...state.packState,cards:state.packState.cards.map(encodeOffer)};
  if(state.effectReplay){const journal=state.effectReplay;payload.state.effectReplay={version:journal.version,before:serializeState(journal.before),actions:structuredClone(journal.actions)};}
  return payload;
}
function canonical(value){return JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);}
function decodeEffectReplay(payload){
  const raw=payload.state,journal=raw.effectReplay;object(journal,['version','before','actions']);
  requireValue([1,2].includes(journal.version)&&typeof journal.before==='string'&&Array.isArray(journal.actions)&&journal.actions.length>=1&&journal.actions.length<=10000);
  const beforePayload=JSON.parse(journal.before);requireValue(beforePayload.state&&!Object.hasOwn(beforePayload.state,'effectReplay'));
  if(journal.version===1)requireValue(beforePayload.state.lastScore===null&&beforePayload.state.phase==='playing');
  const before=deserializeState(journal.before);
  if(journal.version===1)requireValue(hasEffectMechanisms(before)&&journal.actions[0]?.type==='PLAY_HAND');
  const fields={PLAY_HAND:['cardIds'],DISCARD:['cardIds'],REORDER_HAND:['cardIds'],SET_SORT:['mode'],CONTINUE_ENDLESS:[],START_BLIND:[],CASH_OUT:[],SKIP_BLIND:[],LEAVE_SHOP:[],REROLL_SHOP:[],REORDER_JOKERS:['cardIds'],REORDER_CONSUMABLES:['cardIds'],SELL_OWNED_CARD:['area','cardId'],SELL_JOKER:['jokerId'],BUY_SHOP_CARD:['offerId'],BUY_VOUCHER:['offerId'],REROLL_BOSS:[],OPEN_BOOSTER:['offerId'],USE_PACK_CARD:['cardId','targetCardIds'],SKIP_PACK:[],USE_CONSUMABLE:['cardId','targetCardIds']};
  const legacyActions=['PLAY_HAND','DISCARD','REORDER_HAND','SET_SORT','CONTINUE_ENDLESS'];
  for(const action of journal.actions){
    requireValue(action&&typeof action==='object'&&!Array.isArray(action)&&Object.hasOwn(fields,action.type));
    requireValue(Object.keys(action).every(k=>['type','expectedRevision','profileUnlockedCentreIds','profileLockedCentreIds',...fields[action.type]].includes(k)));
    if(journal.version===1)requireValue(legacyActions.includes(action.type));
  }
  const expected=replayEffectActions(before,journal.actions);
  if(journal.version===1)requireValue(expected.lastScore!==null);
  else requireValue(hasEffectMechanisms(before)||hasEffectMechanisms(expected)||hasJokerStickers(before)||journal.actions.some(a=>['USE_CONSUMABLE','USE_PACK_CARD'].includes(a.type))||before.rng?.apk&&journal.actions.some(a=>a.type==='PLAY_HAND'));
  const actual={...raw};delete actual.effectReplay;
  requireValue(canonical(actual)===canonical(encodeState(expected).state));
  expected.effectReplay={version:journal.version,before,actions:structuredClone(journal.actions)};return expected;
}
export function serializeState(state){
  const text=JSON.stringify(encodeState(state));
  deserializeState(text); // Validate the exact bytes that will be stored.
  return text;
}
export function deserializeState(text) {
  requireValue(typeof text==='string' && text.length<=PROFILE_LIMIT && new TextEncoder().encode(text).length<=PROFILE_LIMIT);
  const payload=JSON.parse(text);
  if(Object.hasOwn(payload,'account')){
    object(payload,['format','version','state','account']);validateAccount(payload.account,deserializeState);
    const current=payload.account.profiles[payload.account.activeId].current;
    requireValue(current!==null&&JSON.stringify(payload.state)===JSON.stringify(JSON.parse(current).state));
    const {account,...run}=payload;return decode(run);
  }
  requireValue(text.length<=LIMIT&&new TextEncoder().encode(text).length<=LIMIT);
  return decode(payload);
}




