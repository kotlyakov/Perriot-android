// One active card explanation, shared by the field, shop and collection.
let active=null,dismissedKey=null,keyboardTarget=null;
const listening=new WeakSet();
const key=card=>card?.dataset?.cardId??card?.dataset?.entryId??card?.dataset?.offerId??card?.closest?.('[data-offer-id]')?.dataset.offerId??card?.id??card;
export function tooltipPlacement(card,size,bounds,gap=10){
 const minX=bounds.left+8,minY=bounds.top+8,maxX=Math.max(minX,bounds.right-size.width-8),maxY=Math.max(minY,bounds.bottom-size.height-8);
 let left=card.right+gap,top=card.top;
 if(left>maxX){
  if(card.left-gap-size.width>=minX)left=card.left-gap-size.width;
  else {left=card.left+(card.right-card.left-size.width)/2;top=card.top-gap-size.height>=minY?card.top-gap-size.height:card.bottom+gap;}
 }
 return {left:Math.max(minX,Math.min(maxX,left)),top:Math.max(minY,Math.min(maxY,top))};
}
export function dismissCardTooltip(){
 if(!active)return;
 active.tip.hidden=true;active.tip.remove?.();active.card.removeAttribute?.('aria-describedby');active=null;
}
function install(doc){
 if(!doc?.addEventListener||listening.has(doc))return;listening.add(doc);
 const dismiss=()=>{dismissedKey=active?key(active.card):null;dismissCardTooltip();};
 doc.addEventListener('pointerdown',()=>{keyboardTarget=null;dismiss();},true);
 doc.addEventListener('click',event=>{if(event.detail===0&&!event.pointerType&&!event.sourceCapabilities?.firesTouchEvents){const handled=keyboardTarget!==null&&keyboardTarget===key(event.target);keyboardTarget=null;if(!handled)dismiss();}},true);
 doc.addEventListener('keydown',event=>{if(event.key==='Escape'){keyboardTarget=null;if(active)event.preventDefault();dismiss();}else if(event.key==='Enter'||event.key===' '){keyboardTarget=key(event.target);dismissedKey=active?key(active.card):null;dismissCardTooltip();}},true);
 doc.defaultView?.addEventListener('resize',dismissCardTooltip);
}
export function showCardTooltip(tip,card,{container}={}){
 const doc=card.ownerDocument??globalThis.document;install(doc);
 if(dismissedKey!==null&&dismissedKey===key(card)){tip.hidden=true;return false;}
 dismissCardTooltip();container??=doc.getElementById('stage');
 tip.id||='card_tooltip';tip.style.pointerEvents='auto';tip.hidden=false;container.append(tip);active={tip,card};card.setAttribute('aria-describedby',tip.id??'');
 // DOM-only content checks have no layout engine.
 if(!card.getBoundingClientRect||!container.getBoundingClientRect)return true;
 const box=container.getBoundingClientRect(),scale=box.width/(container.offsetWidth||box.width||1),stage=doc.getElementById('stage'),screen=stage?.getBoundingClientRect();
 const bounds=screen?.width?screen:{left:0,top:0,right:doc.defaultView.innerWidth,bottom:doc.defaultView.innerHeight};
 tip.style.maxWidth=Math.max(1,(bounds.right-bounds.left-16)/scale)+'px';
 const position=tooltipPlacement(card.getBoundingClientRect(),{width:tip.offsetWidth*scale,height:tip.offsetHeight*scale},bounds,10*scale);
 Object.assign(tip.style,{left:(position.left-box.left)/scale+'px',top:(position.top-box.top)/scale+'px',bottom:'auto',transform:'none'});
 return true;
}
