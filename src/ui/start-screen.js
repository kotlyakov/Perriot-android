import {slideWindow} from './window-motion.js';
import {isVerificationSeed} from '../core/verification-seed.js';
import {DECKS} from '../content/decks.js';
import {CHALLENGES,challengeModeUnlocked,challengeUnlocked} from '../content/challenges.js';
import {describeShopItem} from '../content/shop-display.js';
import {APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {APK_TAGS_BY_ID} from '../content/apk-tags.js';
import {STAKES} from '../content/stakes.js';
import {deckUnlocked,stakeUnlocked,collectionEntries} from '../core/profile.js';

let screen, previousFocus;
function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function button(id,label,className,action){const node=element('button',className,label);node.id=id;node.type='button';node.onclick=action;return node;}
function enter(node){slideWindow(node);}
function leave(node,done){node.inert=true;slideWindow(node,true,()=>{node.remove();done?.();});}

/** UI only: onNew receives {deckId, seed, stake, challengeId?}; caller creates the run. */
export function renderStartScreen({hasSave=false,onContinue,onNew,onSettings,profile,profileName='Игрок',onCollection,onProfile,continueChallengeId,savedState,fromRun=false,onBack}){
 let setupSeed='';
 removeStartScreen();previousFocus=document.activeElement;
 screen=element('section','start-screen');screen.id='start_screen';screen.setAttribute('aria-label','Главное меню Пьеро');
 const title=element('h1','start-logo','Пьеро');screen.append(title);
 const ornament=element('div','start-ornament','♠');ornament.setAttribute('aria-hidden','true');screen.append(ornament);
 const bar=element('nav','start-menu');bar.setAttribute('aria-label','Главное меню');
 const newButton=button('start_new','Играть','blue',()=>showSetup(hasSave&&!fromRun?'continue':'new'));
 const collection=button('start_collection','Коллекция','start-green',()=>onCollection?.());collection.disabled=!onCollection;collection.setAttribute('aria-label','Коллекция');
 bar.append(newButton,button('start_settings','Настройки','orange',()=>onSettings?.()),collection);screen.append(bar);
 const profileButton=button('start_profile','','start-profile',()=>onProfile?.());profileButton.disabled=!onProfile;profileButton.setAttribute('aria-label','Текущий профиль '+profileName);profileButton.title=profileName;profileButton.append(element('span','','Профиль'),element('strong','',profileName));screen.append(profileButton);
 const language=button('start_language','Русский','start-language',()=>{});language.disabled=true;language.setAttribute('aria-label','Текущий язык: Русский. Выбор других языков ещё не реализован');screen.append(language);
 document.getElementById('stage').append(screen);newButton.focus({preventScroll:true});

 function renderChallengeOverview(panel){
  panel.classList.add('start-challenge-overview');
  const overview=element('div','challenge-overview');
  const opened=CHALLENGES.filter(challenge=>!profile||challengeUnlocked(profile,challenge.id,setupSeed)).length;
  overview.append(element('h3','','Режим испытаний'),button('challenge_new','Новое испытание','blue',()=>showSetup('challenge-list')));
  for(const [label,value] of [['Открыто',opened],['Пройдено',profile?.completedChallenges?.length??0]]){
   const progress=element('div','challenge-progress'),meter=element('progress');meter.max=CHALLENGES.length;meter.value=value;meter.setAttribute('aria-label',label);progress.append(meter,element('span','',`${label}: ${value} / ${CHALLENGES.length}`));overview.append(progress);
  }
  panel.append(overview,backFooter('setup_back',()=>{leave(panel,()=>{if(onBack){onBack();return;}newButton.focus({preventScroll:true});});}));
 }
 function backFooter(id,action){const footer=element('div','start-back-footer');footer.append(button(id,'Назад','orange',action));return footer;}
 function renderChallenges(panel){
  panel.classList.add('start-challenges');
  const body=element('div','challenge-body'),left=element('div','challenge-browser'),list=element('nav','challenge-list'),details=element('article','challenge-details');list.setAttribute('aria-label','Испытания');details.id='challenge_details';
  let chosen=CHALLENGES[0],page=0,section=0,detailPage=0,detailPages=[];
  const play=button('challenge_play','Играть','blue',()=>{if(profile&&!challengeUnlocked(profile,chosen.id,setupSeed))return;onNew?.({challengeId:chosen.id,deckId:'red',stake:1,...(isVerificationSeed(setupSeed)?{seed:setupSeed}:{})});});
  const paging=element('nav','challenge-paging');paging.setAttribute('aria-label','Страницы испытаний');
  const previous=button('challenge_prev_page','‹','orange',()=>{page--;renderList();choose(CHALLENGES[page*10]);}),next=button('challenge_next_page','›','orange',()=>{page++;renderList();choose(CHALLENGES[page*10]);}),pageLabel=element('span');pageLabel.id='challenge_page';pageLabel.setAttribute('aria-live','polite');previous.setAttribute('aria-label','Предыдущие испытания');next.setAttribute('aria-label','Следующие испытания');paging.append(previous,pageLabel,next);
  const title=element('h3'),access=element('p','challenge-access'),tabs=element('nav','challenge-detail-tabs'),content=element('div','challenge-detail-content');content.id='challenge_detail_content';content.setAttribute('role','tabpanel');content.setAttribute('aria-live','polite');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Описание испытания');
  const sectionIds=['rules','bans','deck'];
  for(const [index,label] of ['Правила','Ограничения','Колода'].entries()){
   const tab=button('challenge_tab_'+sectionIds[index],label,'start-green',()=>{section=index;detailPage=0;renderSection();});tab.setAttribute('role','tab');tab.setAttribute('aria-controls',content.id);tabs.append(tab);
  }
  const detailPaging=element('nav','challenge-paging challenge-detail-paging');detailPaging.setAttribute('aria-label','Страницы описания');
  const detailPrevious=button('challenge_detail_prev','‹','orange',()=>{detailPage--;renderDetailPage();}),detailNext=button('challenge_detail_next','›','orange',()=>{detailPage++;renderDetailPage();}),detailLabel=element('span');detailLabel.id='challenge_detail_page';detailLabel.setAttribute('aria-live','polite');detailPrevious.setAttribute('aria-label','Предыдущая страница описания');detailNext.setAttribute('aria-label','Следующая страница описания');detailPaging.append(detailPrevious,detailLabel,detailNext);
  const inventory=element('div','challenge-inventory');details.append(title,access,inventory,tabs,content,detailPaging,play);left.append(list,paging,element('p','challenge-completed',`Пройдено испытаний: ${profile?.completedChallenges?.length??0} / ${CHALLENGES.length}`));body.append(left,details);panel.append(body,backFooter('challenge_back',()=>showSetup('challenge')));
  function renderList(){
   list.replaceChildren();
   for(const challenge of CHALLENGES.slice(page*10,page*10+10)){const unlocked=!profile||challengeUnlocked(profile,challenge.id,setupSeed),entry=button('challenge_'+challenge.id,challenge.number+'. '+challenge.name+(profile?.completedChallenges?.includes(challenge.id)?' ✓':!unlocked?' 🔒':''),'',()=>choose(challenge));entry.dataset.challengeId=challenge.id;entry.dataset.unlocked=String(unlocked);list.append(entry);}
   previous.disabled=page===0;next.disabled=(page+1)*10>=CHALLENGES.length;pageLabel.textContent=(page+1)+' / '+Math.ceil(CHALLENGES.length/10);
  }
  function choose(challenge){
   chosen=challenge;section=0;detailPage=0;for(const entry of list.children)entry.setAttribute('aria-pressed',String(entry.dataset.challengeId===challenge.id));title.textContent=challenge.number+'. '+challenge.name;
   const unlocked=!profile||challengeUnlocked(profile,challenge.id,setupSeed),complete=profile?.completedChallenges?.includes(challenge.id);play.disabled=!unlocked;access.textContent=complete?'Испытание пройдено.':unlocked?(isVerificationSeed(setupSeed)?'Проверочный сид: старт $100.':'Испытание открыто.'):'Пройдите ещё '+Math.max(0,challenge.number-5-new Set(profile?.completedChallenges??[]).size)+' разных испытаний.';
   inventory.replaceChildren();
   for(const [label,items] of [['Джокеры',(challenge.startingJokers??[]).map(j=>centreName(j.id)+(j.eternal?' (вечный)':'')+(j.negative?' (негативный)':'')+(j.pinned?' (закреплённый)':''))],['Расходники',(challenge.startingConsumables??[]).map(centreName)],['Билеты',(challenge.startingVouchers??[]).map(centreName)]]){const group=element('div');group.append(element('strong','',label),element('span','',compactNames(items)||'Нет'));inventory.append(group);}
   renderSection();
  }
  function renderSection(){
   for(const [index,tab] of [...tabs.children].entries())tab.setAttribute('aria-selected',String(index===section));
   content.setAttribute('aria-labelledby','challenge_tab_'+sectionIds[section]);
   // Measure the actual logical text area, splitting long paragraphs across pages.
   // No text is hidden to make an overfull page appear to fit.
   detailPages=[[]];content.replaceChildren();
   for(const line of challengeDetails(chosen,setupSeed)[section][1]){
    let words=line.split(/\s+/);
    while(words.length){
     const paragraph=element('p');content.append(paragraph);let low=0,high=words.length;
     while(low<high){const middle=Math.ceil((low+high)/2);paragraph.textContent=words.slice(0,middle).join(' ');if(content.scrollHeight<=content.clientHeight)low=middle;else high=middle-1;}
     if(!low&&detailPages.at(-1).length===0)low=1;
     if(low){paragraph.textContent=words.slice(0,low).join(' ');detailPages.at(-1).push(paragraph.textContent);words=words.slice(low);}else paragraph.remove();
     if(words.length){detailPages.push([]);content.replaceChildren();}
    }
   }
   renderDetailPage();
  }
  function renderDetailPage(){content.replaceChildren(...detailPages[detailPage].map(line=>element('p','',line)));detailPrevious.disabled=detailPage===0;detailNext.disabled=detailPage===detailPages.length-1;detailLabel.textContent=(detailPage+1)+' / '+detailPages.length;}
  renderList();choose(chosen);
  document.fonts?.ready.then(()=>{if(panel.isConnected){detailPage=0;renderSection();}});
 }
 function showSetup(mode='new'){
  if(mode!=='new'&&!isVerificationSeed(setupSeed))setupSeed='';
  const old=screen.querySelector('.start-setup');if(old){leave(old,()=>showSetup(mode));return;}
  const panel=element('section','start-setup');panel.setAttribute('aria-label','Новая партия');
  panel.dataset.mode=mode;
  const tabs=element('div','start-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Режим партии');
  const newTab=button('setup_new_tab','Новая игра','blue',()=>showSetup());newTab.setAttribute('aria-pressed',String(mode==='new'));
  const continueTab=button('setup_continue_tab',continueChallengeId?'Продолжить испытание':'Продолжить','start-green',()=>showSetup('continue'));continueTab.setAttribute('aria-pressed',String(mode==='continue'));continueTab.disabled=!hasSave;continueTab.hidden=fromRun;const challengeTab=button('setup_challenge_tab','Испытания','orange',()=>showSetup('challenge'));challengeTab.disabled=!!profile&&!challengeModeUnlocked(profile,setupSeed);challengeTab.setAttribute('aria-pressed',String(mode.startsWith('challenge')));challengeTab.title=challengeTab.disabled?'Победите с 5 разными колодами.':'20 испытаний';challengeTab.setAttribute('aria-label',challengeTab.disabled?'Испытания. Победите с 5 разными колодами.':'Испытания');tabs.append(newTab,continueTab,challengeTab);panel.append(tabs);
  if(mode.startsWith('challenge')){screen.append(panel);if(mode==='challenge-list')renderChallenges(panel);else renderChallengeOverview(panel);enter(panel);challengeTab.focus({preventScroll:true});return;}
  const row=element('div','start-deck-row');
  const deck=element('div','start-deck-back');deck.setAttribute('aria-hidden','true');deck.append(element('span','','♠'));
  const info=element('div','start-deck-info');const deckName=element('h3'),effect=element('p');info.append(deckName,effect);const wins=element('div','start-deck-wins');wins.setAttribute('aria-label','Победы по ставкам');row.append(deck,info,wins);
  const deckIds=Object.keys(DECKS);let deckId=mode==='continue'&&DECKS[savedState?.deckId]?savedState.deckId:'red';
  const choices=element('div','start-deck-choices');choices.setAttribute('role','group');choices.setAttribute('aria-label','Выбрать колоду');
  const selector=element('select');selector.hidden=true;selector.id='setup_deck_select';selector.setAttribute('aria-label','Колода');
  for(const id of deckIds){const option=element('option','',DECKS[id].name);option.id='setup_deck_'+id;option.value=id;option.disabled=!!profile&&!deckUnlocked(profile,id,setupSeed);selector.append(option);}
  selector.onchange=()=>{deckId=selector.value;refreshDeck();};
  function cycle(direction){deckId=deckIds[(deckIds.indexOf(deckId)+direction+deckIds.length)%deckIds.length];refreshDeck();}
  const previous=button('setup_deck_prev','‹','orange',()=>cycle(-1)),next=button('setup_deck_next','›','orange',()=>cycle(1));
  previous.setAttribute('aria-label','Предыдущая колода');next.setAttribute('aria-label','Следующая колода');
  const deckLabel=button('setup_deck_cycle','','start-green',()=>cycle(1));deckLabel.setAttribute('aria-label','Следующая колода');deckLabel.hidden=true;choices.append(previous,selector,row,deckLabel,next);panel.append(choices);
  const access=element('p','start-preview-access');panel.append(access);
  function refreshDeck(){const meta=DECKS[deckId],unlocked=!profile||deckUnlocked(profile,deckId,setupSeed);deckName.textContent=meta.name;effect.textContent=meta.description??`${meta.bonus} ${meta.effect} ${meta.timing}`;deck.dataset.deck=deckId;selector.value=deckId;deckLabel.textContent=meta.name;wins.replaceChildren(...[...STAKES].reverse().map(item=>{const won=!!profile?.deckWins?.[deckId]?.[item.level-1],available=!profile||stakeUnlocked(profile,deckId,item.level,setupSeed),marker=element('span','start-win-marker',won?'✓':available?'':'×');marker.dataset.stake=String(item.level);marker.dataset.available=String(available);marker.dataset.won=String(won);marker.dataset.current=String(item.level===stake);marker.style.setProperty('--stake-color',item.color);marker.title=item.name+(item.level===stake?' — выбрана':'')+(available?' — доступна':' — закрыта')+(won?' — победа':' — нет побед');marker.setAttribute('aria-label',marker.title);return marker;}));
   access.textContent=isVerificationSeed(setupSeed)?'Проверочный сид: всё открыто · старт $100.':profile?(unlocked?'Колода открыта. Следующая ставка открывается победой на предыдущей.':collectionEntries(profile).find(entry=>entry.id==='b_'+deckId)?.condition??'Откройте эту колоду в обычной партии.'):'Режим предпросмотра: все колоды и ставки доступны без условий открытия.';
   if(panel.querySelector('#setup_play'))panel.querySelector('#setup_play').disabled=mode!=='continue'&&!unlocked;
   if(panel.querySelector('#setup_stake')){for(const option of stakeSelect.options)option.disabled=!!profile&&!stakeUnlocked(profile,deckId,Number(option.value),setupSeed);if(mode!=='continue'&&profile&&!stakeUnlocked(profile,deckId,stake,setupSeed))stake=1;stakeSelect.value=String(stake);refreshStake();}
  }
  let stake=mode==='continue'?savedState?.stake??1:1;
  const stakeRow=element('div','start-stake-settings'),chip=element('span','start-stake-chip');chip.setAttribute('aria-hidden','true');
  const stakeSelect=element('select');stakeSelect.hidden=true;stakeSelect.id='setup_stake';stakeSelect.setAttribute('aria-label','Сложность');stakeSelect.setAttribute('aria-describedby','setup_stake_description');
  for(const item of STAKES){const option=element('option','',item.name);option.value=String(item.level);option.disabled=!!profile&&!stakeUnlocked(profile,deckId,item.level,setupSeed);stakeSelect.append(option);}
  const stakeDescription=element('p','start-stake-description');stakeDescription.id='setup_stake_description';
  function cycleStake(direction){const available=STAKES.filter(item=>!profile||stakeUnlocked(profile,deckId,item.level,setupSeed));if(!available.length)return;stake=available[(available.findIndex(item=>item.level===stake)+direction+available.length)%available.length].level;stakeSelect.value=String(stake);refreshStake();}
  const stakeChoices=element('div','start-stake-choices'),stakeLabel=button('setup_stake_cycle','','start-green',()=>cycleStake(1)),stakePrevious=button('setup_stake_prev','‹','orange',()=>cycleStake(-1)),stakeNext=button('setup_stake_next','›','orange',()=>cycleStake(1));stakePrevious.setAttribute('aria-label','Предыдущая ставка');stakeNext.setAttribute('aria-label','Следующая ставка');stakeLabel.setAttribute('aria-label','Следующая ставка');stakeChoices.append(stakePrevious,stakeLabel,stakeNext);
  function refreshStake(){const available=STAKES.filter(item=>!profile||stakeUnlocked(profile,deckId,item.level,setupSeed));for(const control of [stakePrevious,stakeLabel,stakeNext])control.disabled=available.length<2;const item=STAKES.find(item=>item.level===stake);stakeLabel.textContent=item.name;chip.dataset.stake=item.id;chip.style.setProperty('--stake-color',item.color);chip.textContent=String(item.level);stakeDescription.textContent=item.description+(stake>1?' Включает предыдущие ставки.':'');for(const marker of wins.children){marker.dataset.current=String(Number(marker.dataset.stake)===stake);const current=Number(marker.dataset.stake)===stake;marker.setAttribute('aria-current',current?'true':'false');marker.title=marker.title.replace(' — выбрана','')+(current?' — выбрана':'');marker.setAttribute('aria-label',marker.title);}}
  stakeSelect.onchange=()=>{stake=Number(stakeSelect.value);refreshStake();};refreshStake();
  const stakeCenter=element('div','start-stake-center');stakeCenter.append(element('span','start-stake-caption','Ставка'),chip,stakeLabel,stakeDescription);stakeChoices.replaceChildren(stakePrevious,stakeCenter,stakeNext);stakeRow.append(stakeSelect,stakeChoices);panel.append(stakeRow);
  const seedLabel=element('label','start-seed-label','Сид партии');const seed=element('input');seed.id='setup_seed';seed.type='text';seed.maxLength=8;seed.value=setupSeed;seed.oninput=()=>{seed.value=seed.value.toUpperCase().slice(0,8);setupSeed=seed.value.trim();for(const option of selector.options)option.disabled=!!profile&&!deckUnlocked(profile,option.value,setupSeed);challengeTab.disabled=!!profile&&!challengeModeUnlocked(profile,setupSeed);challengeTab.title=challengeTab.disabled?'Победите с 5 разными колодами.':'20 испытаний';challengeTab.setAttribute('aria-label',challengeTab.disabled?'Испытания. Победите с 5 разными колодами.':'Испытания');refreshDeck();};seed.autocomplete='off';seed.spellcheck=false;seed.placeholder='Случайный забег';const seedNotice=element('span','start-seed-notice','Свой сид отключает достижения, открытия и прогресс профиля.');seedNotice.id='setup_seed_notice';seed.setAttribute('aria-describedby',seedNotice.id);const paste=button('setup_seed_paste','Вставить','start-green',async()=>{try{seed.value=String(await navigator.clipboard.readText()).trim().toUpperCase().slice(0,8);seed.oninput();seed.focus({preventScroll:true});}catch{seedNotice.textContent='Не удалось прочитать буфер. Нажмите поле и вставьте сид вручную. Прогресс профиля отключён.';seed.focus({preventScroll:true});}});seedLabel.append(seed,paste,seedNotice);seedLabel.hidden=!setupSeed;panel.append(seedLabel);
  const actions=element('div','start-setup-actions');const toggleLabel=element('label','start-seed-toggle','Свой сид'),toggle=element('input');toggle.id='setup_seed_toggle';toggle.type='checkbox';toggle.checked=!!setupSeed;toggle.onchange=()=>{seedLabel.hidden=!toggle.checked;if(!toggle.checked){seed.value='';seed.oninput();}else seed.focus({preventScroll:true});};toggleLabel.prepend(toggle);actions.append(toggleLabel,button('setup_play',mode==='continue'?'Продолжить':'Играть','blue',()=>{if(mode==='continue'){onContinue?.();return;}if(profile&&(!deckUnlocked(profile,deckId,setupSeed)||!stakeUnlocked(profile,deckId,stake,setupSeed)))return;onNew?.({deckId,stake,seed:seed.value.trim().toUpperCase().slice(0,8)||undefined});}));panel.append(actions,backFooter('setup_back',()=>{leave(panel,()=>{if(onBack){onBack();return;}newButton.focus({preventScroll:true});});}));
  refreshDeck();
  if(mode==='continue'){
   previous.hidden=next.hidden=true;stakePrevious.hidden=stakeNext.hidden=true;stakeLabel.disabled=true;access.hidden=true;seedLabel.hidden=true;toggleLabel.hidden=true;effect.replaceChildren();effect.className='start-continue-summary';
   const values=[['Раунд',savedState?.roundNumber??'—'],['Анте',savedState?.round?.ante??'—'],['Деньги',savedState?.money!==undefined?'$'+savedState.money:'—'],['Лучшая рука',savedState?.bestHand??savedState?.highScore??'—']];
   if(savedState?.seeded??savedState?.seed)values.push(['Сид',savedState.seed]);
   for(const [label,value] of values){const line=element('span');line.append(element('span','',label),element('strong','',String(value)));effect.append(line);}
  }
  screen.append(panel);enter(panel);newTab.focus({preventScroll:true});
 }
 return screen;
}
export function removeStartScreen(){if(!screen)return;screen.remove();screen=undefined;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});previousFocus=undefined;}

