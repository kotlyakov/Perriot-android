import {showCardTooltip,dismissCardTooltip} from './card-tooltip.js';
import catalog from '../content/apk-shop-catalog.js';
import {artwork} from './shop-screen.js';
import {collectionEntries} from '../core/profile.js';
import {nativeBlindTarget} from '../core/blind-progression.js';
import {DECKS} from '../content/decks.js';
import {CHALLENGES} from '../content/challenges.js';
import {STAKES} from '../content/stakes.js';
import {describeShopItem} from '../content/shop-display.js';
import {ENHANCEMENT_DESCRIPTIONS,EDITION_DESCRIPTIONS,SEAL_DESCRIPTIONS} from '../content/card-modifier-display.js';
import {APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {APK_TAGS_BY_ID} from '../content/apk-tags.js';

const setNames={Joker:'Джокеры',Back:'Колоды',Voucher:'Билеты',Tarot:'Таро',Planet:'Планеты',Spectral:'Спектральные карты',Enhanced:'Улучшения',Seal:'Печати',Edition:'Издания',Booster:'Коробочки',Tag:'Награды за пропуск',Blind:'Блайнды'};
const sets=['Joker','Back','Voucher','Tarot','Planet','Spectral','Enhanced','Seal','Edition','Booster','Tag','Blind'];
function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function button(id,text,action){const node=element('button','',text);node.id=id;node.type='button';node.onclick=action;return node;}
function number(value){try{return BigInt(value??0).toLocaleString('ru-RU');}catch{return '0';}}
function localized(entry){
 if(entry.set==='Back'){const meta=DECKS[entry.id.replace(/^b_/,'')];return {name:meta?.name??'Колода',description:meta?.description??(meta?`${meta.bonus} ${meta.effect} ${meta.timing}`:'')};}
 if(entry.set==='Enhanced'){const key=entry.id.replace(/^m_/,''),description=ENHANCEMENT_DESCRIPTIONS[key]??'';return {name:description.split(':')[0]||'Улучшение',description};}
 if(entry.set==='Seal'){const description=SEAL_DESCRIPTIONS[entry.id.replace(/^seal_/,'').replace(/_seal$/,'').toLowerCase()]??'';return {name:description.split(':')[0]||'Печать',description};}
 if(entry.set==='Edition'){const raw=entry.id.replace(/^e_/,''),key=raw==='holo'?'holographic':raw,description=EDITION_DESCRIPTIONS[key]??({negative:'Негатив: +1 слот для карты.',base:'Обычное издание.'})[key]??'';return {name:description.split(':')[0],description};}
 if(entry.set==='Blind'){const meta=APK_BLINDS_BY_ID[entry.id];return {name:meta?.nameRu??meta?.name??'Блайнд',description:meta?.description??''};}
 if(entry.set==='Tag'){const meta=APK_TAGS_BY_ID[entry.id];return {name:meta?.nameRu??meta?.name??'Награда за пропуск',description:meta?.description??''};}
 return describeShopItem({entityId:entry.id});
}
function highestStake(wins){let result=0;for(let index=0;index<wins.length;index++)if(wins[index]>0)result=index+1;return result;}
function pager(id,page,pages,change){const nav=element('nav','profile-paging');nav.setAttribute('aria-label','Страницы');const prev=button(id+'_prev','‹',()=>change(page-1)),next=button(id+'_next','›',()=>change(page+1));prev.setAttribute('aria-label','Предыдущая страница');next.setAttribute('aria-label','Следующая страница');prev.disabled=page===0;next.disabled=page>=pages-1;const count=element('span','',`${page+1} / ${pages}`);count.id=id+'_page';nav.append(prev,count,next);return nav;}
function progressView(profile){
 const progress=element('div','profile-progress'),entries=collectionEntries(profile).filter(entry=>!['Enhanced','Seal'].includes(entry.set));
 const metrics=[['collection','Коллекция',entries.filter(entry=>entry.discovered).length,entries.length],['challenges','Испытания',profile.completedChallenges?.length??0,CHALLENGES.length],['stickers','Наклейки джокеров',Object.values(profile.jokerWins??{}).reduce((n,wins)=>n+highestStake(wins),0),150*8],['decks','Победы колод по ставкам',Object.values(profile.deckWins??{}).reduce((n,wins)=>n+highestStake(wins),0),Object.keys(DECKS).length*8]];
 const overall=metrics.reduce((sum,[,,value,total])=>sum+value/(total||1),0)/metrics.length;
 for(const [id,label,value,total] of [['overall','Общий прогресс',overall,1],...metrics]){
  const percent=Math.floor(.01+100*value/(total||1)),item=element('div','profile-progress-item'+(id==='overall'?' profile-progress-overall':''));item.id='profile_progress_'+id;item.dataset.percent=String(percent);
  const fill=element('div','profile-progress-fill');fill.style.setProperty('--progress-fill',percent+'%');fill.setAttribute('role','progressbar');fill.setAttribute('aria-label',label);fill.setAttribute('aria-valuemin','0');fill.setAttribute('aria-valuemax',String(total));fill.setAttribute('aria-valuenow',String(value));
  fill.append(element('strong','',percent+'%'));if(id!=='overall')fill.append(element('small','',` (${value} / ${total})`));item.append(element('span','profile-progress-label',label),fill);progress.append(item);
 }return progress;
}
/** A single local player; editing the name never replaces progress. */
export function renderProfileView(profile,{name='Игрок',onRename}={}){
 const root=element('section','profile-view player-profile');root.id='profile_view';root.setAttribute('aria-label','Профиль игрока');
 const body=element('div','profile-details');body.id='profile_details';const label=element('label','profile-name-label','Имя игрока'),input=element('input','profile-name');input.id='profile_name';input.type='text';input.maxLength=10;input.value=name;input.autocomplete='off';input.setAttribute('aria-label','Имя игрока');
 const status=element('p','profile-name-status');status.id='profile_name_status';status.setAttribute('role','status');let savedName=name;
 input.onchange=()=>{const next=input.value.trim().slice(0,10)||'Игрок';try{savedName=onRename?.(next)??next;input.value=savedName;status.textContent='';}catch{input.value=savedName;status.textContent='Не удалось сохранить имя. Повторите попытку.';}};label.append(input);
 const wins=element('p','profile-wins');wins.append(element('span','','Победы: '),element('strong','',number(profile.career?.c_wins)));
 body.append(label,status,progressView(profile),wins);root.append(body);return root;
}
// Row capacities from UI_definitions.lua; decks use their own one-at-a-time cycle.
const collectionRows={Joker:[5,5,5],Tarot:[5,6],Planet:[6,6],Spectral:[4,5],Voucher:[4,4],Booster:[4,4],Enhanced:[4,4],Seal:[4],Edition:[5],Back:[1],Tag:[6,6,6,6],Blind:[5,5,5,5,5,5]};
export function renderCollectionView(profile,seed,{onNavigate}={}){
 const root=element('section','collection-view');root.id='collection_view';root.setAttribute('aria-label','Коллекция');
 const entries=collectionEntries(profile,seed);let set=null,page=0,gesture=null,suppressClick=false,animation=null,changePage=()=>{};
 // Keep the release click of a swipe from opening a card on the new page.
 root.addEventListener?.('click',event=>{if(!suppressClick)return;suppressClick=false;event.preventDefault();event.stopImmediatePropagation();},true);
 root.onpointerdown=event=>{
  suppressClick=false;gesture=null;
  if(!set||event.isPrimary===false||(event.button!=null&&event.button!==0)||event.target?.closest?.('.collection-paging'))return;
  gesture={id:event.pointerId,x:event.clientX,y:event.clientY,horizontal:false};
 };
 root.onpointermove=event=>{
  if(!gesture||event.pointerId!==gesture.id)return;
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.4)gesture.horizontal=true;
  if(gesture.horizontal){event.preventDefault();suppressClick=true;root.setPointerCapture?.(event.pointerId);}
 };
 root.onpointerup=event=>{
  if(!gesture||event.pointerId!==gesture.id)return;
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y,horizontal=gesture.horizontal;gesture=null;
  if(horizontal){event.preventDefault();suppressClick=true;if(Math.abs(dx)>=40&&Math.abs(dx)>Math.abs(dy)*1.4)changePage(dx<0?1:-1);}
 };
 root.onpointercancel=()=>{gesture=null;};
 root.ondragstart=event=>event.preventDefault();
 root.back=()=>{if(!set)return false;set=null;page=0;draw();return true;};
 function draw(direction=0){
  animation?.cancel();animation=null;changePage=()=>{};gesture=null;
  dismissCardTooltip();root.replaceChildren();root.onkeydown=null;root.dataset.view=set?'category':'index';root.dataset.set=set??'';
  // Retained as an accessible automation hook, never a second visible navigation.
  const selector=element('select');selector.id='collection_set';selector.hidden=true;selector.tabIndex=-1;selector.setAttribute('aria-label','Раздел коллекции');
  for(const category of sets){const option=element('option','',setNames[category]);option.value=category;selector.append(option);}selector.value=set??'';selector.onchange=()=>changeSet(selector.value);root.append(selector);
  if(!set){
   const categories=element('nav','collection-categories');categories.setAttribute('aria-label','Раздел коллекции');
   const left=element('div','collection-category-column'),right=element('div','collection-category-column');
   function choice(category,parent){const rows=entries.filter(entry=>entry.set===category),item=button('collection_category_'+category,'',()=>changeSet(category));item.dataset.cardSet=category;item.append(element('strong','',setNames[category]));if(!['Enhanced','Seal'].includes(category))item.append(element('span','collection-category-count',`${rows.filter(entry=>entry.discovered).length} / ${rows.length}`));parent.append(item);}
   for(const category of ['Joker','Back','Voucher'])choice(category,left);
   const consumables=element('section','collection-consumables');consumables.setAttribute('aria-label','Расходники');consumables.append(element('strong','collection-group-title','Расходники'));const group=element('div');for(const category of ['Tarot','Planet','Spectral'])choice(category,group);consumables.append(group);left.append(consumables);
   for(const category of ['Enhanced','Seal','Edition','Booster','Tag','Blind'])choice(category,right);
   categories.append(left,right);root.append(categories);
  }else{
   const content=element('div','collection-content');
   const rows=entries.filter(entry=>entry.set===set).sort((a,b)=>(a.order??0)-(b.order??0)),capacities=collectionRows[set],size=capacities.reduce((n,x)=>n+x,0),pages=Math.max(1,Math.ceil(rows.length/size));page=Math.max(0,Math.min(page,pages-1));
   const grid=element('div','collection-grid');grid.setAttribute('aria-label','Карты раздела');grid.dataset.set=set;grid.dataset.cardSet=set;let offset=page*size;
   const tooltip=element('aside','collection-details collection-tooltip');tooltip.id='collection_details';tooltip.hidden=true;tooltip.setAttribute('role','tooltip');tooltip.setAttribute('aria-live','polite');
   function details(entry,card){const known=entry.discovered,display=known||!entry.unlocked?localized(entry):null,name=display?.name??'Не обнаружено';let text=!entry.unlocked?(entry.condition||'Выполните условие открытия.'):known?display.description:'Найдите эту карту в обычной партии.';if(set==='Blind'){const blind=APK_BLINDS_BY_ID[entry.id];text=known?`Набрать: ${blind.mult} × базовые очки анте. Награда: $${blind.dollars}. ${text}`:'Победите этот блайнд в обычной партии, чтобы открыть его описание.';}if(known&&entry.sticker)text+=` Победа: ${STAKES[entry.sticker-1]?.name??entry.sticker}.`;tooltip.replaceChildren(element('strong','',name));
    if(known&&set==='Joker'){const rarity=catalog.centres.find(centre=>centre.key===entry.id)?.rarity,badge=element('span','collection-rarity',({1:'Обычный',2:'Необычный',3:'Редкий',4:'Легендарный'})[rarity]??'Джокер');badge.dataset.rarity=String(rarity);tooltip.append(badge);}
    tooltip.append(element('p','',text||'Описание отсутствует.'));showCardTooltip(tooltip,card,{container:root});
   }

   for(const capacity of capacities){const row=element('div','collection-card-row');row.style.setProperty('--collection-columns',capacity);for(const entry of rows.slice(offset,offset+capacity)){
    const display=entry.discovered||!entry.unlocked?localized(entry):null,name=display?.name??'Не обнаружено',card=button('collection_'+entry.id,'',()=>details(entry,card));card.className='collection-card';card.dataset.entryId=entry.id;card.dataset.cardSet=entry.set;card.dataset.cardState=!entry.unlocked?'locked':entry.discovered?'discovered':'unseen';card.dataset.discovered=String(entry.discovered);card.dataset.unlocked=String(entry.unlocked);card.setAttribute('aria-label',name+(!entry.unlocked?' — закрыто':''));if(entry.discovered&&entry.unlocked){card.append(artwork({entityId:entry.id},entry.set==='Booster'?'booster':'collection'));if(entry.set==='Joker')card.append(element('span','shop-card-name collection-joker-name',display.name));}else{const state=element('span','collection-state-art');state.setAttribute('aria-hidden','true');state.innerHTML=entry.unlocked?'<svg viewBox="0 0 72 100"><path d="M10 8H62V92H10Z M17 15H55V85H17Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M26 36C26 20 51 20 49 38C48 46 36 46 36 58" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="36" cy="72" r="3" fill="currentColor"/></svg>':'<svg viewBox="0 0 72 100"><path d="M23 44V32C23 14 49 14 49 32V44" fill="none" stroke="currentColor" stroke-width="6"/><rect x="15" y="42" width="42" height="39" rx="5" fill="currentColor"/><circle cx="36" cy="57" r="5" fill="#263b3b"/><path d="M36 58V69" stroke="#263b3b" stroke-width="4"/></svg>';card.append(state);}
    if(entry.discovered&&entry.sticker){const sticker=element('span','collection-sticker',String(entry.sticker));sticker.style.setProperty('--stake-color',STAKES[entry.sticker-1]?.color??'#d7c49a');card.append(sticker);}row.append(card);
    if(set==='Back'){const description=element('div','collection-deck-description');description.append(element('h3','',name),element('p','',!entry.unlocked?entry.condition:entry.discovered?display.description:'Найдите эту колоду в обычной партии.'));row.append(description);}
   }offset+=capacity;grid.append(row);}
   if(set==='Blind'){
    const layout=element('div','collection-blind-layout'),table=element('table','collection-ante-table');table.setAttribute('aria-label','Базовые очки по анте');
    const header=element('tr');header.append(element('th','','Анте'),element('th','','База'));table.append(header);
    for(let ante=1;ante<=16;ante++){const target=nativeBlindTarget(ante),record=element('tr');record.dataset.ante=String(ante);record.dataset.target=String(target);record.dataset.reached=String(ante<=(profile.highScores?.furthestAnte??0));record.append(element('td','',String(ante)),element('td','',new Intl.NumberFormat('ru-RU',{notation:target>=1000000n?'compact':'standard',maximumFractionDigits:2}).format(target)));table.append(record);}
    layout.append(table,grid);content.append(layout);
   }else content.append(grid);
   if(['Enhanced','Seal','Edition'].includes(set))content.append(element('p','collection-category-explanation',set==='Seal'?'Печати добавляют карте особое свойство. На карте может быть одна печать.':set==='Enhanced'?'Улучшение меняет свойства игральной карты. На карте может быть одно улучшение.':'Издание добавляет карте отдельный эффект и сочетается с улучшением и печатью.'));
   const cycle=(next,direction=Math.sign(next-page))=>{if(animation||pages===1)return;page=(next+pages)%pages;draw(direction);};
   changePage=delta=>cycle(page+delta,delta);
   const paging=pager('collection',page,pages,cycle);paging.className='collection-paging';
   for(const arrow of [paging.children[0],paging.children[2]])arrow.disabled=pages===1;
   paging.children[1].setAttribute('aria-live','polite');
   // Preserve the existing automation hook; visible navigation is identical in every category.
   const select=element('select');select.id='collection_page_select';select.hidden=true;select.tabIndex=-1;select.setAttribute('aria-label','Страница коллекции');
   for(let index=0;index<pages;index++){const option=element('option','',`Страница ${index+1} / ${pages}`);option.value=String(index);select.append(option);}select.value=String(page);select.onchange=()=>cycle(Number(select.value));paging.append(select);content.append(paging);
   root.append(content,tooltip);
   const surface=set==='Blind'?grid.parentElement:grid;
   if(direction&&surface?.animate&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
    const motion=surface.animate([{transform:`translateX(${direction*24}px)`,opacity:.35},{transform:'translateX(0)',opacity:1}],{duration:180,easing:'ease-out'});
    animation=motion;
    motion.finished.then(()=>{if(animation===motion)animation=null;},()=>{if(animation===motion)animation=null;});
   }

  }
  onNavigate?.({view:set?'category':'index',set,back:root.back});
 }
 function changeSet(category){if(!sets.includes(category))return;set=category;page=0;draw();}draw();return root;
}
