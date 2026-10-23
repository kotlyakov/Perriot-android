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
const pageSize=15;
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
function tabs(container,items,draw){for(const [id,label,key] of items){const tab=button(id,label,()=>draw(key));tab.dataset.tab=key;container.append(tab);}}
function selectTab(container,key){for(const tab of container.querySelectorAll('[data-tab]'))tab.setAttribute('aria-pressed',String(tab.dataset.tab===key));}

/** DOM-only view. The app owns profile selection and persistence. */
export function renderProfileView(profile,{activeId='1',profiles=[{id:'1',name:'П1'},{id:'2',name:'П2'},{id:'3',name:'П3'}],onSelect}={}){
 const root=element('section','profile-view');root.id='profile_view';root.setAttribute('aria-label','Профили и статистика');
 const choices=element('nav','profile-slots');choices.setAttribute('aria-label','Профили');
 for(const item of profiles){const slot=button('profile_slot_'+item.id,item.name??'П'+item.id,()=>onSelect?.(item.id));slot.dataset.profileSlot=item.id;slot.setAttribute('aria-pressed',String(String(item.id)===String(activeId)));choices.append(slot);}root.append(choices);
 const nav=element('nav','profile-tabs');nav.setAttribute('aria-label','Сведения о профиле');root.append(nav);
 const body=element('div','profile-details');body.id='profile_details';root.append(body);
 tabs(nav,[['profile_progress_tab','Прогресс','progress'],['profile_stats_tab','Статистика','stats'],['profile_usage_tab','Карты','usage']],draw);
 function draw(key){
  selectTab(nav,key);body.replaceChildren();
  if(key==='progress'){
   const entries=collectionEntries(profile),collectable=entries.filter(entry=>!['Enhanced','Seal'].includes(entry.set)),discovered=collectable.filter(entry=>entry.discovered).length;
   const progress=element('div','profile-progress');
   for(const [label,value,total] of [['Коллекция',discovered,collectable.length],['Испытания',profile.completedChallenges?.length??0,CHALLENGES.length],['Победы колод по ставкам',Object.values(profile.deckWins??{}).reduce((n,wins)=>n+highestStake(wins),0),15*8],['Наклейки джокеров',Object.values(profile.jokerWins??{}).reduce((n,wins)=>n+highestStake(wins),0),150*8]]){
    const item=element('div','profile-progress-item');item.append(element('strong','',label),element('span','',`${value} / ${total}`));const meter=element('progress');meter.max=total||1;meter.value=value;meter.setAttribute('aria-label',label);item.append(meter);progress.append(item);
   }body.append(progress);
   body.append(element('p','profile-note','Партии с заданным зерном не открывают контент и не засчитывают победы. Пройденные испытания учитываются отдельно от побед колод.'));
  }else if(key==='stats'){
   const c=profile.career??{},scores=profile.highScores??{};
   const stats=[['Победы',c.c_wins],['Поражения',c.c_losses],['Сыграно раундов',c.c_rounds],['Сыграно рук',c.c_hands_played],['Сыграно карт',c.c_cards_played],['Сброшено карт',c.c_cards_discarded],['Заработано денег',c.c_dollars_earned],['Потрачено в магазине',c.c_shop_dollars_spent],['Обновлений магазина',c.c_shop_rerolls],['Лучшая рука',scores.hand],['Максимум денег',scores.mostMoney],['Самое дальнее анте',scores.furthestAnte],['Самый дальний раунд',scores.furthestRound],['Лучшая серия побед',scores.winStreak],['Текущая серия побед',scores.currentStreak]].map(([label,value])=>[label,number(value)]);
   const mostPlayed=Object.entries(profile.usage?.hands??{}).sort((a,b)=>b[1]-a[1])[0];stats.push(['Любимая комбинация',mostPlayed?`${HAND_NAMES[mostPlayed[0]]??mostPlayed[0]} (${number(mostPlayed[1])})`:'Нет']);
   showRows(stats,0,'profile_stats');
  }else{
   const entries=collectionEntries(profile),lookup=new Map(entries.map(entry=>[entry.id,entry]));
   const categories=element('nav','profile-usage-tabs');categories.setAttribute('aria-label','Использование карт');body.append(categories);
   const content=element('section','profile-usage');body.append(content);
   for(const [field,label] of [['jokers','Джокеры'],['consumables','Расходники'],['vouchers','Билеты'],['decks','Колоды'],['hands','Комбинации']]){
    const tab=button('profile_usage_'+field,label,()=>showCategory(field));tab.dataset.tab=field;categories.append(tab);
   }
   function showCategory(field){
    selectTab(categories,field);
    const rows=Object.entries(profile.usage?.[field]??{}).filter(([id])=>lookup.get(id)?.discovered||field==='decks'||field==='hands').sort((a,b)=>Number(b[1]?.count??b[1])-Number(a[1]?.count??a[1])).map(([id,value])=>{const entry=lookup.get(id);return [entry?localized(entry).name:DECKS[id]?.name??HAND_NAMES[id]??'Карта',number(value?.count??value)];});
    showRows(rows,0,'profile_usage',content);
   }
   showCategory('jokers');
  }
  function showRows(rows,page,id,target=body){
   target.replaceChildren();
   // Very large saved scores remain readable through additional value pages.
   const expanded=rows.flatMap(([label,value])=>textPages(value,36).map((part,index,parts)=>[label+(parts.length>1?` (${index+1}/${parts.length})`:''),part]));
   const pages=Math.max(1,Math.ceil(expanded.length/profilePageSize)),table=element('table','profile-stat-table');
   for(const [label,value] of expanded.slice(page*profilePageSize,(page+1)*profilePageSize))row(table,label,value);
   if(expanded.length)target.append(table);else target.append(element('p','profile-empty','Пока нет использованных карт.'));
   target.append(pager(id,page,pages,next=>showRows(rows,next,id,target)));
  }
 }
 draw('progress');return root;
}

