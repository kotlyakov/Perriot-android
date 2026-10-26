// Presentation acknowledgements only. Game unlocks continue to come from the profile.
const memory=new Map();
export function observeCollectionUnlocks(entries,profileId='1',storage){
 const key='pierrot.collection-locks.'+profileId;
 try{storage??=globalThis.localStorage;}catch{}
 let raw;try{raw=storage?.getItem(key);}catch{}raw??=memory.get(key);
 let saved;try{saved=JSON.parse(raw);}catch{}
 const locked=new Set(Array.isArray(saved)&&saved.every(id=>typeof id==='string')?saved:entries.filter(entry=>!entry.unlocked).map(entry=>entry.id));
 for(const entry of entries)if(!entry.unlocked)locked.add(entry.id);
 const persist=()=>{const text=JSON.stringify([...locked]);memory.set(key,text);try{storage?.setItem(key,text);}catch{}};
 persist();
 return {pending:new Set(entries.filter(entry=>entry.unlocked&&locked.has(entry.id)).map(entry=>entry.id)),acknowledge(id){locked.delete(id);persist();}};
}
export function collectionLock(){
 const overlay=document.createElement('span');overlay.className='collection-lock';overlay.setAttribute('aria-hidden','true');
 // Individual interlocking links follow curved, sagging runs rather than rigid bars.
 let chains='';
 for(let arm=0;arm<4;arm++){
  const left=arm%2===0,top=arm<2;
  for(let i=0;i<7;i++){
   const t=i/6,x=(left?3:69)+(left?29:-29)*t,y=(top?17:83)+(top?29:-29)*t+5*Math.sin(t*Math.PI),angle=(left===top?43:-43)+(i%2?18:-10);
   chains+=`<ellipse class="collection-chain-link" cx="${x}" cy="${y}" rx="5.4" ry="2.6" transform="rotate(${angle} ${x} ${y})" style="--link-delay:${i*24}ms;--link-x:${(left?-1:1)*(8+i*2)}px;--link-fall:${16+i*4}px;--link-turn:${(left?-1:1)*(14+i*7)}deg"/>`;
  }
 }
 overlay.innerHTML=`<span class="collection-lock-veil"></span><svg viewBox="0 0 72 100" preserveAspectRatio="none"><g class="collection-chains" fill="none" stroke="#afbab5" stroke-width="2.2">${chains}</g><g class="collection-padlock"><path class="collection-lock-shackle" d="M25 47V36C25 20 47 20 47 36V47" fill="none" stroke="#e0dbbf" stroke-width="5"/><rect x="20" y="43" width="32" height="30" rx="5" fill="#b9b8a6" stroke="#243536" stroke-width="2"/><circle cx="36" cy="54" r="4" fill="#344345"/><path d="M36 57V64" stroke="#344345" stroke-width="3"/></g></svg>`;
 return overlay;
}
export function animateCollectionUnlock(card,acknowledge){
 if(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||!card.animate){acknowledge();return ()=>{};}
 const overlay=collectionLock();card.append(overlay);card.classList.add('collection-unlocking');
 const animation=card.animate([{},{}],{duration:1600});
 animation.finished.then(()=>{if(card.isConnected)acknowledge();overlay.remove();card.classList.remove('collection-unlocking');},()=>{overlay.remove();card.classList.remove('collection-unlocking');});
 return ()=>animation.cancel();
}
