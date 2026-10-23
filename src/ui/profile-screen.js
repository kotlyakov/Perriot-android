import {collectionEntries} from '../core/profile.js';
import {HAND_NAMES} from '../content/hand-names.js';
import {DECKS} from '../content/decks.js';
import {CHALLENGES} from '../content/challenges.js';
import {STAKES} from '../content/stakes.js';
import {describeShopItem} from '../content/shop-display.js';
import {ENHANCEMENT_DESCRIPTIONS,EDITION_DESCRIPTIONS,SEAL_DESCRIPTIONS} from '../content/card-modifier-display.js';
import {APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {APK_TAGS_BY_ID} from '../content/apk-tags.js';

const setNames={Joker:'Джокеры',Back:'Колоды',Voucher:'Билеты',Tarot:'Таро',Planet:'Планеты',Spectral:'Спектральные карты',Enhanced:'Улучшения',Seal:'Печати',Edition:'Издания',Booster:'Коробочки',Tag:'Награды за пропуск',Blind:'Блайнды'};
const sets=['Joker','Back','Voucher','Tarot','Planet','Spectral','Enhanced','Seal','Edition','Booster','Tag','Blind'];
const profilePageSize=6;
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
function row(table,label,value){const tr=element('tr');tr.append(element('td','',label),element('td','',typeof value==='string'?value:number(value)));table.append(tr);}
function pager(id,page,pages,change){const nav=element('nav','profile-paging');nav.setAttribute('aria-label','Страницы');const prev=button(id+'_prev','‹',()=>change(page-1)),next=button(id+'_next','›',()=>change(page+1));prev.setAttribute('aria-label','Предыдущая страница');next.setAttribute('aria-label','Следующая страница');prev.disabled=page===0;next.disabled=page>=pages-1;const count=element('span','',`${page+1} / ${pages}`);count.id=id+'_page';nav.append(prev,count,next);return nav;}
function textPages(text,size=220){const pages=[];let chunk='';for(let word of String(text??'').split(/\s+/)){if(chunk.length+word.length+1>size&&chunk){pages.push(chunk);chunk='';}for(let rest=word;rest.length>size;rest=rest.slice(size)){if(chunk){pages.push(chunk);chunk='';}pages.push(rest.slice(0,size));word=rest.slice(size);}chunk+=(chunk?' ':'')+word;}if(chunk||!pages.length)pages.push(chunk);return pages;}
function selectTab(container,key){for(const tab of container.querySelectorAll('[data-tab]'))tab.setAttribute('aria-pressed',String(tab.dataset.tab===key));}

function progressView(profile){
 const progress=element('div','profile-progress');
 const entries=collectionEntries(profile).filter(entry=>!['Enhanced','Seal'].includes(entry.set));
 for(const [label,value,total] of [['Коллекция',entries.filter(entry=>entry.discovered).length,entries.length],['Испытания',profile.completedChallenges?.length??0,CHALLENGES.length],['Наклейки джокеров',Object.values(profile.jokerWins??{}).reduce((n,wins)=>n+highestStake(wins),0),150*8],['Победы колод по ставкам',Object.values(profile.deckWins??{}).reduce((n,wins)=>n+highestStake(wins),0),Object.keys(DECKS).length*8]]){
  const item=element('div','profile-progress-item');item.append(element('strong','',label),element('span','',`${Math.floor(100*value/(total||1))}% (${value} / ${total})`));const meter=element('progress');meter.max=total||1;meter.value=value;meter.setAttribute('aria-label',label);item.append(meter);progress.append(item);
 }return progress;
}
function showRows(target,rows,page,id){
 target.replaceChildren();
 const expanded=rows.flatMap(([label,value])=>textPages(value,36).map((part,index,parts)=>[label+(parts.length>1?` (${index+1}/${parts.length})`:''),part]));
 const pages=Math.max(1,Math.ceil(expanded.length/profilePageSize)),table=element('table','profile-stat-table');
 for(const [label,value] of expanded.slice(page*profilePageSize,(page+1)*profilePageSize))row(table,label,value);
 target.append(expanded.length?table:element('p','profile-empty','Пока нет использованных карт.'));
 if(pages>1)target.append(pager(id,page,pages,next=>showRows(target,rows,next,id)));
}
/** Browsing a slot does not load or change the active save. */
export function renderProfileView(profile,{activeId='1',profiles=[{id:'1',name:'П1'},{id:'2',name:'П2'},{id:'3',name:'П3'}],onSelect}={}){
 const root=element('section','profile-view');root.id='profile_view';root.setAttribute('aria-label','Профили');
 const slots=element('nav','profile-slots');slots.setAttribute('aria-label','Профили');root.append(slots);
 const body=element('div','profile-details');body.id='profile_details';root.append(body);
 let focused=String(activeId);
 for(const item of profiles){const slot=button('profile_slot_'+item.id,item.name??'П'+item.id,()=>{focused=String(item.id);draw();});slot.dataset.tab=String(item.id);slot.dataset.profileSlot=item.id;slots.append(slot);}
 function draw(){
  selectTab(slots,focused);body.replaceChildren();const item=profiles.find(item=>String(item.id)===focused),data=focused===String(activeId)?profile:item?.profile??item?.data;
  body.append(element('h3','profile-name',item?.name??'П'+focused));
  const columns=element('div','profile-slot-content');columns.append(data?progressView(data):element('p','profile-empty','Прогресс этого профиля доступен после загрузки.'));
  const actions=element('div','profile-load-actions');actions.append(element('p','profile-wins','Победы: '+(data?number(data.career?.c_wins):'—')));
  const load=button('profile_load',focused===String(activeId)?'Текущий профиль':'Загрузить профиль',()=>onSelect?.(focused));load.disabled=focused===String(activeId)||!onSelect;actions.append(load);
  // Destructive profile operations are unavailable until persistence exposes them.
  const reset=button('profile_reset',focused===String(activeId)?'Сбросить профиль':'Удалить профиль');reset.disabled=true;reset.title='Недоступно';actions.append(reset);
  columns.append(actions);body.append(columns);
 }draw();return root;
}
/** Native high-scores surface: records left, progress and card usage right. */
export function renderStatsView(profile,{onNavigate}={}){
 const root=element('section','profile-view stats-view');root.id='stats_view';let view='scores';
 const body=element('div','profile-details');root.append(body);
 function draw(){body.replaceChildren();root.dataset.view=view;
  if(view==='scores'){
   const columns=element('div','profile-stats-columns'),records=element('div','profile-records'),scores=profile.highScores??{};
   const mostPlayed=Object.entries(profile.usage?.hands??{}).sort((a,b)=>b[1]-a[1])[0];
   showRows(records,[['Лучшая рука',number(scores.hand)],['Самый дальний раунд',number(scores.furthestRound)],['Самое дальнее анте',number(scores.furthestAnte)],['Любимая комбинация',mostPlayed?`${HAND_NAMES[mostPlayed[0]]??mostPlayed[0]} (${number(mostPlayed[1])})`:'Нет'],['Максимум денег',number(scores.mostMoney)],['Лучшая серия побед',number(scores.winStreak)]],0,'profile_stats');
   const side=element('div','profile-stats-side');side.append(progressView(profile),button('profile_usage_tab','Статистика карт',()=>navigate('usage')),button('profile_history_tab','Карьера',()=>navigate('history')));columns.append(records,side);body.append(columns);
  }else if(view==='usage'){
   const entries=collectionEntries(profile),lookup=new Map(entries.map(entry=>[entry.id,entry])),nav=element('nav','profile-usage-tabs'),content=element('section','profile-usage');body.append(nav,content);
   for(const [field,label] of [['jokers','Джокеры'],['consumables','Расходники'],['vouchers','Билеты'],['decks','Колоды'],['hands','Комбинации']]){const tab=button('profile_usage_'+field,label,()=>show(field));tab.dataset.tab=field;nav.append(tab);}
   function show(field){selectTab(nav,field);const rows=Object.entries(profile.usage?.[field]??{}).filter(([id])=>lookup.get(id)?.discovered||field==='decks'||field==='hands').sort((a,b)=>Number(b[1]?.count??b[1])-Number(a[1]?.count??a[1])).map(([id,value])=>[lookup.has(id)?localized(lookup.get(id)).name:DECKS[id]?.name??HAND_NAMES[id]??'Карта',number(value?.count??value)]);showRows(content,rows,0,'profile_usage');}show('jokers');
  }else{
   const c=profile.career??{},s=profile.highScores??{};
   showRows(body,[['Победы',c.c_wins],['Поражения',c.c_losses],['Сыграно раундов',c.c_rounds],['Сыграно рук',c.c_hands_played],['Сыграно карт',c.c_cards_played],['Сброшено карт',c.c_cards_discarded],['Заработано денег',c.c_dollars_earned],['Потрачено в магазине',c.c_shop_dollars_spent],['Обновлений магазина',c.c_shop_rerolls],['Текущая серия побед',s.currentStreak]].map(([label,value])=>[label,number(value)]),0,'profile_history');
  }
 }
 function navigate(next){view=next;draw();onNavigate?.({view,back:root.back});}
 root.back=()=>{if(view==='scores')return false;navigate('scores');return true;};draw();return root;
}
// Row capacities from UI_definitions.lua; decks use their own one-at-a-time cycle.
const collectionRows={Joker:[5,5,5],Tarot:[5,6],Planet:[6,6],Spectral:[4,5],Voucher:[4,4],Booster:[4,4],Enhanced:[4,4],Seal:[4],Edition:[5],Back:[1],Tag:[6,6,6,6],Blind:[5,5,5,5,5,5]};
export function renderCollectionView(profile,seed,{onNavigate}={}){
 const root=element('section','collection-view');root.id='collection_view';root.setAttribute('aria-label','Коллекция');
 const entries=collectionEntries(profile,seed);let set=null,page=0;
 root.back=()=>{if(!set)return false;set=null;page=0;draw();return true;};
 function draw(){
  root.replaceChildren();root.onkeydown=null;root.dataset.view=set?'category':'index';root.dataset.set=set??'';
  // Retained as an accessible automation hook, never a second visible navigation.
  const selector=element('select');selector.id='collection_set';selector.hidden=true;selector.tabIndex=-1;selector.setAttribute('aria-label','Раздел коллекции');
  for(const category of sets){const option=element('option','',setNames[category]);option.value=category;selector.append(option);}selector.value=set??'';selector.onchange=()=>changeSet(selector.value);root.append(selector);
  if(!set){
   const categories=element('nav','collection-categories');categories.setAttribute('aria-label','Раздел коллекции');
   const left=element('div','collection-category-column'),right=element('div','collection-category-column');
   function choice(category,parent){const rows=entries.filter(entry=>entry.set===category),item=button('collection_category_'+category,'',()=>changeSet(category));item.append(element('strong','',setNames[category]));if(!['Enhanced','Seal'].includes(category))item.append(element('span','collection-category-count',`${rows.filter(entry=>entry.discovered).length} / ${rows.length}`));parent.append(item);}
   for(const category of ['Joker','Back','Voucher'])choice(category,left);
   const consumables=element('section','collection-consumables');consumables.setAttribute('aria-label','Расходники');consumables.append(element('strong','collection-group-title','Расходники'));const group=element('div');for(const category of ['Tarot','Planet','Spectral'])choice(category,group);consumables.append(group);left.append(consumables);
   for(const category of ['Enhanced','Seal','Edition','Booster','Tag','Blind'])choice(category,right);
   categories.append(left,right);root.append(categories);
  }else{
   const content=element('div','collection-content'),heading=element('div','collection-controls');heading.append(element('strong','',setNames[set]));const tally=element('strong','');tally.id='collection_tally';
   const rows=entries.filter(entry=>entry.set===set).sort((a,b)=>(a.order??0)-(b.order??0)),capacities=collectionRows[set],size=capacities.reduce((n,x)=>n+x,0),pages=Math.max(1,Math.ceil(rows.length/size));page=Math.max(0,Math.min(page,pages-1));tally.textContent=`${rows.filter(entry=>entry.discovered).length}/${rows.length}`;heading.append(tally);content.append(heading);
   const grid=element('div','collection-grid');grid.setAttribute('aria-label','Карты раздела');grid.dataset.set=set;let offset=page*size;
   const tooltip=element('aside','collection-details collection-tooltip');tooltip.id='collection_details';tooltip.hidden=true;tooltip.setAttribute('role','tooltip');tooltip.setAttribute('aria-live','polite');
   function details(entry,card){const known=entry.discovered,display=known||!entry.unlocked?localized(entry):null,name=display?.name??'Не обнаружено';let text=!entry.unlocked?(entry.condition||'Выполните условие открытия.'):known?display.description:'Найдите эту карту в обычной партии.';if(known&&entry.sticker)text+=` Победа: ${STAKES[entry.sticker-1]?.name??entry.sticker}.`;const chunks=textPages(text||'Описание отсутствует.');function part(index){tooltip.replaceChildren(element('strong','',name),element('p','',chunks[index]));const close=button('collection_detail_close','Закрыть описание',()=>{tooltip.hidden=true;});tooltip.append(close);if(chunks.length>1)tooltip.append(pager('collection_detail',index,chunks.length,part));}part(0);tooltip.hidden=false;for(const other of grid.querySelectorAll('[data-entry-id]'))other.setAttribute('aria-pressed',String(other===card));card.setAttribute('aria-describedby',tooltip.id);}
   for(const capacity of capacities){const row=element('div','collection-card-row');row.style.setProperty('--collection-columns',capacity);for(const entry of rows.slice(offset,offset+capacity)){
    const display=entry.discovered||!entry.unlocked?localized(entry):null,name=display?.name??'Не обнаружено',card=button('collection_'+entry.id,'',()=>details(entry,card));card.className='collection-card';card.dataset.entryId=entry.id;card.dataset.discovered=String(entry.discovered);card.dataset.unlocked=String(entry.unlocked);card.setAttribute('aria-label',name+(!entry.unlocked?' — закрыто':''));card.setAttribute('aria-pressed','false');card.onfocus=()=>details(entry,card);card.onmouseenter=()=>details(entry,card);card.append(element('span','collection-symbol',entry.discovered?'♠':entry.unlocked?'?':'◆'),element('strong','',name));
    if(entry.discovered&&entry.sticker){const sticker=element('span','collection-sticker',String(entry.sticker));sticker.style.setProperty('--stake-color',STAKES[entry.sticker-1]?.color??'#d7c49a');card.append(sticker);}row.append(card);
    if(set==='Back'){const description=element('div','collection-deck-description');description.append(element('h3','',name),element('p','',!entry.unlocked?entry.condition:entry.discovered?display.description:'Найдите эту колоду в обычной партии.'));row.append(description);}
   }offset+=capacity;grid.append(row);}content.append(grid);
   const paging=pager('collection',page,pages,next=>{page=next;draw();});paging.className='collection-paging';content.append(paging);root.append(content,tooltip);
   // The floating explanation is dismissible on touch and keyboard, without closing the category.
   root.onkeydown=event=>{if(event.key==='Escape'&&!tooltip.hidden){event.stopPropagation();tooltip.hidden=true;}};
  }
  onNavigate?.({view:set?'category':'index',set,back:root.back});
 }
 function changeSet(category){if(!sets.includes(category))return;set=category;page=0;draw();}draw();return root;
}
