import {supportsConsumable} from '../core/inventory.js';
import {validConsumableUsage} from '../core/consumables.js';
import {canEnterBoss,bossTarget} from '../core/boss-effects.js';
import {APK_BOSSES,APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {createApkTagContext,getApkTagPool} from '../core/apk-tags.js';
import { apkPseudoHash, validateApkRng } from '../core/apk-rng.js';
import { HANDS } from '../content/hands.js';
import { SUPPORTED_JOKERS,supportsJoker } from '../content/jokers.js';
import { evaluateHand } from '../core/hands.js';
import { randomInt } from '../core/rng.js';
import { scoreHand } from '../core/score.js';
import {compareExact,equalExact,exact,floorExact,multiplyExact} from '../core/numbers.js';
import catalogue from '../content/apk-shop-catalog.js';
import {createApkShopContext} from '../core/apk-shop.js';
import {APK_BASE_CARD_IDS} from '../core/apk-deck.js';
const centres=new Map(catalogue.centres.map(c=>[c.key,c]));
const handNames=new Set(catalogue.centres.filter(c=>c.set==='Planet').map(c=>c.handType));

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
  optionalObject(value,owned?['id','entityId']:['id','entityId','cost','sellCost'],['cost','sellCost','edition','eternal','rental','perishable','debuffed','originalKey','set','frontKey','toDoPokerHand']);
  id(value.id);id(value.entityId);requireValue(!ids.has(value.id));ids.add(value.id);
  if(owned)requireValue(consumable?supportsConsumable(value):supportsJoker(value));
  for(const key of ['cost','sellCost'])if(Object.hasOwn(value,key))value[key]=decimal(value[key]);
  if(Object.hasOwn(value,'edition'))requireValue(['base','foil','holographic','polychrome','negative'].includes(value.edition));
  for(const key of ['eternal','rental','perishable','debuffed'])if(Object.hasOwn(value,key))requireValue(typeof value[key]==='boolean');
  if(Object.hasOwn(value,'originalKey') || Object.hasOwn(value,'set')){
    const centre=centres.get(value.originalKey);
    requireValue(centre && value.originalKey===value.entityId && value.set===centre.set);
  }
  if(Object.hasOwn(value,'frontKey'))requireValue(['Base','Enhanced'].includes(value.set) && typeof value.frontKey==='string' && /^[CDHS]_(?:[2-9]|A|J|K|Q|T)$/.test(value.frontKey));
  if(Object.hasOwn(value,'toDoPokerHand'))requireValue(value.originalKey==='j_todo_list' && handNames.has(value.toDoPokerHand));
}
function decodeApkShop(value,state) {
  object(value,['version','voucherId','firstShopBuffoon','context']);
  requireValue(value.version===1 && typeof value.firstShopBuffoon==='boolean' && state.rng.apk);
  requireValue(value.voucherId===null || centres.get(value.voucherId)?.set==='Voucher');
  optionalObject(value.context,Object.keys(createApkShopContext()),['tutorialShopSurcharge']);
  createApkShopContext(value.context); // Validate actual saved inputs without selecting or polling.
  const enhancements=[...new Set(Object.values(state.cards).map(card=>({mult:'m_mult',bonus:'m_bonus',lucky:'m_lucky',wild:'m_wild',steel:'m_steel',glass:'m_glass',stone:'m_stone',gold:'m_gold'})[card.enhancement]).filter(Boolean))];
  requireValue(new Set(value.context.enhancementIds).size===value.context.enhancementIds.length&&value.context.enhancementIds.length===enhancements.length&&value.context.enhancementIds.every(id=>enhancements.includes(id)));
  requireValue(value.context.ante===state.round.ante+(['shop','pack'].includes(state.phase)&&state.round.blindId==='boss'?1:0));
  if(['shop','pack'].includes(state.phase)){
    requireValue(state.shop!==null && state.shop!==undefined);
    const sets={main:['Joker','Tarot','Planet','Spectral','Base','Enhanced'],vouchers:['Voucher'],boosters:['Booster']};
    for(const [area,allowed] of Object.entries(sets))for(const offer of state.shop[area]){
      requireValue(offer.originalKey===offer.entityId && centres.get(offer.originalKey)?.set===offer.set && allowed.includes(offer.set));
    }
  }else requireValue(state.shop===null || state.shop===undefined);
}
function decodeApkBlinds(value,state,pending=false){
  optionalObject(value,['version','ante','bossId','bossesUsed','tags','orbitalHands','tagContext'],['playedCardIds']);
  if(Object.hasOwn(value,'playedCardIds'))cardList(value.playedCardIds,state);
  requireValue(value.version===1 && value.ante===state.round.ante && state.apkShop && state.rng.apk);
  const boss=APK_BLINDS_BY_ID[value.bossId];
  requireValue(boss && APK_BOSSES.includes(boss) && boss.showdown===(value.ante>=2 && value.ante%8===0) && (boss.showdown || boss.minAnte<=value.ante));
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
 const extras={bl_house:['hiddenCardIds'],bl_wheel:['hiddenCardIds'],bl_fish:['hiddenCardIds'],bl_mark:['hiddenCardIds'],bl_eye:['playedHands'],bl_mouth:['firstHand'],bl_ox:['oxHand']};
 optionalObject(value,['version','id','playedBeforeBoss','baseHandSize',...(extras[value.id]??[])],value.id==='bl_mark'?['hiddenFaceRanks']:[]);
 requireValue(value.version===1&&value.id===state.apkBlinds?.bossId&&canEnterBoss(state));
 requireValue(state.round.blindId==='boss'&&['playing','round_won','game_over'].includes(state.phase)&&state.roundNumber===state.round.ante*3&&value.baseHandSize===8);
 cardList(value.playedBeforeBoss,state);requireValue(value.playedBeforeBoss.every(id=>state.apkBlinds.playedCardIds.includes(id)));
 requireValue(state.round.handSize===(value.id==='bl_manacle'?7:8));
 if(Object.hasOwn(value,'hiddenCardIds')){
  cardList(value.hiddenCardIds,state);requireValue(value.hiddenCardIds.every(id=>state.hand.includes(id)));
  if(value.id==='bl_mark'){
   if(Object.hasOwn(value,'hiddenFaceRanks')){object(value.hiddenFaceRanks,value.hiddenCardIds);requireValue(Object.values(value.hiddenFaceRanks).every(rank=>Number.isInteger(rank)&&rank>=11&&rank<=13));}
   else requireValue(value.hiddenCardIds.every(id=>state.cards[id].rank>=11&&state.cards[id].rank<=13||/^card_(?:clubs|diamonds|hearts|spades)_(?:11|12|13)$/.test(id)));
  }
 }
 if(value.id==='bl_eye')requireValue(Array.isArray(value.playedHands)&&new Set(value.playedHands).size===value.playedHands.length&&value.playedHands.every(id=>Object.hasOwn(HANDS,id)));
 if(value.id==='bl_mouth')requireValue(value.firstHand===null||Object.hasOwn(HANDS,value.firstHand));
 if(value.id==='bl_ox')requireValue(Object.hasOwn(HANDS,value.oxHand)&&value.oxHand===state.mostPlayedHand);
 if(value.id==='bl_water')requireValue(state.round.discardsRemaining===0);
 if(value.id==='bl_needle')requireValue(state.round.handsRemaining<=1);
}
function decodeShop(shop,ids) {
  if(shop===null)return;
  object(shop,['main','vouchers','boosters','rerollBase','rerollIncrease','freeRerolls']);
  for(const area of ['main','vouchers','boosters']) {
    requireValue(Array.isArray(shop[area]) && shop[area].length<=10000);
    for(const offer of shop[area])decodeOffer(offer,ids);
  }
  shop.rerollBase=decimal(shop.rerollBase);shop.rerollIncrease=decimal(shop.rerollIncrease);integer(shop.freeRerolls,0,10000);
}
function decodePackState(value,state,ids){
 object(value,['version','sourceEntityId','cards','choicesRemaining']);
 const source=centres.get(value.sourceEntityId);requireValue(value.version===1&&source?.set==='Booster'&&source.kind==='Celestial');
 requireValue(Array.isArray(value.cards)&&value.cards.length>=1&&value.cards.length<=5);for(const card of value.cards){decodeOffer(card,ids);requireValue(card.originalKey===card.entityId&&(card.set==='Planet'||card.entityId==='c_black_hole'));}
 integer(value.choicesRemaining,1,2);
 const mega=value.sourceEntityId.includes('_mega_'),jumbo=value.sourceEntityId.includes('_jumbo_');
 requireValue(mega?value.choicesRemaining===2&&value.cards.length===5||value.choicesRemaining===1&&value.cards.length===4:value.choicesRemaining===1&&value.cards.length===(jumbo?5:3));
 requireValue(state.phase==='pack'&&state.shop&&state.apkShop&&state.rng.apk);
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
  for(const key of ['cost','sellCost'])if(Object.hasOwn(offer,key)) {requireValue(typeof offer[key]==='bigint');encoded[key]=offer[key].toString();}
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
  return {...score,chips:score.chips.toString(),mult:encodeExact(score.mult),score:score.score.toString(),trace:score.trace.map(event=>event.type==='score_money'?{...event,amount:event.amount.toString()}:event.type==='score_total'
    ? {...event,chips:event.chips.toString(),mult:encodeExact(event.mult),score:event.score.toString()}
    : {...event,before:{chips:event.before.chips.toString(),mult:encodeExact(event.before.mult)},after:{chips:event.after.chips.toString(),mult:encodeExact(event.after.mult)}})};
}
function decodeScore(value,state) {
  if(value===null)return null;
  optionalObject(value,['handId','isRoyal','scoringCardIds','chips','mult','score','trace'],['playedCardIds','heldCardIds','handDebuffed','bossHistory','luckyRolls','luckyRngKind','luckyRngBefore','luckyRngAfter','glassRolls','glassRngKind','glassRngBefore','glassRngAfter','glassDestroyedCards']);
  if(Object.hasOwn(value,'handDebuffed'))requireValue(value.handDebuffed===true);
  const glassDestroyedCards=value.glassDestroyedCards??[];requireValue(Array.isArray(glassDestroyedCards)&&glassDestroyedCards.length<=5);
  const destroyedById=new Map();for(const card of glassDestroyedCards){object(card,['id','rank','suit','enhancement']);id(card.id);requireValue(card.enhancement==='glass'&&!Object.hasOwn(state.cards,card.id)&&!destroyedById.has(card.id));evaluateHand([card]);destroyedById.set(card.id,card);}
  const scoreCards={...state.cards,...Object.fromEntries(destroyedById)};
  if(value.playedCardIds)requireValue(Array.isArray(value.playedCardIds)&&value.playedCardIds.length>=1&&value.playedCardIds.length<=5&&new Set(value.playedCardIds).size===value.playedCardIds.length&&value.playedCardIds.every(id=>Object.hasOwn(scoreCards,id)));
  if(value.heldCardIds){cardList(value.heldCardIds,state);requireValue(value.heldCardIds.length>=1&&value.heldCardIds.every(id=>!value.playedCardIds?.includes(id)));}
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
    if(event.type==='score_money'){
      object(event,['type','phase','sourceId','amount']);requireValue(event.phase==='scored_card'&&value.scoringCardIds.includes(event.sourceId));const amount=decimal(event.amount);requireValue(amount===20n);return {...event,amount};
    }
    optionalObject(event,['type','phase','sourceId','operation','before','after'],['effectSourceId']);
    if(event.effectSourceId)requireValue(state.jokers.some(j=>j.id===event.effectSourceId));
    const before=exactPair(event.before),after=exactPair(event.after);
    requireValue(event.type==='score_step' && before.chips===previous.chips && equalExact(before.mult,previous.mult));
    if(i===0) requireValue(event.phase==='base' && event.operation==='base' && event.sourceId===`hand:${value.handId}`);
    else {
      requireValue(['add_chips','add_mult','multiply_mult'].includes(event.operation));
      requireValue(event.operation==='add_chips' ? after.chips>=before.chips && equalExact(after.mult,before.mult) : compareExact(after.mult,before.mult)>=0 && after.chips===before.chips);
      requireValue(event.phase==='scored_card' ? value.scoringCardIds.includes(event.sourceId) : event.phase==='held_card' ? value.heldCardIds?.includes(event.sourceId) : ['independent','edition'].includes(event.phase) && state.jokers.some(j=>j.id===event.sourceId));
    }
    previous=after;return {...event,before,after};
  });
  const luckyFields=['luckyRolls','luckyRngKind','luckyRngBefore','luckyRngAfter'],hasLucky=luckyFields.some(key=>Object.hasOwn(value,key));
  requireValue(!hasLucky||luckyFields.every(key=>Object.hasOwn(value,key)));
  if(hasLucky){
    requireValue(['apk','effects'].includes(value.luckyRngKind)&&Array.isArray(value.luckyRolls)&&value.luckyRolls.length>=1&&value.luckyRolls.length<=5);
    for(const roll of value.luckyRolls){object(roll,['cardId','multRoll','moneyRoll','multTriggered','moneyTriggered']);requireValue(value.scoringCardIds.includes(roll.cardId)&&Number.isFinite(roll.multRoll)&&roll.multRoll>=0&&roll.multRoll<1&&Number.isFinite(roll.moneyRoll)&&roll.moneyRoll>=0&&roll.moneyRoll<1&&typeof roll.multTriggered==='boolean'&&typeof roll.moneyTriggered==='boolean');}
    if(value.luckyRngKind==='apk'){
      requireValue(state.rng.apk);object(value.luckyRngBefore,['lucky_mult','lucky_money']);object(value.luckyRngAfter,['lucky_mult','lucky_money','mathState']);for(const snapshot of [value.luckyRngBefore,value.luckyRngAfter])for(const key of ['lucky_mult','lucky_money'])requireValue(snapshot[key]===null||Number.isFinite(snapshot[key])&&snapshot[key]>=0&&snapshot[key]<=1);validateApkRng({...state.rng.apk,mathState:value.luckyRngAfter.mathState});
      requireValue(['lucky_mult','lucky_money'].every(key=>value.luckyRngAfter[key]===(state.rng.apk.streams[key]??null)));
    }
    else{randomInt(value.luckyRngBefore,1);randomInt(value.luckyRngAfter,1);requireValue(JSON.stringify(value.luckyRngAfter)===JSON.stringify(state.rng.effects));}
  }
  const glassFields=['glassRolls','glassRngKind','glassRngBefore','glassRngAfter','glassDestroyedCards'],hasGlass=glassFields.some(key=>Object.hasOwn(value,key));
  requireValue(!hasGlass||glassFields.every(key=>Object.hasOwn(value,key)));
  if(hasGlass){
    requireValue(['apk','effects'].includes(value.glassRngKind)&&Array.isArray(value.glassRolls)&&value.glassRolls.length>=1&&value.glassRolls.length<=5&&new Set(value.glassRolls.map(roll=>roll.cardId)).size===value.glassRolls.length);
    for(const roll of value.glassRolls){object(roll,['cardId','roll','destroyed']);const source=scoreCards[roll.cardId];requireValue(value.scoringCardIds.includes(roll.cardId)&&source?.enhancement==='glass'&&Number.isFinite(roll.roll)&&roll.roll>=0&&roll.roll<1&&typeof roll.destroyed==='boolean'&&roll.destroyed===(roll.roll<1/4));}
    requireValue(JSON.stringify(glassDestroyedCards.map(card=>card.id))===JSON.stringify(value.glassRolls.filter(roll=>roll.destroyed).map(roll=>roll.cardId)));
    if(value.glassRngKind==='apk'){
      requireValue(state.rng.apk);object(value.glassRngBefore,['glass']);object(value.glassRngAfter,['glass','mathState']);for(const snapshot of [value.glassRngBefore,value.glassRngAfter])requireValue(snapshot.glass===null||Number.isFinite(snapshot.glass)&&snapshot.glass>=0&&snapshot.glass<=1);validateApkRng({...state.rng.apk,mathState:value.glassRngAfter.mathState});
      requireValue(value.glassRngAfter.glass===(state.rng.apk.streams.glass??null)&&JSON.stringify(value.glassRngAfter.mathState)===JSON.stringify(state.rng.apk.mathState));
    }else{randomInt(value.glassRngBefore,1);randomInt(value.glassRngAfter,1);requireValue(JSON.stringify(value.glassRngAfter)===JSON.stringify(state.rng.effects));}
  }else requireValue(glassDestroyedCards.length===0);
  let scoringState=state;
  if(hasLucky){
    if(value.luckyRngKind==='apk'){
      const apk=structuredClone(state.rng.apk);for(const key of ['lucky_mult','lucky_money']){const stream=value.luckyRngBefore[key];if(stream===null)delete apk.streams[key];else apk.streams[key]=stream;}
      scoringState={...state,rng:{...state.rng,apk}};
    }else scoringState={...state,rng:{...state.rng,effects:structuredClone(value.luckyRngBefore)}};
  }
  if(hasGlass){
    if(value.glassRngKind==='apk'){
      const apk=structuredClone(scoringState.rng.apk),stream=value.glassRngBefore.glass;if(stream===null)delete apk.streams.glass;else apk.streams.glass=stream;
      scoringState={...scoringState,rng:{...scoringState.rng,apk}};
    }else scoringState={...scoringState,rng:{...scoringState.rng,effects:structuredClone(value.glassRngBefore)}};
  }
  if(state.bossState?.id==='bl_eye'||state.bossState?.id==='bl_mouth'){
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
  }else requireValue(value.bossHistory===undefined);
  scoringState={...scoringState,cards:scoreCards};if(value.heldCardIds)scoringState={...scoringState,hand:[...value.heldCardIds]};
  const expected=scoreHand(scoringState,(value.playedCardIds??value.scoringCardIds).map(key=>scoreCards[key]));
  requireValue(expected.handDebuffed===value.handDebuffed && expected.handId===value.handId && expected.isRoyal===value.isRoyal && expected.chips===chips && equalExact(expected.mult,mult) && expected.score===score);
  requireValue(expected.scoringCardIds.length===value.scoringCardIds.length && expected.scoringCardIds.every((key,i)=>key===value.scoringCardIds[i]));
  requireValue((expected.heldCardIds===undefined)===(value.heldCardIds===undefined)&&(!value.heldCardIds||expected.heldCardIds.every((key,i)=>key===value.heldCardIds[i])&&expected.heldCardIds.length===value.heldCardIds.length));
  requireValue(expected.trace.length===trace.length && expected.trace.every((event,i)=>{
    const actual=trace[i];
    if(event.phase!==actual.phase||event.type!==actual.type)return false;
    if(event.type==='score_total')return true;
    if(event.type==='score_money')return event.sourceId===actual.sourceId&&event.amount===actual.amount;
    return event.sourceId===actual.sourceId && event.effectSourceId===actual.effectSourceId && event.operation===actual.operation && event.before.chips===actual.before.chips && equalExact(event.before.mult,actual.before.mult) && event.after.chips===actual.after.chips && equalExact(event.after.mult,actual.after.mult);
  }));
  requireValue(!hasLucky||JSON.stringify({rolls:expected.luckyRolls,kind:expected.luckyRngKind,before:expected.luckyRngBefore,after:expected.luckyRngAfter})===JSON.stringify({rolls:value.luckyRolls,kind:value.luckyRngKind,before:value.luckyRngBefore,after:value.luckyRngAfter}));
  requireValue(!hasGlass||JSON.stringify({rolls:expected.glassRolls,kind:expected.glassRngKind,before:expected.glassRngBefore,after:expected.glassRngAfter,destroyed:expected.glassDestroyedCards})===JSON.stringify({rolls:value.glassRolls,kind:value.glassRngKind,before:value.glassRngBefore,after:value.glassRngAfter,destroyed:glassDestroyedCards}));
  return {...value,chips,mult,score,trace};
}
function decode(payload) {
  object(payload,['format','version','state']);requireValue(payload.format==='card-cascade-save' && payload.version===1);
  const state=payload.state;
  const sortMode=state.sortMode;
  if(Object.hasOwn(state,'sortMode'))requireValue(['rank','suit'].includes(sortMode));
  optionalObject(state,['schemaVersion','runId','seed','revision','phase','deckId','cards','hand','drawPile','discardPile','jokers','handLevels','discoveredHands','rng','money','round','lastScore'],['shop','bankruptAt','jokerSlots','apkShop','sortMode','roundNumber','apkBlinds','bossState','nextAnteBlinds','runStats','consumables','consumableSlots','mostPlayedHand','consumableUsage','consumableUsageTotal','lastTarotPlanet','packState','destroyedCardIds','hangedDestroyedCardIds','hangedShortfallCardIds']);
  requireValue(validConsumableUsage(state));
  if(Object.hasOwn(state,'mostPlayedHand'))requireValue(state.mostPlayedHand===null||Object.hasOwn(HANDS,state.mostPlayedHand));
  requireValue(state.schemaVersion===1 && PHASES.includes(state.phase) && ['red','blue'].includes(state.deckId));
  requireValue(typeof state.runId==='string' && state.runId.length>=1 && state.runId.length<=120);
  requireValue(typeof state.seed==='string' && state.seed.length>=1 && state.seed.length<=1000);integer(state.revision);
  requireValue(state.cards!==null && typeof state.cards==='object' && !Array.isArray(state.cards));
  const cardIds=Object.keys(state.cards);requireValue(cardIds.length<=10000);
  for(const key of cardIds) { id(key);optionalObject(state.cards[key],['id','rank','suit'],['enhancement']);requireValue(state.cards[key].id===key);evaluateHand([state.cards[key]]); }
  if(Object.hasOwn(state,'destroyedCardIds')){
    const baseIds=new Set(APK_BASE_CARD_IDS),missing=APK_BASE_CARD_IDS.filter(key=>!Object.hasOwn(state.cards,key));
    requireValue(Array.isArray(state.destroyedCardIds)&&state.destroyedCardIds.length>=1&&state.destroyedCardIds.length===missing.length&&new Set(state.destroyedCardIds).size===state.destroyedCardIds.length&&state.destroyedCardIds.every(key=>baseIds.has(key)&&!Object.hasOwn(state.cards,key)));
  }
  if(Object.hasOwn(state,'hangedDestroyedCardIds')){
    const destroyed=state.destroyedCardIds??[],uses=state.consumableUsage?.c_hanged_man?.count??0;
    requireValue(Array.isArray(state.hangedDestroyedCardIds)&&state.hangedDestroyedCardIds.length>=1&&new Set(state.hangedDestroyedCardIds).size===state.hangedDestroyedCardIds.length&&state.hangedDestroyedCardIds.every(key=>destroyed.includes(key))&&Math.ceil(state.hangedDestroyedCardIds.length/2)<=uses);
  }
  requireValue(cardIds.length>0||state.destroyedCardIds?.length===APK_BASE_CARD_IDS.length);
  const partitions=[state.hand,state.drawPile,state.discardPile];requireValue(partitions.every(Array.isArray));
  const all=partitions.flat();requireValue(all.length===cardIds.length && new Set(all).size===all.length && all.every(key=>Object.hasOwn(state.cards,key)));
  if(Object.hasOwn(state,'runStats')){object(state.runStats,['handsPlayed','unusedDiscards','skips']);for(const count of Object.values(state.runStats))integer(count);}
  if(Object.hasOwn(state,'hangedShortfallCardIds')){
    const destroyed=state.hangedDestroyedCardIds??[],suffix=destroyed.slice(-state.hangedShortfallCardIds.length);
    requireValue(Array.isArray(state.hangedShortfallCardIds)&&state.hangedShortfallCardIds.length>=1&&new Set(state.hangedShortfallCardIds).size===state.hangedShortfallCardIds.length&&state.hangedShortfallCardIds.every(key=>destroyed.includes(key))&&JSON.stringify(suffix)===JSON.stringify(state.hangedShortfallCardIds));
  }
  if(Object.hasOwn(state,'jokerSlots'))integer(state.jokerSlots,0,10000);
  if(Object.hasOwn(state,'bankruptAt'))state.bankruptAt=decimal(state.bankruptAt,true);
  requireValue(Array.isArray(state.jokers) && state.jokers.length<=10000);
  requireValue(state.jokers.length<=(state.jokerSlots??5)+state.jokers.filter(j=>j.edition==='negative').length);
  const jokerIds=new Set(cardIds);
  for(const joker of state.jokers)decodeOffer(joker,jokerIds,true);
  if(Object.hasOwn(state,'consumableSlots'))integer(state.consumableSlots,0,10000);
  if(Object.hasOwn(state,'consumables')){
    // Capacity limits acquisition, not persisted inventory: consuming a
    // Negative generator can legally leave cards above the final limit.
    requireValue(Array.isArray(state.consumables)&&state.consumables.length<=10000);
    for(const card of state.consumables)decodeOffer(card,jokerIds,true,true);
  }
  if(Object.hasOwn(state,'shop'))decodeShop(state.shop,jokerIds);
  if(Object.hasOwn(state,'packState'))decodePackState(state.packState,state,jokerIds);else requireValue(state.phase!=='pack');
  object(state.handLevels,Object.keys(HANDS));for(const level of Object.values(state.handLevels))integer(level,1);
  requireValue(Array.isArray(state.discoveredHands) && new Set(state.discoveredHands).size===state.discoveredHands.length && state.discoveredHands.every(key=>Object.hasOwn(HANDS,key)));
  optionalObject(state.rng,['deck','effects'],['shop','apk']);
  for(const key of ['deck','effects','shop'])if(Object.hasOwn(state.rng,key)) {const rng=state.rng[key];object(rng,['algorithm','state']);randomInt(rng,1);}
  if(Object.hasOwn(state.rng,'apk'))decodeApkRng(state.rng.apk,state.seed);
  state.money=decimal(state.money,true);
  object(state.round,['blindId','ante','target','score','handsRemaining','discardsRemaining','handSize']);
  if(Object.hasOwn(state,'roundNumber'))integer(state.roundNumber,1,24);
  const round=state.round;requireValue(['small','big','boss'].includes(round.blindId));integer(round.ante,1,8);integer(round.handsRemaining,0,state.deckId==='blue'?5:4);integer(round.discardsRemaining,0,state.deckId==='red'?4:3);integer(round.handSize,1,10000);
  if(Object.hasOwn(state,'hangedShortfallCardIds'))requireValue(['playing','round_won'].includes(state.phase)&&(state.phase==='round_won'||!state.drawPile.length||state.bossState?.id==='bl_serpent'||state.hand.length+state.hangedShortfallCardIds.length===round.handSize));
  round.target=decimal(round.target);round.score=decimal(round.score);requireValue(round.target>0n);
  if(Object.hasOwn(state,'apkShop'))decodeApkShop(state.apkShop,state);
  if(Object.hasOwn(state,'apkBlinds'))decodeApkBlinds(state.apkBlinds,state);
  if(Object.hasOwn(state,'nextAnteBlinds')){
    requireValue(['shop','pack'].includes(state.phase)&&round.blindId==='boss'&&round.ante<8&&state.nextAnteBlinds.playedCardIds?.length===0);
    decodeApkBlinds(state.nextAnteBlinds,{...state,round:{...round,ante:round.ante+1}},true);
  }
  if(Object.hasOwn(state,'bossState'))decodeBoss(state.bossState,state);
  if(round.blindId==='boss'){
    requireValue(canEnterBoss(state)&&round.target===bossTarget(state));
    requireValue(['playing','round_won','game_over'].includes(state.phase)?!!state.bossState:!state.bossState&&round.handSize===8);
  }
  if(state.phase==='round_won')requireValue(round.score>=round.target);
  if(['shop','pack'].includes(state.phase))requireValue(round.score>=round.target && state.hand.length===0 && state.discardPile.length===0 && state.drawPile.length===cardIds.length && state.lastScore===null);
  if(state.phase==='game_over')requireValue(round.handsRemaining===0 && round.score<round.target);
  if(state.phase==='playing')requireValue(round.handsRemaining>0 && round.score<round.target && (state.hand.length+(state.hangedShortfallCardIds?.length??0)>=round.handSize || state.drawPile.length===0 || state.bossState?.id==='bl_serpent'));
  if(state.phase==='blind_selection')requireValue(state.hand.length===0 && state.discardPile.length===0 && round.score===0n);
  state.lastScore=decodeScore(state.lastScore,state);
  if(state.lastScore!==null)requireValue(state.lastScore.score<=round.score);
  if(sortMode!==undefined)state.sortMode=sortMode;
  return state;
}
export function serializeState(state) {
  requireValue(typeof state.money==='bigint' && typeof state.round.target==='bigint' && typeof state.round.score==='bigint');
  const payload={format:'card-cascade-save',version:1,state:{...state,money:state.money.toString(),round:{...state.round,target:state.round.target.toString(),score:state.round.score.toString()},lastScore:encodeScore(state.lastScore)}};
  if(Object.hasOwn(state,'bankruptAt')) {requireValue(typeof state.bankruptAt==='bigint');payload.state.bankruptAt=state.bankruptAt.toString();}
  if(state.consumables)payload.state.consumables=state.consumables.map(encodeOffer);
  if(state.jokers.some(j=>Object.hasOwn(j,'cost') || Object.hasOwn(j,'sellCost')))payload.state.jokers=state.jokers.map(encodeOffer);
  if(Object.hasOwn(state,'shop') && state.shop!==null) {
    requireValue(typeof state.shop.rerollBase==='bigint' && typeof state.shop.rerollIncrease==='bigint');
    payload.state.shop={...state.shop,main:state.shop.main.map(encodeOffer),vouchers:state.shop.vouchers.map(encodeOffer),boosters:state.shop.boosters.map(encodeOffer),rerollBase:state.shop.rerollBase.toString(),rerollIncrease:state.shop.rerollIncrease.toString()};
  }
  if(Object.hasOwn(state,'packState'))payload.state.packState={...state.packState,cards:state.packState.cards.map(encodeOffer)};
  const text=JSON.stringify(payload);
  deserializeState(text); // Validate the exact bytes that will be stored.
  return text;
}
export function deserializeState(text) {
  requireValue(typeof text==='string' && text.length<=LIMIT && new TextEncoder().encode(text).length<=LIMIT);
  return decode(JSON.parse(text));
}




