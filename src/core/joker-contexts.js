// Native calculate_joker forwards context, not inventory modifiers or editions.
export function jokerEffectContext(jokers,index){
 const source=jokers[index];
 if(!source)return null;
 let target=source,copied=false,depth=0,targetIndex=index;
 while(target){
  if(target.debuffed)return null;
  const key=target.entityId;
  if(key!=='j_blueprint'&&key!=='j_brainstorm')return {source,target,copied};
  const nextIndex=key==='j_blueprint'?targetIndex+1:0;
  const next=jokers[nextIndex];
  if(!next||next===target)return null;
  depth++;
  if(depth>jokers.length+1)return null;
  copied=true;target=next;targetIndex=nextIndex;
 }
 return null;
}
