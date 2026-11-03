import {createRun,dispatch,replayEffectActions} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const before=createRun('PROFILE-CAP',{runId:'profile-cap',money:4n,referenceRng:true,referenceShop:true,challengeId:'omelette'});
const start=dispatch(before,{type:'START_BLIND',expectedRevision:0});if(start.error)throw Error(JSON.stringify(start.error));
const actions=[{type:'START_BLIND',expectedRevision:0}];
for(let i=1;i<10000;i++)actions.push({type:'SET_SORT',mode:i%2?'suit':'rank',expectedRevision:i});
// Execute every action using the production transition replay, then attach the
// identical journal normal dispatch would have accumulated. No state fields edited.
const state=replayEffectActions(before,actions);state.effectReplay={version:2,before,actions};
const text=serializeState(state),restored=deserializeState(text);
const result=dispatch(restored,{type:'SET_SORT',mode:'rank',expectedRevision:state.revision});
console.log(JSON.stringify({legalActionsExecuted:actions.length,serializedBytes:text.length,restoredRevision:restored.revision,expected:'sort succeeds; playable run remains playable',actual:result.error},null,2));
