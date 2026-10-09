import {canEnterFirstAnteBoss} from '../core/boss-effects.js';
import {APK_BOSSES,APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {createApkTagContext,getApkTagPool} from '../core/apk-tags.js';
import { apkPseudoHash, validateApkRng } from '../core/apk-rng.js';
import { HANDS } from '../content/hands.js';
import { SUPPORTED_JOKERS,supportsJoker } from '../content/jokers.js';
import { evaluateHand } from '../core/hands.js';
import { randomInt } from '../core/rng.js';
import { scoreHand } from '../core/score.js';
import catalogue from '../content/apk-shop-catalog.js';
import {createApkShopContext} from '../core/apk-shop.js';
const centres=new Map(catalogue.centres.map(c=>[c.key,c]));
const handNames=new Set(catalogue.centres.filter(c=>c.set==='Planet').map(c=>c.handType));

const LIMIT=2*1024*1024;
const PHASES=['blind_selection','playing','round_won','game_over','shop'];
function requireValue(condition) { if (!condition) throw new TypeError('Invalid save data'); }
function object(value,keys) {
  requireValue(value!==null && typeof value==='object' && !Array.isArray(value));
  requireValue(Object.keys(value).length===keys.length && keys.every(key=>Object.hasOwn(value,key)));
}
function optionalObject(value,required,optional=[]) {
  requireValue(value!==null && typeof value==='object' && !Array.isArray(value));
  requireValue(required.every(key=>Object.hasOwn(value,key)) && Object.keys(value).every(key=>required.includes(key) || optional.includes(key)));
}
function decodeOffer(value,ids,owned=false) {
  optionalObject(value,owned?['id','entityId']:['id','entityId','cost','sellCost'],['cost','sellCost','edition','eternal','rental','perishable','debuffed','originalKey','set','frontKey','toDoPokerHand']);
  id(value.id);id(value.entityId);requireValue(!ids.has(value.id));ids.add(value.id);
  if(owned)requireValue(supportsJoker(value));
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
  requireValue(value.context.ante===state.round.ante+(state.phase==='shop'&&state.round.blindId==='boss'?1:0));
  if(state.phase==='shop'){
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
 object(value,['version','id','playedBeforeBoss','baseHandSize']);
 requireValue(value.version===1&&value.id===state.apkBlinds?.bossId&&canEnterFirstAnteBoss(state));
 requireValue(state.round.blindId==='boss'&&['playing','round_won','game_over'].includes(state.phase)&&state.roundNumber===3&&value.baseHandSize===8);
 cardList(value.playedBeforeBoss,state);requireValue(value.playedBeforeBoss.every(id=>state.apkBlinds.playedCardIds.includes(id)));
 requireValue(state.round.handSize===(value.id==='bl_manacle'?7:8));
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
function pair(value) { object(value,['chips','mult']);return {chips:decimal(value.chips),mult:decimal(value.mult)}; }
function encodeScore(score) {
  if(score===null)return null;
  return {...score,chips:score.chips.toString(),mult:score.mult.toString(),score:score.score.toString(),trace:score.trace.map(event=>event.type==='score_total'
    ? {...event,chips:event.chips.toString(),mult:event.mult.toString(),score:event.score.toString()}
    : {...event,before:{chips:event.before.chips.toString(),mult:event.before.mult.toString()},after:{chips:event.after.chips.toString(),mult:event.after.mult.toString()}})};
}
function decodeScore(value,state) {
  if(value===null)return null;
  optionalObject(value,['handId','isRoyal','scoringCardIds','chips','mult','score','trace'],['playedCardIds','handDebuffed']);
  if(Object.hasOwn(value,'handDebuffed'))requireValue(value.handDebuffed===true);
  if(value.playedCardIds)requireValue(Array.isArray(value.playedCardIds)&&value.playedCardIds.length>=1&&value.playedCardIds.length<=5&&new Set(value.playedCardIds).size===value.playedCardIds.length&&value.playedCardIds.every(id=>Object.hasOwn(state.cards,id))); 
  requireValue(Object.hasOwn(HANDS,value.handId) && typeof value.isRoyal==='boolean');
  requireValue(!value.isRoyal || value.handId==='straight_flush');
  requireValue(Array.isArray(value.scoringCardIds) && value.scoringCardIds.length>=0 && value.scoringCardIds.length<=5);
  requireValue(new Set(value.scoringCardIds).size===value.scoringCardIds.length && value.scoringCardIds.every(key=>Object.hasOwn(state.cards,key)));
  const chips=decimal(value.chips),mult=decimal(value.mult),score=decimal(value.score);
  requireValue(score===chips*mult && Array.isArray(value.trace) && value.trace.length>=2 && value.trace.length<=10000);
  let previous={chips:0n,mult:0n};
  const trace=value.trace.map((event,i)=>{
    if(i===value.trace.length-1) {
      object(event,['type','phase','chips','mult','score']);
      requireValue(event.type==='score_total' && event.phase==='total');
      const total={...event,chips:decimal(event.chips),mult:decimal(event.mult),score:decimal(event.score)};
      requireValue(total.chips===chips && total.mult===mult && total.score===score && previous.chips===chips && previous.mult===mult);
      return total;
    }
    optionalObject(event,['type','phase','sourceId','operation','before','after'],['effectSourceId']);
    if(event.effectSourceId)requireValue(state.jokers.some(j=>j.id===event.effectSourceId));
    const before=pair(event.before),after=pair(event.after);
    requireValue(event.type==='score_step' && before.chips===previous.chips && before.mult===previous.mult);
    if(i===0) requireValue(event.phase==='base' && event.operation==='base' && event.sourceId===`hand:${value.handId}`);
    else {
      requireValue(['add_chips','add_mult','multiply_mult'].includes(event.operation));
      requireValue(event.operation==='add_chips' ? after.chips>=before.chips && after.mult===before.mult : after.mult>=before.mult && after.chips===before.chips);
      requireValue(event.phase==='scored_card' ? value.scoringCardIds.includes(event.sourceId) : ['independent','edition'].includes(event.phase) && state.jokers.some(j=>j.id===event.sourceId));
    }
    previous=after;return {...event,before,after};
  });
  const expected=scoreHand(state,(value.playedCardIds??value.scoringCardIds).map(key=>state.cards[key]));
  requireValue(expected.handDebuffed===value.handDebuffed && expected.handId===value.handId && expected.isRoyal===value.isRoyal && expected.chips===chips && expected.mult===mult && expected.score===score);
  requireValue(expected.scoringCardIds.length===value.scoringCardIds.length && expected.scoringCardIds.every((key,i)=>key===value.scoringCardIds[i]));
  requireValue(expected.trace.length===trace.length && expected.trace.every((event,i)=>{
    const actual=trace[i];
    return event.phase===actual.phase && (event.type==='score_total' || event.sourceId===actual.sourceId && event.effectSourceId===actual.effectSourceId && event.operation===actual.operation && event.before.chips===actual.before.chips && event.before.mult===actual.before.mult && event.after.chips===actual.after.chips && event.after.mult===actual.after.mult);
  }));
  return {...value,chips,mult,score,trace};
}
function decode(payload) {
  object(payload,['format','version','state']);requireValue(payload.format==='card-cascade-save' && payload.version===1);
  const state=payload.state;
  const sortMode=state.sortMode;
  if(Object.hasOwn(state,'sortMode'))requireValue(['rank','suit'].includes(sortMode));
  optionalObject(state,['schemaVersion','runId','seed','revision','phase','deckId','cards','hand','drawPile','discardPile','jokers','handLevels','discoveredHands','rng','money','round','lastScore'],['shop','bankruptAt','jokerSlots','apkShop','sortMode','roundNumber','apkBlinds','bossState','nextAnteBlinds']);
  requireValue(state.schemaVersion===1 && PHASES.includes(state.phase) && ['red','blue'].includes(state.deckId));
  requireValue(typeof state.runId==='string' && state.runId.length>=1 && state.runId.length<=120);
  requireValue(typeof state.seed==='string' && state.seed.length>=1 && state.seed.length<=1000);integer(state.revision);
  requireValue(state.cards!==null && typeof state.cards==='object' && !Array.isArray(state.cards));
  const cardIds=Object.keys(state.cards);requireValue(cardIds.length>=1 && cardIds.length<=10000);
  for(const key of cardIds) { id(key);object(state.cards[key],['id','rank','suit']);requireValue(state.cards[key].id===key);evaluateHand([state.cards[key]]); }
  const partitions=[state.hand,state.drawPile,state.discardPile];requireValue(partitions.every(Array.isArray));
  const all=partitions.flat();requireValue(all.length===cardIds.length && new Set(all).size===all.length && all.every(key=>Object.hasOwn(state.cards,key)));
  if(Object.hasOwn(state,'jokerSlots'))integer(state.jokerSlots,0,10000);
  if(Object.hasOwn(state,'bankruptAt'))state.bankruptAt=decimal(state.bankruptAt,true);
  requireValue(Array.isArray(state.jokers) && state.jokers.length<=10000);
  requireValue(state.jokers.length<=(state.jokerSlots??5)+state.jokers.filter(j=>j.edition==='negative').length);
  const jokerIds=new Set(cardIds);
  for(const joker of state.jokers)decodeOffer(joker,jokerIds,true);
  if(Object.hasOwn(state,'shop'))decodeShop(state.shop,jokerIds);
  object(state.handLevels,Object.keys(HANDS));for(const level of Object.values(state.handLevels))integer(level,1);
  requireValue(Array.isArray(state.discoveredHands) && new Set(state.discoveredHands).size===state.discoveredHands.length && state.discoveredHands.every(key=>Object.hasOwn(HANDS,key)));
  optionalObject(state.rng,['deck','effects'],['shop','apk']);
  for(const key of ['deck','effects','shop'])if(Object.hasOwn(state.rng,key)) {const rng=state.rng[key];object(rng,['algorithm','state']);randomInt(rng,1);}
  if(Object.hasOwn(state.rng,'apk'))decodeApkRng(state.rng.apk,state.seed);
  state.money=decimal(state.money,true);
  object(state.round,['blindId','ante','target','score','handsRemaining','discardsRemaining','handSize']);
  if(Object.hasOwn(state,'roundNumber'))integer(state.roundNumber,1,6);
  const round=state.round;requireValue(['small','big','boss'].includes(round.blindId));integer(round.ante,1,8);integer(round.handsRemaining,0,state.deckId==='blue'?5:4);integer(round.discardsRemaining,0,state.deckId==='red'?4:3);integer(round.handSize,1,10000);
  round.target=decimal(round.target);round.score=decimal(round.score);requireValue(round.target>0n);
  if(Object.hasOwn(state,'apkShop'))decodeApkShop(state.apkShop,state);
  if(Object.hasOwn(state,'apkBlinds'))decodeApkBlinds(state.apkBlinds,state);
  if(Object.hasOwn(state,'nextAnteBlinds')){
    requireValue(state.phase==='shop'&&round.blindId==='boss'&&round.ante===1&&state.nextAnteBlinds.playedCardIds?.length===0);
    decodeApkBlinds(state.nextAnteBlinds,{...state,round:{...round,ante:2}},true);
  }
  if(Object.hasOwn(state,'bossState'))decodeBoss(state.bossState,state);
  if(round.blindId==='boss'){
    requireValue(canEnterFirstAnteBoss(state)&&round.target===600n);
    requireValue(['playing','round_won','game_over'].includes(state.phase)?!!state.bossState:!state.bossState&&round.handSize===8);
  }
  if(state.phase==='round_won')requireValue(round.score>=round.target);
  if(state.phase==='shop')requireValue(round.score>=round.target && state.hand.length===0 && state.discardPile.length===0 && state.drawPile.length===cardIds.length && state.lastScore===null);
  if(state.phase==='game_over')requireValue(round.handsRemaining===0 && round.score<round.target);
  if(state.phase==='playing')requireValue(round.handsRemaining>0 && round.score<round.target && state.hand.length>0 && (state.hand.length>=round.handSize || state.drawPile.length===0));
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
  if(state.jokers.some(j=>Object.hasOwn(j,'cost') || Object.hasOwn(j,'sellCost')))payload.state.jokers=state.jokers.map(encodeOffer);
  if(Object.hasOwn(state,'shop') && state.shop!==null) {
    requireValue(typeof state.shop.rerollBase==='bigint' && typeof state.shop.rerollIncrease==='bigint');
    payload.state.shop={...state.shop,main:state.shop.main.map(encodeOffer),vouchers:state.shop.vouchers.map(encodeOffer),boosters:state.shop.boosters.map(encodeOffer),rerollBase:state.shop.rerollBase.toString(),rerollIncrease:state.shop.rerollIncrease.toString()};
  }
  const text=JSON.stringify(payload);
  deserializeState(text); // Validate the exact bytes that will be stored.
  return text;
}
export function deserializeState(text) {
  requireValue(typeof text==='string' && text.length<=LIMIT && new TextEncoder().encode(text).length<=LIMIT);
  return decode(JSON.parse(text));
}


