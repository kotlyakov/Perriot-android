import {describeShopItem,displayPlayingCard} from '../content/shop-display.js';
import {EDITION_DESCRIPTIONS,ENHANCEMENT_DESCRIPTIONS,SEAL_DESCRIPTIONS} from '../content/card-modifier-display.js';
import {originalJokerKey} from '../content/jokers.js';
import {ITEM7_JOKER_DEFAULTS} from '../core/joker-item7-lifecycle.js';
import {appendTooltipContents} from './tooltip-text.js';

const materialNames={foil:'Фольговый',holographic:'Голографический',polychrome:'Полихромный',negative:'Негативный',steel:'Стальной',glass:'Стеклянный',gold:'Золотой',stone:'Каменный'};
const withoutName=text=>text.slice(text.indexOf(':')+1).trim();
const number=value=>String(value).replace('.',',');
export function cardDescription(card={},options={}){
 const {owned=false,collection=false,concealed=false,saleAllowed=true,state}=options;
 const details=concealed?{}:describeShopItem({...card,edition:'base'}),playing=concealed?null:displayPlayingCard(card);
 const result={title:options.title??details.name??'Карта',baseChips:null,descriptions:[],accumulated:[],modifiers:[],seal:null,statuses:[],sale:null};
 if(concealed){result.descriptions=[options.description??'Описание неизвестно.'];return result;}
 if(playing){
  if(playing.enhancement!=='stone')result.baseChips=playing.rank===14?11:Math.min(playing.rank,10);
  if(playing.permaBonus)result.descriptions.push(`Постоянный бонус: +${playing.permaBonus} фишек.`);
 }else result.descriptions=[options.description??details.description].filter(Boolean);
 const modifier=(id,description)=>({id,title:materialNames[id]??description.split(':')[0],description:withoutName(description)});
 if(ENHANCEMENT_DESCRIPTIONS[card.enhancement])result.modifiers.push(modifier(card.enhancement,ENHANCEMENT_DESCRIPTIONS[card.enhancement]));
 if(EDITION_DESCRIPTIONS[card.edition])result.modifiers.push(modifier(card.edition,EDITION_DESCRIPTIONS[card.edition]));
 if(card.edition==='negative')result.modifiers.push({id:'negative',title:'Негативный',description:card.set==='Joker'||originalJokerKey(card.entityId)?.startsWith('j_')?'+1 место джокера.':'+1 место расходной карты.'});
 if(SEAL_DESCRIPTIONS[card.seal])result.seal={id:card.seal,title:SEAL_DESCRIPTIONS[card.seal].split(':')[0],description:withoutName(SEAL_DESCRIPTIONS[card.seal])};
 if(card.rental)result.statuses.push({id:'rental',title:'Аренда',detail:'−$3 за раунд'});
 if(card.eternal)result.statuses.push({id:'eternal',title:'Вечная',detail:'Нельзя продать или уничтожить'});
 else if(card.perishable)result.statuses.push({id:'perishable',title:'Временная',detail:card.perishRounds===0?'Срок истёк':`Ещё ${card.perishRounds??5} раундов`});
 const debuffed=options.debuffed??(card.debuffed||card.perishable&&card.perishRounds===0);
 if(debuffed)result.descriptions.unshift('Ослаблена: способности отключены.');
 if(owned&&!collection){
  const defaults=ITEM7_JOKER_DEFAULTS[originalJokerKey(card.entityId)]??{};
  for(const [field,kind,sign] of [['chips','chips','+'],['mult','mult','+'],['xMult','mult','×'],['cainoXMult','mult','×']]){
   const value=originalJokerKey(card.entityId)==='j_throwback'&&state?1+(state.runStats?.skips??0)/4:card[field]??defaults[field];
   if((Object.hasOwn(defaults,field)||Object.hasOwn(card,field))&&value!==undefined)result.accumulated.push({value:sign+number(value),kind});
  }
  if(!card.eternal&&saleAllowed&&card.sellCost!==undefined)result.sale='$'+String(card.sellCost);
 }
 return result;
}

export function appendCardDescription(container,card,options={}){
 const d=cardDescription(card,options),doc=container.ownerDocument;
 const el=(tag,cls,text)=>{const n=doc.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const text=(parent,value)=>{const tmp=el('div','');appendTooltipContents(tmp,'',[value]);parent.append(...Array.from(tmp.children).slice(1));};
 container.replaceChildren();container.classList.add('approved-tooltip');
 const main=el('div','tooltip-main'),heading=el('div','tooltip-heading');heading.append(el('strong','tooltip-title',d.title));
 if(d.baseChips!==null)heading.append(el('strong','tooltip-base tooltip-chips','+'+d.baseChips));main.append(heading);
 const body=el('div','tooltip-body');
 for(const amount of d.accumulated){const row=el('div','tooltip-accumulated');text(row,amount.value+(amount.kind==='chips'?' фишек':' к множителю'));body.append(row);}
 for(const description of d.descriptions)text(body,description);if(body.childNodes.length)main.append(body);
 if(d.seal){const row=el('div','tooltip-seal-row'),wax=el('span','tooltip-wax tooltip-wax-'+d.seal.id);wax.setAttribute('role','img');wax.setAttribute('aria-label',d.seal.title);wax.append(el('span','tooltip-wax-symbol',({red:'↻',blue:'✦',gold:'$',purple:'✧'})[d.seal.id]));const content=el('div','tooltip-seal-description');content.append(el('strong','',d.seal.title));text(content,d.seal.description);row.append(wax,content);main.append(row);}
 if(d.statuses.length){const row=el('div','tooltip-statuses');for(const status of d.statuses){const badge=el('div','tooltip-status tooltip-status-'+status.id),icon=el('span','tooltip-status-icon',({rental:'$',eternal:'∞',perishable:'⌛'})[status.id]);icon.setAttribute('aria-hidden','true');const info=el('span','tooltip-status-info');info.append(el('strong','tooltip-status-name',status.title),el('span','tooltip-status-detail',status.detail));badge.append(icon,info);row.append(badge);}main.append(row);}
 if(d.sale!==null){const foot=el('div','tooltip-footer'),price=el('span','tooltip-sale');price.append(el('span','','ПРОДАЖА'),el('strong','',d.sale));foot.append(price);main.append(foot);}
 container.append(main);
 if(d.modifiers.length){const side=el('div','tooltip-modifiers');for(const m of d.modifiers){const box=el('section','tooltip-modifier tooltip-material-'+m.id);box.append(el('strong','tooltip-material-title',m.title));text(box,m.description);side.append(box);}container.append(side);}
 return container;
}
