import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createRun} from '../../src/core/run.js';
import {createApkRng,createApkMathState} from '../../src/core/apk-rng.js';
import {APK_HAND_NAMES} from '../../src/core/apk-shop-state.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
const fixture=JSON.parse(gunzipSync(readFileSync(new URL('../../scripts/reference-rng/card-effect-lifecycle-fixtures.json.gz',import.meta.url))));
const handIds=Object.fromEntries(Object.entries(APK_HAND_NAMES).map(([id,name])=>[name,id]));
const enhancement={c_base:'base',m_steel:'steel',m_gold:'gold',m_stone:'stone'};
function input(f){
 const s=createRun(f.seed,{runId:'native-lifecycle',money:0n,referenceRng:true,referenceShop:true});
 s.phase='playing';s.round.ante=2;s.round.handsPlayed=f.opts.handsPlayed??0;s.runStats.handsPlayed=f.opts.handsPlayed??0;s.lastPlayedHand=handIds[f.opts.handName??'High Card'];
 s.rng.apk=createApkRng(f.seed,createApkMathState(42));s.hand=Object.keys(s.cards).slice(0,f.heldBefore.length);s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));
 for(const [i,c] of f.heldBefore.entries())Object.assign(s.cards[s.hand[i]],{rank:c.rank,suit:c.suit.toLowerCase(),enhancement:enhancement[c.center],edition:c.edition==='holo'?'holographic':c.edition,...(c.seal!=='base'?{seal:c.seal.toLowerCase()}:{}),...(c.debuffed?{debuffed:true}:{})});
 s.jokers=(f.opts.jokers??[]).map((key,i)=>({id:`${key}:${i+1}`,entityId:key,edition:'base',sellCost:2n,...(f.opts.debuffJokerIndex===i+1?{debuffed:true}:{}),...(key==='j_selzer'?{repeatHandsRemaining:f.opts.remaining??10}:{})}));
 s.consumableSlots=f.opts.limit??2;s.consumables=Array.from({length:f.opts.occupied??0},(_,i)=>({id:`owned_${i+1}`,entityId:'c_fool',originalKey:'c_fool',set:'Tarot',edition:'base',cost:3n,sellCost:1n}));
 s.apkShop.context={...s.apkShop.context,ante:2,playedHands:Object.fromEntries(Object.values(APK_HAND_NAMES).map(name=>[name,1])),bannedCentreIds:f.opts.empty?catalogue.centres.filter(c=>c.set==='Tarot').map(c=>c.key):f.opts.banned??[]};
 // Native used_jokers can include unbought offers: use this real area rather than
 // injecting a used-centre cache that currentApkShopContext intentionally rebuilds.
 if(f.opts.owned?.length)s.shop={main:f.opts.owned.map((key,i)=>({id:`offered_${i}`,entityId:key,originalKey:key})),vouchers:[],boosters:[]};
 return s;
}
function checkRng(s,f,label){const {seed,hashed_seed,...streams}=f.streams;assert.deepEqual(s.rng.apk.mathState,f.after,label);assert.deepEqual(s.rng.apk.streams,streams,label);}
const semantic=c=>({rank:c.rank,suit:c.suit.toLowerCase(),enhancement:enhancement[c.center],edition:c.edition==='holo'?'holographic':c.edition,seal:c.seal.toLowerCase()});
const actualSemantic=c=>({rank:c.rank,suit:c.suit,enhancement:c.enhancement??'base',edition:c.edition??'base',seal:c.seal??'base'});

test('original held-endround and discard callbacks agree on creation identities, reservations, Gold payout and exact RNG',async()=>{
 const {applyDiscardSeals,applyEndRoundCardEffects}=await import('../../src/core/card-effects.js');
 for(const [index,f]of fixture.cases.entries()){
  if(!['endround','purple'].includes(f.kind))continue;
  const s=input(f),events=[],before=s.consumables.length,label=`native lifecycle ${index} ${f.kind} ${JSON.stringify(f.opts)}`;
  if(f.kind==='purple')applyDiscardSeals(s,s.hand,events);else applyEndRoundCardEffects(s,events);
  assert.equal(s.money,BigInt(f.money),label);
  assert.deepEqual(s.consumables.slice(before).map(c=>c.entityId),f.created.map(c=>c.center),label);
  assert.ok(s.consumables.length<=s.consumableSlots,label);checkRng(s,f,label);
 }
});

