import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {createProfile,validateProfile,updateProfile} from '../../src/core/profile.js';
import {CHALLENGES,challengeModeUnlocked,challengeUnlocked} from '../../src/content/challenges.js';
const start=id=>createRun('challenge-save',{runId:`challenge-${id}`,challengeId:id,money:4n});
const profileState=(fields={})=>({runId:'challenge-profile',revision:0,deckId:'red',challengeId:'omelette',phase:'blind_selection',money:4n,round:{ante:1,blindId:'small',handSize:8},jokers:[],cards:{},...fields});
test('every challenge start roundtrips its native deck, inventory and settings',()=>{
 for(const {id} of CHALLENGES){const state=start(id);assert.deepEqual(deserializeState(serializeState(state)),state,id);}
});
test('challenge codec rejects unknown IDs and incompatible normal deck or stake settings',()=>{
 const state=start('omelette');const text=serializeState(state);
 for(const change of [{challengeId:'unknown'},{challengeId:null},{deckId:'blue'},{stake:2},{challengeInflation:1},{challengeLuxuryTax:1},{challengePlayedCardIds:[]},{challengeFlippedCardIds:[]}]){
  const data=JSON.parse(text);Object.assign(data.state,change);assert.throws(()=>deserializeState(JSON.stringify(data)),TypeError,JSON.stringify(change));
 }
 const normal=createRun('legacy',{runId:'legacy',money:4n});assert.deepEqual(deserializeState(serializeState(normal)),normal);
});
test('profile persists strict completed challenge IDs while accepting older profiles',()=>{
 const p=createProfile();assert.deepEqual(p.completedChallenges,[]);p.completedChallenges=['omelette'];assert.deepEqual(validateProfile(JSON.parse(JSON.stringify(p))).completedChallenges,['omelette']);
 for(const values of [['unknown'],['omelette','omelette'],{},[null]])assert.throws(()=>validateProfile({...p,completedChallenges:values}),TypeError);
 const old={...p};delete old.completedChallenges;assert.equal(validateProfile(old),old);
});
test('only successful Ante 8 boss completion records a challenge once and preserves native exclusions',()=>{
 const initial=createProfile(),before=profileState();let p=updateProfile(initial,null,before);
 const won=profileState({revision:1,phase:'round_won',winPending:true,won:true,round:{ante:8,blindId:'boss'},jokers:[{entityId:'j_caino'}]});
 p=updateProfile(p,before,won,[{type:'round_won'}]);assert.deepEqual(p.completedChallenges,['omelette']);assert.equal(p.runs[won.runId].won,true);
 assert.deepEqual(p.deckWins,{});assert.deepEqual(p.jokerWins,{});assert.equal(p.career.c_wins,0);assert.deepEqual(p.unlocked,initial.unlocked);assert.deepEqual(p.discovered,initial.discovered);
 assert.deepEqual(updateProfile(p,before,won,[{type:'round_won'}]),p);
 for(const change of [{phase:'game_over',winPending:false},{round:{ante:7,blindId:'boss'}},{round:{ante:8,blindId:'big'}},{winPending:false}]){
  const q=updateProfile(initial,before,{...won,...change},[{type:'round_won'}]);assert.deepEqual(q.completedChallenges,[],JSON.stringify(change));
 }
});
test('five distinct normal deck wins open five challenges and each distinct completion opens one more',()=>{
 const p=createProfile();for(const id of ['red','blue','yellow','green'])p.deckWins[id]=[3,0,0,0,0,0,0,0];assert.equal(challengeModeUnlocked(p),false);
 p.deckWins.black=[1,0,0,0,0,0,0,0];assert.equal(challengeModeUnlocked(p),true);assert.equal(challengeUnlocked(p,'xray_vision'),true);assert.equal(challengeUnlocked(p,'mad_world'),false);
 p.completedChallenges=['omelette'];assert.equal(challengeUnlocked(p,'mad_world'),true);assert.equal(challengeUnlocked(p,'luxury_tax'),false);
});
test('challenge play resumes identically and replay rejects mutable challenge field tampering',()=>{
 for(const id of ['xray_vision','double_or_nothing','luxury_tax','rich_get_richer','inflation']){
  let state=start(id);state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;
  const action={type:'PLAY_HAND',cardIds:state.hand.slice(0,5),expectedRevision:state.revision};
  const played=dispatch(state,action);assert.equal(played.error,null,id);const text=serializeState(played.state),restored=deserializeState(text);assert.deepEqual(restored,played.state,id);
  if(restored.phase==='playing'){
   const discard={type:'DISCARD',cardIds:restored.hand.slice(0,1),expectedRevision:restored.revision};assert.deepEqual(dispatch(restored,discard),dispatch(played.state,discard),id);
  }
  assert.equal(played.state.effectReplay?.version,2,id);
  const payload=JSON.parse(text);payload.state.challengeId='omelette';assert.throws(()=>deserializeState(JSON.stringify(payload)),TypeError,id);
  if(id==='double_or_nothing'){const changed=JSON.parse(text);changed.state.challengePlayedCardIds=[];assert.throws(()=>deserializeState(JSON.stringify(changed)),TypeError);}
 }
});
test('challenge settings cannot drop their catalog shop and blind restrictions',()=>{
 for(const id of ['omelette','non_perishable','jokerless','fragile']){
  const original=JSON.parse(serializeState(start(id)));
  if(original.state.apkShop.context.bannedCentreIds.length){const p=structuredClone(original);p.state.apkShop.context.bannedCentreIds=[];assert.throws(()=>deserializeState(JSON.stringify(p)),TypeError,id+' bans');}
  if(id==='non_perishable'){const p=structuredClone(original);delete p.state.apkShop.context.modifiers.all_eternal;assert.throws(()=>deserializeState(JSON.stringify(p)),TypeError);}
  if(id==='jokerless'){const p=structuredClone(original);p.state.apkShop.context.rates.Joker=20;assert.throws(()=>deserializeState(JSON.stringify(p)),TypeError);}
 }
});
test('challenge saves retain banned tag exclusions through resume',()=>{
 const raw=JSON.parse(serializeState(start('jokerless')));raw.state.apkBlinds.tagContext.bannedKeys=[];assert.throws(()=>deserializeState(JSON.stringify(raw)),TypeError);
});
test('Luxury Tax persists negative money floor when Credit Card debt grants hand space',()=>{
 const state=start('luxury_tax');state.money=-1n;state.challengeLuxuryTax=-1;state.round.handSize=11;assert.deepEqual(deserializeState(serializeState(state)),state);
});
test('challenge completion remains excluded from normal progress even under seeded profile context',()=>{
 const before=profileState(),initial=updateProfile(createProfile(),null,before,[],{seeded:true});
 const next=profileState({revision:1,phase:'round_won',winPending:true,round:{ante:8,blindId:'boss'}});
 const p=updateProfile(initial,before,next,[{type:'round_won'}]);assert.deepEqual(p.completedChallenges,['omelette']);assert.equal(p.career.c_wins,0);assert.deepEqual(p.deckWins,{});
});
