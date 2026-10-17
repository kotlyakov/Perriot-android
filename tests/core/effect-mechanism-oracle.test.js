import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {HANDS} from '../../src/content/hands.js';
import {scoreHand} from '../../src/core/score.js';
import {createApkRng,createApkMathState} from '../../src/core/apk-rng.js';
import {APK_HAND_NAMES} from '../../src/core/apk-shop-state.js';

const fixture=JSON.parse(gunzipSync(readFileSync(new URL('../../scripts/reference-rng/effect-mechanism-fixtures.json.gz',import.meta.url))));
const enhancements={'Stone Card':'stone','Lucky Card':'lucky','Glass Card':'glass','Steel Card':'steel','Bonus Card':'bonus','Mult Card':'mult',base:'base'};
function input(f){
 const convert=c=>({id:c.id,rank:c.rank,suit:c.suit.toLowerCase(),enhancement:enhancements[c.enhancement],edition:c.edition==='holo'?'holographic':c.edition,...(c.seal!=='base'?{seal:c.seal}:{})});
 const played=f.playedSpecs.map(convert).sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1)));
 const held=f.heldSpecs.map(convert),all=[...played,...held];
 const debuffed=[...f.playedSpecs,...f.heldSpecs].filter(c=>c.debuffed).map(c=>c.id);
 const state={handLevels:Object.fromEntries(Object.keys(HANDS).map(k=>[k,1])),jokers:f.jokers.map(j=>({id:j.id,entityId:j.key,sellCost:2n,edition:j.edition,...(j.runtimeExtra?{repeatHandsRemaining:j.runtimeExtra}:{}),...(j.debuffed?{debuffed:true}:{})})),cards:Object.fromEntries(all.map(c=>[c.id,c])),hand:all.map(c=>c.id),drawPile:[],discardPile:[],money:20n,round:{handsRemaining:(f.options.nativeHands??0)+1,discardsRemaining:3},rng:{apk:createApkRng(f.runSeed,createApkMathState(f.seed))},...(f.options.denied?{bossState:{id:'bl_mouth',firstHand:'pair'}}:debuffed.length?{bossState:{id:'bl_pillar',playedBeforeBoss:debuffed}}:{})};
 return {state,played};
}
const rational=n=>Number(n?.n??n)/Number(n?.d??1);


test('unchanged native effect loop: 1122 cases agree on scores, playing editions/seals, copy source order and exact RNG',()=>{
 assert.equal(fixture.cases.length,1122);
 for(const [index,f] of fixture.cases.entries()){
  const {state,played}=input(f),before=structuredClone(state),actual=scoreHand(state,played);
  const label=`native effect ${index} ${f.jokers.map(j=>j.key).join(',')} ${JSON.stringify(f.options)}`;
  assert.equal(actual.chips,BigInt(f.chips),label);assert.equal(rational(actual.mult),f.mult,label);assert.equal(actual.score,BigInt(f.score),label);
  assert.equal(APK_HAND_NAMES[actual.handId],f.recognizedHand,label);
  assert.deepEqual(actual.scoringCardIds,f.scoringOrder,label);
  assert.deepEqual(actual.trace.filter(e=>e.type==='score_repeat').map(e=>({cardId:e.sourceId,sourceId:e.effectSourceId,phase:e.phase})),f.repeats,label);
  if(actual.actionRng){
   assert.deepEqual(actual.actionRng.before.mathState,f.before,label);
   assert.deepEqual(actual.actionRng.draws.map(d=>d.key?d.value:-d.value),f.draws.map(d=>d.value),label);
   assert.deepEqual(actual.actionRng.after.mathState,f.after,label);
   const {seed,hashed_seed,...streams}=f.streams;assert.deepEqual(actual.actionRng.after.streams,streams,label);
  }else {assert.deepEqual(f.draws,[],label);assert.deepEqual(f.before,f.after,label);}
  assert.equal(actual.trace.filter(e=>e.type==='score_money').reduce((n,e)=>n+e.amount,0n),BigInt(f.pendingMoney),label);
  assert.deepEqual(actual.glassRolls?.filter(r=>r.destroyed).map(r=>r.cardId)??[],f.destroyed,label);
  const ownPasses=f.evals.filter(e=>e.evalCard&&e.phase.startsWith('scored:own:')).map(e=>e.phase.slice('scored:own:'.length));
  const luckyOwnCount=ownPasses.filter(id=>f.playedSpecs.some(c=>c.id===id&&c.enhancement==='Lucky Card')).length;
  assert.equal(actual.luckyRolls?.length??0,luckyOwnCount,label);
  const nativeLucky=f.draws.filter(d=>!Object.hasOwn(d,'min')&&f.playedSpecs.some(c=>c.enhancement==='Lucky Card'&&d.phase===`scored:own:${c.id}`));
  assert.deepEqual((actual.luckyRolls??[]).flatMap(r=>[r.multRoll,r.moneyRoll]),nativeLucky.map(d=>d.value),label);
  const nativeGlass=f.draws.filter(d=>!Object.hasOwn(d,'min')&&d.phase==='evaluate_play');
  assert.deepEqual((actual.glassRolls??[]).map(r=>r.roll),nativeGlass.map(d=>d.value),label);
  assert.deepEqual(state,before,'oracle comparison must not mutate its caller');
 }
});

