import {nextApkRandom} from './apk-rng.js';
import {isCardFace} from './card-faces.js';

// Shared by ordinary refill and raw hand-size grants; no dependency on hand-size.
export function applyBossDrawVisibility(state,ids,action){
 const boss=state.bossState;if(!boss||boss.disabled||!['bl_house','bl_wheel','bl_fish','bl_mark'].includes(boss.id))return;
 boss.hiddenCardIds??=[];
 if(boss.id==='bl_mark'&&!boss.hiddenFaceRanks)boss.hiddenFaceRanks=Object.fromEntries(boss.hiddenCardIds.map(id=>{
  const rank=state.cards[id].rank;return[id,rank>=11&&rank<=13?rank:Number(id.match(/_(\d+)$/)?.[1])];
 }));
 for(const id of ids){
  const card=state.cards[id];
  let hidden=boss.id==='bl_house'&&(state.round.handsPlayed??0)===0&&(state.round.discardsUsed??0)===0||boss.id==='bl_fish'&&action==='PLAY_HAND'||boss.id==='bl_mark'&&isCardFace(card,state.jokers,{debuffed:false});
  if(boss.id==='bl_wheel'){
   const draw=nextApkRandom(state.rng.apk,'wheel');state.rng.apk=draw.rng;
   const probability=2**state.jokers.filter(j=>j.entityId==='j_oops'&&!j.debuffed).length;
   hidden=draw.value<probability/7;
  }
  if(hidden){
   boss.hiddenCardIds.push(id);
   if(boss.id==='bl_mark'){
    boss.hiddenFaceRanks[id]=card.rank;
    if(state.jokers.some(j=>j.entityId==='j_pareidolia'&&!j.debuffed)){boss.pareidoliaHiddenCardIds??=[];boss.pareidoliaHiddenCardIds.push(id);}
   }
  }
 }
}
