import {renderShop,prepareShopChange} from './shop-screen.js';
import {renderStartScreen,removeStartScreen} from './start-screen.js';
import {renderBlindSelect} from './blind-select.js';
import {renderPostRound,roundDeckView} from './post-round.js';
import {animateNumber,animateCounters,animateMoney} from './number-animation.js';
import {DECKS} from '../content/decks.js';
import {createDeckView} from './deck-view.js';
import {liftScoringCards,animateScore} from './score-animation.js';
import {showFlame} from './flame.js';
import {preparePlayedCards,prepareDrawnCards,prepareHandMovement} from './play-animation.js';
import {createRun,dispatch} from '../core/run.js';
import {createRepository} from '../persistence/repository.js';
import {createBackend} from '../persistence/backend.js';
import {installLayout} from './layout.js';
import {renderField,dismissCardTip,showNumbers,HAND_NAMES,SUITS,rankLabel,displayInteger} from './field.js';

installLayout();
document.getElementById('stage').addEventListener('pointerdown',e=>{if(!e.target.closest('button'))dismissCardTip();});
const native=globalThis.CardStorage;
const backend=createBackend({native,storage:native?null:globalThis.localStorage});
const repository=createRepository(backend),selected=new Set(),dialog=document.getElementById('dialog');
let state=null,busy=false,noticeTimer,dialogMotion;
function notice(message){document.getElementById('notice').textContent=message;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>document.getElementById('notice').textContent='',3500);}
function closeDialog(){if(dialog.open){dialogMotion?.cancel();dialogMotion=null;dialog.close();dialog.classList.remove('deck-dialog');return true;}return false;}
dialog.addEventListener('close',()=>{if(dialog.open)return;dialogMotion?.cancel();dialogMotion=null;dialog.classList.remove('deck-dialog');});
globalThis.cardGameBack=closeDialog;
function openDialog(title,body,actions=[['Закрыть',closeDialog]]) {
 dismissCardTip();
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
function render(hand=state?.hand,scoringPreview=null){if(state){renderField(!busy?roundDeckView({...state,hand}):{...state,hand},selected,busy,toggle,reorder,scoringPreview);renderPostRound(state,busy&&!state.shop,()=>perform('CASH_OUT'));renderShop(state.shop?state:{...state,phase:'playing'},busy,{onAction:(type,fields)=>perform(type,undefined,undefined,fields),onNotice:notice});renderBlindSelect(state,busy,()=>perform('START_BLIND'));for(const id of ['blind_panel','blind_title','blind_token','blind_target','hand','hand_count','play_hand','discard','sort_panel','sort_label','sort_rank','sort_suit'])document.getElementById(id).hidden=state.phase==='blind_selection'||(state.phase==='shop'&&!!state.shop)||(!busy&&['round_won','shop'].includes(state.phase));}}
function toggle(id){if(busy || state?.phase!=='playing')return;dismissCardTip();if(selected.has(id))selected.delete(id);else if(selected.size<5)selected.add(id);else {notice('Можно выбрать до 5 карт');return;}render();}
async function reorder(id,to){const movement=prepareHandMovement();const ids=[...state.hand],from=ids.indexOf(id);ids.splice(from,1);ids.splice(to,0,id);if(to===from){render();await movement();return;}await perform('REORDER_HAND',ids);await movement();}
function newState({deckId='red',seed}={}){return createRun(seed??crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase(),{runId:crypto.randomUUID(),deckId,money:4n,referenceRng:true,referenceShop:true,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});}
function startFresh(options){try{const next=newState(options);repository.reset(next);state=next;selected.clear();closeDialog();removeStartScreen();render();}catch{storageError();}}
function showMenu(){if(busy)return;closeDialog();renderStartScreen({hasSave:!!state,onContinue:()=>{removeStartScreen();render();},onNew:options=>{if(state)confirmNew(options);else startFresh(options);},onSettings:showSettings});}
function storageError(){openDialog('Не удалось сохранить','<p>Действие не применено. Проверьте свободное место и доступ к сохранению.</p>');}
async function perform(type,ids,mode,fields={}) {
 if(busy || !state)return;if(type!=='REORDER_HAND')dismissCardTip();busy=true;
 const result=dispatch(state,{type,expectedRevision:state.revision,cardIds:ids,mode,...fields});
 if(result.error){busy=false;notice('Действие недоступно');render();return;}
 try{repository.save(result.state);}catch{busy=false;render();storageError();return;}
 const previousRound=state.round,previousScore=state.round.score,previousMoney=state.money;
 const leaveShop=prepareShopChange(type);await leaveShop();
 const ordered=state.hand.filter(id=>(ids??[]).includes(id));
 const outgoing=['PLAY_HAND','DISCARD'].includes(type)?preparePlayedCards(ordered,type==='DISCARD'):null;
 const remaining=state.hand.filter(id=>!ordered.includes(id));
 const draw=result.events.find(e=>e.type==='cards_drawn');
 const compact=outgoing?prepareHandMovement():null;
 state=result.state;if(!['REORDER_HAND','SET_SORT'].includes(type))selected.clear();
 render(outgoing?remaining:state.hand,type==='PLAY_HAND'?state.lastScore:null);
 animateCounters(previousRound,state.round);
 const moneyMotion=animateMoney(previousMoney,state.money);
 const closing=compact?.();
 if(type==='PLAY_HAND'){animateNumber(document.getElementById('round_score_value'),previousScore,{format:displayInteger});document.getElementById('hand_name').textContent=HAND_NAMES[state.lastScore.handId];}
 if(outgoing){
   const finish=await outgoing();
   if(type==='PLAY_HAND'){
     animateNumber(document.getElementById('round_score_value'),previousScore,{format:displayInteger});
     showFlame(state.lastScore.score,state.round.target);
     await liftScoringCards(state.lastScore.scoringCardIds);
     await animateScore(result.events);
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
 if(state.phase==='game_over')openDialog('Партия окончена',`<p>Набрано ${state.round.score} из ${state.round.target} очков.</p><p>В этой версии доступны малый и большой блайнды, магазин и 32 вида джокеров. Боссы и остальные механики ещё в разработке.</p>`,[['Новый забег',()=>confirmNew()],['Закрыть',closeDialog]]);
}
function confirmNew(options){openDialog('Новый забег','<p>Начать заново? Текущий забег останется в резервной записи.</p>',[['Начать',()=>startFresh(options)],['Отмена',closeDialog]]);}
document.getElementById('play_hand').onclick=()=>perform('PLAY_HAND',[...selected]);
document.getElementById('discard').onclick=()=>perform('DISCARD',[...selected]);
function sort(mode){if(busy || state?.phase!=='playing')return;perform('SET_SORT',undefined,mode);}
document.getElementById('sort_rank').onclick=()=>sort('rank');document.getElementById('sort_suit').onclick=()=>sort('suit');
function showSettings(){openDialog('Настройки','<p>Пьеро · промежуточная сборка 0.4.9</p><p>Малый и большой блайнды, магазин, покупка и продажа джокеров. В этой предварительной версии доступны 32 эффекта джокеров; остальные товары, наборы, ваучеры и боссы ещё недоступны. Продолжение сохраняется после каждого действия.</p>',[['Продолжить',closeDialog],['Новый забег',()=>confirmNew()],['Главное меню',showMenu]]);}
document.getElementById('options').onclick=showSettings;
document.getElementById('run_info').onclick=()=>{
 if(!state)return;const table=document.createElement('table');
 for(const id of state.discoveredHands){const row=table.insertRow();row.insertCell().textContent=HAND_NAMES[id];row.insertCell().textContent='Ур. '+state.handLevels[id];}
 const body=document.createElement('div'),p=document.createElement('p');p.textContent=DECKS[state.deckId].name+' · Анте '+state.round.ante+(state.round.blindId==='big'?' · Большой блайнд':' · Малый блайнд');body.append(p,table);openDialog('Партия',body);
};
document.getElementById('deck').onclick=()=>{
 if(!state)return;openDialog('Колода',createDeckView(roundDeckView(state)),[['Назад',closeDialog]]);
};
globalThis.cardGamePause=()=>{}; // Actions are persisted before animation; no pending I/O on pause.
const loaded=repository.load();
if(loaded.status==='current'){state=loaded.state;render();showMenu();}
else if(loaded.status==='empty')showMenu();
else if(loaded.status==='recovery') {
 dialog.addEventListener('cancel',e=>e.preventDefault(),{once:true});
 openDialog('Восстановить забег?','<p>Основная запись повреждена. Есть проверенная резервная копия. Восстановить её?</p>',[['Восстановить',()=>{try{state=repository.restoreBackup();closeDialog();render();}catch{storageError();}},'restore-backup']]);
} else openDialog('Сохранение недоступно','<p>Не удалось прочитать исправную запись. Файлы сохранены без изменений. Автоматический новый забег не начат.</p>');
