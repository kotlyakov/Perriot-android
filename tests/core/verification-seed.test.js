import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {createProfile,updateProfile,deckUnlocked,stakeUnlocked,profileRunContext,collectionEntries} from '../../src/core/profile.js';
import {CHALLENGES,challengeUnlocked,challengeModeUnlocked} from '../../src/content/challenges.js';
import {DECKS} from '../../src/content/decks.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {createProfileStore} from '../../src/persistence/profile-store.js';
const seed='13031990',profile=createProfile();
const options={runId:'verification',money:4n,referenceRng:true,referenceShop:true};
test('verification seed opens every deck, stake, challenge and collection without changing profile',()=>{
 const before=structuredClone(profile);
 for(const id of Object.keys(DECKS))for(let stake=1;stake<=8;stake++)assert.equal(stakeUnlocked(profile,id,stake,seed),true);
 assert.equal(challengeModeUnlocked(profile,seed),true);
 for(const c of CHALLENGES)assert.equal(challengeUnlocked(profile,c.id,seed),true);
 assert.ok(collectionEntries(profile,seed).every(c=>c.unlocked&&c.discovered));
 assert.deepEqual(profile,before);
 for(const other of [undefined,'13031991','013031990','13031990 ']){
  assert.equal(deckUnlocked(profile,'yellow',other),false);
  assert.equal(challengeModeUnlocked(profile,other),false);
 }
});
test('verification run starts every deck and challenge at exactly $100 with unlocked pools',()=>{
 const ctx=profileRunContext(profile,seed);
 assert.equal(ctx.lockedCentreIds.length,0);assert.ok(ctx.unlockedCentreIds.includes('j_blueprint'));
 for(const deckId of Object.keys(DECKS)){
  const s=createRun(seed,{...options,deckId});assert.equal(s.money,100n,deckId);
  assert.equal(s.apkShop.context.lockedCentreIds.length,0);assert.ok(s.apkShop.context.unlockedCentreIds.includes('j_perkeo'));
  assert.deepEqual(deserializeState(serializeState(s)),s);
 }
 for(const c of CHALLENGES){
  const s=createRun(seed,{...options,challengeId:c.id});assert.equal(s.money,100n,c.id);
  if(c.modifiers?.minusHandSizePerDollars)assert.equal(s.round.handSize,Math.max(0,(c.handSize??8)-Number(100n/BigInt(c.modifiers.minusHandSizePerDollars))));
  assert.deepEqual(deserializeState(serializeState(s)),s);
 }
 assert.equal(createRun('13031991',{...options,deckId:'yellow'}).money,14n);
});
test('verification resume keeps money and RNG, normal profile unlocks stay locked',()=>{
 const data={},io={read:k=>data[k]??'',write:(k,v)=>{data[k]=v;}};
 const store=createProfileStore(io);store.load();let s=createRun(seed,options);store.reset(s,{seeded:true});
 const next=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision});assert.equal(next.error,null);s=next.state;store.save(s,next.events);
 const loaded=createProfileStore(io);assert.deepEqual(loaded.load().state,s);
 assert.equal(deckUnlocked(loaded.getProfile(),'yellow'),false);assert.equal(stakeUnlocked(loaded.getProfile(),'red',8),false);
 assert.ok(collectionEntries(loaded.getProfile(),s.seed).every(c=>c.discovered));
});
test('verification challenge wins cannot complete real profile challenges',()=>{
 const before=createRun(seed,{...options,challengeId:'omelette'});
 const after={...before,revision:1,phase:'round_won',won:true,winPending:true,round:{...before.round,ante:8,blindId:'boss'}};
 const started=updateProfile(profile,null,before,[],{seeded:true,challenge:true});
 const p=updateProfile(started,before,after,[{type:'round_won'}]);
 assert.deepEqual(p.completedChallenges,[]);assert.deepEqual(p.deckWins,{});assert.deepEqual(p.unlocked,profile.unlocked);
});
