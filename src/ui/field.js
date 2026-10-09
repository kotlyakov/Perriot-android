import {isBossCardDebuffed} from '../core/boss-effects.js';
import {APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {animateNumber} from './number-animation.js';
import {showFlame} from './flame.js';
import {pipArtwork,suitSvg} from './card-art.js';
import {scoreHand} from '../core/score.js';
import {appendTooltipContents} from './tooltip-text.js';
import {describeCardModifiers} from '../content/card-modifier-display.js';
export const HAND_NAMES={high_card:'Старшая карта',pair:'Пара',two_pair:'Две пары',three_of_a_kind:'Тройка',straight:'Стрит',flush:'Флеш',full_house:'Фулл-хаус',four_of_a_kind:'Каре',straight_flush:'Стрит-флеш',five_of_a_kind:'Пятёрка',flush_house:'Флеш-хаус',flush_five:'Флеш-пятёрка'};
export const SUITS={spades:['♠','#283c53'],hearts:['♥','#bb3034'],clubs:['♣','#143d39'],diamonds:['♦','#ca502a']};
export function rankLabel(rank){return ({11:'J',12:'Q',13:'K',14:'A'})[rank]??String(rank);}
export function cardMarkup(card) {
 const [symbol,color]=SUITS[card.suit],rank=rankLabel(card.rank);
 let inside='';
 if(card.rank>=11 && card.rank<=13)inside=`<svg class="face" viewBox="0 0 70 124" aria-hidden="true"><rect x="1" y="1" width="68" height="122" rx="2" fill="none" stroke="${color}" stroke-width="2"/><path d="M10 27L15 10L26 18L35 5L44 18L56 10L60 27Z" fill="${color}"/><circle cx="35" cy="40" r="15" fill="#d8b98c" stroke="${color}" stroke-width="2"/><path d="M19 38L27 35M44 35L52 38M29 48Q35 53 41 48" fill="none" stroke="${color}" stroke-width="2"/><path d="M9 104L14 65L35 55L57 66L63 104Z" fill="${color}"/><path d="M18 67L51 102M52 67L20 104" stroke="#f0e5c8" stroke-width="7"/>${suitSvg(card.suit).replace('<svg ','<svg x="23" y="72" width="24" height="24" style="color:#f0e5c8" ')}<path d="M6 116H64" stroke="${color}" stroke-width="3"/></svg>`;
 else {
   inside=pipArtwork(card);
 }
 return `<span class="corner" style="color:${color}">${rank}<span>${suitSvg(card.suit)}</span></span>${inside}<span class="corner bottom" style="color:${color}">${rank}<span>${suitSvg(card.suit)}</span></span>`;
}
function text(id,value){document.getElementById(id).textContent=String(value);}
export function displayInteger(value){const s=String(value);return s.length>10?s.slice(0,3)+'e'+(s.length-3):s;}
export function showNumbers(chips,mult,animate=false){
 for(const [id,value] of [['chips_value',chips],['mult_value',mult]]){
   const n=document.getElementById(id);animateNumber(n,value,{animate,format:displayInteger,onFrame:()=>{n.style.fontSize=Math.min(43,(n.parentElement.clientWidth-12)/(.7*n.textContent.length))+'px';}});
 }
}

export function dismissCardTip(){document.querySelector('.card-tip')?.remove();}
export function renderField(state,selected,busy,onCard,onReorder,scoringPreview=null) {
 document.getElementById('deck').dataset.deck=state.deckId;
 const boss=state.round.blindId==='boss'?APK_BLINDS_BY_ID[state.apkBlinds?.bossId]:null;
 text('target_value',state.round.target);text('blind_title',boss?boss.name:state.round.blindId==='big'?'Большой блайнд':'Малый блайнд');document.querySelector('#blind_token span').textContent=boss?boss.name:state.round.blindId==='big'?'БОЛЬШОЙ\nБЛАЙНД':'МАЛЫЙ\nБЛАЙНД';document.querySelector('#blind_target b').textContent=boss?'$$$$$':state.round.blindId==='big'?'$$$$':'$$$';document.querySelector('#round strong').textContent=state.roundNumber??1;animateNumber(document.getElementById('round_score_value'),state.round.score,{format:displayInteger});animateNumber(document.getElementById('hands_value'),state.round.handsRemaining);animateNumber(document.getElementById('discards_value'),state.round.discardsRemaining);text('money_value','$'+state.money);
 document.querySelector('#ante strong').firstChild.textContent=String(state.phase==='shop'&&state.round.blindId==='boss'?state.apkShop.context.ante:state.round.ante);
 text('hand_count',state.hand.length+'/'+state.round.handSize);text('deck_count',state.drawPile.length+'/'+Object.keys(state.cards).length);text('joker_count',state.jokers.length+'/5');
 const played=state.hand.filter(id=>selected.has(id)).map(id=>state.cards[id]);
 let preview=scoringPreview;try{if(!preview && played.length)preview=scoreHand(state,played);}catch{}
 text('hand_name',preview?HAND_NAMES[preview.handId]:'');text('hand_level',preview?'Ур. '+state.handLevels[preview.handId]:'');
 const base=preview?.trace[0]?.after;
 showNumbers(base?.chips??0n,base?.mult??0n);
 showFlame(preview?.score??0n,state.round.target);
 for(const mode of ['rank','suit'])document.getElementById('sort_'+mode).classList.toggle('sort-active',state.sortMode===mode);
 const playing=state.phase==='playing';
 document.getElementById('play_hand').disabled=busy || !playing || !selected.size || !state.round.handsRemaining;
 document.getElementById('discard').disabled=busy || !playing || !selected.size || !state.round.discardsRemaining;
 for(const id of ['sort_rank','sort_suit'])document.getElementById(id).disabled=busy || !playing;
 const focusedCard=document.activeElement?.dataset.cardId;
 const hand=document.getElementById('hand');hand.replaceChildren();
 // geometry.json describes visible rotated bounds. Reserve 10px at each
 // edge for rotation rather than extending the fan beyond those bounds.
 const fanWidth=669;
 const gap=state.hand.length>1?Math.min(82,(fanWidth-115)/(state.hand.length-1)):0;
 const start=478+(fanWidth-115-gap*(state.hand.length-1))/2;
 state.hand.forEach((id,i)=>{
   const card=state.cards[id],b=document.createElement('button'),middle=(state.hand.length-1)/2,tilt=state.hand.length>1?(i-middle)*1.35:0;
   const debuffed=isBossCardDebuffed(state,card);b.className='playing-card'+(selected.has(id)?' selected':'')+(debuffed?' boss-debuffed':'');b.dataset.cardId=id;
   b.setAttribute('aria-label',`${rankLabel(card.rank)} ${({clubs:'трефы',diamonds:'бубны',hearts:'червы',spades:'пики'})[card.suit]}${debuffed?' — ослаблена':''}`);b.setAttribute('aria-pressed',selected.has(id));
   const left=start+i*gap,top=388+Math.abs(i-middle)*2.5-(selected.has(id)?28:0);
   Object.assign(b.style,{left:left+'px',top:top+'px',transform:`rotate(${tilt}deg)`,zIndex:String(3+i),color:SUITS[card.suit][1]});
   b.innerHTML=cardMarkup(card)+(debuffed?'<span class=debuff-stamp>Ослаблена</span>':'');b.disabled=busy || !playing;
   // Touch emits a compatibility click with detail=0 after pointerup. Only
   // keyboard/programmatic clicks need this path; pointers already toggled.
   b.addEventListener('click',e=>{if(e.detail===0 && !e.pointerType && !e.sourceCapabilities?.firesTouchEvents)onCard(id);});
   b.addEventListener('pointerdown',e=>{
     if(b.disabled || e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);
     document.querySelector('.card-tip')?.remove();
     const tip=document.createElement('div');tip.className='card-tip';tip.setAttribute('role','tooltip');
     const title=document.createDocumentFragment(),suit=document.createElement('span');
     title.append(document.createTextNode(rankLabel(card.rank)+' '));suit.style.color=SUITS[card.suit][1];suit.textContent=({clubs:'треф',diamonds:'бубен',hearts:'червей',spades:'пик'})[card.suit];title.append(suit);
     appendTooltipContents(tip,title,[`+${debuffed?0:card.rank===14?11:Math.min(card.rank,10)} очков`,...describeCardModifiers(card),...(debuffed?['Не даёт фишек и не запускает эффекты джокеров за эту карту.']:[])]);
     tip.dataset.cardId=id;
     const placeTip=()=>{tip.style.left=Math.max(8,Math.min(1348,parseFloat(b.style.left)-32))+'px';tip.style.top=Math.max(8,parseFloat(b.style.top)-100)+'px';};placeTip();
     const x=e.clientX,y=e.clientY,scale=document.getElementById('stage').getBoundingClientRect().width/1536;let dragged=false,to=i,held=false;
     const holdTimer=setTimeout(()=>{if(!b.isConnected)return;held=true;placeTip();document.getElementById('stage').append(tip);},350);
     const slots=[...hand.children].map(n=>({id:n.dataset.cardId,left:n.style.left,top:n.style.top,transform:n.style.transform}));
     function move(ev){if(ev.pointerId!==e.pointerId)return;
       if(Math.hypot(ev.clientX-x,ev.clientY-y)>8)dragged=true;
       if(dragged){b.classList.add('dragging');b.style.left=left+(ev.clientX-x)/scale+'px';b.style.top=top+(ev.clientY-y)/scale+'px';
         to=Math.max(0,Math.min(state.hand.length-1,Math.round((parseFloat(b.style.left)-start)/Math.max(gap,1))));
         const order=state.hand.filter(other=>other!==id);order.splice(to,0,id);
         for(const n of hand.children){if(n===b)continue;const slot=slots[order.indexOf(n.dataset.cardId)];Object.assign(n.style,{left:slot.left,top:parseFloat(slot.top)+(selected.has(slot.id)?28:0)-(selected.has(n.dataset.cardId)?28:0)+'px',transform:slot.transform});}
         placeTip();
       }
     }
     function cleanup(removeTip=true){clearTimeout(holdTimer);b.removeEventListener('pointermove',move);b.removeEventListener('pointerup',end);b.removeEventListener('pointercancel',cancel);if(removeTip)tip.remove();b.classList.remove('dragging');}
     async function end(ev){if(ev.pointerId!==e.pointerId)return;cleanup(false);if(dragged){await onReorder(id,to);tip.remove();}else if(!held){tip.remove();onCard(id);}}
     function cancel(){cleanup();for(const n of hand.children){const slot=slots.find(s=>s.id===n.dataset.cardId);Object.assign(n.style,{left:slot.left,top:slot.top,transform:slot.transform});}}
     b.addEventListener('pointermove',move);b.addEventListener('pointerup',end);b.addEventListener('pointercancel',cancel);
   });
   hand.append(b);
   if(id===focusedCard)b.focus({preventScroll:true});
 });
}


