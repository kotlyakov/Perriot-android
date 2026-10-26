import {cardFlightDuration,shatterCard,cardMotion} from './card-motion.js';
import {gameDuration} from './game-speed.js';
import {cardMarkup,applyCardModifiers,SUITS} from './field.js';
export function animationHeldCardIds(hand,played,forced,created=[]){return [...hand.filter(id=>!played.includes(id)&&!forced.includes(id)),...created.map(card=>card.id)];}
export function preparePlayedCards(ids,discard=false,revealedCards={}) {
 const stage=document.getElementById('stage');
 const cards=ids.map(id=>stage.querySelector(`.playing-card[data-card-id="${id}"]`)).filter(Boolean).map(card=>{
   const clone=card.cloneNode(true);clone.classList.add('played-card');clone.classList.remove('selected');
   if(!discard&&clone.classList.contains('hidden-card')&&revealedCards[card.dataset.cardId]){
     const revealed=revealedCards[card.dataset.cardId];clone.classList.remove('hidden-card','deck-back');delete clone.dataset.deck;applyCardModifiers(clone,revealed);clone.innerHTML=cardMarkup(revealed);clone.style.color=SUITS[revealed.suit][1];
   }
   clone.disabled=false;clone.tabIndex=-1;clone.setAttribute('aria-hidden','true');return clone;
 });
 return async function show() {
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   const gap=126,start=885-(cards.length-1)*gap/2-57.5;
   const flights=cards.map((card,i)=>{
     stage.append(card);
     const from={left:card.style.left,top:card.style.top,transform:card.style.transform,opacity:1};
     const to=discard?{left:'1450px',top:'-190px',transform:'rotate(38deg)',opacity:0}:{left:start+i*gap+'px',top:'232px',transform:'rotate(0deg)'};
     Object.assign(card.style,to);
     const distance=Math.hypot(parseFloat(to.left)-parseFloat(from.left),parseFloat(to.top)-parseFloat(from.top));
     const middle={left:(parseFloat(from.left)+parseFloat(to.left))/2+'px',top:Math.min(parseFloat(from.top),parseFloat(to.top))-55+'px',transform:discard?'rotate(12deg) scale(1.04)':'rotate(-4deg) scale(1.04)',opacity:1,offset:.55};
     return cardMotion(card,[from,middle,to],{duration:gameDuration(cardFlightDuration(distance)),delay:gameDuration(i*35),easing:'cubic-bezier(.25,.7,.3,1)',fill:'backwards'});
   });
   await Promise.all(flights);
   if(discard){cards.forEach(card=>card.remove());return async()=>{};}
   return async function finish(){
     if(!reduced)await Promise.all(cards.map(card=>card.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-38px)'}],{duration:gameDuration(170),easing:'ease-in'}).finished));
     cards.forEach(card=>card.remove());
   };
 };
}

export async function animateShatteredCards(ids){
 await Promise.all(ids.map(id=>document.querySelector(`.played-card[data-card-id="${id}"]`)).filter(Boolean).map(shatterCard));
}

export function prepareDrawnCards(ids){
 const cards=ids.map(id=>document.querySelector(`#hand .playing-card[data-card-id="${id}"]`)).filter(Boolean);
 cards.forEach(card=>card.classList.add('dealing'));
 return async()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   await Promise.all(cards.map((card,i)=>{card.classList.remove('dealing');if(reduced)return Promise.resolve();
     return cardMotion(card,[{left:'1208px',top:'491px',transform:'rotate(-18deg) scale(.78)',opacity:0},{left:(1208+parseFloat(card.style.left))/2+'px',top:Math.min(430,parseFloat(card.style.top)-55)+'px',transform:'rotate(7deg) scale(1.03)',opacity:1,offset:.64},{left:card.style.left,top:card.style.top,transform:card.style.transform,opacity:1}],{duration:gameDuration(cardFlightDuration(Math.abs(1208-parseFloat(card.style.left)))),delay:gameDuration(i*50),fill:'backwards',easing:'cubic-bezier(.2,.7,.25,1)'});
   }));
 };
}

// Capture the currently visible hand before render; animate only surviving IDs.
export function prepareHandMovement(){
 const from=new Map([...document.querySelectorAll('#hand .playing-card')].map(c=>[c.dataset.cardId,{left:c.style.left,top:c.style.top,transform:c.style.transform}]));
 return ()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
   return Promise.all([...document.querySelectorAll('#hand .playing-card')].filter(c=>from.has(c.dataset.cardId)).map(c=>c.animate([from.get(c.dataset.cardId),{left:c.style.left,top:c.style.top,transform:c.style.transform}],{duration:gameDuration(300),easing:'cubic-bezier(.2,.85,.28,1.13)'}).finished));
 };
}

