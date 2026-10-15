import {renderShop,prepareShopChange} from './shop-screen.js';
import {renderStartScreen,removeStartScreen} from './start-screen.js';
import {renderBlindSelect} from './blind-select.js';
import {renderPostRound,roundDeckView} from './post-round.js';
import {animateNumber,animateCounters,animateMoney} from './number-animation.js';
import {DECKS} from '../content/decks.js';
import {createDeckView} from './deck-view.js';
import {liftScoringCards,animateScore} from './score-animation.js';
import {showFlame} from './flame.js';
import {preparePlayedCards,prepareDrawnCards,prepareHandMovement,animateShatteredCards} from './play-animation.js';
import {createRun,dispatch} from '../core/run.js';
import {createRepository} from '../persistence/repository.js';
import {createBackend} from '../persistence/backend.js';
import {installLayout} from './layout.js';
import {displayBlindTarget,renderField,dismissCardTip,showNumbers,HAND_NAMES,SUITS,rankLabel,displayInteger} from './field.js';

installLayout();
document.getElementById('stage').addEventListener('pointerdown',e=>{if(!e.target.closest('button'))dismissCardTip();});
const native=globalThis.CardStorage;
const backend=createBackend({native,storage:native?null:globalThis.localStorage});
const repository=createRepository(backend),selected=new Set(),dialog=document.getElementById('dialog');
let state=null,busy=false,noticeTimer,dialogMotion;
function notice(message){document.getElementById('notice').textContent=message;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>document.getElementById('notice').textContent='',3500);}
function closeDialog(){if(busy||state?.winPending){if(!busy&&dialog.dataset.view==='victory-confirm')showVictory();return true;}return dismissDialog();}
function dismissDialog(){if(dialog.open){dialogMotion?.cancel();dialogMotion=null;dialog.close();dialog.classList.remove('deck-dialog');return true;}return false;}
dialog.addEventListener('close',()=>{if(dialog.open)return;dialogMotion?.cancel();dialogMotion=null;dialog.classList.remove('deck-dialog');});
dialog.addEventListener('cancel',e=>{if(busy||state?.winPending){e.preventDefault();if(!busy&&dialog.dataset.view==='victory-confirm')showVictory();}});
// Native dialog cancel may be noncancelable; consume Escape before its close request.
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog.open&&(busy||state?.winPending)){e.preventDefault();closeDialog();}});
globalThis.cardGameBack=closeDialog;
function openDialog(title,body,actions=[['Закрыть',closeDialog]]) {
 dismissCardTip();dialog.dataset.view='';
 dialogMotion?.cancel();dialogMotion=null;
 dialog.classList.toggle('deck-dialog',typeof body!=='string' && body.classList.contains('deck-view'));
 document.getElementById('dialog-title').textContent=title;document.getElementById('dialog-body').replaceChildren();
 if(typeof body==='string')document.getElementById('dialog-body').innerHTML=body;else document.getElementById('dialog-body').append(body);
 const buttons=document.getElementById('dialog-actions');buttons.replaceChildren();
 for(const [label,handler,id] of actions){const b=document.createElement('button');b.textContent=label;if(id)b.id=id;b.onclick=handler;buttons.append(b);}
 if(!dialog.open)dialog.showModal();
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
  const distance=innerHeight-dialog.getBoundingClientRect().top+16;
  // Individual translate preserves the deck's existing centering and uniform scale.
  dialogMotion=dialog.animate([{translate:`0 ${distance}px`},{translate:'0 0'}],{duration:360,easing:'cubic-bezier(.16,1,.3,1)'});
 }
}
function render(hand=state?.hand,scoringPreview=null){if(state){if(!busy){for(const id of selected)if(!state.hand.includes(id))selected.delete(id);const forced=!state.bossState?.disabled&&state.phase==='playing'?state.bossState?.forcedCardId:null;if(forced&&state.hand.includes(forced)&&!selected.has(forced)){if(selected.size>=5)selected.delete([...selected].at(-1));selected.add(forced);}}renderField(!busy?roundDeckView({...state,hand}):{...state,hand},selected,busy||!!state.winPending,toggle,reorder,scoringPreview);renderPostRound(state,busy&&!state.shop,()=>perform('CASH_OUT'));renderShop(state,busy||!!state.winPending,{onAction:(type,fields)=>perform(type,undefined,undefined,fields),onNotice:notice,targetCardIds:[...selected]});renderBlindSelect(state,busy||!!state.winPending,()=>perform('START_BLIND'),blindId=>perform('SKIP_BLIND',undefined,undefined,{blindId}));for(const id of ['blind_panel','blind_title','blind_token','blind_target','hand','hand_count','play_hand','discard','sort_panel','sort_label','sort_rank','sort_suit'])document.getElementById(id).hidden=state.phase==='blind_selection'||(['shop','pack'].includes(state.phase)&&!!state.shop)||(!busy&&['round_won','shop','pack'].includes(state.phase));if(!busy&&state.winPending&&!dialog.open&&!document.getElementById('start_screen'))showVictory();}}
function toggle(id){if(busy || state?.phase!=='playing'||!state.bossState?.disabled&&state.bossState?.forcedCardId===id)return;dismissCardTip();if(selected.has(id))selected.delete(id);else if(selected.size<5)selected.add(id);else {notice('Можно выбрать до 5 карт');return;}render();}
async function reorder(id,to){const movement=prepareHandMovement();const ids=[...state.hand],from=ids.indexOf(id);ids.splice(from,1);ids.splice(to,0,id);if(to===from){render();await movement();return;}await perform('REORDER_HAND',ids);await movement();}
function newState({deckId='red',seed}={}){return createRun(seed??crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase(),{runId:crypto.randomUUID(),deckId,money:4n,referenceRng:true,referenceShop:true,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});}
function startFresh(options){if(busy)return;try{const next=newState(options);repository.reset(next);state=next;selected.clear();closeDialog();removeStartScreen();render();}catch{storageError();}}
function showMenu(){if(busy)return;dismissDialog();renderStartScreen({hasSave:!!state,onContinue:()=>{removeStartScreen();render();},onNew:options=>{if(state)confirmNew(options);else startFresh(options);},onSettings:showSettings});}
function storageError(){openDialog('Не удалось сохранить','<p>Действие не применено. Проверьте свободное место и доступ к сохранению.</p>',state?.winPending?[['Вернуться к победе',showVictory,'victory_retry']]:undefined);}
function showVictory(){
 if(busy||!state?.winPending)return;
 openDialog('Победа!','<p>Босс Анте '+state.round.ante+' побеждён. Продолжить забег в бесконечном режиме?</p>',[['Новый забег',()=>confirmNew(),'victory_new'],['Главное меню',showMenu,'victory_menu'],['Бесконечный режим',()=>perform('CONTINUE_ENDLESS'),'victory_endless']]);
 dialog.dataset.view='victory';
}
async function perform(type,ids,mode,fields={}) {
 if(busy || !state)return;if(type!=='REORDER_HAND')dismissCardTip();busy=true;
 const action={type,expectedRevision:state.revision,...fields};if(ids!==undefined)action.cardIds=ids;if(mode!==undefined)action.mode=mode;
 const result=dispatch(state,action);
 if(result.error){busy=false;notice('Действие недоступно');render();return;}
 if(type==='CONTINUE_ENDLESS')for(const button of document.getElementById('dialog-actions').children)button.disabled=true;
 try{repository.save(result.state);}catch{busy=false;render();storageError();return;}
 if(type==='CONTINUE_ENDLESS'){state=result.state;dismissDialog();busy=false;render();return;}
 const previousRound=state.round,previousScore=state.round.score,previousMoney=state.money;
 const leaveShop=prepareShopChange(type);await leaveShop();
 const ordered=state.hand.filter(id=>(ids??[]).includes(id));
 const outgoing=['PLAY_HAND','DISCARD'].includes(type)?preparePlayedCards(ordered,type==='DISCARD',state.cards):null;
 const forced=result.events.find(e=>e.type==='cards_forced_discarded')?.cardIds??[];
 const forceDiscard=forced.length?preparePlayedCards(forced,true):null;
 const remaining=state.hand.filter(id=>!ordered.includes(id)&&!forced.includes(id));
 const draw=result.events.find(e=>e.type==='cards_drawn');
 const compact=outgoing?prepareHandMovement():null;
 state=result.state;if(!['REORDER_HAND','SET_SORT'].includes(type))selected.clear();
 render(outgoing?remaining:state.hand,type==='PLAY_HAND'?state.lastScore:null);
 animateCounters(previousRound,state.round);
 const moneyMotion=animateMoney(previousMoney,state.money);
 const closing=compact?.();
 if(type==='PLAY_HAND'){animateNumber(document.getElementById('round_score_value'),previousScore,{format:displayInteger});document.getElementById('hand_name').textContent=HAND_NAMES[state.lastScore.handId];}
 if(outgoing){
   const [finish]=await Promise.all([outgoing(),forceDiscard?.()]);
   if(type==='PLAY_HAND'){
     animateNumber(document.getElementById('round_score_value'),previousScore,{format:displayInteger});
     showFlame(state.lastScore.score,state.round.target);
     await liftScoringCards(state.lastScore.scoringCardIds);
     await animateScore(result.events);
     await animateShatteredCards(result.events.filter(event=>event.type==='card_shattered').map(event=>event.cardId));
     await animateNumber(document.getElementById('round_score_value'),state.round.score,{animate:true,from:previousScore,duration:480,format:displayInteger});
     if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.getElementById('round_score_value').animate([{scale:1.18},{scale:1}],{duration:280});
   }
   await finish();
 }
 await closing;
 if(draw?.cardIds.length){
   const expand=prepareHandMovement();render();
   const arrive=prepareDrawnCards(draw.cardIds);
   await Promise.all([expand(),arrive()]);
 }
 await moneyMotion;busy=false;render();
 if(state.phase==='game_over')openDialog('Партия окончена',`<p>Набрано ${state.round.score} из ${displayBlindTarget(state.round.target)} очков.</p><p>Предварительная версия: доступны переходы анте, финальные боссы, победа и бесконечный режим. Полный профиль и часть контента ещё в разработке.</p>`,[['Новый забег',()=>confirmNew()],['Закрыть',closeDialog]]);
}
function confirmNew(options){if(busy)return;openDialog('Новый забег','<p>Начать заново? Текущий забег останется в резервной записи.</p>',[['Начать',()=>startFresh(options)],['Отмена',()=>{if(state?.winPending)showVictory();else closeDialog();}]]);if(state?.winPending)dialog.dataset.view='victory-confirm';}
document.getElementById('play_hand').onclick=()=>perform('PLAY_HAND',[...selected]);
document.getElementById('discard').onclick=()=>perform('DISCARD',[...selected]);
function sort(mode){if(busy || state?.phase!=='playing')return;perform('SET_SORT',undefined,mode);}
document.getElementById('sort_rank').onclick=()=>sort('rank');document.getElementById('sort_suit').onclick=()=>sort('suit');
function showSettings(){if(busy||state?.winPending)return;openDialog('Настройки','<p>Пьеро · предварительная сборка 0.4.34-preview</p><p>Переходы анте, обычные и финальные боссы, победа и бесконечный режим. Доступны магазин, 53 из 150 эффектов джокеров, Планеты, Небесные наборы и реализованные карты Таро. Полный профиль и остальной контент ещё в разработке. Продолжение сохраняется после каждого действия.</p>',[['Продолжить',closeDialog],['Новый забег',()=>confirmNew()],['Главное меню',showMenu]]);}
document.getElementById('options').onclick=showSettings;
document.getElementById('run_info').onclick=()=>{
 if(busy||!state||state.winPending)return;const table=document.createElement('table');
 for(const id of state.discoveredHands){const row=table.insertRow();row.insertCell().textContent=HAND_NAMES[id];row.insertCell().textContent='Ур. '+state.handLevels[id];}
 const body=document.createElement('div'),p=document.createElement('p');p.textContent=DECKS[state.deckId].name+' · Анте '+state.round.ante+(state.round.blindId==='boss'?' · Босс':state.round.blindId==='big'?' · Большой блайнд':' · Малый блайнд');body.append(p,table);openDialog('Партия',body);
};
document.getElementById('deck').onclick=()=>{
 if(busy||!state||state.winPending)return;openDialog('Колода',createDeckView(roundDeckView(state)),[['Назад',closeDialog]]);
};
globalThis.cardGamePause=()=>{}; // Actions are persisted before animation; no pending I/O on pause.
const loaded=repository.load();
if(loaded.status==='current'){state=loaded.state;render();if(!state.winPending)showMenu();}
else if(loaded.status==='empty')showMenu();
else if(loaded.status==='recovery') {
 dialog.addEventListener('cancel',e=>e.preventDefault(),{once:true});
 openDialog('Восстановить забег?','<p>Основная запись повреждена. Есть проверенная резервная копия. Восстановить её?</p>',[['Восстановить',()=>{try{state=repository.restoreBackup();dismissDialog();render();}catch{storageError();}},'restore-backup']]);
} else openDialog('Сохранение недоступно','<p>Не удалось прочитать исправную запись. Файлы сохранены без изменений. Автоматический новый забег не начат.</p>');



