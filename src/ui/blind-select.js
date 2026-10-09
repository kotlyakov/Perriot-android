import {getSkipAvailability} from '../core/skip-blind.js';
import {APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {blindBase} from '../core/blind-progression.js';
import {APK_TAGS_BY_ID} from '../content/apk-tags.js';
import {APK_HAND_NAMES} from '../core/apk-shop-state.js';
import {HAND_NAMES} from './field.js';
import {appendTooltipContents} from './tooltip-text.js';
let overlay,controller;
const russianHands=Object.fromEntries(Object.entries(APK_HAND_NAMES).map(([id,name])=>[name,HAND_NAMES[id]]));
function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
/** Ordinary unskipped Small/Big selection. Boss and skip tags remain unavailable. */
export function renderBlindSelect(state,busy,onSelect,onSkip){
 if(state.phase!=='blind_selection'){removeBlindSelect();return;}
 if(overlay&&(overlay.dataset.blindId!==state.round.blindId || overlay.dataset.selection!==JSON.stringify(state.apkBlinds??null)))removeBlindSelect();
 if(overlay){for(const id of ['small','big']){const button=overlay.querySelector('#skip_'+id);if(button){const skip=getSkipAvailability(state,id);button.disabled=busy||!skip.available;button.title=skip.reason??'Получить награду и перейти к следующему блайнду';button.onclick=()=>{if(!button.disabled)onSkip?.(id);};}}const select=overlay.querySelector('#select_'+state.round.blindId);select.disabled=Boolean(busy);select.onclick=()=>{if(!select.disabled)onSelect?.();};overlay.querySelector('#select_'+state.round.blindId+'_target').textContent=String(state.round.target);return overlay;}
 overlay=node('section','blind-selection');overlay.id='blind_selection';overlay.dataset.blindId=state.round.blindId;overlay.dataset.selection=JSON.stringify(state.apkBlinds??null);
 controller=new AbortController();
 const closeTip=()=>{overlay?.querySelector('#blind_tag_tooltip')?.remove();overlay?.querySelectorAll('.blind-tag').forEach(b=>b.setAttribute('aria-expanded','false'));};
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTip();},{signal:controller.signal});
 document.addEventListener('click',e=>{if(!e.target.closest('.blind-tag,#blind_tag_tooltip'))closeTip();},{signal:controller.signal});overlay.setAttribute('aria-label','Выбор блайнда');
 overlay.append(node('h2','blind-selection-prompt','Выберите ваш\nследующий блайнд'));
 for(const [id,name] of [['small','Малый блайнд'],['big','Большой блайнд'],['boss','Босс']]){
  const current=id===state.round.blindId,passed=id!=='boss'&&(state.round.blindId==='boss'||id==='small'&&state.round.blindId==='big');
  const card=node('section','blind-choice blind-choice-'+id);card.setAttribute('aria-label',name);
  const select=node('button','blind-choice-select orange',current?'Выбрать':passed?'Пройден':'В разработке');select.type='button';select.id='select_'+id;select.disabled=!current||Boolean(busy);select.onclick=()=>{if(current&&!select.disabled)onSelect?.();};card.append(select,node('h3','blind-choice-name',name));
  if(current || state.apkBlinds && !passed){
   const boss=id==='boss'?APK_BLINDS_BY_ID[state.apkBlinds.bossId]:null;
   const token=node('div','blind-choice-token',boss?boss.name:id==='big'?'БОЛЬШОЙ\nБЛАЙНД':'МАЛЫЙ\nБЛАЙНД');token.setAttribute('aria-hidden','true');card.append(token);
   const base=blindBase(state.round.ante),target=node('div','blind-choice-target');target.append(node('span','','Минимум очков'));const score=node('strong','scarlet',String(current?state.round.target:id==='big'?base*3n/2n:base*BigInt(boss.mult)));score.id='select_'+id+'_target';target.append(score);const reward=node('span');reward.append(node('span','','Награда: '),node('strong','gold',id==='big'?'$$$$':boss?'$'.repeat(boss.dollars):'$$$'));target.append(reward);card.append(target);
   if(boss)card.append(node('p','blind-boss-description',boss.description));
   else{
    const lower=node('div','blind-choice-skip');lower.append(node('span','','ИЛИ'));
    const row=node('div','blind-skip-row'),tag=APK_TAGS_BY_ID[state.apkBlinds?.tags[id]];
    if(tag){const stamp=node('button','blind-tag',String(tag.order).padStart(2,'0'));stamp.type='button';stamp.id='tag_'+id;stamp.setAttribute('aria-label',tag.name+' — описание награды');stamp.setAttribute('aria-expanded','false');
     stamp.onclick=()=>{const open=stamp.getAttribute('aria-expanded')==='true';closeTip();if(open)return;stamp.setAttribute('aria-expanded','true');
      const tip=node('aside','blind-tag-tooltip');tip.id='blind_tag_tooltip';tip.setAttribute('role','status');
      appendTooltipContents(tip,tag.name,[tag.description+(tag.id==='tag_orbital'?' Комбинация: '+russianHands[state.apkBlinds.orbitalHands[id]]+'.':'')]);overlay.append(tip);};row.append(stamp);}
    const skip=node('button','red','Пропустить блайнд');skip.id='skip_'+id;skip.type='button';const availability=getSkipAvailability(state,id);skip.disabled=busy||!availability.available;skip.title=availability.reason??'Получить награду и перейти к следующему блайнду';skip.setAttribute('aria-label','Пропустить блайнд'+(availability.reason?' — '+availability.reason:''));skip.onclick=()=>{if(!skip.disabled)onSkip?.(id);};row.append(skip);lower.append(row);card.append(lower);
   }
  }else card.append(node('p','blind-choice-unavailable',passed?'Пройден':'В разработке'));
  overlay.append(card);
 }
 document.getElementById('stage').append(overlay);
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)overlay.animate([{transform:'translateY(688px)'},{transform:'translateY(0)'}],{duration:360,easing:'cubic-bezier(.16,1,.3,1)'});
 return overlay;
}
export function removeBlindSelect(){controller?.abort();controller=undefined;overlay?.remove();overlay=undefined;}


