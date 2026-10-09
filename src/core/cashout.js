import {canEnterBoss} from './boss-effects.js';
import {APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
// Interest snapshots money before this payout.
export function getCashout(state) {
 if(state?.phase!=='round_won' || !['small','big','boss'].includes(state.round?.blindId) || !['red','blue'].includes(state.deckId) || typeof state.money!=='bigint' ||
    !Number.isSafeInteger(state.round.handsRemaining) || state.round.handsRemaining<0 || state.round.handsRemaining>(state.deckId==='blue'?5:4) ||
    typeof state.round.score!=='bigint' || typeof state.round.target!=='bigint' || state.round.target<=0n || state.round.score<state.round.target)throw new TypeError('Invalid cashout state');
 if(state.round.blindId==='boss' && (!state.bossState || state.bossState.id!==state.apkBlinds?.bossId || !canEnterBoss(state)))throw new TypeError('Invalid boss payout');
 const reward=state.round.blindId==='boss'?BigInt(APK_BLINDS_BY_ID[state.bossState.id].dollars):state.round.blindId==='big'?4n:3n;
 const hands=BigInt(state.round.handsRemaining),earned=state.money>0n?state.money/5n:0n,interest=earned>5n?5n:earned;
 return {reward,hands,interest,total:reward+hands+interest};
}


