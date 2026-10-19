import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {NATIVE_JOKERS,supportsJoker} from '../../src/content/jokers.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {canUseConsumable} from '../../src/core/consumables.js';

test('item7b enables every one of the150 native Joker identities',()=>{
 const keys=catalogue.centres.filter(c=>c.set==='Joker').map(c=>c.key);
 assert.equal(keys.length,150);assert.equal(NATIVE_JOKERS.length,150);
 assert.deepEqual(new Set(NATIVE_JOKERS),new Set(keys));
 for(const entityId of keys)assert.equal(supportsJoker({id:'offer',entityId,edition:'base'}),true,entityId);
});
test('Judgement consumes once and creates from the complete Joker pool',()=>{
 const s=createRun('JUDGEMENT7B',{runId:'jud7b',money:20n,referenceRng:true,referenceShop:true});
 const card={id:'jud',entityId:'c_judgement',originalKey:'c_judgement',set:'Tarot',edition:'base',cost:3n,sellCost:1n};s.consumables=[card];
 assert.equal(canUseConsumable(s,card).available,true);
 const before=structuredClone(s),result=dispatch(s,{type:'USE_CONSUMABLE',cardId:card.id,expectedRevision:s.revision});
 assert.equal(result.error,null);assert.deepEqual(s,before);assert.equal(result.state.jokers.length,1);assert.equal(result.state.consumables.length,0);
 assert.ok(NATIVE_JOKERS.includes(result.state.jokers[0].entityId));
 const again=dispatch(result.state,{type:'USE_CONSUMABLE',cardId:card.id,expectedRevision:result.state.revision});assert.ok(again.error);assert.equal(again.state,result.state);
});

test('Judgement retains another active consumable across save and deterministic continuation',()=>{
 const s=createRun('JUDGEMENT7B',{runId:'jud-save',money:20n,referenceRng:true,referenceShop:true});
 s.consumables=['c_judgement','c_empress'].map((entityId,i)=>({id:'tarot'+i,entityId,originalKey:entityId,set:'Tarot',edition:'base',cost:3n,sellCost:1n}));
 s.apkShop.context=currentApkShopContext(s);
 const used=dispatch(s,{type:'USE_CONSUMABLE',cardId:'tarot0',expectedRevision:s.revision});assert.equal(used.error,null);
 assert.ok(used.state.apkShop.context.activeCentreIds.includes('c_empress'));
 const restored=deserializeState(serializeState(used.state));assert.deepEqual(restored,used.state);
 const action={type:'START_BLIND',expectedRevision:restored.revision};
 assert.deepEqual(dispatch(restored,action),dispatch(used.state,action));
 const payload=JSON.parse(serializeState(restored));payload.state.apkShop.context.activeCentreIds.push('unknown-centre');
 assert.throws(()=>deserializeState(JSON.stringify(payload)),/Invalid save data/);
});
