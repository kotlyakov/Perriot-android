import {cardMarkup,SUITS} from './field.js';
export function preparePlayedCards(ids,discard=false,revealedCards={}) {
 const stage=document.getElementById('stage');
 const cards=ids.map(id=>stage.querySelector(`.playing-card[data-card-id="${id}"]`)).filter(Boolean).map(card=>{
   const clone=card.cloneNode(true);clone.classList.add('played-card');clone.classList.remove('selected');
   if(!discard&&clone.classList.contains('hidden-card')&&revealedCards[card.dataset.cardId]){
     const revealed=revealedCards[card.dataset.cardId];clone.classList.remove('hidden-card','deck-back');delete clone.dataset.deck;if(revealed.enhancement&&revealed.enhancement!=='base')clone.dataset.enhancement=revealed.enhancement;clone.innerHTML=cardMarkup(revealed);clone.style.color=SUITS[revealed.suit][1];
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
     return reduced?Promise.resolve():card.animate([from,to],{duration:280,easing:'cubic-bezier(.2,.8,.2,1)'}).finished;
   });
   await Promise.all(flights);
   if(discard){cards.forEach(card=>card.remove());return async()=>{};}
   return async function finish(){
     if(!reduced)await Promise.all(cards.map(card=>card.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-38px)'}],{duration:170,easing:'ease-in'}).finished));
     cards.forEach(card=>card.remove());
   };
 };
}

export function prepareDrawnCards(ids){
 const cards=ids.map(id=>document.querySelector(`#hand .playing-card[data-card-id="${id}"]`)).filter(Boolean);
 cards.forEach(card=>card.classList.add('dealing'));
 return async()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   await Promise.all(cards.map((card,i)=>{card.classList.remove('dealing');if(reduced)return Promise.resolve();
     return card.animate([{left:'1208px',top:'491px',transform:'rotate(-15deg) scale(.65)',opacity:0},{left:card.style.left,top:card.style.top,transform:card.style.transform,opacity:1}],{duration:330,delay:i*50,fill:'backwards',easing:'cubic-bezier(.2,.7,.25,1)'}).finished;
   }));
 };
}

// Capture the currently visible hand before render; animate only surviving IDs.
export function prepareHandMovement(){
 const from=new Map([...document.querySelectorAll('#hand .playing-card')].map(c=>[c.dataset.cardId,{left:c.style.left,top:c.style.top,transform:c.style.transform}]));
 return ()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
   return Promise.all([...document.querySelectorAll('#hand .playing-card')].filter(c=>from.has(c.dataset.cardId)).map(c=>c.animate([from.get(c.dataset.cardId),{left:c.style.left,top:c.style.top,transform:c.style.transform}],{duration:240,easing:'cubic-bezier(.2,.7,.25,1)'}).finished));
 };
}

