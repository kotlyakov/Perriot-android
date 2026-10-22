import test from 'node:test';
import assert from 'node:assert/strict';
import {firstLegendary,chooseProfileSeed} from '../../src/core/profile-seed.js';
const all=['j_caino','j_triboulet','j_yorick','j_chicot','j_perkeo'];
test('Gold automatic seeds avoid already gold-winning legendary, fixed seeds stay fixed',()=>{
 const won=firstLegendary('FIRST');let calls=0;
 const next=all.find(id=>id!==won);let other;
 for(let i=0;i<100&&!other;i++)if(firstLegendary('SEED'+i)===next)other='SEED'+i;
 assert.ok(other);assert.equal(chooseProfileSeed({stake:8,wonIds:[won],randomSeed:()=>++calls===1?'FIRST':other}),other);assert.equal(calls,2);
 assert.equal(chooseProfileSeed({seed:'FIRST',stake:8,wonIds:[won],randomSeed:()=>{throw Error('not called');}}),'FIRST');
 assert.equal(chooseProfileSeed({stake:7,wonIds:[won],randomSeed:()=> 'FIRST'}),'FIRST');
 assert.equal(chooseProfileSeed({stake:8,wonIds:all,randomSeed:()=> 'FIRST'}),'FIRST');
 assert.equal(chooseProfileSeed({stake:8,wonIds:[],randomSeed:()=> 'FIRST'}),'FIRST');
});

test('profile unlocks enter generation and survive authenticated effect replay',async()=>{
 const {createRun,dispatch}=await import('../../src/core/run.js');const {serializeState,deserializeState}=await import('../../src/persistence/save.js');
 let s=createRun('PROFILE',{runId:'pool',money:4n,referenceShop:true,referenceRng:true,unlockedCentreIds:['j_blueprint']});
 assert.ok(s.apkShop.context.unlockedCentreIds.includes('j_blueprint'));
 const next=dispatch(s,{type:'START_BLIND',expectedRevision:0,profileUnlockedCentreIds:['j_brainstorm']});assert.ifError(next.error);s=next.state;
 assert.ok(s.apkShop.context.unlockedCentreIds.includes('j_brainstorm'));
 assert.deepEqual(deserializeState(serializeState(s)),s);
 const bad=dispatch(s,{type:'DISCARD',expectedRevision:s.revision,cardIds:[],profileUnlockedCentreIds:['untrusted']});assert.ok(bad.error);assert.deepEqual(bad.state,s);
});

test('first Legendary prediction agrees with 200 private-original-function fixtures',async()=>{
 const {readFile}=await import('node:fs/promises');const fixtures=JSON.parse(await readFile(new URL('../../scripts/reference-rng/profile-legendary-fixtures.json',import.meta.url),'utf8'));
 assert.equal(fixtures.length,200);for(const row of fixtures)assert.equal(firstLegendary(row.seed),row.joker,row.seed);
});
