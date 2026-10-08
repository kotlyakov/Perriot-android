let overlay;
function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}

/** Selection display only. onSelect starts the supported Small blind through the caller. */
export function renderBlindSelect(state,busy,onSelect){
 if(state.phase!=='blind_selection'){removeBlindSelect();return;}
 if(overlay){
  const select=overlay.querySelector('#select_small');select.disabled=Boolean(busy);select.onclick=()=>{if(!select.disabled)onSelect?.();};
  overlay.querySelector('#select_small_target').textContent=String(state.round.target);return overlay;
 }
 overlay=node('section','blind-selection');overlay.id='blind_selection';overlay.setAttribute('aria-label','Выбор блайнда');
 const prompt=node('h2','blind-selection-prompt','Выберите ваш\nследующий блайнд');overlay.append(prompt);
 for(const [id,name] of [['small','Малый блайнд'],['big','Большой блайнд'],['boss','Босс']]){
  const card=node('section','blind-choice blind-choice-'+id);card.setAttribute('aria-label',name);
  const select=node('button','blind-choice-select orange',id==='small'?'Выбрать':'В разработке');select.type='button';select.id='select_'+id;select.disabled=id!=='small'||Boolean(busy);select.onclick=()=>{if(id==='small'&&!select.disabled)onSelect?.();};card.append(select);
  card.append(node('h3','blind-choice-name',name));
  if(id==='small'){
   const token=node('div','blind-choice-token','МАЛЫЙ\nБЛАЙНД');token.setAttribute('aria-hidden','true');card.append(token);
   const target=node('div','blind-choice-target');target.append(node('span','','Минимум очков'));
   const score=node('strong','scarlet',String(state.round.target));score.id='select_small_target';target.append(score);
   const reward=node('span');reward.append(node('span','','Награда: '),node('strong','gold','$$$'));target.append(reward);card.append(target);
   // Skip rewards depend on unimplemented tags; show their original control disabled.
   const lower=node('div','blind-choice-skip');lower.append(node('span','','ИЛИ'));const skip=node('button','red','Пропустить блайнд');skip.type='button';skip.disabled=true;skip.setAttribute('aria-label','Пропустить блайнд — награды за пропуск ещё не реализованы');lower.append(skip);card.append(lower);
  }else{
   const status=node('p','blind-choice-unavailable','В разработке');card.append(status);
  }
  overlay.append(card);
 }
 document.getElementById('stage').append(overlay);
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)overlay.animate([{transform:'translateY(688px)'},{transform:'translateY(0)'}],{duration:360,easing:'cubic-bezier(.16,1,.3,1)'});
 return overlay;
}
export function removeBlindSelect(){overlay?.remove();overlay=undefined;}
