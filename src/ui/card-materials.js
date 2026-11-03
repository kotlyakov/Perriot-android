// Decorative layers only. Game state, pointer capture and card transforms remain owned by the game.
const CARD='.playing-card,.shop-card,.collection-card';
const SPECIAL=new Set(['j_satellite','j_hologram']);
export function applyCardMaterials(element) {
 const spectral=element.dataset.cardSet==='Spectral'&&!element.matches('.hidden-card,.acorn-hidden,[data-card-state=locked],[data-card-state=unseen]');
 const shimmer=element.querySelector(':scope > .spectral-shimmer');
 if(spectral&&!shimmer){const layer=element.ownerDocument.createElement('span');layer.className='spectral-shimmer';layer.setAttribute('aria-hidden','true');element.append(layer);}
 if(!spectral&&shimmer)shimmer.remove();
 if(element.matches('.hidden-card,.acorn-hidden'))return;
 const art=element.querySelector('svg[data-joker-id]');
 const id=art?.dataset.jokerId;
 if(SPECIAL.has(id))element.dataset.animatedArt=id;
 else delete element.dataset.animatedArt;
 const needed=Boolean(element.dataset.edition&&element.dataset.edition!=='base'||element.dataset.enhancement||element.dataset.animatedArt);
 element.classList.toggle('card-material',needed);
 const layers=[...element.children].filter(n=>n.classList.contains('card-material-layer'));
 if(!needed){for(const n of layers)n.remove();return;}
 for(const name of ['grain','light'])if(!layers.some(n=>n.classList.contains('material-'+name))){
  const layer=element.ownerDocument.createElement('span');layer.className='card-material-layer material-'+name;layer.setAttribute('aria-hidden','true');element.append(layer);
 }
}
export function installCardMaterials(root=document) {
 const scan=node=>{
  if(node.nodeType!==1&&node.nodeType!==9)return;
  if(node.matches?.(CARD))applyCardMaterials(node);
  for(const card of node.querySelectorAll(CARD))applyCardMaterials(card);
 };
 scan(root);
 const Observer=root.ownerDocument?.defaultView?.MutationObserver??globalThis.MutationObserver;
 const observer=new Observer(records=>{
  const cards=new Set();
  for(const record of records){
   const target=record.target.closest?.(CARD);if(target)cards.add(target);
   for(const node of record.addedNodes??[])if(node.nodeType===1&&!node.classList.contains('card-material-layer'))scan(node);
  }
  for(const card of cards)applyCardMaterials(card);
 });
 observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['data-edition','data-enhancement','data-card-set','data-card-state']});
 let active=null,frame=null,pointerX=0,pointerY=0;
 function reset(){if(frame!==null){cancelAnimationFrame(frame);frame=null;}if(active){active.style.removeProperty('--material-x');active.style.removeProperty('--material-y');active=null;}}
 function paint(){
  frame=null;
  if(!active?.isConnected||!root.contains(active)){reset();return;}
  const box=active.getBoundingClientRect();
  active.style.setProperty('--material-x',`${Math.max(0,Math.min(100,(pointerX-box.left)/Math.max(1,box.width)*100))}%`);
  active.style.setProperty('--material-y',`${Math.max(0,Math.min(100,(pointerY-box.top)/Math.max(1,box.height)*100))}%`);
 }
 function move(event){
  const card=event.target.closest?.(CARD);if(!card||!root.contains(card)||!card.classList.contains('card-material')||card.matches('.hidden-card,.acorn-hidden')){reset();return;}
  if(active!==card){reset();active=card;}
  pointerX=event.clientX;pointerY=event.clientY;
  if(frame===null)frame=requestAnimationFrame(paint);
 }
 root.addEventListener('pointermove',move,{passive:true});
 root.addEventListener('pointerleave',reset,{passive:true});
 root.addEventListener('pointercancel',reset,{passive:true});
 return ()=>{observer.disconnect();root.removeEventListener('pointermove',move);root.removeEventListener('pointerleave',reset);root.removeEventListener('pointercancel',reset);reset();};
}
