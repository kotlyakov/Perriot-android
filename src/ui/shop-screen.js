import {SHOP_DROP_REGIONS,shopDropActions} from './shop-actions.js';
import {jokerArtworkSvg} from './joker-art.js';
import {consumableArtworkSvg} from '../content/consumable-illustrations.js';
import {collectionArtworkSvg} from '../content/collection-illustrations.js';
import {originalJokerKey} from '../content/jokers.js';
import {gameDuration} from './game-speed.js';
import {canEnterBoss} from '../core/boss-effects.js';
import {canLeaveApkShop} from '../core/blind-progression.js';
import {describeShopItem as describeCatalogueItem,displayPlayingCard} from '../content/shop-display.js';
import {appendCardDescription} from './card-description.js';
import {showCardTooltip,dismissCardTooltip} from './card-tooltip.js';
import {getRerollCost} from '../core/shop.js';
import {canAfford} from '../core/shop-pricing.js';
import {canManageInventory,canSellOwned} from '../core/inventory.js';


import {cardMarkup,applyCardModifiers} from './field.js';

const voucherDescriptions={
 v_overstock_norm:'В магазине на 1 карту больше.',v_overstock_plus:'В магазине ещё на 1 карту больше.',
 v_clearance_sale:'Все карты и наборы в магазине дешевле на 25%.',v_liquidation:'Все карты и наборы в магазине дешевле на 50%.',
 v_hone:'Фольга, голографические и полихромные издания появляются в 2 раза чаще.',v_glow_up:'Фольга, голографические и полихромные издания появляются в 4 раза чаще.',
 v_reroll_surplus:'Переброс магазина дешевле на $2.',v_reroll_glut:'Переброс магазина дешевле ещё на $2.',
 v_crystal_ball:'Даёт 1 дополнительное место для расходных карт.',v_omen_globe:'В наборах Таро могут появляться Спектральные карты.',
 v_telescope:'В Небесном наборе всегда есть планета для вашей самой часто сыгранной комбинации.',v_observatory:'Каждая планета среди ваших расходных карт даёт ×1,5 к множителю своей комбинации.',
 v_grabber:'Даёт 1 дополнительную руку в каждом раунде.',v_nacho_tong:'Даёт ещё 1 дополнительную руку в каждом раунде.',
 v_wasteful:'Даёт 1 дополнительный сброс в каждом раунде.',v_recyclomancy:'Даёт ещё 1 дополнительный сброс в каждом раунде.',
 v_tarot_merchant:'Карты Таро появляются в магазине чаще.',v_tarot_tycoon:'Карты Таро появляются в магазине значительно чаще.',
 v_planet_merchant:'Планеты появляются в магазине чаще.',v_planet_tycoon:'Планеты появляются в магазине значительно чаще.',
 v_seed_money:'Увеличивает предел процентов за раунд до $10.',v_money_tree:'Увеличивает предел процентов за раунд до $20.',
 v_blank:'Ничего не делает.',v_antimatter:'Даёт 1 дополнительное место для джокера.',
 v_magic_trick:'Позволяет покупать игральные карты в магазине.',v_illusion:'Игральные карты в магазине могут иметь усиление и издание.',
 v_hieroglyph:'Уменьшает анте на 1 и количество рук в каждом раунде на 1.',v_petroglyph:'Уменьшает анте на 1 и количество сбросов в каждом раунде на 1.',
 v_directors_cut:'За $10 позволяет заменить босса один раз за анте.',v_retcon:'За $10 позволяет заменять босса без ограничения числа замен.',
 v_paint_brush:'Увеличивает размер руки на 1 карту.',v_palette:'Увеличивает размер руки ещё на 1 карту.',
};
function describeShopItem(offer,options){
 const details=describeCatalogueItem(offer,options);
 return {...details,...(voucherDescriptions[offer.entityId]?{description:voucherDescriptions[offer.entityId],canBuy:true}:{}),...(displayPlayingCard(offer)?{canBuy:true}:{})};
}

