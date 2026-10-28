import {applyItem7EndRound} from './joker-item7-lifecycle.js';
import {applyItem7EconomyContext} from './joker-item7-economy.js';
import {applyJokerStickerEndRound} from './joker-stickers.js';

export const hasJokerStickers=state=>(state.jokers??[]).some(j=>j.perishable||j.rental);
// End round iterates original owned slots: own effect → remaining lifetime.
// Keep the aggregate path unchanged when no stickers affect the lifecycle.
export function applyRoundEndJokers(state,events,{gameOver=false}={}){
 if(!hasJokerStickers(state)){
  const result=applyItem7EndRound(state,events,{gameOver});
  applyItem7EconomyContext(state,{type:'end_of_round'},events);return result;
 }
 let saved=false;
 for(const joker of [...state.jokers]){
  const result=applyItem7EndRound(state,events,{gameOver:gameOver&&!saved,jokerId:joker.id});saved||=result.saved;
  applyItem7EconomyContext(state,{type:'end_of_round'},events,{jokerId:joker.id});
  applyJokerStickerEndRound(state,events,{jokers:[joker]});
 }
 return {saved};
}
