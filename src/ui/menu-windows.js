import {animateSettingsPaper} from './settings-paper.js';
import {GAME_SPEEDS,getGameSpeed,setGameSpeed} from './game-speed.js';
import {showCardTooltip} from './card-tooltip.js';
import {HANDS} from '../content/hands.js';
import {HAND_NAMES} from '../content/hand-names.js';
import {APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {STAKES} from '../content/stakes.js';
import {describeShopItem} from '../content/shop-display.js';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const button=(id,label,action,cls='')=>{const b=el('button',cls,label);b.id=id;b.onclick=action;return b;};
export function handInfoRows(state){return [...(state.discoveredHands??[])].reverse().map(id=>{const h=HANDS[id],level=state.handLevels[id]??1;return {id,name:HAND_NAMES[id],level,chips:h.chips+h.chipGain*(level-1),mult:h.mult+h.multGain*(level-1)};});}
export function runInfoTabs(state){return [['hands','Комбинации'],['blinds','Блайнды'],['vouchers','Билеты'],...((state.stake??1)>1?[['stake','Ставка']]:[])];}
export function tabbedWindow(items,draw,{paperMotion=false}={}){
 const root=el('section','menu-window'),tabs=el('nav','menu-window-tabs'),body=el('div','menu-window-content');root.append(tabs,body);
 for(const [id,label] of items)tabs.append(button('menu_tab_'+id,label,()=>select(id)));
 let active=null,wanted=null,moving=false;
 function paint(id){active=id;for(const b of tabs.children)b.setAttribute('aria-selected',String(b.id==='menu_tab_'+id));body.replaceChildren();draw(id,body);}
 async function select(id){
  wanted=id;
  if(moving||id===active)return;
  if(!paperMotion||!body.animate||matchMedia('(prefers-reduced-motion: reduce)').matches){paint(id);return;}
  moving=true;body.inert=true;body.setAttribute('aria-busy','true');
  try{
   do{if(active!==null)await animateSettingsPaper(body,true);paint(wanted);await animateSettingsPaper(body);}while(active!==wanted&&body.isConnected);
  }finally{moving=false;body.inert=false;body.setAttribute('aria-busy','false');}
 }

 select(items[0][0]);return root;
}
// Source structure: UI_definitions options2317, settings2373/2407.
export function createOptionsView(actions={},context={}){
 const root=el('section','options-menu');root.dataset.window='options';
 const add=(key,label)=>{const b=button('options_'+key,label,actions[key]??(()=>{}));b.disabled=!actions[key];root.append(b);};
 add('settings','Настройки');
 if(context.inRun!==false){
  if(context.seeded&&context.seed){const row=el('div','options-seed'),value=el('strong','',context.seed),copy=button('options_copy_seed','Копировать',()=>actions.copySeed?.(context.seed));row.append(el('span','','Сид:'),value,copy);root.append(row);}
  add('restart','Новая партия');add('menu','Главное меню');
 }
 if(context.inRun===false)add('credits','Авторы');return root;
}
export function createSettingsView({values={music:.35,effects:.7},onVolume=()=>{},onNotice=()=>{}}={}){
 const view=tabbedWindow([['game','Игра'],['audio','Звук']],(tab,body)=>{
  body.classList.add('native-settings');
  function slider(key,label,value,enabled=false){const row=el('label','settings-row'),caption=el('span','',label),input=el('input'),out=el('output');input.id='audio_'+key;input.type='range';input.min=0;input.max=100;input.value=Math.round(value*100);input.disabled=!enabled;out.textContent=input.value+'%';if(!enabled)row.classList.add('settings-unavailable');row.append(caption,out,input);if(enabled)input.oninput=()=>{try{const next=onVolume(key,Number(input.value)/100);if(next)values=next;else values={...values,[key]:Number(input.value)/100};}catch{onNotice('Не удалось сохранить настройки звука');}input.value=Math.round(values[key]*100);out.textContent=input.value+'%';};body.append(row);}
  if(tab==='audio'){slider('music','Музыка',values.music,true);slider('effects','Звуковые эффекты',values.effects,true);}
  else{
   const speedRow=el('div','settings-speed'),caption=el('span','','Скорость игры'),track=el('div','settings-speed-track');track.setAttribute('role','group');track.setAttribute('aria-label','Скорость игры');
   function refreshSpeed(){for(const b of track.children)b.setAttribute('aria-pressed',String(Number(b.dataset.speed)===getGameSpeed()));}
   for(const value of GAME_SPEEDS){const b=button('game_speed_'+String(value).replace('.','_'),String(value).replace('.',',')+'×',()=>{try{setGameSpeed(value);refreshSpeed();}catch{onNotice('Не удалось сохранить скорость игры');}});b.dataset.speed=String(value);b.setAttribute('aria-label','Скорость '+String(value).replace('.',',')+'×');track.append(b);}
   refreshSpeed();speedRow.append(caption,track);body.append(speedRow);}
 },{paperMotion:true});view.dataset.window='settings';return view;
}
export function createRunInfoView(state,{blindChoices=[],voucherFamilies=[]}={}){
 const view=tabbedWindow(runInfoTabs(state),(tab,body)=>{
  if(tab==='hands'){
   const grid=el('div','run-hands');for(const r of handInfoRows(state)){const row=el('div','run-hand');row.append(el('span','hand-level','Ур. '+r.level),el('strong','',r.name),el('b','hand-chips',r.chips),el('span','','×'),el('b','hand-mult',r.mult),el('span','','#'),el('span','hand-played',state.handUsage?.[r.id]??0));grid.append(row);}body.append(grid);
  }else if(tab==='blinds'){
   const grid=el('div','run-blinds');for(const [id,label] of [['small','Малый блайнд'],['big','Большой блайнд'],['boss','Босс']]){const p=el('article','run-blind');p.append(el('h2','',label),el('p','',id==='boss'?(APK_BLINDS_BY_ID[state.apkBlinds?.bossId]?.nameRu??APK_BLINDS_BY_ID[state.apkBlinds?.bossId]?.name??'Босс'):id==='small'?'Первый блайнд анте':'Второй блайнд анте'));const meta=blindChoices.find(b=>b.id===id);p.append(el('div','run-blind-token',id==='boss'?'♠':id==='big'?'●●':'●'));if(meta){p.append(el('small','','Набрать минимум'),el('strong','run-blind-target',meta.target),el('p','run-blind-description',meta.description??''),el('span','gold','Награда: $'+meta.reward));}p.append(el('strong','run-blind-status',state.round.blindId===id?'Текущий блайнд':'Анте '+state.round.ante));grid.append(p);}body.append(grid);
  }else if(tab==='vouchers'){
   const ids=state.apkShop?.context.usedVoucherIds??[];if(!ids.length){body.append(el('p','menu-empty','В этой партии билетов пока нет.'));return;}
   body.append(el('h2','','Использованные билеты'));const groups=new Map();
   for(const id of [...ids].sort((a,b)=>voucherFamilies.findIndex(v=>v.id===a)-voucherFamilies.findIndex(v=>v.id===b))){const key=voucherFamilies.find(v=>v.id===id)?.group??id;const group=groups.get(key)??[];group.push(id);groups.set(key,group);}
   const area=el('div','used-voucher-groups'),rows=[...groups.values()];
   const tip=el('aside','voucher-tooltip');tip.id='used_voucher_tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;
   for(let offset=0;offset<rows.length;offset+=offset===10?rows.length:5){const row=el('div','used-voucher-row');for(const family of rows.slice(offset,offset===10?rows.length:offset+5)){const stack=el('div','used-voucher-family');family.forEach((id,index)=>{const meta=describeShopItem({entityId:id}),card=button('used_'+id,meta.name,()=>{tip.replaceChildren(el('strong','',meta.name),el('p','',meta.description));showCardTooltip(tip,card,{container:body});});card.style.setProperty('--voucher-index',index);stack.append(card);});row.append(stack);}area.append(row);if(offset>=10)break;}
   body.append(area,tip);
  }else {const s=STAKES.find(s=>s.level===(state.stake??1));body.append(el('h2','',s?.name??'Белая ставка'),el('p','settings-summary',s?.description??''),el('p','menu-note','Действуют ограничения предыдущих ставок.'));}
 });view.dataset.window='party';return view;
}

// Native win/game_over hierarchy: mascot left, summary right, actions depend on outcome.
export function createEndView(state,actions={},won=false){
 const root=el('section','end-window');root.dataset.window='end';root.dataset.outcome=won?'won':'lost';
 const mascot=el('aside','end-mascot','♠');mascot.setAttribute('aria-label','Пьеро');
 const panel=el('div','end-panel'),heading=el('h2','end-heading',won?'Вы победили!':'Партия окончена');panel.append(heading);
 const top=el('div','end-best');
 const score=(label,value)=>{const row=el('div','end-score');row.append(el('span','',label),el('strong','',value??'—'));return row;};
 // Missing historical counters are explicit, never replaced with invented totals.
 top.append(score('Лучшая рука',state.runSummary?.bestHand),score('Любимая комбинация',Object.entries(state.handUsage??{}).sort((a,b)=>b[1]-a[1])[0]?.[0]?HAND_NAMES[Object.entries(state.handUsage).sort((a,b)=>b[1]-a[1])[0][0]]:'—'));panel.append(top);
 const columns=el('div','end-columns'),left=el('div','end-counters'),right=el('div','end-progress');
 for(const [label,key]of [['Сыграно карт','cardsPlayed'],['Сброшено карт','cardsDiscarded'],['Куплено карт','cardsPurchased'],['Перебросов','rerolls'],['Новых открытий','newCollection']])left.append(score(label,state.runSummary?.[key]));
 left.append(score('Сид',state.seed),button('end_copy_seed','Копировать',()=>actions.copySeed?.(state.seed)));
 right.append(score('Анте',state.round.ante),score('Раунд',state.roundNumber??1));
 const controls=el('div','end-controls');controls.append(button(won?'victory_new':'loss_new','Новая партия',actions.restart),button(won?'victory_menu':'loss_menu','Главное меню',actions.menu));
 if(won)right.append(controls);else {right.append(score('Поражение от',state.round.blindId==='boss'?(APK_BLINDS_BY_ID[state.apkBlinds?.bossId]?.nameRu??'Босс'):state.round.blindId==='big'?'Большой блайнд':'Малый блайнд'));}
 columns.append(left,right);panel.append(columns);if(won)panel.append(button('victory_endless','Бесконечный режим',actions.endless));else panel.append(controls);
 if(!state.runSummary)panel.append(el('p','end-note','— показатель не записан в этой версии сохранения.'));
 root.append(mascot,panel);return root;
}
