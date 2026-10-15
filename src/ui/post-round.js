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
  const rowContainer=quote.jokerBonuses?document.createElement('div'):panel;if(quote.jokerBonuses){rowContainer.className='payout-bonus-list';panel.append(rowContainer);}
  function row(className,value,label,total){const item=document.createElement('div');item.className='payout-row '+className;const n=document.createElement('strong');n.textContent=value;const text=document.createElement('span');text.textContent=label;const dollars=document.createElement('strong');dollars.className='gold';dollars.textContent='$'+total;item.append(n,text,dollars);rowContainer.append(item);return item;}
  row('payout-hands',quote.hands,'Осталось рук ($1 каждая)',quote.hands);
  for(const bonus of quote.jokerBonuses??[]){const item=row('payout-joker',1,describeShopItem({entityId:bonus.entityId}).name,bonus.amount);item.dataset.jokerId=bonus.sourceId;}
  if(quote.interest)row('payout-interest',quote.interest,'Проценты ($1 за каждые $5)',quote.interest);
 }else{
  const entry=document.createElement('div');entry.id='shop_entry';const title=document.createElement('h2');title.textContent='Магазин';const text=document.createElement('p');text.textContent='Награда получена. Переход сохранён.';const scope=document.createElement('p');scope.className='shop-scope';scope.textContent='Промежуточная сборка: покупки, обновление магазина и следующий блайнд будут добавлены на следующем этапе.';entry.append(title,text,scope);panel.append(entry);
 }
 document.getElementById('stage').append(panel);
 if(entering&&!matchMedia('(prefers-reduced-motion: reduce)').matches)motion=panel.animate([{translate:'0 488px'},{translate:'0 0'}],{duration:360,easing:'cubic-bezier(.16,1,.3,1)'});
}


