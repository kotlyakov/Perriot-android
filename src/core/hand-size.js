import {sortHand} from './sort.js';
import {applyChallengeDraw} from './challenge-draw.js';

// CardArea keeps the unclamped limit so a later grant first repays any debt.
export function realHandSize(state){return state.round.realHandSize??state.round.handSize;}
export function setHandSize(state,size){
 if(size<0||Object.hasOwn(state.round,'realHandSize'))state.round.realHandSize=size;
 state.round.handSize=Math.max(0,size);
}
export function changeHandSize(state,delta,{events,draw=false,updateBoss=true}={}){
 if(!delta)return;
 const size=realHandSize(state)+delta;setHandSize(state,size);
 if(updateBoss&&state.bossState)state.bossState.baseHandSize+=delta;
 // Native positive change_size draws the raw grant, even for an overfull hand.
 if(draw&&delta>0&&size>1&&state.phase==='playing'&&state.hand.length){
  const count=Math.min(delta,state.drawPile.length),ids=state.rng.apk?Array.from({length:count},()=>state.drawPile.pop()):state.drawPile.splice(0,count);
  applyChallengeDraw(state,ids);state.hand.push(...ids);sortHand(state);if(ids.length)events?.push({type:'cards_drawn',cardIds:ids});
 }
}
export function restoreBossHandSize(state){setHandSize(state,state.bossState.baseHandSize);}
