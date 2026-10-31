import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
test('the same validated save bytes are reused without repeating schema parsing',()=>{
 const s=createRun('CACHEBYTES',{runId:'CACHEBYTES',money:4n}),text=serializeState(s);
 const parse=JSON.parse;let parses=0;JSON.parse=(...args)=>{parses++;return parse(...args);};
 try{for(let i=0;i<8;i++)assert.deepEqual(deserializeState(text),s);}finally{JSON.parse=parse;}
 assert.equal(parses,0,'Repeated exact bytes should use the previously authenticated state');
});
test('cached validated saves are isolated and changed bytes still undergo validation',()=>{
 const state=dispatch(createRun('CACHEVALID',{runId:'CACHEVALID',money:4n}),{type:'START_BLIND',expectedRevision:0}).state,text=serializeState(state);
 const loaded=deserializeState(text);loaded.money=9999n;loaded.cards[loaded.hand[0]].suit='forged';assert.deepEqual(deserializeState(text),state);
 const raw=JSON.parse(text);raw.state.cards[Object.keys(raw.state.cards)[0]].suit='forged';assert.throws(()=>deserializeState(JSON.stringify(raw)));
 assert.throws(()=>deserializeState(text+'x'));assert.deepEqual(deserializeState(text),state);
});
