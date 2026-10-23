import {deckDiscards} from '../content/decks.js';
import {APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {challengeDiscards,challengeReward} from './challenge-rules.js';

export const validStake=level=>Number.isInteger(level)&&level>=1&&level<=8;
export const stakeScaling=state=>(state.stake??1)>=6?3:(state.stake??1)>=3?2:1;
export const runDiscards=state=>state.challengeId?challengeDiscards(state):deckDiscards(state.deckId)-((state.stake??1)>=5?1:0);
export function stakeShopModifiers(level){return {...(level>=4?{enable_eternals_in_shop:true}:{}),...(level>=7?{enable_perishables_in_shop:true}:{}),...(level>=8?{enable_rentals_in_shop:true}:{})};}
export function blindReward(state,id=state.round.blindId){return challengeReward(state,id,id==='small'?((state.stake??1)>=2?0n:3n):id==='big'?4n:BigInt(APK_BLINDS_BY_ID[state.apkBlinds.bossId].dollars));}
