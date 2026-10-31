const fields=new Set(['type','expectedRevision','mode','repeat']);
const pureSort=a=>a?.type==='SET_SORT'&&['rank','suit'].includes(a.mode)&&Number.isSafeInteger(a.expectedRevision)&&a.expectedRevision>=0&&Object.keys(a).every(k=>fields.has(k));

// A macro proves only repeated sorting: no economy, creation, RNG or profile metadata.
export function replaySortSpan(action){
 if(!action||!Object.hasOwn(action,'repeat'))return 1;
 if(!pureSort(action)||!Number.isSafeInteger(action.repeat)||action.repeat<2||!Number.isSafeInteger(action.expectedRevision+action.repeat))throw new TypeError('Invalid sort replay span');
 return action.repeat;
}
export function compactSortActions(actions){
 const result=[];
 for(const action of actions){
  const previous=result.at(-1);
  if(pureSort(previous)&&pureSort(action)&&previous.expectedRevision+replaySortSpan(previous)===action.expectedRevision){
   const repeat=replaySortSpan(previous)+replaySortSpan(action);
   if(!Number.isSafeInteger(previous.expectedRevision+repeat))throw new TypeError('Sort replay revision overflow');
   result[result.length-1]={type:'SET_SORT',expectedRevision:previous.expectedRevision,mode:action.mode,repeat};
  }else result.push(action);
 }
 return result;
}