test('original DNA, Marble and Seltzer contexts agree on copies, physical properties, destination, lifetime and exact RNG',async()=>{
 const {applyJokerBeforeScore,applyJokerAfterScore,applyJokerBlindStart}=await import('../../src/core/joker-lifecycle.js');
 for(const [index,f]of fixture.cases.entries()){
  if(!['dna','marble','seltzer'].includes(f.kind))continue;
  const s=input(f),events=[],initialCards=new Set(Object.keys(s.cards)),handLength=s.hand.length,drawLength=s.drawPile.length,label=`native lifecycle ${index} ${f.kind} ${JSON.stringify(f.opts)}`;
  if(f.kind==='dna')applyJokerBeforeScore(s,[...s.hand],events);
  else if(f.kind==='marble')applyJokerBlindStart(s,events);
  else applyJokerAfterScore(s,events);
  const added=Object.values(s.cards).filter(c=>!initialCards.has(c.id));
  assert.deepEqual(added.map(actualSemantic),f.created.map(semantic),label);
  assert.equal(s.hand.length-handLength,f.kind==='dna'?f.created.length:0,label);
  assert.equal(s.drawPile.length-drawLength,f.kind==='marble'?f.created.length:0,label);
  assert.deepEqual(s.jokers.map(j=>j.id),f.ownedJokers,label);
  assert.deepEqual(Object.fromEntries(s.jokers.filter(j=>j.entityId==='j_selzer').map(j=>[j.id,j.repeatHandsRemaining??10])),f.remaining,label);
  assert.deepEqual(added.map(c=>c.creationOrdinal),f.created.map(c=>c.playingCard),label);
  checkRng(s,f,label);
 }
});

test('native lifecycle fixture pins bounded callback scope, all Blue targets, shared reservations and copy exclusions',()=>{
 assert.equal(fixture.cases.length,228);
 assert.ok(fixture.cases.some(f=>f.kind==='endround'&&f.opts.heldKinds?.[0]==='m_gold'&&f.money===9&&f.created.length===2));
 assert.ok(fixture.cases.some(f=>f.kind==='endround'&&f.opts.heldKinds?.[0]==='c_base'&&f.money===9&&f.created.length===2));
 assert.equal(new Set(fixture.cases.filter(f=>f.opts.handName).map(f=>f.created[0]?.center)).size,12);
 assert.ok(fixture.cases.some(f=>f.kind==='endround'&&f.opts.owned?.includes('c_pluto')&&f.created[0]?.center==='c_pluto'));
 assert.ok(fixture.cases.some(f=>f.kind==='purple'&&f.opts.empty&&f.created[0]?.center==='c_strength'));
 assert.ok(fixture.cases.some(f=>f.kind==='dna'&&f.opts.jokers.length===3&&f.created.length===3));
 assert.ok(fixture.cases.some(f=>f.kind==='seltzer'&&f.opts.jokers.length===2&&f.opts.remaining===1&&f.ownedJokers.length===1&&f.draws.length===1));
 assert.match(fixture.source.method,/original endround held loop/);assert.match(fixture.source.method,/JIT on\/off identical/);
 assert.match(fixture.source.limits,/No full frame\/event scheduler parity/);
 assert.deepEqual(fixture.source.filesSha256,{"card.lua":"a3a613f90eca3e39042d28a70b129ece292644cbe79970e127e27c49bf4dee53","game.lua":"15ef486aa017ed99c31d2bacdb17846e77e6698d658182964bf7143e2e189e51","functions/misc_functions.lua":"59f6c7e1ac7a9609eb99fbed1c00619a0ed103e8c647780cc9f9f7e5333c636c","functions/common_events.lua":"6db2e23935413ff53c558a3b4674deff668603f695fd02b8de663d75bee0a4cd","functions/state_events.lua":"8ea653623e2c9b6aaa606750e1b0e90eeb215ee18d36676e5a3627f14ce9e4ac"});
});
