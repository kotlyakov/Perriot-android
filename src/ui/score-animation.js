import {showNumbers} from './field.js';
export function integerText(value){if(typeof value==='bigint')return value.toString();if(value && typeof value.numerator==='bigint')return (value.numerator/value.denominator).toString();return String(Math.trunc(Number(value)));}
export function scoreDelta(event){const mult=event.operation.includes('mult'),key=mult?'mult':'chips',multiply=event.operation.startsWith('multiply') || event.operation.startsWith('mul_') || event.operation.startsWith('x_');const before=event.before[key],after=event.after[key];return {kind:mult?'mult':'chips',multiply,text:(multiply?'×':'+')+integerText(multiply?(before?after/before:after):after-before)};}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function animateScore(events){const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const event of events){if(event.type!=='score_step')continue;
   showNumbers(event.after.chips,event.after.mult,true);
   const joker=document.querySelector(`#shop_owned [data-offer-id="${event.effectSourceId??event.sourceId}"]`);
   const card=joker??document.querySelector(`.played-card[data-card-id="${event.sourceId}"]`)??document.querySelector(`#shop_owned [data-offer-id="${event.sourceId}"]`);
   if(card && event.operation!=='base'){
     const d=scoreDelta(event),pop=document.createElement('span');pop.className='score-pop '+d.kind+(d.multiply?' multiply':'');pop.textContent=d.text;pop.dataset.sourceId=event.sourceId;pop.dataset.operation=event.operation;
     Object.assign(pop.style,{left:parseFloat(card.style.left)+57.5+'px',top:parseFloat(card.style.top)+(joker?card.offsetHeight+4:-27)+'px'});document.getElementById('stage').append(pop);
     if(!reduced){card.animate([{translate:'0 0'},{translate:'0 -8px'},{translate:'0 0'}],{duration:230});const direction=joker?1:-1;const frames=d.multiply?[{opacity:1,translate:'-3px 0'},{opacity:1,translate:`3px ${5*direction}px`},{opacity:1,translate:`-3px ${9*direction}px`},{opacity:0,translate:`0 ${30*direction}px`}]:[{opacity:1,translate:'0 0'},{opacity:0,translate:`0 ${30*direction}px`}];pop.animate(frames,{duration:520}).finished.then(()=>pop.remove());}else pop.remove();
   }
   if(!reduced)await pause(260);
 }
}

export async function liftScoringCards(ids){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 await Promise.all(ids.map(id=>document.querySelector(`.played-card[data-card-id="${id}"]`)).filter(Boolean).map(card=>{
   const top=card.style.top;card.style.top=parseFloat(top)-28+'px';card.dataset.scoring='true';
   return reduced?Promise.resolve():card.animate([{top},{top:card.style.top}],{duration:200,easing:'ease-out'}).finished;
 }));
}

