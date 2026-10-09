import {canEnterFirstAnteBoss} from './boss-effects.js';
import {chooseApkBoss} from './apk-blinds.js';
import {createApkTagContext,chooseApkTag} from './apk-tags.js';

export function blindBase(ante){
 const bases=[300n,800n,2000n,5000n,11000n,20000n,35000n,50000n];
 if(!Number.isSafeInteger(ante)||ante<1||ante>bases.length)throw new RangeError('Unsupported ante');
 return bases[ante-1];
}
export function canLeaveApkShop(state){
 return !!state.apkShop && state.phase==='shop' && (
  state.round.blindId==='small'&&[1,2].includes(state.round.ante) ||
  ['big','boss'].includes(state.round.blindId)&&canEnterFirstAnteBoss(state));
}
// Boss cashout selects tags, then boss, after the cashout shuffle and before shop generation.
// Orbital hands are selected when entering the next blind selection screen.
export function chooseNextAnteBlinds(state,rng){
 const ante=state.round.ante+1;
 const tagContext=createApkTagContext({...state.apkBlinds.tagContext,ante});
 const small=chooseApkTag(rng,tagContext),big=chooseApkTag(small.rng,tagContext);
 const boss=chooseApkBoss(big.rng,{ante,bossesUsed:state.apkBlinds.bossesUsed});
 return {selection:{version:1,ante,bossId:boss.bossId,bossesUsed:boss.bossesUsed,
  tags:{small:small.tagId,big:big.tagId},orbitalHands:{},tagContext,playedCardIds:[]},rng:boss.rng};
}
