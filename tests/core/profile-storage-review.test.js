import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfile,updateProfile} from '../../src/core/profile.js';
import {createRun,dispatch} from '../../src/core/run.js';
const run=id=>createRun('PROFILE-REVIEW',{runId:id,money:4n,referenceRng:true,referenceShop:true});
test('profile idempotence is preserved for valid legacy run IDs that name prototype properties',()=>{
 for(const id of ['__proto__','constructor','toString']){
  const before=run(id),result=dispatch(before,{type:'START_BLIND',expectedRevision:0});assert.ifError(result.error);
  let p=updateProfile(createProfile(),null,before,[],{seeded:false});p=updateProfile(p,before,result.state,result.events);assert.equal(p.career.c_rounds,1);
  const again=updateProfile(p,before,result.state,result.events);assert.equal(again.career.c_rounds,1);assert.ok(Object.hasOwn(again.runs,id));
 }
});
test('abandoning unfinished ordinary run resets current win streak without counting a loss',()=>{
 const previous=run('unfinished'),next=run('replacement');let p=createProfile();p.highScores.currentStreak=2;p.highScores.winStreak=2;
 p=updateProfile(p,null,previous,[],{seeded:false});p=updateProfile(p,previous,next,[],{seeded:true,abandonedRunId:previous.runId});
 assert.equal(p.highScores.currentStreak,0);assert.equal(p.highScores.winStreak,2);assert.equal(p.career.c_losses,0);
});
test('abandoning a seeded or already victorious run preserves current win streak',()=>{
 for(const [seeded,won] of [[true,false],[false,true]]){
  const previous=run('previous'),next=run('replacement');let p=createProfile();p=updateProfile(p,null,previous,[],{seeded});p.runs.previous.won=won;p.highScores.currentStreak=2;p.highScores.winStreak=2;
  p=updateProfile(p,previous,next,[],{seeded:false,abandonedRunId:previous.runId});assert.equal(p.highScores.currentStreak,2);
 }
});
