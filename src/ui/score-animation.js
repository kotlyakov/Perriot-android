import {juiceCard,cardMotion} from './card-motion.js';
import {gameDuration,scorePopDuration,scoreEventDuration} from './game-speed.js';
import {showNumbers} from './field.js';
import {divideExact,exactText,subtractExact} from '../core/numbers.js';
export {exactText};
export function integerText(value){return exactText(typeof value==='number'?BigInt(Math.trunc(value)):value);}
export function scoreDelta(event){if(event.operation==='balance')return {kind:'balance',multiply:false,text:'Баланс'};const mult=event.operation.includes('mult'),key=mult?'mult':'chips',multiply=event.operation.startsWith('multiply') || event.operation.startsWith('mul_') || event.operation.startsWith('x_');const before=event.before[key],after=event.after[key];return {kind:mult?'mult':'chips',multiply,text:(multiply?'×':'+')+exactText(multiply?divideExact(after,before):subtractExact(after,before))};}
export function scoreMoneyText(event){return '+$'+integerText(event.amount);}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,scoreEventDuration(ms)));
// The number remains still and fully opaque before its short exit. Card movement
// keeps its own speed setting; reading time does not shrink to a few frames.
export function scorePopFrames({multiply=false,direction=-1}={}){
 return multiply?[
  {opacity:1,scale:'1',translate:'0 0'},
  {opacity:1,scale:'1.16',translate:'0 0',offset:.12},
  {opacity:1,scale:'1',translate:'0 0',offset:.24},
  {opacity:1,scale:'1',translate:'0 0',offset:.7},
  {opacity:0,scale:'1',translate:`0 ${12*direction}px`}
 ]:[{opacity:1,translate:'0 0'},{opacity:1,translate:'0 0',offset:.7},{opacity:0,translate:`0 ${12*direction}px`}];
}
export async function animateScore(events,onSound=()=>{}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,pending=new Map();
 for(const event of events){
  if(!['score_repeat','score_step','score_money'].includes(event.type))continue;
  const repeat=event.type==='score_repeat',money=event.type==='score_money';
  const joker=money?null:document.querySelector(`#shop_owned [data-offer-id="${event.effectSourceId??event.sourceId}"]`);
  const card=joker??(repeat?document.querySelector(`${event.phase==='held_card'?'#hand .playing-card':'.played-card'}[data-card-id="${event.sourceId}"]`):document.querySelector(`.played-card[data-card-id="${event.sourceId}"]`)??(!money?document.querySelector(`.playing-card[data-card-id="${event.sourceId}"]`):null));
  // Retriggers and chips/mult/money on the same card must be read in order.
  if(card&&pending.has(card))await pending.get(card);
  onSound(event);
  if(!repeat&&!money)showNumbers(event.after.chips,event.after.mult,true);
  const d=repeat?{kind:'score-repeat',multiply:false,text:'Ещё раз'}:money?{kind:'money gold',multiply:false,text:scoreMoneyText(event)}:scoreDelta(event);
  if(card&&(repeat||money||!['base','balance'].includes(event.operation))){
   const pop=document.createElement('span');pop.className='score-pop '+d.kind+(d.multiply?' multiply':'');pop.textContent=d.text;pop.dataset.sourceId=event.sourceId;
   if(event.effectSourceId)pop.dataset.effectSourceId=event.effectSourceId;
   pop.dataset.operation=repeat?'repeat':money?'add_money':event.operation;
   Object.assign(pop.style,{left:parseFloat(card.style.left)+57.5+'px',top:parseFloat(card.style.top)+(joker?card.offsetHeight+4:-27)+'px'});
   document.getElementById('stage').append(pop);
   if(reduced)pop.remove();
   else{
    juiceCard(card,{multiply:d.multiply});
    if(!repeat&&!money)juiceCard(document.getElementById(d.kind==='mult'?'mult_value':'chips_value'),{multiply:d.multiply});
    const finished=cardMotion(pop,scorePopFrames({multiply:d.multiply,direction:joker?1:-1}),{duration:scorePopDuration(),easing:'linear'}).finally(()=>pop.remove());
    pending.set(card,finished);
   }
  }
  if(!reduced)await pause(repeat||money||event.operation==='balance'?260:d.multiply?340:220);
 }
 // Callers can now remove scoring cards only after the final label has exited.
 await Promise.all(pending.values());
}

export async function liftScoringCards(ids){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 await Promise.all(ids.map(id=>document.querySelector(`.played-card[data-card-id="${id}"]`)).filter(Boolean).map(card=>{
   const top=card.style.top;card.style.top=parseFloat(top)-28+'px';card.dataset.scoring='true';
   return reduced?Promise.resolve():card.animate([{top},{top:card.style.top}],{duration:gameDuration(200),easing:'ease-out'}).finished;
 }));
}


