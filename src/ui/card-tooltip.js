// One active card explanation, shared by the field, shop and collection.
let active=null,dismissedKey=null,keyboardTarget=null,tooltipTap=false;
const listening=new WeakSet();
const key=card=>card?.dataset?.cardId??card?.dataset?.entryId??card?.dataset?.offerId??card?.closest?.('[data-offer-id]')?.dataset.offerId??card?.id??card;
export function tooltipPlacement(card,size,bounds,gap=10){
 const minX=bounds.left+8,minY=bounds.top+8,maxX=Math.max(minX,bounds.right-size.width-8),maxY=Math.max(minY,bounds.bottom-size.height-8);
 let left=card.right+gap,top=card.top;
 // Owned cards occupy a dense top row. Keep the explanation below that row so
 // adjacent cards remain tappable instead of being covered by its wider window.
 if(card.bottom<=bounds.top+(bounds.bottom-bounds.top)*.35&&card.bottom+gap+size.height<=bounds.bottom-8){left=card.left+(card.right-card.left-size.width)/2;top=card.bottom+gap;}
 else if(left>maxX){
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
 let scrollGesture=null;
 doc.addEventListener('pointerdown',event=>{scrollGesture=null;tooltipTap=active?.tip.contains?.(event.target)??false;keyboardTarget=null;
  if(tooltipTap&&active.tip.scrollHeight>active.tip.clientHeight+1){scrollGesture={tip:active.tip,id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};return;}
  if(tooltipTap)event.preventDefault();dismiss();
 },true);
 doc.addEventListener('pointermove',event=>{if(scrollGesture?.id===event.pointerId&&Math.hypot(event.clientX-scrollGesture.x,event.clientY-scrollGesture.y)>8)scrollGesture.moved=true;},true);
 doc.addEventListener('pointerup',event=>{if(!scrollGesture||scrollGesture.id!==event.pointerId)return;const gesture=scrollGesture;scrollGesture=null;if(!gesture.moved&&active?.tip===gesture.tip){event.preventDefault();dismiss();}},true);
 doc.addEventListener('pointercancel',()=>{scrollGesture=null;tooltipTap=false;},true);
 doc.addEventListener('click',event=>{if(tooltipTap){tooltipTap=false;event.preventDefault();event.stopImmediatePropagation();return;}if(event.detail===0&&!event.pointerType&&!event.sourceCapabilities?.firesTouchEvents){const handled=keyboardTarget!==null&&keyboardTarget===key(event.target);keyboardTarget=null;if(!handled)dismiss();}},true);
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
 const place=()=>{
  if(active?.tip!==tip||!tip.isConnected)return;
  const box=container.getBoundingClientRect(),scale=box.width/(container.offsetWidth||box.width||1),stage=doc.getElementById('stage'),screen=stage?.getBoundingClientRect(),viewport=doc.defaultView.visualViewport;
  const visible={left:viewport?.offsetLeft??0,top:viewport?.offsetTop??0,right:(viewport?.offsetLeft??0)+(viewport?.width??doc.defaultView.innerWidth),bottom:(viewport?.offsetTop??0)+(viewport?.height??doc.defaultView.innerHeight)};
  const bounds=screen?.width?{left:Math.max(screen.left,visible.left),top:Math.max(screen.top,visible.top),right:Math.min(screen.right,visible.right),bottom:Math.min(screen.bottom,visible.bottom)}:visible;
  const insets=doc.defaultView.getComputedStyle(tip);
  bounds.left+=parseFloat(insets.getPropertyValue('--tooltip-safe-left'))||0;bounds.right-=parseFloat(insets.getPropertyValue('--tooltip-safe-right'))||0;
  bounds.top+=parseFloat(insets.getPropertyValue('--tooltip-safe-top'))||0;bounds.bottom-=parseFloat(insets.getPropertyValue('--tooltip-safe-bottom'))||0;
  const anchor=card.getBoundingClientRect(),availableWidth=Math.max(1,bounds.right-bounds.left-16),availableHeight=Math.max(1,bounds.bottom-bounds.top-16);
  tip.style.maxWidth=availableWidth/scale+'px';tip.style.maxHeight=availableHeight/scale+'px';
  tip.classList.remove('tooltip-stacked');
  const sideRoom=Math.max(bounds.right-anchor.right,anchor.left-bounds.left)-10*scale-8;
  if(tip.classList.contains('approved-tooltip')&&tip.offsetWidth*scale>sideRoom)tip.classList.add('tooltip-stacked');
  // Exceptional descriptions remain readable and accessible within the visible
  // rectangle; the normal card layouts need neither scrolling nor font shrinking.
  tip.style.overflowY=tip.scrollHeight>availableHeight/scale?'auto':'visible';
  const position=tooltipPlacement(anchor,{width:tip.offsetWidth*scale,height:tip.offsetHeight*scale},bounds,10*scale);
  Object.assign(tip.style,{left:(position.left-box.left)/scale+(container.scrollLeft??0)+'px',top:(position.top-box.top)/scale+(container.scrollTop??0)+'px',bottom:'auto',transform:'none'});
 };
 place();doc.fonts?.ready.then(place);
 return true;
}
