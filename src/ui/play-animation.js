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

export async function animateShatteredCards(ids){
 const cards=ids.map(id=>document.querySelector(`.played-card[data-card-id="${id}"]`)).filter(Boolean);
 cards.forEach(card=>{card.classList.add('shattering');card.dataset.shattered='true';});
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 await Promise.all(cards.map(card=>card.animate([
   {opacity:1,transform:'rotate(0deg) scale(1)',filter:'brightness(1)'},
   {opacity:.88,transform:'rotate(-4deg) scale(1.08)',filter:'brightness(1.8)'},
   {opacity:0,transform:'rotate(11deg) scale(.48)',filter:'brightness(2.2) blur(2px)'},
 ],{duration:380,easing:'cubic-bezier(.45,0,.85,.35)',fill:'forwards'}).finished));
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

