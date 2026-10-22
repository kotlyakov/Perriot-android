import {DECKS} from '../content/decks.js';
import {STAKES} from '../content/stakes.js';
import {deckUnlocked,stakeUnlocked,collectionEntries} from '../core/profile.js';

let screen, previousFocus;
function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function button(id,label,className,action){const node=element('button',className,label);node.id=id;node.type='button';node.onclick=action;return node;}
function enter(node){if(!matchMedia('(prefers-reduced-motion: reduce)').matches)node.animate([{transform:'translateY(688px)'},{transform:'translateY(0)'}],{duration:360,easing:'cubic-bezier(.16,1,.3,1)'});}

/** UI only: onNew receives {deckId, seed, stake}; caller creates the blind-selection state. */
export function renderStartScreen({hasSave=false,onContinue,onNew,onSettings,profile,profileName='П1',onCollection,onProfile}){
 removeStartScreen();previousFocus=document.activeElement;
 screen=element('section','start-screen');screen.id='start_screen';screen.setAttribute('aria-label','Главное меню Пьеро');
 const title=element('h1','start-logo','Пьеро');screen.append(title);
 const ornament=element('div','start-ornament','♠');ornament.setAttribute('aria-hidden','true');screen.append(ornament);
 const bar=element('nav','start-menu');bar.setAttribute('aria-label','Главное меню');
 const newButton=button('start_new','Играть','blue',()=>showSetup());
 const collection=button('start_collection','Коллекция','start-green',()=>onCollection?.());collection.disabled=!onCollection;collection.setAttribute('aria-label','Коллекция');
 bar.append(newButton,button('start_settings','Настройки','orange',()=>onSettings?.()),collection);screen.append(bar);
 const profileButton=button('start_profile','','start-profile',()=>onProfile?.());profileButton.disabled=!onProfile;profileButton.setAttribute('aria-label','Текущий профиль '+profileName);profileButton.append(element('span','','Профиль'),element('strong','',profileName));screen.append(profileButton);
 const language=button('start_language','Русский','start-language',()=>{});language.disabled=true;language.setAttribute('aria-label','Текущий язык: Русский. Выбор других языков ещё не реализован');screen.append(language);
 document.getElementById('stage').append(screen);enter(screen);newButton.focus({preventScroll:true});

 function showSetup(){
  screen.querySelector('.start-setup')?.remove();
  const panel=element('section','start-setup');panel.setAttribute('aria-label','Новая партия');
  const heading=element('h2','','Новая партия');panel.append(heading);
  const tabs=element('div','start-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Режим партии');
  const newTab=button('setup_new_tab','Новая игра','blue',()=>{});newTab.setAttribute('aria-pressed','true');
  const continueTab=button('setup_continue_tab','Продолжить','start-green',()=>onContinue?.());continueTab.disabled=!hasSave;tabs.append(newTab,continueTab);panel.append(tabs);
  const row=element('div','start-deck-row');
  const deck=element('div','start-deck-back');deck.setAttribute('aria-hidden','true');deck.append(element('span','','♠'));
  const info=element('div','start-deck-info');const deckName=element('h3'),effect=element('p');info.append(deckName,effect);row.append(deck,info);panel.append(row);
  const deckIds=Object.keys(DECKS);let deckId='red';
  const choices=element('div','start-deck-choices');choices.setAttribute('role','group');choices.setAttribute('aria-label','Выбрать колоду');
  const selector=element('select');selector.id='setup_deck_select';selector.setAttribute('aria-label','Колода');
  for(const id of deckIds){const option=element('option','',DECKS[id].name);option.id='setup_deck_'+id;option.value=id;option.disabled=!!profile&&!deckUnlocked(profile,id);selector.append(option);}
  selector.onchange=()=>{deckId=selector.value;refreshDeck();};
  function cycle(direction){deckId=deckIds[(deckIds.indexOf(deckId)+direction+deckIds.length)%deckIds.length];refreshDeck();}
  const previous=button('setup_deck_prev','‹','orange',()=>cycle(-1)),next=button('setup_deck_next','›','orange',()=>cycle(1));
  previous.setAttribute('aria-label','Предыдущая колода');next.setAttribute('aria-label','Следующая колода');
  choices.append(previous,selector,next);panel.append(choices);
  const access=element('p','start-preview-access');panel.append(access);
  function refreshDeck(){const meta=DECKS[deckId],unlocked=!profile||deckUnlocked(profile,deckId);deckName.textContent=meta.name;effect.textContent=meta.description??`${meta.bonus} ${meta.effect} ${meta.timing}`;deck.dataset.deck=deckId;selector.value=deckId;
   access.textContent=profile?(unlocked?'Колода открыта. Следующая ставка открывается победой на предыдущей.':collectionEntries(profile).find(entry=>entry.id==='b_'+deckId)?.condition??'Откройте эту колоду в обычной партии.'):'Режим предпросмотра: все колоды и ставки доступны без условий открытия.';
   if(panel.querySelector('#setup_play'))panel.querySelector('#setup_play').disabled=!unlocked;
   if(panel.querySelector('#setup_stake')){for(const option of stakeSelect.options)option.disabled=!!profile&&!stakeUnlocked(profile,deckId,Number(option.value));if(profile&&!stakeUnlocked(profile,deckId,stake))stake=1;stakeSelect.value=String(stake);refreshStake();}
  }
  let stake=1;
  const stakeRow=element('div','start-stake-settings'),chip=element('span','start-stake-chip');chip.setAttribute('aria-hidden','true');
  const stakeSelect=element('select');stakeSelect.id='setup_stake';stakeSelect.setAttribute('aria-label','Сложность');stakeSelect.setAttribute('aria-describedby','setup_stake_description');
  for(const item of STAKES){const option=element('option','',item.name);option.value=String(item.level);option.disabled=!!profile&&!stakeUnlocked(profile,deckId,item.level);stakeSelect.append(option);}
  const stakeDescription=element('p','start-stake-description');stakeDescription.id='setup_stake_description';
  function refreshStake(){const item=STAKES.find(item=>item.level===stake);chip.dataset.stake=item.id;chip.style.setProperty('--stake-color',item.color);chip.textContent=String(item.level);stakeDescription.textContent=item.description+(stake>1?' Включает предыдущие ставки.':'');}
  stakeSelect.onchange=()=>{stake=Number(stakeSelect.value);refreshStake();};refreshStake();
  stakeRow.append(chip,stakeSelect,stakeDescription);panel.append(stakeRow);
  const seedLabel=element('label','start-seed-label','Зерно забега (необязательно)');const seed=element('input');seed.id='setup_seed';seed.type='text';seed.maxLength=8;seed.oninput=()=>{seed.value=seed.value.toUpperCase().slice(0,8);};seed.autocomplete='off';seed.spellcheck=false;seed.placeholder='Случайный забег';seedLabel.append(seed);panel.append(seedLabel);
  const actions=element('div','start-setup-actions');actions.append(button('setup_back','Назад','orange',()=>{panel.remove();newButton.focus({preventScroll:true});}),button('setup_play','Играть','blue',()=>{if(profile&&(!deckUnlocked(profile,deckId)||!stakeUnlocked(profile,deckId,stake)))return;onNew?.({deckId,stake,seed:seed.value.trim().toUpperCase().slice(0,8)||undefined});}));panel.append(actions);
  refreshDeck();screen.append(panel);enter(panel);newTab.focus({preventScroll:true});
 }
 return screen;
}
export function removeStartScreen(){if(!screen)return;screen.remove();screen=undefined;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});previousFocus=undefined;}