/** Button categories and pages; preserve locked hints and hide undiscovered effects. */
export function renderCollectionView(profile,seed){
 const root=element('section','collection-view');root.id='collection_view';root.setAttribute('aria-label','Коллекция');
 const entries=collectionEntries(profile,seed),categories=element('nav','collection-categories');categories.setAttribute('aria-label','Раздел коллекции');
 const selector=element('select');selector.id='collection_set';selector.hidden=true;selector.setAttribute('aria-label','Раздел коллекции');selector.tabIndex=-1;
 for(const category of sets){const option=element('option','',setNames[category]);option.value=category;selector.append(option);const choice=button('collection_category_'+category,setNames[category],()=>changeSet(category));choice.dataset.tab=category;categories.append(choice);}root.append(selector,categories);
 const content=element('div','collection-content'),nav=element('div','collection-controls'),heading=element('strong'),tally=element('strong');tally.id='collection_tally';nav.append(heading,tally);content.append(nav);root.append(content);
 const grid=element('div','collection-grid');grid.setAttribute('aria-label','Карты раздела');content.append(grid);
 const paging=element('nav','collection-paging');paging.setAttribute('aria-label','Страницы коллекции');const counter=element('span');counter.id='collection_page';
 let set='Joker',page=0;
 const previous=button('collection_prev','‹',()=>{page--;draw();}),next=button('collection_next','›',()=>{page++;draw();});previous.setAttribute('aria-label','Предыдущая страница');next.setAttribute('aria-label','Следующая страница');paging.append(previous,counter,next);content.append(paging);
 const details=element('div','collection-details');details.id='collection_details';details.setAttribute('aria-live','polite');root.append(details);
 selector.onchange=()=>changeSet(selector.value);
 function changeSet(category){if(!sets.includes(category))return;set=category;selector.value=category;page=0;draw();}
 function showDetails(name,text){
  const pages=textPages(text),title=element('strong','',name);
  function show(index){details.replaceChildren(title,element('p','',pages[index]));if(pages.length>1)details.append(pager('collection_detail',index,pages.length,show));}
  show(0);
 }
 function draw(){
  const rows=entries.filter(entry=>entry.set===set).sort((a,b)=>(a.order??0)-(b.order??0)),pages=Math.max(1,Math.ceil(rows.length/pageSize));page=Math.max(0,Math.min(page,pages-1));
  selectTab(categories,set);heading.textContent=setNames[set];tally.textContent=`${rows.filter(entry=>entry.discovered).length}/${rows.length}`;counter.textContent=`${page+1} / ${pages}`;previous.disabled=page===0;next.disabled=page===pages-1;grid.replaceChildren();showDetails('Подробности','Нажмите на карту для подробностей.');
  for(const entry of rows.slice(page*pageSize,(page+1)*pageSize)){
   const known=entry.discovered,display=known||!entry.unlocked?localized(entry):null,name=display?display.name:'Не обнаружено';
   const card=button('collection_'+entry.id,'',()=>{
    let text=!entry.unlocked?(entry.condition||'Выполните условие открытия.'):known?display.description:'Найдите эту карту в обычной партии.';
    if(known&&entry.sticker)text+=` Победа: ${STAKES[entry.sticker-1]?.name??entry.sticker}.`;
    showDetails(name,text||'Описание отсутствует.');
    for(const item of grid.children)item.setAttribute('aria-pressed',String(item===card));
   });
   card.className='collection-card';card.dataset.entryId=entry.id;card.dataset.discovered=String(known);card.dataset.unlocked=String(entry.unlocked);card.setAttribute('aria-label',name+(!entry.unlocked?' — закрыто':''));card.setAttribute('aria-pressed','false');
   card.append(element('span','collection-symbol',known?'♠':entry.unlocked?'?':'◆'),element('strong','',name));
   if(known&&entry.sticker){const sticker=element('span','collection-sticker',String(entry.sticker));sticker.style.setProperty('--stake-color',STAKES[entry.sticker-1]?.color??'#d7c49a');sticker.setAttribute('aria-label','Победа: '+(STAKES[entry.sticker-1]?.name??entry.sticker));card.append(sticker);}grid.append(card);
  }
 }
 draw();return root;
}
