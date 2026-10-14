import {canEnterBoss} from './boss-effects.js';
import {chooseApkBoss} from './apk-blinds.js';
import {createApkTagContext,chooseApkTag} from './apk-tags.js';

// APK misc_functions.lua get_blind_amount: default scaling uses binary64,
// including logarithmic modulo truncation. Multiply before converting to BigInt.
export function nativeBlindTarget(ante,multiplier=1){
 if(!Number.isSafeInteger(ante)||ante<1)throw new RangeError('Unsupported ante');
 if(!Number.isFinite(multiplier)||multiplier<=0)throw new RangeError('Invalid blind multiplier');
 const bases=[300,800,2000,5000,11000,20000,35000,50000];
 let amount=bases[ante-1];
 if(ante>8){
  const c=ante-8;
  amount=Math.floor(50000*(1.6+(0.75*c)**(1+0.2*c))**c);
  amount-=amount%(10**Math.floor(Math.log10(amount)-1));
 }
 const target=amount*multiplier;
 // Ante39 is native NaN: the durable non-finite lifecycle is a separate task.
 if(!Number.isFinite(target)||!Number.isInteger(target))throw new RangeError('Non-finite or non-integer native blind target');
 return BigInt(target);
}
export function blindBase(ante){return nativeBlindTarget(ante);}
export function canLeaveApkShop(state){
 return !!state.apkShop && state.phase==='shop' && (
  state.round.blindId==='small'&&state.round.ante>=1&&state.round.ante<=8 ||
  state.round.blindId==='big'&&canEnterBoss({...state,phase:'blind_selection'}) ||
  state.round.blindId==='boss'&&canEnterBoss(state));
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