test('native effect matrix covers seals before owned repeats, empty held gates, copied aliases, cycles and Stone face identity',()=>{
 const cases=fixture.cases;
 assert.ok(cases.some(f=>f.playedSpecs[0].seal==='gold'&&f.pendingMoney===9&&f.jokers[0]?.key==='j_hanging_chad'&&f.playedSpecs[0].enhancement==='base'));
 assert.ok(cases.some(f=>f.playedSpecs[0].seal==='red'&&f.jokers[0]?.key==='j_hanging_chad'&&f.repeats.length===3&&f.repeats[0].sourceId==='c1'));
 assert.ok(cases.some(f=>f.heldSpecs[0].seal==='red'&&f.heldSpecs[0].enhancement==='base'&&!f.jokers.length&&!f.repeats.some(r=>r.phase==='held_card')));
 assert.ok(cases.some(f=>f.heldSpecs[0].enhancement==='Steel Card'&&f.heldSpecs[0].seal==='red'&&f.jokers[0]?.key==='j_mime'&&f.repeats.filter(r=>r.phase==='held_card').length===2));
 assert.ok(cases.some(f=>f.jokers.map(j=>j.key).join(',')==='j_blueprint,j_blueprint,j_hack'&&f.repeats.some(r=>r.sourceId==='j_blueprint:1')));
 assert.ok(cases.some(f=>f.jokers.map(j=>j.key).join(',')==='j_blueprint,j_brainstorm'&&f.repeats.every(r=>!r.sourceId.startsWith('j_'))));
 assert.ok(cases.some(f=>f.jokers[0]?.key==='j_pareidolia'&&f.playedSpecs[0].enhancement==='Stone Card'&&f.repeats.some(r=>r.sourceId==='j_sock_and_buskin:2')));
 assert.ok(cases.some(f=>f.jokers.some(j=>j.key==='j_selzer'&&j.runtimeExtra===1)));
 assert.ok(cases.some(f=>f.options.debuffHeld&&f.options.jokerEditionIndex===2&&f.playedSpecs.length===1));
});

test('effect oracle pins private inputs and explicitly excludes queued lifecycle removal',()=>{
 assert.deepEqual(fixture.source.nativeJokerKeys,['j_mime','j_pareidolia','j_blueprint','j_brainstorm','j_selzer']);
 assert.deepEqual(fixture.source.filesSha256,{"card.lua": "a3a613f90eca3e39042d28a70b129ece292644cbe79970e127e27c49bf4dee53", "game.lua": "15ef486aa017ed99c31d2bacdb17846e77e6698d658182964bf7143e2e189e51", "functions/misc_functions.lua": "59f6c7e1ac7a9609eb99fbed1c00619a0ed103e8c647780cc9f9f7e5333c636c", "functions/common_events.lua": "6db2e23935413ff53c558a3b4674deff668603f695fd02b8de663d75bee0a4cd", "functions/state_events.lua": "8ea653623e2c9b6aaa606750e1b0e90eeb215ee18d36676e5a3627f14ce9e4ac"});
 assert.match(fixture.source.method,/Unchanged evaluate_play body/);assert.match(fixture.source.method,/JIT on\/off identical/);assert.match(fixture.source.limits,/callbacks not executed/);
});
