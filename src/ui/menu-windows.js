import {HANDS} from '../content/hands.js';
import {HAND_NAMES} from '../content/hand-names.js';
import {APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {STAKES} from '../content/stakes.js';
import {describeShopItem} from '../content/shop-display.js';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const button=(id,label,action,cls='')=>{const b=el('button',cls,label);b.id=id;b.onclick=action;return b;};
export function handInfoRows(state){return [...(state.discoveredHands??[])].reverse().map(id=>{const h=HANDS[id],level=state.handLevels[id]??1;return {id,name:HAND_NAMES[id],level,chips:h.chips+h.chipGain*(level-1),mult:h.mult+h.multGain*(level-1)};});}
export function runInfoTabs(state){return [['hands','Комбинации'],['blinds','Блайнды'],['vouchers','Билеты'],...((state.stake??1)>1?[['stake','Ставка']]:[])];}
export function tabbedWindow(items,draw){
 const root=el('section','menu-window'),tabs=el('nav','menu-window-tabs'),body=el('div','menu-window-content');root.append(tabs,body);
 for(const [id,label] of items)tabs.append(button('menu_tab_'+id,label,()=>select(id)));
 function select(id){for(const b of tabs.children)b.setAttribute('aria-selected',String(b.id==='menu_tab_'+id));body.replaceChildren();draw(id,body);}
 select(items[0][0]);return root;
}
export function createOptionsView(actions={}){
 const root=el('section','options-menu');
 for(const [key,label]of [['settings','Настройки'],['restart','Новый забег'],['menu','Главное меню'],['stats','Статистика'],['collection','Коллекция'],['deck','Колода']]){
  const b=button('options_'+key,label,actions[key]??(()=>{}));b.disabled=!actions[key];root.append(b);
 }
 return root;
}
export function createSettingsView({values={music:.35,effects:.7},onVolume=()=>{},onNotice=()=>{}}={}){
 return tabbedWindow([['game','Игра'],['graphics','Графика'],['audio','Звук']],(tab,body)=>{
  if(tab==='audio'){
   for(const [key,label]of [['music','Музыка'],['effects','Звуковые эффекты']]){
    const row=el('label','settings-row',label),input=el('input'),out=el('output');input.id='audio_'+key;input.type='range';input.min=0;input.max=100;input.value=Math.round(values[key]*100);out.textContent=input.value+'%';
    input.oninput=()=>{try{const next=onVolume(key,Number(input.value)/100);if(next)values=next;else values={...values,[key]:Number(input.value)/100};}catch{onNotice('Не удалось сохранить настройки звука');}input.value=Math.round(values[key]*100);out.textContent=input.value+'%';};row.append(input,out);body.append(row);
   }
   body.append(el('p','menu-note','0% — выключено. Настройки звука сохраняются отдельно от партии.'));
  }else if(tab==='graphics'){
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;body.append(el('h2','', 'Отображение'),el('p','settings-summary','Оформление: Печатная мастерская'),el('p','settings-summary','Шрифт: Rubik'),el('p','settings-summary','Движение: '+(reduced?'уменьшено настройкой устройства':'обычное')),el('p','menu-note','CRT, выбор качества и другие параметры графики ещё не реализованы.'));
  }else body.append(el('h2','','Партия'),el('p','settings-summary','Язык: русский'),el('p','settings-summary','Сохранение после каждого действия'),el('p','menu-note','Изменение скорости игры пока не реализовано.'));
 });
}
export function createRunInfoView(state){
 return tabbedWindow(runInfoTabs(state),(tab,body)=>{
  if(tab==='hands'){
   const grid=el('div','run-hands');for(const r of handInfoRows(state)){const row=el('div','run-hand');row.append(el('strong','',r.name),el('span','','Ур. '+r.level),el('b','cyan',r.chips),el('span','','×'),el('b','scarlet',r.mult));grid.append(row);}body.append(grid);
  }else if(tab==='blinds'){
   const grid=el('div','run-blinds');for(const [id,label] of [['small','Малый блайнд'],['big','Большой блайнд'],['boss','Босс']]){const p=el('article','run-blind');p.append(el('h2','',label),el('p','',id==='boss'?(APK_BLINDS_BY_ID[state.apkBlinds?.bossId]?.nameRu??APK_BLINDS_BY_ID[state.apkBlinds?.bossId]?.name??'Босс'):id==='small'?'Первый блайнд анте':'Второй блайнд анте'));p.append(el('strong','',state.round.blindId===id?'Текущий блайнд':'Анте '+state.round.ante));grid.append(p);}body.append(grid);
  }else if(tab==='vouchers'){
   const ids=state.apkShop?.context.usedVoucherIds??[];if(!ids.length){body.append(el('p','menu-empty','В этой партии билетов пока нет.'));return;}
   let page=0;const list=el('div','run-vouchers'),pager=el('nav','menu-paging');body.append(list,pager);
   const paint=()=>{list.replaceChildren();for(const id of ids.slice(page*4,page*4+4)){const meta=describeShopItem({entityId:id}),row=el('article','run-voucher');row.append(el('strong','',meta.name),el('p','',meta.description));list.append(row);}pager.replaceChildren(button('voucher_prev','‹',()=>{page--;paint();}),el('span','',`${page+1} / ${Math.ceil(ids.length/4)}`),button('voucher_next','›',()=>{page++;paint();}));pager.firstChild.disabled=page===0;pager.lastChild.disabled=(page+1)*4>=ids.length;};paint();
  }else {const s=STAKES.find(s=>s.level===(state.stake??1));body.append(el('h2','',s?.name??'Белая ставка'),el('p','settings-summary',s?.description??''),el('p','menu-note','Действуют ограничения предыдущих ставок.'));}
 });
}
