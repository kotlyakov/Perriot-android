import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const run=()=>createRun('history-check',{runId:'history-check',money:4n,referenceRng:true,referenceShop:true});
test('exact skipped blind history persists; old saves remain without invented outcomes',()=>{
 const state=run(),result=dispatch(state,{type:'SKIP_BLIND',expectedRevision:state.revision});assert.equal(result.error,null);
 assert.deepEqual(result.state.blindHistory,[{ante:1,blindId:'small',outcome:'skipped'}]);assert.deepEqual(deserializeState(serializeState(result.state)),result.state);assert.deepEqual(state.blindHistory,[]);
 const old=run();delete old.blindHistory;assert.equal(Object.hasOwn(deserializeState(serializeState(old)),'blindHistory'),false);
 const next=dispatch(old,{type:'SKIP_BLIND',expectedRevision:0});assert.equal(next.error,null);assert.equal(Object.hasOwn(next.state,'blindHistory'),false);
});
test('invalid or duplicate blind history is rejected',()=>{
 for(const history of [[{ante:1,blindId:'boss',outcome:'skipped'}],[{ante:2,blindId:'small',outcome:'defeated'}],Array(2).fill({ante:1,blindId:'small',outcome:'skipped'})]){const state=run();state.blindHistory=history;assert.throws(()=>serializeState(state));}
});
