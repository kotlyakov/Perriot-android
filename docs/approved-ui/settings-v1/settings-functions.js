const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const button=(id,label,action,cls='')=>{const b=el('button',cls,label);b.id=id;b.onclick=action;return b;};
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