// The same sticker details label the card and explain its persistent rules.
export function jokerStickers(offer){
 const rows=[];
 if(offer.eternal)rows.push({id:'eternal',label:'Вечный',description:'Нельзя продать или уничтожить.'});
 if(offer.perishable){const rounds=offer.perishRounds??5;rows.push({id:'perishable',label:'Временный · '+rounds,description:rounds===0?'Срок действия истёк. Эффект джокера отключён.':`Действует ещё ${rounds} раундов. После этого эффект джокера отключится.`});}
 if(offer.rental)rows.push({id:'rental',label:'Аренда',description:'Снимает $3 в конце каждого раунда.'});
 return rows;
}

let currentTargets=[],refreshSelectedActions=null;
let view=null,packView=null,selected=null,tip=null,lastMain=null,entryMotion,cancelDrag,cancelReturn,lastAcornRound=null;
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
function bindActionButton(button,action){button.onclick=()=>{if(!button.disabled)action();};}
function dismissTip(){if(tip?.isConnected)dismissCardTooltip();tip=null;}
function clearSelection(){refreshSelectedActions=null;document.getElementById('shop_action_zones')?.remove();selected=null;dismissTip();for(const root of [view,packView,document.getElementById('shop_owned')]){root?.querySelectorAll('.shop-choice').forEach(n=>{n.classList.remove('is-selected');n.querySelector('.shop-card')?.setAttribute('aria-pressed','false');});root?.querySelectorAll('.shop-buy,.shop-use').forEach(n=>n.remove());}}
function showTip(offer,card,state,busy){
 dismissTip();if(card.classList.contains('acorn-hidden'))return;const details=describeShopItem({...offer,edition:'base'},{owned:card.classList.contains('shop-owned-card')});tip=node('aside','shop-tooltip');tip.setAttribute('role','tooltip');tip.id='shop_tooltip';
 const owned=card.classList.contains('shop-owned-card')||card.closest('[data-kind]')?.dataset.kind==='consumable',area=card.classList.contains('shop-owned-card')?'jokers':'consumables';
 appendCardDescription(tip,offer,{owned,state,title:details.name,description:details.description,saleAllowed:!busy&&canSellOwned(state,offer,area)});
 showCardTooltip(tip,card);
}
// Independently drawn printing blocks: each catalogue identity gets its own ink,
// plate number and geometry. These are not source-game illustrations.
export function artwork(offer,kind){
 const key=originalJokerKey(offer.entityId??offer.originalKey??offer.id);
 const consumable=consumableArtworkSvg(key);
 if(consumable){const n=node('div','shop-art consumable-illustration');n.dataset.consumableId=key;n.innerHTML=consumable;return n;}
 const illustration=jokerArtworkSvg(key);
 if(illustration){const n=node('div','shop-art joker-illustration');n.dataset.jokerId=key;n.innerHTML=illustration;return n;}
 const collection=collectionArtworkSvg(key);
 if(collection){const n=node('div','shop-art collection-illustration');n.dataset.collectionArtId=key;n.innerHTML=collection;return n;}
 // Unknown offers have no invented catalogue plate. Known identities are drawn above.
 return node('div','shop-art');
}
function ticketArtwork(offer,details){
 const main=node('span','ticket-main'),stub=node('span','ticket-stub');
 main.append(artwork(offer,'voucher'),node('span','shop-card-name',details.name));
 stub.append(node('span','ticket-price-label','ЦЕНА'),money(offer.cost,52,23));
 const seam=node('span','ticket-perforation');seam.setAttribute('aria-hidden','true');
 return [main,stub,seam];
}
function actionZones(offer,kind,state,callbacks,busy){
 document.getElementById('shop_action_zones')?.remove();
 const group=node('div','shop-action-zones');group.id='shop_action_zones';group.dataset.offerId=offer.id;
 const actions=shopDropActions(state,offer,kind,callbacks.targetCardIds??[]);
 for(const [key,action] of Object.entries(actions)){
  const zone=rect(node('button','shop-drop-zone shop-'+key+'-zone'+((key==='use'&&action.action||action.action==='USE_PACK_CARD')?' shop-use':'')),...SHOP_DROP_REGIONS[key]);
  zone.type='button';zone.id='shop_'+key+'_zone';zone.dataset.available=String(action.available&&!busy);zone.disabled=busy||!action.available;zone.title=action.reason??action.label;
  const caption=node('strong','shop-drop-caption');for(const line of action.label.split('\n'))caption.append(node('span','',line));zone.append(caption);
  if(action.price!==undefined)zone.append(money(action.price,key==='buy'?680:150,key==='buy'?40:30));
  bindActionButton(zone,()=>{zone.disabled=true;clearSelection();callbacks.onAction?.(action.action,action.fields);});group.append(zone);
 }
 document.getElementById('stage').append(group);return {group,actions};
}
function choice(offer,kind,index,state,busy,callbacks,x,y,w,h){
 const wrap=rect(node('div','shop-choice'),x,y,w,h);wrap.dataset.offerId=offer.id;wrap.dataset.kind=kind;
 const hidden=kind==='owned'&&!state.bossState?.disabled&&state.bossState?.hiddenJokerIds?.includes(offer.id);
 const expired=offer.perishable===true&&offer.perishRounds===0;
 const debuffed=kind==='owned'&&!hidden&&(expired||state.phase==='playing'&&offer.debuffed===true),stickers=hidden?[]:jokerStickers(offer);
 const details=hidden?{name:'Скрытый джокер',canBuy:false}:describeShopItem(offer,{owned:kind==='owned'}),card=node('button','shop-card shop-'+(kind==='owned'?'owned-card':kind));card.type='button';card.disabled=busy;card.setAttribute('aria-label',[details.name,...stickers.map(row=>row.label),...(debuffed?['ослаблен']:[])].join(' — '));card.setAttribute('aria-pressed',String(selected?.id===offer.id));
 const cardSet=kind==='booster'?offer.entityId.startsWith('p_arcana_')?'Tarot':offer.entityId.startsWith('p_celestial_')?'Planet':offer.entityId.startsWith('p_spectral_')?'Spectral':offer.set:offer.set;
 if(!hidden&&cardSet)card.dataset.cardSet=cardSet;
 if(kind==='voucher'){card.classList.add('shop-ticket');card.append(...ticketArtwork(offer,details));}
 else if(hidden){card.classList.add('acorn-hidden');const back=node('span','acorn-back');back.setAttribute('aria-hidden','true');back.innerHTML='<svg viewBox="0 0 104 143"><path d="M7 7H97V136H7Z M14 14H90V129H14Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M52 28L80 72L52 115L24 72Z" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="52" cy="72" r="12" fill="currentColor"/></svg>';card.append(back);}
 else if(['pack','main'].includes(kind)&&displayPlayingCard(offer)){const playing=displayPlayingCard(offer);card.classList.add('playing-card','pack-playing-card');card.innerHTML=cardMarkup(playing);applyCardModifiers(card,playing);}else card.append(artwork(offer,kind),node('span','shop-card-name',details.name));
 if(debuffed){card.classList.add('heart-debuffed');card.append(node('span','joker-debuff-stamp',expired?'Срок истёк':'Ослаблен'));}
 if(stickers.length){const badges=node('span','joker-stickers');for(const row of stickers){const badge=node('span','joker-sticker',row.label);badge.dataset.sticker=row.id;badges.append(badge);}card.append(badges);}
 if(!hidden&&offer.edition&&offer.edition!=='base')card.dataset.edition=offer.edition;
 if(!['owned','consumable','pack','voucher'].includes(kind)){const plaque=node('div','shop-price');plaque.append(money(offer.cost));wrap.append(plaque);}
 wrap.append(card);
 function select(){
  clearSelection();selected={id:offer.id,kind};wrap.classList.add('is-selected');card.setAttribute('aria-pressed','true');
  refreshSelectedActions=()=>actionZones(offer,kind,state,callbacks,busy);refreshSelectedActions();
 }
 // Pointer selection is committed on release; captured touch need not emit a click.
 card.onclick=e=>{if(e.detail===0&&!e.pointerType&&!e.sourceCapabilities?.firesTouchEvents&&!busy){select();showTip(offer,card,state,busy);}};
 card.onpointerdown=e=>{
  if(busy||card.disabled||e.button!==0)return;cancelDrag?.();cancelReturn?.();
  const inventory=kind==='owned'||kind==='consumable',area=kind==='owned'?'jokers':'consumables';
  const purchasable=state.phase==='shop'&&!inventory,draggable=kind==='pack'||purchasable||inventory&&canManageInventory(state);
  const startX=e.clientX,startY=e.clientY,stageOrigin=document.getElementById('stage').getBoundingClientRect(),scale=stageOrigin.width/document.getElementById('stage').offsetWidth;let dragged=false,zones,ghost;
  card.setPointerCapture?.(e.pointerId);
  function cleanup(animateHome=false){
   zones?.group.remove();
   const returning=ghost;ghost=null;
   if(animateHome&&returning&&!reduced()){
    let finished=false,motion;
    const finish=()=>{if(finished)return;finished=true;motion?.cancel();returning.remove();wrap.style.opacity='';if(cancelReturn===finish)cancelReturn=null;};
    cancelReturn=finish;
    const [dx,dy=0]=returning.style.translate.split(' ').map(parseFloat);
    motion=returning.animate(shopReturnFrames(dx,dy),{duration:gameDuration(720),fill:'forwards',easing:'linear'});
    motion.finished.then(finish,finish);
   }else{returning?.remove();wrap.style.opacity='';}
   card.removeEventListener('pointermove',move);card.removeEventListener('pointerup',end);card.removeEventListener('pointercancel',cancel);card.removeEventListener('lostpointercapture',cancel);card.removeEventListener('keydown',escape);cancelDrag=null;if(card.hasPointerCapture?.(e.pointerId))card.releasePointerCapture(e.pointerId);
  }
  function cancel(){cleanup(dragged);clearSelection();}
  function escape(ev){if(ev.key==='Escape'){ev.preventDefault();cancel();}}
  function move(ev){
   if(ev.pointerId!==e.pointerId||!draggable)return;
   if(!dragged&&Math.hypot(ev.clientX-startX,ev.clientY-startY)>8){
    dragged=true;clearSelection();
    const stage=document.getElementById('stage'),bounds=wrap.getBoundingClientRect(),stageBounds=stage.getBoundingClientRect();
    ghost=wrap.cloneNode(true);ghost.querySelector('.shop-use')?.remove();rect(ghost,(bounds.left-stageBounds.left)/scale,(bounds.top-stageBounds.top)/scale,w,h);ghost.classList.add('is-dragging');ghost.setAttribute('aria-hidden','true');ghost.style.pointerEvents='none';stage.append(ghost);wrap.style.opacity='0';ghost.querySelector('button').tabIndex=-1;
    zones=actionZones(offer,kind,state,callbacks,busy);zones.group.classList.add('is-dragging');
   }
   if(dragged){ev.preventDefault();ghost.style.translate=(ev.clientX-startX)/scale+'px '+(ev.clientY-startY)/scale+'px';
    const px=(ev.clientX-stageOrigin.left)/scale,py=(ev.clientY-stageOrigin.top)/scale;
    for(const [key,[x,y,w,h]] of Object.entries(SHOP_DROP_REGIONS))zones.group.querySelector('#shop_'+key+'_zone').classList.toggle('is-over',px>=x&&px<=x+w&&py>=y&&py<=y+h);
   }
  }
  function end(ev){
   if(ev.pointerId!==e.pointerId)return;
   const px=(ev.clientX-stageOrigin.left)/scale,py=(ev.clientY-stageOrigin.top)/scale;
   const key=dragged?Object.keys(SHOP_DROP_REGIONS).find(key=>{const [x,y,w,h]=SHOP_DROP_REGIONS[key];return px>=x&&px<=x+w&&py>=y&&py<=y+h;}):null;
   const action=key?zones.actions[key]:null,drop=!!action&&!(inventory&&key==='buy'),available=action?.available;cleanup(dragged&&!(drop&&available));
   if(!dragged){if(!busy){select();showTip(offer,card,state,busy);}return;}
   if(drop){if(available)callbacks.onAction?.(action.action,action.fields);else callbacks.onNotice?.(action.reason??'Для этой карты выберите другую область.');}
   else if(dragged&&inventory){
    const siblings=[...document.querySelectorAll(`#shop_owned [data-kind=${kind}]`)],cardBounds=card.getBoundingClientRect();
    const inRow=ev.clientY>=cardBounds.top-25*scale&&ev.clientY<=cardBounds.bottom+25*scale;
    if(inRow&&!offer.pinned){const ids=siblings.map(n=>n.dataset.offerId),others=siblings.filter(n=>n.dataset.offerId!==offer.id),to=others.filter(n=>{const b=n.getBoundingClientRect();return ev.clientX>(b.left+b.right)/2;}).length;const ordered=ids.filter(id=>id!==offer.id);ordered.splice(to,0,offer.id);if((area!=='jokers'||!state.jokers.some((j,i)=>j.pinned&&ordered[i]!==j.id))&&ordered.some((id,i)=>id!==ids[i]))callbacks.onAction?.(area==='jokers'?'REORDER_JOKERS':'REORDER_CONSUMABLES',{cardIds:ordered});}
   }
  }
  cancelDrag=cancel;card.addEventListener('pointermove',move);card.addEventListener('pointerup',end);card.addEventListener('pointercancel',cancel);card.addEventListener('lostpointercapture',cancel);card.addEventListener('keydown',escape);
 };
 card.onkeydown=e=>{if(e.key==='Escape'){cancelDrag?.();clearSelection();}if(e.key==='F1'){e.preventDefault();showTip(offer,card,state,busy);}};
 if(selected?.id===offer.id)select();return wrap;
}
function ensureView(){
 if(view?.isConnected)return false;
 view=node('section','shop-screen');view.id='shop_screen';view.setAttribute('aria-label','Магазин');
 for(const [className,x,y,w,h] of [['shop-main-tray',185,12,457,192],['shop-voucher-tray',27,236,306,199],['shop-booster-tray',337,237,290,199]])view.append(rect(node('div','shop-tray '+className),x,y,w,h));
 const voucherLabel=rect(node('div','shop-voucher-label','БИЛЕТЫ'),42,274,28,144);view.append(voucherLabel);
 const offers=node('div','shop-offers');view.append(offers);document.getElementById('stage').append(view);
 const sign=node('section','shop-sign');sign.id='shop_sign';sign.setAttribute('aria-label','Магазин');sign.append(node('div','shop-sign-title','МАГАЗИН'),node('div','shop-sign-subtitle','Улучшите свою партию!'));document.getElementById('stage').append(sign);
 if(!document.getElementById('shop_owned')){const owned=node('div','shop-owned');owned.id='shop_owned';document.getElementById('stage').append(owned);}
 view.addEventListener('pointerdown',e=>{if(!e.target.closest('button'))clearSelection();});
 if(!reduced())entryMotion=view.animate([{translate:'0 488px'},{translate:'0 0'}],{duration:gameDuration(360),easing:'cubic-bezier(.16,1,.3,1)'});
 return true;
}
// Capture after persistence succeeds; await the returned exit before rendering
// the new state. The enclosing shop and voucher/booster trays stay in place.
export function prepareShopChange(type){
 cancelDrag?.();cancelReturn?.();
 // Lock the displayed controls while the accepted action animates, before
 // replacing inventory. Persistence has already succeeded at this point.
 for(const root of [view,packView,document.getElementById('shop_owned')])root?.querySelectorAll('button').forEach(b=>b.disabled=true);
 const outgoing=type==='REROLL_SHOP'?[...(view?.querySelectorAll('[data-kind=main]')??[])]:[];
 return async()=>{
  if(!outgoing.length)return;
  clearSelection();
  if(reduced())return;
  await Promise.allSettled(outgoing.map((card,i)=>card.animate([{opacity:1,scale:1},{opacity:1,scale:.08,offset:.85},{opacity:0,scale:0}],{duration:gameDuration(170),delay:gameDuration(i*15),fill:'forwards',easing:'cubic-bezier(.6,0,1,.3)'}).finished));
 };
}
function renderPack(state,busy,callbacks){
 dismissTip();entryMotion?.cancel();view?.controller?.abort();view?.remove();document.getElementById('shop_sign')?.remove();view=null;lastMain=null;
 const source=state.packState.sourceEntityId,targetHand=/^p_(arcana|spectral)_/.test(source),titleText=source.startsWith('p_arcana_')?'НАБОР ТАРО':source.startsWith('p_spectral_')?'ПРИЗРАЧНЫЙ НАБОР':source.startsWith('p_standard_')?'СТАНДАРТНЫЙ НАБОР':source.startsWith('p_buffoon_')?'ШУТОВСКОЙ НАБОР':'НЕБЕСНЫЙ НАБОР';
 if(!packView?.isConnected){packView=node('section','pack-screen');packView.id='pack_screen';document.getElementById('stage').append(packView);}
 packView.classList.toggle('arcana-pack',targetHand);packView.setAttribute('aria-label',titleText);
 packView.dataset.cardSet=source.startsWith('p_arcana_')?'Tarot':source.startsWith('p_celestial_')?'Planet':source.startsWith('p_spectral_')?'Spectral':'';
 packView.replaceChildren();const title=node('h1','pack-title',titleText);title.id='pack_title';const choices=node('p','pack-choices','Выберите '+state.packState.choicesRemaining);choices.id='pack_choices';packView.append(title,choices);
 const cards=state.packState.cards,spacing=cards.length>1?Math.min(116,520/(cards.length-1)):116,start=327-52-spacing*(cards.length-1)/2;
 cards.forEach((card,index)=>packView.append(choice(card,'pack',index,state,busy,callbacks,start+index*spacing,targetHand?65:135,targetHand?90:104,targetHand?123:143)));
 const skip=rect(node('button','pack-skip','Пропустить набор'),targetHand?690:235,targetHand?120:375,180,58);skip.id='pack_skip';skip.disabled=busy;bindActionButton(skip,()=>{skip.disabled=true;clearSelection();callbacks.onAction?.('SKIP_PACK',{});});packView.append(skip);
 renderOwned(state,busy,callbacks);
}
function renderOwned(state,busy,callbacks){
 let owned=document.getElementById('shop_owned');if(!owned){owned=node('div','shop-owned');owned.id='shop_owned';document.getElementById('stage').append(owned);}owned.replaceChildren();
 const jokers=state.jokers,step=jokers.length<=3?220:Math.min(130,560/Math.max(1,jokers.length-1)),jokerStart=744-52-step*(jokers.length-1)/2;
 jokers.forEach((o,i)=>owned.append(choice(o,'owned',i,state,busy,callbacks,jokerStart+i*step,23,104,143)));
 const consumables=state.consumables??[],consumableStep=Math.min(103,164/Math.max(1,consumables.length-1));
 consumables.forEach((o,i,a)=>owned.append(choice(o,'consumable',i,state,busy,callbacks,1145+(i-(a.length-1)/2)*consumableStep,25,96,141)));
 document.getElementById('joker_count').textContent=jokers.length+'/'+((state.jokerSlots??5)+jokers.filter(j=>j.edition==='negative').length);
 document.getElementById('consumable_count').textContent=(state.consumables?.length??0)+'/'+((state.consumableSlots??2)+(state.consumables??[]).filter(c=>c.edition==='negative').length);
}
// Keep selection-only updates visible to existing consumable action handlers.
export function updateShopTargets(ids){
 currentTargets.splice(0,currentTargets.length,...ids);
 // Pack actions stay selected while their targets change; owned actions keep the established reset.
 if(selected?.kind==='pack')refreshSelectedActions?.();else clearSelection();
}
export function renderShop(state,busy,{onAction,onNotice,targetCardIds=[]}={}){
 targetCardIds=[...targetCardIds];currentTargets=targetCardIds;
 cancelDrag?.();cancelReturn?.();document.getElementById('shop_action_zones')?.remove();
 const acornRound=state.phase==='playing'&&!state.bossState?.disabled&&state.bossState?.id==='bl_final_acorn'?`${state.runId}:${state.roundNumber}`:null;
 // Native setup unhighlights before shuffling; an old highlight must not track
 // a known identity through the shuffle. Later renders are not fresh setup.
 if(acornRound!==lastAcornRound){if(acornRound)clearSelection();lastAcornRound=acornRound;}
 if(state.phase==='pack'&&state.packState){renderPack(state,busy,{onAction,onNotice,targetCardIds});return;}
 packView?.remove();packView=null;
 if(state.phase!=='shop'||!state.shop){
  dismissTip();entryMotion?.cancel();view?.controller?.abort();view?.remove();document.getElementById('shop_sign')?.remove();view=null;if(!acornRound)selected=null;lastMain=null;renderOwned(state,busy,{onAction,onNotice,targetCardIds});return;
 }
 const fresh=ensureView();view.querySelector('.shop-voucher-label').textContent='БИЛЕТЫ · АНТЕ '+(state.apkShop?.context.ante??state.round?.ante??'');const callbacks={onAction,onNotice,targetCardIds},offers=view.querySelector('.shop-offers'),owned=document.getElementById('shop_owned');
 const all=[...state.shop.main,...state.shop.vouchers,...state.shop.boosters,...state.jokers,...(state.consumables??[])];if(selected&&!all.some(o=>o.id===selected.id))clearSelection();dismissTip();offers.replaceChildren();owned.replaceChildren();
 const main=state.shop.main,mainWidth=104,spacing=Math.min(118,main.length>1?330/(main.length-1):118),start=413-mainWidth/2-spacing*(main.length-1)/2;
 main.forEach((o,i)=>offers.append(choice(o,'main',i,state,busy,callbacks,start+i*spacing,38,104,142)));
 const tickets=rect(node('div','shop-ticket-list'),79,251,226,172);tickets.id='shop_ticket_list';tickets.setAttribute('aria-label','Билеты магазина');
 const ticketStart=state.shop.vouchers.length===1?46:4;
 state.shop.vouchers.forEach((o,i)=>tickets.append(choice(o,'voucher',i,state,busy,callbacks,2,ticketStart+i*84,220,74)));offers.append(tickets);
 if(state.shop.vouchers.length>2){
  for(const [direction,y,label] of [[-1,255,'Предыдущие билеты'],[1,383,'Следующие билеты']]){
   const scroll=rect(node('button','shop-ticket-scroll',direction<0?'▲':'▼'),306,y,21,35);scroll.type='button';scroll.setAttribute('aria-label',label);scroll.disabled=busy;
   bindActionButton(scroll,()=>tickets.scrollBy({top:direction*84,behavior:reduced()?'instant':'smooth'}));offers.append(scroll);
  }
 }
 state.shop.boosters.forEach((o,i)=>offers.append(choice(o,'booster',i,state,busy,callbacks,364+i*127,246,111,181)));
 renderOwned(state,busy,callbacks);
 view.querySelectorAll('.shop-action').forEach(n=>n.remove());
 const next=rect(node('button','shop-action shop-next'),20,19,156,82);next.id='shop_next_round';next.append(node('span','','Следующий'),node('strong','','Раунд'));const boss=state.round.blindId==='big'&&canEnterBoss({...state,phase:'blind_selection'});next.disabled=busy||!canLeaveApkShop(state);next.title=state.round.blindId==='boss'?'Перейти к следующему анте':state.round.blindId==='small'?'Перейти к большому блайнду':boss?'Перейти к выбранному боссу':state.apkBlinds?.bossId==='bl_ox'?'Нет однозначного сохранённого выбора комбинации Буйвола':'Следующий блайнд пока недоступен';next.onclick=()=>onAction?.('LEAVE_SHOP',{});view.append(next);
 const rerollCost=getRerollCost(state.shop),reroll=rect(node('button','shop-action shop-reroll'),21,107,155,89);reroll.id='shop_reroll';reroll.append(node('span','','Переброс'),money(rerollCost,137,38));reroll.disabled=busy||!canAfford(state.money,rerollCost,state.bankruptAt??0n);reroll.onclick=()=>{clearSelection();onAction?.('REROLL_SHOP',{});};view.append(reroll);
 const signature=main.map(o=>o.id).join('|');if(!fresh&&lastMain!==null&&signature!==lastMain&&!reduced())offers.querySelectorAll('[data-kind=main]').forEach((n,i)=>n.animate([{opacity:0,scale:0},{opacity:1,scale:.12,offset:.15},{opacity:1,scale:1}],{duration:gameDuration(200),delay:gameDuration(i*15),easing:'cubic-bezier(.15,.7,.3,1)'}));lastMain=signature;
}



