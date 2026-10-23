import {createOptionsView,createSettingsView,createRunInfoView,createEndView,createCustomizeView} from './menu-windows.js';
import {isVerificationSeed} from '../core/verification-seed.js';
import catalogue from '../content/apk-shop-catalog.js';
import {createGameAudio,createAudioSettings,soundForAction} from './audio.js';
import {renderShop,prepareShopChange} from './shop-screen.js';
import {renderStartScreen,removeStartScreen} from './start-screen.js';
import {blindReward} from '../core/stakes.js';
import {APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {blindChoiceTarget,renderBlindSelect} from './blind-select.js';
import {renderPostRound,roundDeckView} from './post-round.js';
import {animateNumber,animateCounters,animateMoney} from './number-animation.js';
import {CHALLENGE_BY_ID,challengeUnlocked} from '../content/challenges.js';
import {DECKS} from '../content/decks.js';
import {createDeckView} from './deck-view.js';
import {liftScoringCards,animateScore} from './score-animation.js';
import {showFlame} from './flame.js';
import {animationHeldCardIds,preparePlayedCards,prepareDrawnCards,prepareHandMovement,animateShatteredCards} from './play-animation.js';
import {createRun,dispatch} from '../core/run.js';
import {createProfileStore} from '../persistence/profile-store.js';
import {profileRunContext,deckUnlocked,stakeUnlocked,legendaryWinIds} from '../core/profile.js';
import {chooseProfileSeed} from '../core/profile-seed.js';
import {renderProfileView,renderCollectionView,renderStatsView} from './profile-screen.js';
import {createBackend} from '../persistence/backend.js';
import {installLayout} from './layout.js';
import {displayBlindTarget,renderField,dismissCardTip,showNumbers,HAND_NAMES,SUITS,rankLabel,displayInteger} from './field.js';

installLayout();
document.getElementById('stage').addEventListener('pointerdown',e=>{if(!e.target.closest('button'))dismissCardTip();});
const native=globalThis.CardStorage;
const audioPreferences=createAudioSettings({
 read:()=>native?native.read('audio'):globalThis.localStorage.getItem('pierrot.audio'),
 write:text=>{if(native){if(native.writeAudio(text)!==true)throw Error('Audio settings write failed');}else globalThis.localStorage.setItem('pierrot.audio',text);}
});
const audio=createGameAudio();audio.setVolumes(audioPreferences.get());
document.addEventListener('pointerdown',()=>audio.unlock(),{capture:true});
document.addEventListener('keydown',()=>audio.unlock(),{capture:true});
document.addEventListener('visibilitychange',()=>audio.setActive(!document.hidden));
globalThis.cardGameResume=()=>audio.setActive(!document.hidden);
addEventListener('pagehide',()=>audio.setActive(false));
addEventListener('pageshow',()=>audio.setActive(!document.hidden));
const backend=createBackend({native,storage:native?null:globalThis.localStorage});
const repository=createProfileStore(backend),selected=new Set(),dialog=document.getElementById('dialog');
let state=null,busy=false,noticeTimer,dialogMotion,scoringJokers=null;
function notice(message){document.getElementById('notice').textContent=message;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>document.getElementById('notice').textContent='',3500);}
const victoryProtected=()=>state?.winPending&&!document.getElementById('start_screen');
function closeDialog(){if(busy||victoryProtected()){if(!busy&&dialog.dataset.view==='victory-confirm')showVictory();return true;}return dismissDialog();}
function dismissDialog(){if(dialog.open){dialogMotion?.cancel();dialogMotion=null;dialog.close();dialog.classList.remove('deck-dialog');return true;}return false;}
dialog.addEventListener('close',()=>{if(dialog.open)return;dialogMotion?.cancel();dialogMotion=null;dialog.classList.remove('deck-dialog');});
dialog.addEventListener('cancel',e=>{if(busy||victoryProtected()){e.preventDefault();if(!busy&&dialog.dataset.view==='victory-confirm')showVictory();}});
// Native dialog cancel may be noncancelable; consume Escape before its close request.
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog.open&&(busy||victoryProtected())){e.preventDefault();closeDialog();}});
globalThis.cardGameBack=closeDialog;
function openDialog(title,body,actions=[['Закрыть',closeDialog]]) {
 dismissCardTip();dialog.dataset.view='';
 dialog.dataset.window=typeof body==='string'?'message':body.dataset.window??(body.classList.contains('profile-view')?'profile':'collection-index');
 dialogMotion?.cancel();dialogMotion=null;
 dialog.classList.toggle('deck-dialog',typeof body!=='string' && body.classList.contains('deck-view'));
 dialog.classList.toggle('menu-dialog',!dialog.classList.contains('deck-dialog'));
 dialog.classList.toggle('audio-dialog',typeof body!=='string' && body.classList.contains('audio-settings'));
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
const targetPackOpen=()=>state?.phase==='pack'&&/^p_(arcana|spectral)_/.test(state.packState?.sourceEntityId??'');
function render(hand=state?.hand,scoringPreview=null){if(state){if(!busy){for(const id of selected)if(!state.hand.includes(id))selected.delete(id);const forced=!state.bossState?.disabled&&state.phase==='playing'?state.bossState?.forcedCardId:null;if(forced&&state.hand.includes(forced)&&!selected.has(forced)){if(selected.size>=5)selected.delete([...selected].at(-1));selected.add(forced);}}renderField(!busy?roundDeckView({...state,hand}):{...state,hand},selected,busy||!!state.winPending,toggle,reorder,scoringPreview);renderPostRound(state,busy&&!state.shop,()=>perform('CASH_OUT'));renderShop(busy&&scoringJokers?{...state,jokers:scoringJokers}:state,busy||!!state.winPending,{onAction:(type,fields)=>perform(type,undefined,undefined,fields),onNotice:notice,targetCardIds:[...selected]});renderBlindSelect(state,busy||!!state.winPending,()=>perform('START_BLIND'),blindId=>perform('SKIP_BLIND',undefined,undefined,{blindId}),()=>perform('REROLL_BOSS')); document.getElementById('stage').classList.toggle('arcana-open',targetPackOpen());for(const id of ['blind_panel','blind_title','blind_token','blind_target','hand','hand_count','play_hand','discard','sort_panel','sort_label','sort_rank','sort_suit'])document.getElementById(id).hidden=targetPackOpen()? !['hand','sort_panel','sort_label','sort_rank','sort_suit'].includes(id):state.phase==='blind_selection'||(['shop','pack'].includes(state.phase)&&!!state.shop)||(!busy&&['round_won','shop','pack'].includes(state.phase));for(const id of ['hands','discards','round_score','calculation_panel','chips','mult','times'])document.getElementById(id).hidden=targetPackOpen();if(!busy&&state.winPending&&!dialog.open&&!document.getElementById('start_screen'))showVictory();}}
function toggle(id){if(busy || (state?.phase!=='playing'&&!targetPackOpen())||state.phase==='playing'&&!state.bossState?.disabled&&state.bossState?.forcedCardId===id)return;dismissCardTip();if(selected.has(id))selected.delete(id);else if(selected.size<5)selected.add(id);else {notice('Можно выбрать до 5 карт');return;}audio.play('select');render();}
async function reorder(id,to){const movement=prepareHandMovement();const ids=[...state.hand],from=ids.indexOf(id);ids.splice(from,1);ids.splice(to,0,id);if(to===from){render();await movement();return;}await perform('REORDER_HAND',ids);await movement();}
function newState({deckId='red',seed,stake=1,challengeId}={}){
 const profile=repository.getProfile();
 if(challengeId){if(!challengeUnlocked(profile,challengeId,seed))throw Error('Испытание пока закрыто');deckId='red';stake=1;if(!isVerificationSeed(seed))seed=undefined;}
 if(!deckUnlocked(profile,deckId,seed)||!stakeUnlocked(profile,deckId,stake,seed))throw Error('Колода или ставка пока закрыта');
 const selectedSeed=chooseProfileSeed({seed,stake,wonIds:challengeId?[]:legendaryWinIds(profile),randomSeed:()=>crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase()});
 return createRun(selectedSeed,{runId:crypto.randomUUID(),deckId,stake,challengeId,money:4n,referenceRng:true,referenceShop:true,...profileRunContext(profile,selectedSeed),reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
}
function startFresh(options){if(busy)return;try{const next=newState(options);repository.reset(next,{seeded:isVerificationSeed(next.seed)||!options?.challengeId&&!!options?.seed,challenge:!!options?.challengeId});state=next;selected.clear();closeDialog();removeStartScreen();render();}catch{storageError();}}
function showMenu(){if(busy)return;dismissDialog();renderStartScreen({hasSave:!!state,savedState:state?{...state,seeded:repository.getProfile()?.runs?.[state.runId]?.seeded??false}:undefined,continueChallengeId:state?.challengeId,profile:repository.getProfile(),profileName:repository.getProfiles().find(p=>p.id===repository.activeId)?.name,onContinue:()=>{try{repository.save(state,[],{continued:true});removeStartScreen();render();}catch{storageError();}},onNew:startFresh,onSettings:showOptions,onCollection:()=>showCollection(closeDialog),onProfile:showProfile});}
function showProfile(){
 openDialog('Профиль',renderProfileView(repository.getProfile(),{activeId:repository.activeId,profiles:repository.getProfiles().map(p=>({...p,profile:repository.getProfile(p.id)})),onSelect:id=>{
  if(busy)return;try{const selectedProfile=repository.selectProfile(id);state=selectedProfile.state;selected.clear();showMenu();showProfile();}catch{storageError();}
 }}));
}
function storageError(){openDialog('Не удалось сохранить','<p>Действие не применено. Проверьте свободное место и доступ к сохранению.</p>',state?.winPending?[['Вернуться к победе',showVictory,'victory_retry']]:undefined);}
function showLoss(){openDialog('Партия окончена',createEndView(state,{restart:showRunSetup,menu:showMenu,copySeed}),[]);}
function showVictory(){
 if(busy||!state?.winPending)return;
 openDialog('Победа!',createEndView(state,{restart:()=>showRunSetup(),menu:showMenu,endless:()=>perform('CONTINUE_ENDLESS'),copySeed},true),[]);
 dialog.dataset.view='victory';
}
async function perform(type,ids,mode,fields={}) {
 if(busy || !state)return;if(type!=='REORDER_HAND')dismissCardTip();busy=true;
 const context=profileRunContext(repository.getProfile()),nativeLocked=new Set(catalogue.centres.filter(c=>c.unlocked===false||c.start_locked).map(c=>c.key));
 const newlyUnlocked=state.apkShop?context.unlockedCentreIds.filter(id=>nativeLocked.has(id)&&!state.apkShop.context.unlockedCentreIds.includes(id)):[];
 const action={type,expectedRevision:state.revision,...(newlyUnlocked.length?{profileUnlockedCentreIds:[...new Set([...state.apkShop.context.unlockedCentreIds,...newlyUnlocked])],profileLockedCentreIds:state.apkShop.context.lockedCentreIds.filter(id=>!newlyUnlocked.includes(id))}:{}),...fields};if(ids!==undefined)action.cardIds=ids;if(mode!==undefined)action.mode=mode;
 const result=dispatch(state,action);
 if(result.error){busy=false;audio.play('error');notice('Действие недоступно');render();return;}
 if(type==='CONTINUE_ENDLESS')for(const button of document.getElementById('dialog-actions').children)button.disabled=true;
 try{repository.save(result.state,result.events);}catch{busy=false;render();storageError();return;}
 const cue=soundForAction(type);
 if(cue)audio.play(cue);audio.setScene(result.state.phase==='shop'?'shop':'table');
 if(type==='CONTINUE_ENDLESS'){state=result.state;dismissDialog();busy=false;render();return;}
 // Keep disappearing Joker anchors only for presentation; the saved transaction is final.
 if(type==='PLAY_HAND')scoringJokers=state.jokers;
 const previousRound=state.round,previousScore=state.round.score,previousMoney=state.money;
 const leaveShop=prepareShopChange(type);await leaveShop();
 const ordered=state.hand.filter(id=>(ids??[]).includes(id));
 const outgoing=['PLAY_HAND','DISCARD'].includes(type)?preparePlayedCards(ordered,type==='DISCARD',state.cards):null;
 const forced=result.events.find(e=>e.type==='cards_forced_discarded')?.cardIds??[];
 const forceDiscard=forced.length?preparePlayedCards(forced,true):null;
 const remaining=animationHeldCardIds(state.hand,ordered,forced,type==='PLAY_HAND'?result.state.lastScore.createdPlayingCards:undefined);
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
     await animateScore(result.events,event=>audio.play(event.type==='score_repeat'?'repeat':event.type==='score_money'?'money':event.operation.includes('mult')?'mult':'chips'));
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
 await moneyMotion;scoringJokers=null;busy=false;render();
 if(type==='PLAY_HAND'&&['round_won','game_over'].includes(state.phase))audio.play(state.phase==='round_won'?'win':'lose');
 if(state.phase==='game_over')showLoss();
}
function confirmNew(options){if(busy)return;openDialog('Новый забег','<p>Начать заново? Текущий забег останется в резервной записи.</p>',[['Начать',()=>startFresh(options)],['Отмена',()=>{if(state?.winPending)showVictory();else closeDialog();}]]);if(state?.winPending)dialog.dataset.view='victory-confirm';}
document.getElementById('play_hand').onclick=()=>perform('PLAY_HAND',[...selected]);
document.getElementById('discard').onclick=()=>perform('DISCARD',[...selected]);
function sort(mode){if(busy || (state?.phase!=='playing'&&!targetPackOpen()))return;perform('SET_SORT',undefined,mode);}
document.getElementById('sort_rank').onclick=()=>sort('rank');document.getElementById('sort_suit').onclick=()=>sort('suit');
async function copySeed(seed){try{await navigator.clipboard.writeText(String(seed));notice('Сид скопирован');}catch{notice('Не удалось скопировать сид: '+seed);}}
function showRunSetup(){if(busy)return;dismissDialog();renderStartScreen({hasSave:!!state,savedState:state?{...state,seeded:repository.getProfile()?.runs?.[state.runId]?.seeded??false}:undefined,fromRun:true,onBack:()=>{removeStartScreen();if(state?.phase==='game_over')showLoss();else render();},profileName:repository.getProfiles().find(p=>p.id===repository.activeId)?.name,profile:repository.getProfile(),onNew:startFresh,onContinue:()=>{removeStartScreen();render();},onSettings:showOptions,onCollection:()=>showCollection(closeDialog),onProfile:showProfile});document.getElementById('start_new').click();}
function showCollection(back=showOptions){let view;view=renderCollectionView(repository.getProfile(),state?.seed,{onNavigate:({view:page})=>{dialog.dataset.window=page==='index'?'collection-index':'collection';}});openDialog('Коллекция',view,[['Назад',()=>{if(!view.back?.())back();}]]);dialog.dataset.window='collection-index';}
function showStats(){const view=renderStatsView(repository.getProfile());openDialog('Статистика',view,[['Назад',()=>{if(!view.back?.())showOptions();}]]);dialog.dataset.window='stats';}
function showOptions(){
 if(busy||victoryProtected())return;
 const inRun=!!state&&!document.getElementById('start_screen');
 openDialog('Меню',createOptionsView({settings:showSettings,restart:showRunSetup,menu:showMenu,stats:showStats,collection:()=>showCollection(),deck:()=>openDialog('Настройка колоды',createCustomizeView(),[['Назад',showOptions]]),copySeed,credits:()=>openDialog('Авторы','<h2>Пьеро</h2><p>Собственное оформление: Печатная мастерская.</p><p>Правила и структура интерфейса основаны на Balatro.</p>',[['Назад',showOptions]])},{inRun,seeded:repository.getProfile()?.runs?.[state?.runId]?.seeded??false,seed:state?.seed}),[['Назад',closeDialog]]);
}
function showSettings(){
 if(busy||victoryProtected())return;
 openDialog('Настройки',createSettingsView({values:audioPreferences.get(),onVolume:(key,value)=>{const next=audioPreferences.set({...audioPreferences.get(),[key]:value});audio.setVolumes(next);if(key==='effects')audio.play('select');return next;},onNotice:notice}),[['Назад',showOptions]]);
}
document.getElementById('options').onclick=showOptions;
document.getElementById('run_info').onclick=()=>{
 if(busy||!state||state.winPending)return;
 openDialog('Партия',createRunInfoView(state,{blindChoices:['small','big','boss'].map(id=>({id,target:displayBlindTarget(blindChoiceTarget(state,id)),reward:blindReward(state,id),description:id==='boss'?(APK_BLINDS_BY_ID[state.apkBlinds?.bossId]?.description??''):''}))}),[['Назад',closeDialog]]);
};
document.getElementById('deck').onclick=()=>{
 if(busy||!state||state.winPending)return;openDialog('Колода',createDeckView(roundDeckView(state)),[['Назад',closeDialog]]);
};
globalThis.cardGamePause=()=>audio.setActive(false); // Actions are persisted before animation; no pending I/O on pause.
const loaded=repository.load();
if(loaded.status==='current'){state=loaded.state;render();if(!state.winPending)showMenu();}
else if(loaded.status==='empty')showMenu();
else if(loaded.status==='recovery') {
 dialog.addEventListener('cancel',e=>e.preventDefault(),{once:true});
 openDialog('Восстановить забег?','<p>Основная запись повреждена. Есть проверенная резервная копия. Восстановить её?</p>',[['Восстановить',()=>{try{state=repository.restoreBackup();dismissDialog();render();if(!state?.winPending)showMenu();}catch{storageError();}},'restore-backup']]);
} else openDialog('Сохранение недоступно','<p>Не удалось прочитать исправную запись. Файлы сохранены без изменений. Автоматический новый забег не начат.</p>');



