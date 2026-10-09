import {canonicalCards} from './apk-deck.js';
import {nextApkRandom,validateApkRng} from './apk-rng.js';
import {APK_BOSSES,APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {APK_HAND_NAMES} from './apk-shop-state.js';
export const FIRST_ANTE_BOSSES=Object.freeze(['bl_hook','bl_club','bl_manacle','bl_psychic','bl_goad','bl_window','bl_head','bl_pillar']);
export const SUPPORTED_BOSSES=Object.freeze(APK_BOSSES.filter(boss=>!boss.showdown).map(boss=>boss.id));
const anteBases=[300n,800n,2000n,5000n,11000n,20000n,35000n,50000n];
const suits={bl_club:'clubs',bl_goad:'spades',bl_window:'diamonds',bl_head:'hearts'};
export function canEnterBoss(state){
 const ante=state.round?.ante,boss=APK_BLINDS_BY_ID[state.apkBlinds?.bossId];
 if(!Number.isSafeInteger(ante)||ante<1||ante>8||!boss||!SUPPORTED_BOSSES.includes(boss.id)||boss.minAnte>ante||!Array.isArray(state.apkBlinds.playedCardIds)||!state.rng?.apk)return false;
 if(boss.id==='bl_ox'&&state.phase!=='shop'&&!Object.hasOwn(APK_HAND_NAMES,state.mostPlayedHand))return false;
 try{canonicalCards(state.cards);}catch{return false;}return true;
}
export function bossTarget(state){
 const ante=state.round?.ante,boss=APK_BLINDS_BY_ID[state.apkBlinds?.bossId];
 if(!Number.isSafeInteger(ante)||ante<1||ante>8||!boss||!SUPPORTED_BOSSES.includes(boss.id))throw new RangeError('Unsupported boss target');
 return anteBases[ante-1]*BigInt(boss.mult);
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
 return !!boss && (suits[boss.id]===card.suit || boss.id==='bl_pillar'&&boss.playedBeforeBoss.includes(card.id) || boss.id==='bl_plant'&&card.rank>=11&&card.rank<=13);
}
export function isBossHandDebuffed(state,cards,handId){
 const boss=state.bossState;
 return !!boss && (boss.id==='bl_psychic'&&cards.length<5 || boss.id==='bl_eye'&&!!boss.playedHands?.includes(handId) || boss.id==='bl_mouth'&&!!boss.firstHand&&boss.firstHand!==handId);
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

