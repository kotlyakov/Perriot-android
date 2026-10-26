import {cardMotion,reducedMotion} from './card-motion.js';
import {gameDuration} from './game-speed.js';
import {displayBlindTarget} from './field.js';
import {describeShopItem} from '../content/shop-display.js';
import {APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {getCashout} from '../core/cashout.js';
// Outside the active blind, the deck preview represents the full run deck.
export function roundDeckView(state){return state.phase==='round_won'?{...state,hand:[],discardPile:[],drawPile:Object.keys(state.cards)}:state;}
const hiddenIds=['blind_panel','blind_title','blind_token','blind_target','hand','hand_count','play_hand','discard','sort_panel','sort_label','sort_rank','sort_suit'];
let currentPhase=null,currentQuote=null,motion;
export function renderPostRound(state,busy,cashout){
 const phase=busy?'playing':state.phase;
 const visible=phase==='round_won'||phase==='shop';
 for(const id of hiddenIds)document.getElementById(id).hidden=visible;
 if(phase==='shop'&&state.shop){currentPhase=phase;motion?.cancel();document.getElementById('post_round')?.remove();return;}
 const quoteKey=phase==='round_won'?JSON.stringify({quote:getCashout(state),winPending:!!state.winPending},(_key,value)=>typeof value==='bigint'?value.toString():value):null;
 if(phase===currentPhase&&quoteKey===currentQuote)return;
 const entering=phase!==currentPhase;currentQuote=quoteKey;
 currentPhase=phase;motion?.cancel();document.getElementById('post_round')?.remove();
 if(!visible)return;
 const panel=document.createElement('section');panel.id='post_round';panel.className='panel fixed';panel.setAttribute('aria-label',phase==='shop'?'Магазин':'Награда за блайнд');
 if(phase==='round_won'){
  const quote=getCashout(state),button=document.createElement('button');button.id='cashout';button.className='orange';button.textContent='Обналичить: $'+quote.total;button.onclick=cashout;button.disabled=!!state.winPending;panel.append(button);
  const reward=document.createElement('div');reward.className='payout-blind';
  const token=document.createElement('div');token.className='token';token.textContent=state.round.blindId==='boss'?APK_BLINDS_BY_ID[state.apkBlinds.bossId].name:state.round.blindId==='big'?'БОЛЬШОЙ\nБЛАЙНД':'МАЛЫЙ\nБЛАЙНД';
  const target=document.createElement('div');target.className='payout-target';target.textContent='Минимум очков';const score=document.createElement('strong');score.className='scarlet';score.textContent=displayBlindTarget(state.round.target);target.append(score);
  const amount=document.createElement('strong');amount.className='gold';amount.textContent='$'.repeat(Number(quote.reward));reward.append(token,target,amount);panel.append(reward);
  const rowContainer=document.createElement('div');rowContainer.className='payout-bonus-list';Object.assign(rowContainer.style,{overflow:'visible',bottom:'14px',display:'grid',gridTemplateRows:'repeat(5, 43px)',gap:'3px'});panel.append(rowContainer);const rows=[];
  function row(className,value,label,total){const item=document.createElement('div');item.className='payout-row '+className;const n=document.createElement('strong');n.textContent=value;const text=document.createElement('span');text.textContent=label;const dollars=document.createElement('strong');dollars.className='gold';dollars.textContent='$'+total;item.append(n,text,dollars);Object.assign(item.style,{position:'static',minHeight:'0',margin:'0',fontSize:'17px'});Object.assign(n.style,{fontSize:'29px',flexShrink:'0'});Object.assign(text.style,{lineHeight:'19px',flex:'1'});dollars.style.fontSize='24px';item.dataset.amount=String(total);rows.push(item);return item;}
  row('payout-hands',quote.hands,state.deckId==='green'?'Осталось рук ($2 каждая)':'Осталось рук ($1 каждая)',quote.handReward??quote.hands);
  if(state.deckId==='green')row('payout-discards',state.cashoutQuote?.discardsRemainingBefore??state.round.discardsRemaining,'Осталось сбросов ($1 каждый)',quote.discards??0n);
  for(const bonus of quote.jokerBonuses??[]){const item=row('payout-joker',1,describeShopItem({entityId:bonus.entityId}).name,bonus.amount);item.dataset.jokerId=bonus.sourceId;}
  if(quote.tagReward)row('payout-investment',quote.tagReward/25n,'Инвестиционная награда',quote.tagReward);
  if(quote.interest)row('payout-interest',quote.interest,'Проценты ($1 за каждые $5)',quote.interest);
  let page=0;const pages=Math.ceil(rows.length/5),navigation=document.createElement('nav');navigation.setAttribute('aria-label','Страницы награды');
  Object.assign(navigation.style,{position:'absolute',left:'16px',right:'18px',bottom:'8px',display:'flex',justifyContent:'center',alignItems:'center',gap:'15px'});
  const previous=document.createElement('button'),count=document.createElement('span'),next=document.createElement('button');previous.textContent='‹';next.textContent='›';previous.setAttribute('aria-label','Предыдущие строки награды');next.setAttribute('aria-label','Следующие строки награды');
  for(const button of [previous,next])Object.assign(button.style,{width:'46px',height:'30px',fontSize:'22px'});
  function showRows(animate=false){
   rowContainer.replaceChildren(...rows.slice(page*5,page*5+5));previous.disabled=page===0;next.disabled=page===pages-1;count.textContent=(page+1)+' / '+pages;
   if(animate&&!reducedMotion())for(const [i,item] of [...rowContainer.children].entries()){
    cardMotion(item,[{opacity:0,translate:'-24px 0'},{opacity:1,translate:'3px 0',offset:.78},{opacity:1,translate:'0 0'}],{duration:gameDuration(280),delay:gameDuration(330+i*130),fill:'backwards'});
    const dollars=item.lastElementChild;cardMotion(dollars,[{scale:'.7',color:'#fff6b0'},{scale:'1.12',color:'#fff6b0',offset:.5},{scale:'1',color:'#f6c35d'}],{duration:gameDuration(300),delay:gameDuration(330+i*130),fill:'backwards'});
   }
  }
  previous.onclick=()=>{page--;showRows(true);};next.onclick=()=>{page++;showRows(true);};
  if(pages>1){rowContainer.style.gridTemplateRows='repeat(5, 40px)';navigation.append(previous,count,next);panel.append(navigation);}
  // Animation starts after attachment below so scaled layout remains stable.
  panel.revealPayout=()=>showRows(entering);showRows();
 }else{
  const entry=document.createElement('div');entry.id='shop_entry';const title=document.createElement('h2');title.textContent='Магазин';const text=document.createElement('p');text.textContent='Награда получена. Переход сохранён.';const scope=document.createElement('p');scope.className='shop-scope';scope.textContent='Промежуточная сборка: покупки, обновление магазина и следующий блайнд будут добавлены на следующем этапе.';entry.append(title,text,scope);panel.append(entry);
 }
 document.getElementById('stage').append(panel);panel.revealPayout?.();
 if(entering&&!matchMedia('(prefers-reduced-motion: reduce)').matches)motion=panel.animate([{translate:'0 488px'},{translate:'0 0'}],{duration:gameDuration(360),easing:'cubic-bezier(.16,1,.3,1)'});
}


