import {describeShopItem} from '../content/shop-display.js';
import {getRerollCost,hasJokerSpace} from '../core/shop.js';
import {canAfford} from '../core/shop-pricing.js';
import {SUPPORTED_JOKERS} from '../content/jokers.js';

let view=null,selected=null,tip=null,held=false,lastMain=null,entryMotion,stageTipListener=false,cancelDrag,cancelReturn;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const node=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
export function shopMoneyFontSize(value,width,max=27){return Math.min(max,width/(String(value).length+1)/.66);}
// Damped spring along the actual flight vector; visual only, no game RNG.
export function shopReturnFrames(dx,dy){
 return Array.from({length:61},(_,i)=>{
  const t=i/60,q=Math.exp(-6*t)*(Math.cos(10*t)+.6*Math.sin(10*t))*(1-t*t);
  return {translate:`${dx*q}px ${dy*q}px`,offset:t};
 });
}
function money(value,width=56,max=27){const n=node('span','shop-money','$'+value);n.style.fontSize=shopMoneyFontSize(value,width,max)+'px';return n;}
function rect(n,x,y,w,h){Object.assign(n.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});return n;}
function dismissTip(){tip?.remove();tip=null;}
function clearSelection(){selected=null;dismissTip();view?.querySelectorAll('.shop-choice').forEach(n=>{n.classList.remove('is-selected');n.querySelector('.shop-card')?.setAttribute('aria-pressed','false');});document.getElementById('shop_owned')?.querySelectorAll('.shop-choice').forEach(n=>{n.classList.remove('is-selected');n.querySelector('.shop-card')?.setAttribute('aria-pressed','false');});view?.querySelectorAll('.shop-buy').forEach(n=>n.remove());document.getElementById('shop_owned')?.querySelectorAll('.shop-buy').forEach(n=>n.remove());}
function showTip(offer,card){
 dismissTip();const details=describeShopItem(offer);tip=node('aside','shop-tooltip');tip.setAttribute('role','tooltip');tip.id='shop_tooltip';
 tip.append(node('strong','',details.name),node('p','',details.description));
 const stage=document.getElementById('stage'),scale=stage.getBoundingClientRect().width/1536,b=card.getBoundingClientRect(),s=stage.getBoundingClientRect();
 const x=(b.left-s.left)/scale,y=(b.top-s.top)/scale;
 Object.assign(tip.style,{left:Math.min(1300,Math.max(450,x+card.offsetWidth+12))+'px',top:Math.min(475,Math.max(12,y))+'px'});stage.append(tip);
}
// Independently drawn printing blocks: each catalogue identity gets its own ink,
// plate number and geometry. These are not source-game illustrations.
function artwork(offer,kind){
 const key=offer.entityId??offer.originalKey??offer.id;let hash=0;for(const c of key)hash=(hash*31+c.charCodeAt(0))>>>0;
 const ink=['#176e80','#b84b37','#406b42','#7a5382','#ac772b'][hash%5],variant=hash%4;
 const motifs=[
 '<path d="M27 67L43 32L60 67L75 32L91 67Z" fill="currentColor"/><circle cx="59" cy="88" r="23" fill="none" stroke="currentColor" stroke-width="5"/><path d="M42 91Q59 107 76 91" fill="none" stroke="currentColor" stroke-width="4"/>',
 '<path d="M25 34H93V100H25Z" fill="none" stroke="currentColor" stroke-width="5"/><path d="M25 55H93M25 78H93M47 34V100M71 34V100" stroke="currentColor" stroke-width="3"/><circle cx="59" cy="67" r="16" fill="currentColor"/>',
 '<path d="M59 25L92 67L59 111L26 67Z" fill="none" stroke="currentColor" stroke-width="5"/><path d="M59 42L79 67L59 94L39 67Z" fill="currentColor"/><circle cx="59" cy="67" r="9" fill="#f0e5c8"/>',
 '<circle cx="59" cy="68" r="35" fill="none" stroke="currentColor" stroke-width="5"/><path d="M27 98L90 36M25 69H93M59 33V103" stroke="currentColor" stroke-width="5"/><circle cx="59" cy="68" r="16" fill="currentColor"/>'
 ];
 const n=node('div','shop-art');n.style.setProperty('--shop-ink',ink);
 n.innerHTML=`<svg viewBox="0 0 118 138" aria-hidden="true"><path d="M8 8H110V130H8Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M13 14H105M13 124H105" stroke="currentColor" stroke-width="2"/>${motifs[variant]}<path d="M17 19H33M85 119H101" stroke="currentColor" stroke-width="5"/></svg>`;
 if(kind==='booster')n.append(node('span','shop-pack-stamp','ПЬЕРО'));
 n.append(node('span','shop-plate',String(hash%999+1).padStart(3,'0')));return n;
}
function choice(offer,kind,index,state,busy,callbacks,x,y,w,h){
 const wrap=rect(node('div','shop-choice'),x,y,w,h);wrap.dataset.offerId=offer.id;wrap.dataset.kind=kind;
 const details=describeShopItem(offer),card=node('button','shop-card shop-'+(kind==='owned'?'owned-card':kind));card.type='button';card.setAttribute('aria-label',details.name);card.setAttribute('aria-pressed',String(selected?.id===offer.id));card.append(artwork(offer,kind),node('span','shop-card-name',details.name));
 if(offer.edition&&offer.edition!=='base')card.dataset.edition=offer.edition;
 if(kind!=='owned'&&kind!=='consumable'){const plaque=node('div','shop-price');plaque.append(money(offer.cost));wrap.append(plaque);}
 wrap.append(card);
 function select(){
  clearSelection();selected={id:offer.id,kind};wrap.classList.add('is-selected');card.setAttribute('aria-pressed','true');
  const amount=offer.sellCost;if(kind!=='owned'||state.phase!=='shop')return;
  const button=node('button','shop-buy');button.type='button';button.append(money(amount,95,29));button.setAttribute('aria-label','Продать '+details.name+' за $'+amount);
  const supported=SUPPORTED_JOKERS.includes(offer.entityId)&&!offer.eternal;
  button.disabled=busy;button.classList.toggle('shop-unavailable',!supported);button.title=supported?'Продать':'Доступен только просмотр';
  button.onclick=e=>{e.stopPropagation();dismissTip();if(!supported){callbacks.onNotice?.('Эта карта пока доступна только для просмотра.');return;}callbacks.onAction?.('SELL_JOKER',{jokerId:offer.id});};wrap.append(button);
 }
 card.onclick=()=>{if(held){held=false;return;}if(!busy){if(kind==='owned')select();showTip(offer,card);}};
 card.onpointerdown=e=>{
  if(busy||card.disabled||e.button!==0)return;cancelDrag?.();cancelReturn?.();held=false;showTip(offer,card);
  const purchasable=state.phase==='shop'&&kind!=='owned'&&kind!=='consumable';
  const startX=e.clientX,startY=e.clientY,scale=document.getElementById('stage').getBoundingClientRect().width/1536;let dragged=false,zone,ghost;
  card.setPointerCapture?.(e.pointerId);
  function cleanup(animateHome=false){
   zone?.remove();
   const returning=ghost;ghost=null;
   if(animateHome&&returning&&!reduced()){
    let finished=false,motion;
    const finish=()=>{if(finished)return;finished=true;motion?.cancel();returning.remove();wrap.style.opacity='';if(cancelReturn===finish)cancelReturn=null;};
    cancelReturn=finish;
    const [dx,dy]=returning.style.translate.split(' ').map(parseFloat);
    motion=returning.animate(shopReturnFrames(dx,dy),{duration:720,fill:'forwards',easing:'linear'});
    motion.finished.then(finish,finish);
   }else{returning?.remove();wrap.style.opacity='';}
   card.removeEventListener('pointermove',move);card.removeEventListener('pointerup',end);card.removeEventListener('pointercancel',cancel);card.removeEventListener('lostpointercapture',cancel);card.removeEventListener('keydown',escape);cancelDrag=null;if(card.hasPointerCapture?.(e.pointerId))card.releasePointerCapture(e.pointerId);
  }
  function cancel(){held=dragged||held;cleanup(dragged);dismissTip();}
  function escape(ev){if(ev.key==='Escape'){ev.preventDefault();cancel();}}
  function move(ev){
   if(ev.pointerId!==e.pointerId||!purchasable)return;
   if(!dragged&&Math.hypot(ev.clientX-startX,ev.clientY-startY)>8){
    dragged=true;held=true;clearSelection();
    const stage=document.getElementById('stage'),bounds=wrap.getBoundingClientRect(),stageBounds=stage.getBoundingClientRect();
    ghost=wrap.cloneNode(true);rect(ghost,(bounds.left-stageBounds.left)/scale,(bounds.top-stageBounds.top)/scale,w,h);ghost.classList.add('is-dragging');ghost.setAttribute('aria-hidden','true');ghost.style.pointerEvents='none';stage.append(ghost);wrap.style.opacity='0';ghost.querySelector('button').tabIndex=-1;
    zone=rect(node('div','shop-buy-zone'),454,15,895,182);zone.id='shop_buy_zone';zone.setAttribute('aria-live','polite');
    const supported=kind==='main'&&details.canBuy&&(state.inflation??0n)===0n;
    const reason=!supported?'Доступен только просмотр':!canAfford(state.money,offer.cost,state.bankruptAt??0n)?'Недостаточно денег':!hasJokerSpace(state,offer)?'Нет места для джокера':null;
    zone.dataset.available=String(!reason);zone.append(node('strong','',reason??'Купить'),money(offer.cost,800,43));document.getElementById('stage').append(zone);
   }
   if(dragged){ev.preventDefault();ghost.style.translate=(ev.clientX-startX)/scale+'px '+(ev.clientY-startY)/scale+'px';const b=zone.getBoundingClientRect();zone.classList.toggle('is-over',ev.clientX>=b.left&&ev.clientX<=b.right&&ev.clientY>=b.top&&ev.clientY<=b.bottom);}
  }
  function end(ev){
   if(ev.pointerId!==e.pointerId)return;
   const bounds=zone?.getBoundingClientRect(),drop=dragged&&bounds&&ev.clientX>=bounds.left&&ev.clientX<=bounds.right&&ev.clientY>=bounds.top&&ev.clientY<=bounds.bottom,available=zone?.dataset.available==='true';cleanup(dragged&&!(drop&&available));
   if(drop){if(available)callbacks.onAction?.('BUY_SHOP_CARD',{offerId:offer.id});else callbacks.onNotice?.('Покупка недоступна: проверьте эффект карты, деньги и свободные места.');}
  }
  cancelDrag=cancel;card.addEventListener('pointermove',move);card.addEventListener('pointerup',end);card.addEventListener('pointercancel',cancel);card.addEventListener('lostpointercapture',cancel);card.addEventListener('keydown',escape);
 };
 card.onkeydown=e=>{if(e.key==='Escape'){cancelDrag?.();clearSelection();}if(e.key==='F1'){e.preventDefault();showTip(offer,card);}};
 if(selected?.id===offer.id)select();return wrap;
}
function ensureView(){
 if(view?.isConnected)return false;
 view=node('section','shop-screen');view.id='shop_screen';view.setAttribute('aria-label','Магазин');
 for(const [className,x,y,w,h] of [['shop-main-tray',185,12,457,192],['shop-voucher-tray',27,236,306,199],['shop-booster-tray',337,237,290,199]])view.append(rect(node('div','shop-tray '+className),x,y,w,h));
 const voucherLabel=rect(node('div','shop-voucher-label','ВАУЧЕР АНТЕ'),42,274,28,144);view.append(voucherLabel);
 const offers=node('div','shop-offers');view.append(offers);document.getElementById('stage').append(view);
 const sign=node('section','shop-sign');sign.id='shop_sign';sign.setAttribute('aria-label','Магазин');sign.append(node('div','shop-sign-title','МАГАЗИН'),node('div','shop-sign-subtitle','Улучшите свою партию!'));document.getElementById('stage').append(sign);
 if(!document.getElementById('shop_owned')){const owned=node('div','shop-owned');owned.id='shop_owned';document.getElementById('stage').append(owned);}
 view.addEventListener('pointerdown',e=>{if(!e.target.closest('button'))clearSelection();});
 document.getElementById('stage').addEventListener('pointerdown',e=>{if(!e.target.closest('.shop-choice,.shop-tooltip'))dismissTip();},{signal:(view.controller=new AbortController()).signal});
 if(!reduced())entryMotion=view.animate([{translate:'0 488px'},{translate:'0 0'}],{duration:360,easing:'cubic-bezier(.16,1,.3,1)'});
 return true;
}
// Capture after persistence succeeds; await the returned exit before rendering
// the new state. The enclosing shop and voucher/booster trays stay in place.
export function prepareShopChange(type){
 cancelDrag?.();cancelReturn?.();
 // Lock the displayed controls while the accepted action animates, before
 // replacing inventory. Persistence has already succeeded at this point.
 if(view){view.querySelectorAll('button').forEach(b=>b.disabled=true);document.getElementById('shop_owned')?.querySelectorAll('button').forEach(b=>b.disabled=true);}
 const outgoing=type==='REROLL_SHOP'?[...(view?.querySelectorAll('[data-kind=main]')??[])]:[];
 return async()=>{
  if(!outgoing.length)return;
  clearSelection();
  if(reduced())return;
  await Promise.allSettled(outgoing.map((card,i)=>card.animate([{opacity:1,translate:'0 0'},{opacity:0,translate:'0 -90px'}],{duration:220,delay:i*25,fill:'forwards',easing:'ease-in'}).finished));
 };
}
function renderOwned(state,busy,callbacks){
 if(!stageTipListener){document.getElementById('stage').addEventListener('pointerdown',e=>{if(!e.target.closest('.shop-choice,.shop-tooltip'))dismissTip();});stageTipListener=true;}
 let owned=document.getElementById('shop_owned');if(!owned){owned=node('div','shop-owned');owned.id='shop_owned';document.getElementById('stage').append(owned);}owned.replaceChildren();
 const jokers=state.jokers,step=jokers.length<=3?220:Math.min(130,560/Math.max(1,jokers.length-1)),jokerStart=744-52-step*(jokers.length-1)/2;
 jokers.forEach((o,i)=>owned.append(choice(o,'owned',i,state,busy,callbacks,jokerStart+i*step,23,104,143)));
 (state.consumables??[]).forEach((o,i,a)=>owned.append(choice(o,'consumable',i,state,busy,callbacks,1145+(i-(a.length-1)/2)*103,25,96,141)));
 document.getElementById('joker_count').textContent=jokers.length+'/'+((state.jokerSlots??5)+jokers.filter(j=>j.edition==='negative').length);
 document.getElementById('consumable_count').textContent=(state.consumables?.length??0)+'/'+(state.consumableSlots??2);
}
export function renderShop(state,busy,{onAction,onNotice}={}){
 cancelDrag?.();cancelReturn?.();
 if(state.phase!=='shop'){
  dismissTip();entryMotion?.cancel();view?.controller?.abort();view?.remove();document.getElementById('shop_sign')?.remove();view=null;selected=null;lastMain=null;renderOwned(state,busy,{onAction,onNotice});return;
 }
 const fresh=ensureView();view.querySelector('.shop-voucher-label').textContent='ВАУЧЕР '+(state.round?.ante??'')+' АНТЕ';const callbacks={onAction,onNotice},offers=view.querySelector('.shop-offers'),owned=document.getElementById('shop_owned');
 const all=[...state.shop.main,...state.shop.vouchers,...state.shop.boosters,...state.jokers];if(selected&&!all.some(o=>o.id===selected.id))clearSelection();dismissTip();offers.replaceChildren();owned.replaceChildren();
 const main=state.shop.main,mainWidth=104,spacing=Math.min(118,main.length>1?330/(main.length-1):118),start=413-mainWidth/2-spacing*(main.length-1)/2;
 main.forEach((o,i)=>offers.append(choice(o,'main',i,state,busy,callbacks,start+i*spacing,38,104,142)));
 state.shop.vouchers.forEach((o,i)=>offers.append(choice(o,'voucher',i,state,busy,callbacks,150+i*98,265,90,143)));
 state.shop.boosters.forEach((o,i)=>offers.append(choice(o,'booster',i,state,busy,callbacks,364+i*127,246,111,181)));
 renderOwned(state,busy,callbacks);
 view.querySelectorAll('.shop-action').forEach(n=>n.remove());
 const next=rect(node('button','shop-action shop-next'),20,19,156,82);next.id='shop_next_round';next.append(node('span','','Следующий'),node('strong','','Раунд'));next.disabled=busy||state.round.blindId!=='small';next.title=state.round.blindId==='small'?'Перейти к большому блайнду':'Следующий блайнд пока недоступен';next.onclick=()=>onAction?.('LEAVE_SHOP',{});view.append(next);
 const rerollCost=getRerollCost(state.shop),reroll=rect(node('button','shop-action shop-reroll'),21,107,155,89);reroll.id='shop_reroll';reroll.append(node('span','','Переброс'),money(rerollCost,137,38));reroll.disabled=busy||!canAfford(state.money,rerollCost,state.bankruptAt??0n);reroll.onclick=()=>{clearSelection();onAction?.('REROLL_SHOP',{});};view.append(reroll);
 const signature=main.map(o=>o.id).join('|');if(!fresh&&lastMain!==null&&signature!==lastMain&&!reduced())offers.querySelectorAll('[data-kind=main]').forEach((n,i)=>n.animate([{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 0'}],{duration:220,delay:i*35,easing:'ease-out'}));lastMain=signature;
}

