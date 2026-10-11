import {cardMarkup,SUITS,rankLabel} from './field.js';
import {suitSvg} from './card-art.js';
import {DECKS} from '../content/decks.js';
const suits=['spades','hearts','clubs','diamonds'];
export function deckStats(state,mode){
 const unknown=[...state.drawPile,...(state.bossState?.hiddenCardIds??[])];
 const cards=mode==='full'?Object.values(state.cards):unknown.map(id=>state.cards[id]);
 const stats={total:cards.length,categories:{aces:0,faces:0,numbered:0},suits:Object.fromEntries(suits.map(s=>[s,0])),ranks:Object.fromEntries(Array.from({length:13},(_,i)=>[i+2,0]))};
 for(const c of cards)if(c.enhancement!=='stone'){stats.suits[c.suit]++;stats.ranks[c.rank]++;stats.categories[c.rank===14?'aces':c.rank>=11?'faces':'numbered']++;}
 return stats;
}
export function createDeckView(state){
 const deck=DECKS[state.deckId];
 const root=document.createElement('div');root.className='deck-view';
 root.innerHTML=`<div class="deck-tabs" role="tablist" aria-label="Состав колоды"><button role="tab" data-mode="remaining">Осталось</button><button role="tab" data-mode="full">Вся колода</button></div><aside class="deck-stats"><div class="deck-info"><strong>${deck.name}</strong><p><em>${deck.bonus}</em> ${deck.effect}<br>${deck.timing}</p></div><div class="deck-base"><strong>Базовые карты</strong><div class="deck-categories"></div><div class="deck-suits"></div></div><div class="deck-ranks"></div></aside><div class="deck-grid" aria-label="Карты текущей колоды"></div>`;
 const grid=root.querySelector('.deck-grid');
 const hidden=state.bossState?.hiddenCardIds??[];
 const cards=Object.values(state.cards),available=new Set([...state.drawPile,...hidden]);
 for(const suit of suits){
   const row=document.createElement('div');row.className='deck-row';row.setAttribute('aria-label',({spades:'Пики',hearts:'Червы',clubs:'Трефы',diamonds:'Бубны'})[suit]);grid.append(row);
   const ordered=cards.filter(c=>c.suit===suit).sort((a,b)=>b.rank-a.rank);
   const gap=Math.min(56, (760-79)/Math.max(1,ordered.length-1));
   ordered.forEach((card,i)=>{
     const item=document.createElement('div');item.className='deck-card';item.dataset.cardId=card.id;
     item.dataset.available=String(available.has(card.id));item.setAttribute('aria-label',`${card.enhancement==='stone'?'Каменная карта':`${rankLabel(card.rank)} ${suit}`}, ${available.has(card.id)?hidden.length?'в колоде или скрытой руке':'в колоде':state.hand.includes(card.id)?'в руке':'сброшена'}`);
     const middle=(ordered.length-1)/2;
     item.style.left=((760-79-gap*(ordered.length-1))/2+i*gap)+'px';item.style.top=(Math.abs(i-middle)*.75)+'px';item.style.transform=`rotate(${(i-middle)*.55}deg)`;
     const art=document.createElement('div');art.className='playing-card card-scale';art.style.color=SUITS[suit][1];if(card.enhancement&&card.enhancement!=='base')art.dataset.enhancement=card.enhancement;art.innerHTML=cardMarkup(card);item.append(art);row.append(item);
   });
 }
 function select(mode){
   const stats=deckStats(state,mode);root.dataset.mode=mode;
   for(const b of root.querySelectorAll('[role=tab]')){const active=b.dataset.mode===mode;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;}
   for(const c of grid.querySelectorAll('.deck-card'))c.classList.toggle('used',mode==='remaining'&&c.dataset.available==='false');
   root.querySelector('.deck-categories').innerHTML=[['A',stats.categories.aces,'Тузы'],['<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 13L3 4L12 9L16 2L20 9L29 4L28 13Z" fill="currentColor"/><circle cx="16" cy="20" r="9" fill="none" stroke="currentColor" stroke-width="3"/><path d="M11 22Q16 27 21 22" fill="none" stroke="currentColor" stroke-width="2"/></svg>',stats.categories.faces,'Карты с лицом'],['#',stats.categories.numbered,'Числовые карты']].map(([symbol,n,label])=>`<div aria-label="${label}: ${n}"><span>${symbol}</span><b>${n}</b></div>`).join('');
   root.querySelector('.deck-suits').innerHTML=suits.map(s=>`<div aria-label="${s}: ${stats.suits[s]}"><span style="color:${SUITS[s][1]}">${suitSvg(s)}</span><b>${stats.suits[s]}</b></div>`).join('');
   root.querySelector('.deck-ranks').innerHTML=Array.from({length:13},(_,i)=>14-i).map(rank=>`<div><span>${rankLabel(rank)}</span><b>${stats.ranks[rank]}</b></div>`).join('');
 }
 for(const b of root.querySelectorAll('[role=tab]')){b.onclick=()=>select(b.dataset.mode);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const mode=e.key==='Home'?'remaining':e.key==='End'?'full':root.dataset.mode==='full'?'remaining':'full';select(mode);root.querySelector(`[data-mode="${mode}"]`).focus();}};}
 select('remaining');return root;
}

