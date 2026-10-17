import {APK_TAGS_BY_ID} from '../content/apk-tags.js';
import {APK_HAND_NAMES} from './apk-shop-state.js';
import {canEnterBoss,bossTarget} from './boss-effects.js';
import {chooseApkBoss} from './apk-blinds.js';
import {nativeBlindTarget} from './blind-progression.js';

const handIds=Object.fromEntries(Object.entries(APK_HAND_NAMES).map(([id,name])=>[name,id]));
const immediate=new Set(['tag_handy','tag_garbage','tag_skip','tag_economy','tag_orbital','tag_boss']);
const reasons={
 tag_investment:'Награда после победы над боссом ещё не реализована.',
 tag_double:'Копирование следующей награды ещё не реализовано.',
 tag_juggle:'Временное увеличение руки ещё не реализовано.',
 tag_d_six:'Изменение цены обновлений следующего магазина ещё не реализовано.',
 tag_top_up:'Создание случайных обычных джокеров ещё не реализовано.',
 tag_voucher:'Дополнительный ваучер следующего магазина ещё не реализован.',
 tag_coupon:'Бесплатные начальные товары следующего магазина ещё не реализованы.',
};
function blocked(reason,tagId){return {available:false,reason,tagId};}
function validStats(stats){return stats&&['handsPlayed','unusedDiscards','skips'].every(key=>Number.isSafeInteger(stats[key])&&stats[key]>=0)&&stats.skips<Number.MAX_SAFE_INTEGER;}
// Read-only capability query. It never polls a different pool or grants a placeholder.
export function getSkipAvailability(state,blindId=state.round?.blindId){
 const tagId=state.apkBlinds?.tags?.[blindId];
 if(state.phase!=='blind_selection'||!['small','big'].includes(blindId)||blindId!==state.round?.blindId)return blocked('Пропуск доступен только для текущего малого или большого блайнда.',tagId);
 if(!state.apkShop||!state.rng?.apk||!APK_TAGS_BY_ID[tagId])return blocked('Нет сохранённой награды для этого блайнда.',tagId);
 if(!validStats(state.runStats))return blocked('В этом сохранении нет точных счётчиков забега. Пропуск доступен в новом забеге.',tagId);
 if(blindId==='big'&&!canEnterBoss(state))return blocked('Эффект следующего босса или его точное состояние ещё недоступны.',tagId);
 if(!immediate.has(tagId)){
  const reason=reasons[tagId]??(['tag_standard','tag_charm','tag_meteor','tag_buffoon','tag_ethereal'].includes(tagId)?'Открытие и выбор карт бесплатного набора ещё не реализованы.':'Награда для джокера следующего магазина ещё не реализована.');
  return blocked(reason,tagId);
 }
 if(typeof state.money!=='bigint')return blocked('Некорректный баланс забега.',tagId);
 if(tagId==='tag_orbital'){
  const handId=handIds[state.apkBlinds.orbitalHands?.[blindId]],level=state.handLevels?.[handId];
  if(!handId||!Number.isSafeInteger(level)||level<1||level>Number.MAX_SAFE_INTEGER-3)return blocked('Не сохранена точная комбинация орбитальной награды.',tagId);
 }
 if(tagId==='tag_boss'){
  try{
   const selected=chooseApkBoss(state.rng.apk,{ante:state.round.ante,bossesUsed:state.apkBlinds.bossesUsed});
   if(!canEnterBoss({...state,apkBlinds:{...state.apkBlinds,bossId:selected.bossId}}))return blocked('Эффект выпавшего при замене босса ещё не реализован.',tagId);
  }catch{return blocked('Недоступны точные данные для замены босса.',tagId);}
 }
 return {available:true,reason:null,tagId};
}
export function applySkipBlind(state,action){
 const availability=getSkipAvailability(state,action.blindId??state.round.blindId);
 if(!availability.available)return {state,events:[],error:{code:'SKIP_UNAVAILABLE',message:availability.reason}};
 const next=structuredClone(state),tagId=availability.tagId,skipped=state.round.blindId,events=[];
 next.runStats.skips++;
 let delta=0n;
 if(tagId==='tag_skip')delta=5n*BigInt(next.runStats.skips);
 if(tagId==='tag_handy')delta=BigInt(next.runStats.handsPlayed);
 if(tagId==='tag_garbage')delta=BigInt(next.runStats.unusedDiscards);
 if(tagId==='tag_economy')delta=state.money<0n?0n:state.money>40n?40n:state.money;
 if(tagId==='tag_orbital'){
  const handId=handIds[next.apkBlinds.orbitalHands[skipped]];next.handLevels[handId]+=3;
  events.push({type:'hand_level_changed',handId,levels:3,level:next.handLevels[handId]});
 }
 if(tagId==='tag_boss'){
  const selected=chooseApkBoss(next.rng.apk,{ante:next.round.ante,bossesUsed:next.apkBlinds.bossesUsed});
  next.apkBlinds.bossId=selected.bossId;next.apkBlinds.bossesUsed=selected.bossesUsed;next.rng.apk=selected.rng;
  events.push({type:'boss_rerolled',bossId:selected.bossId});
 }
 next.money+=delta;
 if(delta)events.push({type:'money_changed',before:state.money,after:next.money,delta});
 const blindId=skipped==='small'?'big':'boss';
 next.round={...next.round,blindId,target:blindId==='boss'?bossTarget(next):nativeBlindTarget(next.round.ante,1.5),score:0n,handsRemaining:next.deckId==='blue'?5:4,discardsRemaining:next.deckId==='red'?4:3};
 next.lastScore=null;next.revision++;
 events.unshift({type:'blind_skipped',blindId:skipped,nextBlindId:blindId,tagId});
 return {state:next,events,error:null};
}

