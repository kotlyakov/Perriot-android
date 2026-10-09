import {canonicalCards} from './apk-deck.js';
import {nextApkRandom,validateApkRng} from './apk-rng.js';
export const FIRST_ANTE_BOSSES=Object.freeze(['bl_hook','bl_club','bl_manacle','bl_psychic','bl_goad','bl_window','bl_head','bl_pillar']);
const suits={bl_club:'clubs',bl_goad:'spades',bl_window:'diamonds',bl_head:'hearts'};
export function canEnterFirstAnteBoss(state){
 if(!(state.round?.ante===1 && FIRST_ANTE_BOSSES.includes(state.apkBlinds?.bossId) && Array.isArray(state.apkBlinds.playedCardIds) && state.rng?.apk))return false;
 try{canonicalCards(state.cards);}catch{return false;}return true;
}
export function isBossCardDebuffed(state,card){
 const boss=state.bossState;
 return !!boss && (suits[boss.id]===card.suit || boss.id==='bl_pillar'&&boss.playedBeforeBoss.includes(card.id));
}
export function isBossHandDebuffed(state,cards){return state.bossState?.id==='bl_psychic'&&cards.length<5;}
export function chooseHookDiscards(rng,cardIds){
 validateApkRng(rng);
 if(!Array.isArray(cardIds)||cardIds.some(id=>typeof id!=='string'||!id)||new Set(cardIds).size!==cardIds.length)throw new TypeError('Invalid Hook hand');
 const pool=canonicalCards(cardIds.map(id=>{const match=/^card_(clubs|diamonds|hearts|spades)_(\d+)$/.exec(id);return match?{id,suit:match[1],rank:Number(match[2])}:null;})),selected=[];let current=rng;
 for(let i=0;i<Math.min(2,cardIds.length);i++){
  const draw=nextApkRandom(current,'hook',1,pool.length);current=draw.rng;selected.push(pool.splice(draw.value-1,1)[0]);
 }
 return {cardIds:selected,rng:current};
}