const challengeRules={
 noReward:()=> 'Блайнды не приносят наград.',noHandMoney:()=> 'Нет денег за оставшиеся руки.',noInterest:()=> 'Нет процентов.',chipsDollarCap:()=> 'Число фишек за руку не может превышать количество ваших долларов.',flippedCards:n=> `Карты приходят рубашкой вверх с вероятностью 1 к ${n}.`,minusHandSizePerDollars:n=> `Размер руки уменьшается на 1 за каждые $${n}.`,allEternal:()=> 'Все джокеры в магазине вечные.',debuffPlayedCards:()=> 'Все сыгранные карты навсегда ослабляются.',eternalAfterAnte:n=> `После победы над боссом анте ${n} все джокеры становятся вечными.`,zeroJokerSlotsAfterAnte:n=> `После победы над боссом анте ${n} число слотов джокеров становится равно 0.`,inflationPerPurchase:n=> `Каждая покупка увеличивает все цены на $${n}.`,noShopJokers:()=> 'Джокеры не появляются в магазине.',discardCost:n=> `Каждый сброс стоит $${n}.`,noSmallReward:()=> 'Нет награды за малый блайнд.',noBigReward:()=> 'Нет награды за большой блайнд.'
};
const challengeDecks={double_faces:'Колода: по 2 копии каждой картинки, без тузов, двоек и троек (52 карты).',ranks_2_to_9:'Колода: только карты от 2 до 9 (32 карты).',face_stone:'Все картинки в колоде — каменные карты.',red_seals:'Все карты в колоде — с красной печатью.',glass:'Все карты в колоде — стеклянные.'};
const centreName=id=>describeShopItem({entityId:id}).name;
function compactNames(items){return [...new Set(items)].map(name=>{const count=items.filter(item=>item===name).length;return name+(count>1?' ×'+count:'');}).join(', ');}
function challengeDetails(challenge,seed){
 const money=isVerificationSeed(seed)?100:challenge.money??4;
 const handSize=Math.max(0,(challenge.handSize??8)-Math.floor(money/(challenge.modifiers?.minusHandSizePerDollars??Infinity)));
 const resources=[`$${money} · Руки: ${challenge.hands??4} · Сбросы: ${challenge.discards??3}`,`Размер руки: ${handSize} · Слоты джокеров: ${challenge.jokerSlots??5} · Расходники: 2`];
 if(isVerificationSeed(seed)&&handSize===0)resources.push('При $100 правило этого испытания уменьшает руку до нуля. Для обычного прохождения уберите проверочный сид.');
 if(challenge.deckPattern)resources.push(challengeDecks[challenge.deckPattern]);else resources.push('Обычная колода: 52 карты.');
 if(challenge.startingJokers?.length)resources.push('Джокеры: '+challenge.startingJokers.map(j=>centreName(j.id)+([j.eternal&&'вечный',j.negative&&'негативный',j.pinned&&'закреплённый'].filter(Boolean).length?' ('+[j.eternal&&'вечный',j.negative&&'негативный',j.pinned&&'закреплённый'].filter(Boolean).join(', ')+')':'')).join(', ')+'.');
 if(challenge.startingConsumables?.length)resources.push('Расходники: '+challenge.startingConsumables.map(centreName).join(', ')+'.');
 if(challenge.startingVouchers?.length)resources.push('Билеты: '+challenge.startingVouchers.map(centreName).join(', ')+'.');
 const rules=Object.entries(challenge.modifiers??{}).map(([id,value])=>challengeRules[id]?.(value)).filter(Boolean),bans=[];
 if(challenge.bannedCentreIds?.length)bans.push('Карты: '+challenge.bannedCentreIds.map(centreName).join(', ')+'.');
 if(challenge.bannedBossIds?.length)bans.push('Боссы: '+challenge.bannedBossIds.map(id=>APK_BLINDS_BY_ID[id]?.nameRu??APK_BLINDS_BY_ID[id]?.name??id).join(', ')+'.');
 if(challenge.bannedTagIds?.length)bans.push('Награды за пропуск: '+challenge.bannedTagIds.map(id=>APK_TAGS_BY_ID[id]?.nameRu??APK_TAGS_BY_ID[id]?.name??id).join(', ')+'.');
 if(challenge.bannedBoosterFamilies?.length)bans.push('Наборы: '+challenge.bannedBoosterFamilies.map(id=>({standard:'Стандартные',buffoon:'Шутовские'})[id]).join(', ')+'.');
 return [['Правила',[...resources.slice(0,2),...rules,...(resources.filter(line=>line.startsWith('При $100')))]],['Ограничения',bans.length?bans:['Дополнительных запретов нет.']],['Колода',[challenge.deckPattern?challengeDecks[challenge.deckPattern]:'Обычная колода: 52 карты.']]];
}
