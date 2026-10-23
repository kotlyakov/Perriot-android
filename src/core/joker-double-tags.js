// Native Tag:apply_to_run(tag_add): every untriggered Double copies the next
// non-Double tag once; copied tags cannot retrigger consumed Double tags.
export function addItem7DoubleTag(state,events=[]){
 const before=state.pendingDoubleTags??0;
 if(!Number.isSafeInteger(before)||before<0||before>=10000)throw new TypeError('Invalid Double tag queue');
 state.pendingDoubleTags=before+1;events.push({type:'tag_added',tagId:'tag_double',pendingDoubleTags:state.pendingDoubleTags});
}
export function item7TagRepetitions(state,tagId){
 const count=state.pendingDoubleTags??0;
 if(!Number.isSafeInteger(count)||count<0||count>10000)throw new TypeError('Invalid Double tag queue');
 return tagId==='tag_double'?0:1+count;
}
export function consumeItem7DoubleTags(state,tagId,events=[]){
 if(tagId==='tag_double'){addItem7DoubleTag(state,events);return 0;}
 const repeats=item7TagRepetitions(state,tagId);
 if(repeats>1){state.pendingDoubleTags=0;events.push({type:'double_tags_consumed',tagId,count:repeats-1});}
 return repeats;
}
