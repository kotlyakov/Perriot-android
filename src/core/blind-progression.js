import {canEnterBoss} from './boss-effects.js';
import {chooseApkBoss} from './apk-blinds.js';
import {createApkTagContext,chooseApkTag} from './apk-tags.js';

// APK misc_functions.lua get_blind_amount: default scaling uses binary64,
// including logarithmic modulo truncation. Multiply before converting to BigInt.
export function nativeBlindTarget(ante,multiplier=1,scaling=1){
 if(!Number.isSafeInteger(ante)||ante< -1)throw new RangeError('Unsupported ante');
 if(!Number.isFinite(multiplier)||multiplier<=0)throw new RangeError('Invalid blind multiplier');
 if(![1,2,3].includes(scaling))throw new RangeError('Invalid blind scaling');
 const bases=({1:[300,800,2000,5000,11000,20000,35000,50000],2:[300,900,2600,8000,20000,36000,60000,100000],3:[300,1000,3200,9000,25000,60000,110000,200000]})[scaling];
 let amount=ante<1?100:bases[ante-1];
 if(ante>8){
  const c=ante-8;
  amount=Math.floor(bases[7]*(1.6+(0.75*c)**(1+0.2*c))**c);
  amount-=amount%(10**Math.floor(Math.log10(amount)-1));
 }
 const target=amount*multiplier;
 // Native overflow/modulo yields NaN at Ante39; preserve its unordered comparisons.
 if(Number.isNaN(target))return NaN;
 if(!Number.isFinite(target)||!Number.isInteger(target))throw new RangeError('Non-finite or non-integer native blind target');
 return BigInt(target);
}
// Reconstruct the binary64 target before native division; BigInt division truncates
// differently at high antes. A NaN target stays unordered and unwinnable.
export function divideNativeBlindTarget(target,divisor){
 const divided=Number(target)/divisor;
 return Number.isNaN(divided)?NaN:BigInt(divided);
}
export function blindBase(ante){return nativeBlindTarget(ante);}
export function canLeaveApkShop(state){
 return !!state.apkShop && state.phase==='shop' && (
  state.round.blindId==='small'&&Number.isSafeInteger(state.round.ante)&&state.round.ante>=-1 ||
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

