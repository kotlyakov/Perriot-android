import {juiceCard,cardMotion} from './card-motion.js';
import {gameDuration} from './game-speed.js';
import {showNumbers} from './field.js';
import {divideExact,exactText,subtractExact} from '../core/numbers.js';
export {exactText};
export function integerText(value){return exactText(typeof value==='number'?BigInt(Math.trunc(value)):value);}
export function scoreDelta(event){if(event.operation==='balance')return {kind:'balance',multiply:false,text:'Баланс'};const mult=event.operation.includes('mult'),key=mult?'mult':'chips',multiply=event.operation.startsWith('multiply') || event.operation.startsWith('mul_') || event.operation.startsWith('x_');const before=event.before[key],after=event.after[key];return {kind:mult?'mult':'chips',multiply,text:(multiply?'×':'+')+exactText(multiply?divideExact(after,before):subtractExact(after,before))};}
export function scoreMoneyText(event){return '+$'+integerText(event.amount);}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,gameDuration(ms)));
export async function animateScore(events,onSound=()=>{}){const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const event of events){
   if(['score_repeat','score_step','score_money'].includes(event.type))onSound(event);
   if(event.type==='score_repeat'){
     const joker=document.querySelector(`#shop_owned [data-offer-id="${event.effectSourceId}"]`);
     const card=joker??document.querySelector(`${event.phase==='held_card'?'#hand .playing-card':'.played-card'}[data-card-id="${event.sourceId}"]`);
     if(card){const pop=document.createElement('span');pop.className='score-pop score-repeat';pop.textContent='Ещё раз';pop.dataset.sourceId=event.sourceId;pop.dataset.effectSourceId=event.effectSourceId;pop.dataset.operation='repeat';Object.assign(pop.style,{left:parseFloat(card.style.left)+57.5+'px',top:parseFloat(card.style.top)+(joker?card.offsetHeight+4:-27)+'px'});document.getElementById('stage').append(pop);
       if(!reduced){juiceCard(card);cardMotion(pop,[{opacity:1,translate:'0 0'},{opacity:0,translate:`0 ${joker?30:-30}px`}],{duration:gameDuration(520)}).then(()=>pop.remove());}else pop.remove();}
     if(!reduced)await pause(260);continue;
   }
   if(!['score_step','score_money'].includes(event.type))continue;
   if(event.type==='score_money'){
     const card=document.querySelector(`.played-card[data-card-id="${event.sourceId}"]`);if(card){const pop=document.createElement('span');pop.className='score-pop money gold';pop.textContent=scoreMoneyText(event);pop.dataset.sourceId=event.sourceId;pop.dataset.operation='add_money';Object.assign(pop.style,{left:parseFloat(card.style.left)+57.5+'px',top:parseFloat(card.style.top)-27+'px'});document.getElementById('stage').append(pop);if(!reduced){juiceCard(card);cardMotion(pop,[{opacity:1,translate:'0 0'},{opacity:0,translate:'0 -30px'}],{duration:gameDuration(520)}).then(()=>pop.remove());}else pop.remove();}if(!reduced)await pause(260);continue;
   }
   showNumbers(event.after.chips,event.after.mult,true);
   if(event.operation==='balance'){if(!reduced)await pause(260);continue;}
   const joker=document.querySelector(`#shop_owned [data-offer-id="${event.effectSourceId??event.sourceId}"]`);
   const card=joker??document.querySelector(`.played-card[data-card-id="${event.sourceId}"]`)??document.querySelector(`.playing-card[data-card-id="${event.sourceId}"]`)??document.querySelector(`#shop_owned [data-offer-id="${event.sourceId}"]`);
   if(card && event.operation!=='base'){
     const d=scoreDelta(event),pop=document.createElement('span');pop.className='score-pop '+d.kind+(d.multiply?' multiply':'');pop.textContent=d.text;pop.dataset.sourceId=event.sourceId;if(event.effectSourceId)pop.dataset.effectSourceId=event.effectSourceId;pop.dataset.operation=event.operation;
     Object.assign(pop.style,{left:parseFloat(card.style.left)+57.5+'px',top:parseFloat(card.style.top)+(joker?card.offsetHeight+4:-27)+'px'});document.getElementById('stage').append(pop);
     if(!reduced){juiceCard(card,{multiply:d.multiply});const direction=joker?1:-1;const target=document.getElementById(d.kind==='mult'?'mult_value':'chips_value');juiceCard(target,{multiply:d.multiply});const frames=d.multiply?[{opacity:0,scale:'.65',translate:'0 0'},{opacity:1,scale:'1.35',translate:`0 ${8*direction}px`,offset:.2},{opacity:1,scale:'.95',translate:`0 ${14*direction}px`,offset:.45},{opacity:0,scale:'1.08',translate:`0 ${38*direction}px`}]:[{opacity:1,translate:'0 0'},{opacity:0,translate:`0 ${30*direction}px`}];cardMotion(pop,frames,{duration:gameDuration(520)}).then(()=>pop.remove());}else pop.remove();
   }
   if(!reduced)await pause(event.operation.startsWith('multiply')||event.operation.startsWith('mul_')||event.operation.startsWith('x_')?340:220);
 }
}

export async function liftScoringCards(ids){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 await Promise.all(ids.map(id=>document.querySelector(`.played-card[data-card-id="${id}"]`)).filter(Boolean).map(card=>{
   const top=card.style.top;card.style.top=parseFloat(top)-28+'px';card.dataset.scoring='true';
   return reduced?Promise.resolve():card.animate([{top},{top:card.style.top}],{duration:gameDuration(200),easing:'ease-out'}).finished;
 }));
}


