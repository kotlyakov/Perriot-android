import {nextApkRandom} from './apk-rng.js';
import {challengeFor} from './challenge-rules.js';

export function applyChallengeDraw(state,ids){
 const denominator=challengeFor(state)?.modifiers?.flippedCards;
 if(!denominator)return;
 state.challengeFlippedCardIds??=[];
 for(const id of ids){
  const draw=nextApkRandom(state.rng.apk,'flipped_card');state.rng.apk=draw.rng;
  if(draw.value<1/denominator&&!state.challengeFlippedCardIds.includes(id))state.challengeFlippedCardIds.push(id);
 }
}
