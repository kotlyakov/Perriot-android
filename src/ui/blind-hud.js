import {APK_BLINDS_BY_ID} from '../content/apk-blinds.js';
import {STAKES} from '../content/stakes.js';

export function blindHudDetails(state){
 const isBoss=state.round.blindId==='boss',boss=isBoss?APK_BLINDS_BY_ID[state.apkBlinds?.bossId]:null;
 return {name:isBoss?(boss?.name??'Босс'):state.round.blindId==='big'?'Большой блайнд':'Малый блайнд',
  condition:!isBoss?'':state.bossState?.disabled||state.round.bossDisabled?'Эффект босса отключён.':boss?.description??'Условие босса неизвестно.',
  stake:STAKES[(state.stake??1)-1]??STAKES[0],isBoss};
}
function fitText(element,max,min){
 element.style.fontSize=max+'px';
 for(let size=max;size>min&&(element.scrollHeight>element.clientHeight+1||element.scrollWidth>element.clientWidth+1);){size-=.5;element.style.fontSize=size+'px';}
}
export function renderBlindHud(state){
 const d=blindHudDetails(state),stage=document.getElementById('stage'),title=document.getElementById('blind_title'),condition=document.getElementById('blind_condition'),chip=document.getElementById('blind_stake');
 stage.dataset.blindKind=d.isBoss?'boss':state.round.blindId;
 title.textContent=d.name;condition.textContent=d.condition;condition.hidden=!d.isBoss;
 document.querySelector('#blind_token span').textContent=d.isBoss?d.name:state.round.blindId==='big'?'БОЛЬШОЙ\nБЛАЙНД':'МАЛЫЙ\nБЛАЙНД';
 chip.style.setProperty('--stake-color',d.stake.color);chip.setAttribute('aria-label',d.stake.name);chip.title=d.stake.name;
 document.getElementById('blind_stake_label').textContent=d.stake.name;
 const fit=()=>{
  if(!title.isConnected||title.hidden)return;
  fitText(title,28,18);if(!condition.hidden)fitText(condition,14,12);
  const token=document.querySelector('#blind_token span');token.style.whiteSpace=d.isBoss?'normal':'pre';fitText(token,16,11);
  const number=document.getElementById('target_value'),valueRow=number.parentElement;
  number.style.fontSize='31px';let size=31;
  while(size>16&&valueRow.scrollWidth>valueRow.clientWidth+1){size-=.5;number.style.fontSize=size+'px';}
 };
 fit();requestAnimationFrame(fit);document.fonts?.ready.then(fit);
}
