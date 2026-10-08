let overlay;
function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
/** Ordinary unskipped Small/Big selection. Boss and skip tags remain unavailable. */
export function renderBlindSelect(state,busy,onSelect){
 if(state.phase!=='blind_selection'){removeBlindSelect();return;}
 if(overlay&&overlay.dataset.blindId!==state.round.blindId)removeBlindSelect();
 if(overlay){const select=overlay.querySelector('#select_'+state.round.blindId);select.disabled=Boolean(busy);select.onclick=()=>{if(!select.disabled)onSelect?.();};overlay.querySelector('#select_'+state.round.blindId+'_target').textContent=String(state.round.target);return overlay;}
 overlay=node('section','blind-selection');overlay.id='blind_selection';overlay.dataset.blindId=state.round.blindId;overlay.setAttribute('aria-label','Выбор блайнда');
 overlay.append(node('h2','blind-selection-prompt','Выберите ваш\nследующий блайнд'));
 for(const [id,name] of [['small','Малый блайнд'],['big','Большой блайнд'],['boss','Босс']]){
  const current=id===state.round.blindId,passed=id==='small'&&state.round.blindId==='big';
  const card=node('section','blind-choice blind-choice-'+id);card.setAttribute('aria-label',name);
  const select=node('button','blind-choice-select orange',current?'Выбрать':passed?'Пройден':'В разработке');select.type='button';select.id='select_'+id;select.disabled=!current||Boolean(busy);select.onclick=()=>{if(current&&!select.disabled)onSelect?.();};card.append(select,node('h3','blind-choice-name',name));
  if(current){
   const token=node('div','blind-choice-token',id==='big'?'БОЛЬШОЙ\nБЛАЙНД':'МАЛЫЙ\nБЛАЙНД');token.setAttribute('aria-hidden','true');card.append(token);
   const target=node('div','blind-choice-target');target.append(node('span','','Минимум очков'));const score=node('strong','scarlet',String(state.round.target));score.id='select_'+id+'_target';target.append(score);const reward=node('span');reward.append(node('span','','Награда: '),node('strong','gold',id==='big'?'$$$$':'$$$'));target.append(reward);card.append(target);
   const lower=node('div','blind-choice-skip');lower.append(node('span','','ИЛИ'));const skip=node('button','red','Пропустить блайнд');skip.type='button';skip.disabled=true;skip.setAttribute('aria-label','Пропустить блайнд — награды за пропуск ещё не реализованы');lower.append(skip);card.append(lower);
  }else card.append(node('p','blind-choice-unavailable',passed?'Пройден':'В разработке'));
  overlay.append(card);
 }
 document.getElementById('stage').append(overlay);
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)overlay.animate([{transform:'translateY(688px)'},{transform:'translateY(0)'}],{duration:360,easing:'cubic-bezier(.16,1,.3,1)'});
 return overlay;
}
export function removeBlindSelect(){overlay?.remove();overlay=undefined;}
