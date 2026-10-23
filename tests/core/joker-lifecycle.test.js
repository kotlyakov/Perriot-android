import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createRun} from '../../src/core/run.js';
import {applyJokerBeforeScore,applyJokerAfterScore,applyJokerBlindStart} from '../../src/core/joker-lifecycle.js';
const fixture=JSON.parse(gunzipSync(readFileSync(new URL('../../scripts/reference-rng/card-effect-lifecycle-fixtures.json.gz',import.meta.url))));
function setup(f){
 const s=createRun(f.seed,{runId:'lifecycle-native',money:10n,referenceRng:true});s.jokers=f.opts.jokers.map((entityId,i)=>({id:entityId+':'+(i+1),entityId,...(f.opts.debuffJokerIndex===i+1?{debuffed:true}:{}),...(entityId==='j_selzer'?{repeatHandsRemaining:f.opts.remaining??10}:{})}));
 s.rng.apk.mathState=[...f.before];s.rng.apk.streams={};s.round.handsPlayed=f.opts.handsPlayed??0;
 s.hand=['card_spades_13',...(f.opts.count===2?['card_spades_12']:[])];s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));
 if(f.kind==='dna')Object.assign(s.cards[s.hand[0]],{enhancement:'steel',edition:'polychrome',seal:'red'});
 return s;
}
test('original-source DNA lifecycle fixtures preserve created modifiers, before counter and raw chronology',()=>{
 for(const f of fixture.cases.filter(f=>f.kind==='dna')){
  const s=setup(f),events=[],made=applyJokerBeforeScore(s,[...s.hand],events);
  assert.equal(made.length,f.created.length,JSON.stringify(f.opts));
  assert.deepEqual(s.rng.apk.mathState,f.after,JSON.stringify(f.opts));
  for(let i=0;i<made.length;i++){const c=made[i];assert.equal(c.id,'card_created_'+(53+i));assert.equal(c.rank,13);assert.equal(c.suit,'spades');assert.equal(c.edition,'polychrome');assert.equal(c.seal,'red');assert.equal(c.enhancement,'steel');assert.ok(s.hand.includes(c.id));}
 }
});
test('original-source Marble lifecycle fixtures preserve front and keyed/raw chronological boundary',()=>{
 for(const f of fixture.cases.filter(f=>f.kind==='marble')){
  const s=setup(f),events=[],made=applyJokerBlindStart(s,events);
  assert.equal(made.length,f.created.length);assert.deepEqual(s.rng.apk.mathState,f.after);
  assert.equal(s.rng.apk.streams.marb_fr,f.streams.marb_fr);
  for(let i=0;i<made.length;i++){assert.equal(made[i].rank,f.created[i].rank);assert.equal(made[i].suit,f.created[i].suit.toLowerCase());assert.equal(made[i].enhancement,'stone');assert.ok(s.drawPile.includes(made[i].id));}
 }
});
test('original-source Seltzer lifecycle fixtures consume once, copied after excluded, final juice/removal exact',()=>{
 for(const f of fixture.cases.filter(f=>f.kind==='seltzer')){
  const s=setup(f),events=[];applyJokerAfterScore(s,events);
  assert.deepEqual(s.rng.apk.mathState,f.after);assert.deepEqual(s.jokers.map(j=>j.id),f.ownedJokers);
  for(const j of s.jokers.filter(j=>j.entityId==='j_selzer'))assert.equal(j.repeatHandsRemaining,f.remaining[j.id]);
  assert.equal(events.filter(e=>e.type==='joker_removed').length,f.opts.remaining===1?1:0);
 }
});
test('DNA debuff/copy/source and nonfirst-hand constraints never mutate rejected activation',()=>{
 const f=fixture.cases.find(f=>f.kind==='dna'&&f.opts.jokers.length===2&&f.created.length===2),s=setup(f);s.jokers[1].debuffed=true;
 const before=structuredClone(s);assert.deepEqual(applyJokerBeforeScore(s,[...s.hand],[]),[]);assert.deepEqual(s,before);
 const live=setup(f),events=[];applyJokerBeforeScore(live,[...live.hand],events);assert.deepEqual(events.map(e=>e.sourceId),live.jokers.map(j=>j.id));
});
test('inactive lifecycle paths leave legacy no-native-RNG states untouched',()=>{
 const s=createRun('LEGACY',{runId:'legacy-lifecycle',money:10n}),before=structuredClone(s);
 assert.deepEqual(applyJokerBeforeScore(s,['card_spades_13'],[]),[]);
 assert.deepEqual(applyJokerBlindStart(s,[]),[]);applyJokerAfterScore(s,[]);assert.deepEqual(s,before);
});
test('Seltzer debuff suspends decay and malformed lifetime is refused',()=>{
 const f=fixture.cases.find(f=>f.kind==='seltzer'),s=setup(f);s.jokers[0].debuffed=true;const before=structuredClone(s);applyJokerAfterScore(s,[]);assert.deepEqual(s,before);
 delete s.jokers[0].debuffed;s.jokers[0].repeatHandsRemaining=0;assert.throws(()=>applyJokerAfterScore(s,[]),/Invalid Seltzer lifetime/);
});
