import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreHand} from '../../src/core/score.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const ace={id:'ace',rank:14,suit:'hearts'};
const score=(jokers,extra={})=>scoreHand({handLevels:{},jokers,cards:{ace},hand:['ace'],drawPile:[],discardPile:[],...extra},[ace]);
const independent=r=>r.trace.filter(e=>e.phase==='independent');
test('Blue Joker counts only the pre-refill draw pile, including empty and one-card boundaries',()=>{
 for(const count of [0,1,3]){
  const r=score([{id:'blue',entityId:'j_blue_joker'}],{drawPile:Array.from({length:count},(_,i)=>'d'+i)});
  assert.equal(r.chips,16n+2n*BigInt(count));assert.equal(independent(r).length,count?1:0);
 }
});
test('Swashbuckler excludes itself and sums OTHER stored sell values exactly across position and editions',()=>{
 const giant=9007199254740998n;
 for(const jokers of [
  [{id:'swash',entityId:'j_swashbuckler',sellCost:99n}],
  [{id:'swash',entityId:'j_swashbuckler',sellCost:99n},{id:'other',entityId:'j_blue_joker',sellCost:0n}],
 ])assert.equal(score(jokers).mult,1n);
 const jokers=[{id:'other',entityId:'j_blue_joker',sellCost:giant,edition:'negative'},{id:'swash',entityId:'j_swashbuckler',sellCost:99n},{id:'other2',entityId:'j_blue_joker',sellCost:4n,edition:'polychrome'}];
 const r=score(jokers);assert.deepEqual(r.mult,{n:3n*(1n+giant+4n),d:2n});
 assert.equal(independent(r)[0].after.mult-independent(r)[0].before.mult,giant+4n);
});
test('Swashbucklers count each other and use current values without mutating them',()=>{
 const jokers=[{id:'a',entityId:'j_swashbuckler',sellCost:2n},{id:'b',entityId:'j_swashbuckler',sellCost:7n}],before=structuredClone(jokers);
 assert.equal(score(jokers).mult,10n);assert.deepEqual(jokers,before);
 jokers[1].sellCost=1n;assert.equal(score(jokers).mult,4n);
});
const act=(s,type,fields={})=>dispatch(s,{type,expectedRevision:s.revision,...fields});
function run(seed='blue-before',referenceRng=false){let s=act(createRun(seed,{runId:'blue-save',money:10n,referenceRng,referenceShop:referenceRng}),'START_BLIND').state;s.jokers=[{id:'blue',entityId:'j_blue_joker',sellCost:2n,cost:5n},{id:'swash',entityId:'j_swashbuckler',sellCost:2n,cost:4n}];return s;}
// A real Ante7 target leaves room for multiple scoring actions without forging
// native Small Blind identity. The synthetic fixture retains its dealt cards.
function setReplayTarget(s){
 s.round.target=35000n;
 if(s.apkShop){s.round.ante=7;s.roundNumber=19;s.apkShop.context.ante=7;s.apkBlinds.ante=7;s.apkBlinds.tagContext.ante=7;}
}
test('Blue score replay survives redraw, later DISCARD, second PLAY, and duplicate stale action rejection',()=>{
 for(const reference of [false,true]){
  let s=run('blue-before',reference);setReplayTarget(s);const drawCount=s.drawPile.length,action={type:'PLAY_HAND',expectedRevision:s.revision,cardIds:s.hand.slice(0,2)};
  let r=dispatch(s,action);assert.equal(r.error,null);assert.equal(independent(r.state.lastScore)[0].after.chips-independent(r.state.lastScore)[0].before.chips,2n*BigInt(drawCount));
  assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
  assert.equal(dispatch(r.state,action).error.code,'STALE_ACTION');
  r=act(r.state,'DISCARD',{cardIds:r.state.hand.slice(0,2)});assert.equal(r.error,null);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
  r=act(r.state,'PLAY_HAND',{cardIds:r.state.hand.slice(0,1)});assert.equal(r.error,null);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
 }
});
test('Blue draw snapshot rejects an overcount using a historically discarded identity',()=>{
 let s=run();s=act(s,'DISCARD',{cardIds:s.hand.slice(0,2)}).state;s=act(s,'PLAY_HAND',{cardIds:s.hand.slice(0,1)}).state;
 const payload=JSON.parse(serializeState(s));const p=payload.state.lastScore.scoringPilesBefore;
 p.drawPile.push(p.discardPile.pop());assert.throws(()=>deserializeState(JSON.stringify(payload)));
});
test('Swashbuckler refuses an unavailable or invalid OTHER sell value',()=>{
 for(const sellCost of [undefined,-1n,2])assert.throws(()=>score([{id:'swash',entityId:'j_swashbuckler'},{id:'other',entityId:'j_joker',...(sellCost===undefined?{}:{sellCost})}]),/sell value/);
});
function boss(id,ante){
 let s=createRun('BLUE-BOSS',{runId:'blue-boss',money:10n,referenceRng:true,referenceShop:true});
 s.round.ante=ante;s.round.blindId='boss';s.round.target=({3:2000n,5:11000n})[ante]*2n;
 s.apkShop.context.ante=ante;s.apkBlinds.ante=ante;s.apkBlinds.tagContext.ante=ante;s.apkBlinds.bossId=id;s.apkBlinds.bossesUsed[id]=1;
 s=act(s,'START_BLIND').state;s.jokers=[{id:'blue',entityId:'j_blue_joker',sellCost:2n,cost:5n}];return s;
}
test('Blue snapshot matches Hook pre-score forced discards and Serpent three-card refill/overdraw',()=>{
 for(const [id,ante] of [['bl_hook',3],['bl_serpent',5]]){
  let s=boss(id,ante),beforeDraw=s.drawPile.length,initial=s.hand.length;
  const r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);
  assert.equal(independent(r.state.lastScore)[0].after.chips-independent(r.state.lastScore)[0].before.chips,2n*BigInt(beforeDraw));
  assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
  if(id==='bl_hook')assert.equal(r.state.lastScore.scoringPilesBefore.discardPile.length,2);
  else assert.equal(r.state.hand.length,initial-1+3);
  const discarded=act(r.state,'DISCARD',{cardIds:[r.state.hand[0]]});assert.equal(discarded.error,null);assert.deepEqual(deserializeState(serializeState(discarded.state)),discarded.state);
 }
});
test('Blue snapshot handles an exhausted draw pile with no effect or refill',()=>{
 let s=run();s.discardPile.push(...s.drawPile);s.drawPile=[];
 const r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);assert.equal(independent(r.state.lastScore).some(e=>e.sourceId==='blue'),false);
 assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
});
test('Blue rejects a coherent held-to-draw overcount in both draw directions',()=>{
 for(const reference of [false,true]){
  const before=run('blue-fullness',reference),played=before.hand[0],moved=before.hand[1];
  const actual=act(before,'PLAY_HAND',{cardIds:[played]});assert.equal(actual.error,null);
  const fake=structuredClone(before);fake.hand=fake.hand.filter(id=>id!==moved);
  if(reference)fake.drawPile.push(moved);else fake.drawPile.unshift(moved);
  const forged=structuredClone(actual.state);forged.lastScore=scoreHand(fake,[fake.cards[played]]);forged.round.score=forged.lastScore.score;
  assert.throws(()=>serializeState(forged));
 }
});
test('Blue preserves exact Hanged shortfall provenance through PLAY and later DISCARD',()=>{
 for(const reference of [false,true]){
  let s=run('blue-hanged',reference);setReplayTarget(s);
  s.consumables=[{id:'hanged',entityId:'c_hanged_man',originalKey:'c_hanged_man',set:'Tarot',edition:'base',cost:3n,sellCost:1n}];
  const targets=s.hand.slice(0,2),used=act(s,'USE_CONSUMABLE',{cardId:'hanged',targetCardIds:targets});assert.equal(used.error,null);
  const r=act(used.state,'PLAY_HAND',{cardIds:[used.state.hand[0]]});assert.equal(r.error,null);
  assert.equal(r.state.hangedShortfallCardIds,undefined);
  assert.deepEqual(r.state.lastScore.scoringPilesBefore.hangedShortfallCardIds,targets);
  assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
  const later=act(r.state,'DISCARD',{cardIds:[r.state.hand[0]]});assert.equal(later.error,null);assert.deepEqual(deserializeState(serializeState(later.state)),later.state);
  const forged=JSON.parse(serializeState(r.state));forged.state.lastScore.scoringPilesBefore.hangedShortfallCardIds=[r.state.drawPile[0]];
  assert.throws(()=>deserializeState(JSON.stringify(forged)));
 }
});
test('Blue rejects reuse of an already consumed Hanged shortfall on the next PLAY',()=>{
 for(const reference of [false,true]){
  let s=run('blue-consumed-hanged',reference);setReplayTarget(s);
  s.consumables=[{id:'hanged',entityId:'c_hanged_man',originalKey:'c_hanged_man',set:'Tarot',edition:'base',cost:3n,sellCost:1n}];
  const targets=s.hand.slice(0,1);s=act(s,'USE_CONSUMABLE',{cardId:'hanged',targetCardIds:targets}).state;
  s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;
  const played=s.hand[0],moved=s.hand[1],actual=act(s,'PLAY_HAND',{cardIds:[played]});assert.equal(actual.error,null);
  const fake=structuredClone(s);fake.hand=fake.hand.filter(id=>id!==moved);fake.hangedShortfallCardIds=targets;
  if(reference)fake.drawPile.push(moved);else fake.drawPile.unshift(moved);
  const forged=structuredClone(actual.state);forged.lastScore=scoreHand(fake,[fake.cards[played]]);forged.round.score=s.round.score+forged.lastScore.score;
  assert.throws(()=>serializeState(forged));
 }
});
test('Blue cannot reuse a shortfall consumed by DISCARD instead of PLAY and migrates old active markers',()=>{
 let s=run('blue-discard-hanged',true);setReplayTarget(s);
 s.consumables=[{id:'hanged',entityId:'c_hanged_man',originalKey:'c_hanged_man',set:'Tarot',edition:'base',cost:3n,sellCost:1n}];
 const targets=s.hand.slice(0,1);s=act(s,'USE_CONSUMABLE',{cardId:'hanged',targetCardIds:targets}).state;
 const legacy=JSON.parse(serializeState(s));delete legacy.state.hangedShortfallEpoch;
 const migrated=act(deserializeState(JSON.stringify(legacy)),'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(migrated.error,null);assert.deepEqual(deserializeState(serializeState(migrated.state)),migrated.state);
 s=act(s,'DISCARD',{cardIds:[s.hand[0]]}).state;
 const played=s.hand[0],moved=s.hand[1],actual=act(s,'PLAY_HAND',{cardIds:[played]});assert.equal(actual.error,null);
 const fake=structuredClone(s);fake.hand=fake.hand.filter(id=>id!==moved);fake.hangedShortfallCardIds=targets;fake.drawPile.push(moved);
 const forged=structuredClone(actual.state);forged.lastScore=scoreHand(fake,[fake.cards[played]]);forged.round.score=s.round.score+forged.lastScore.score;
 assert.throws(()=>serializeState(forged));
});
test('Serpent Blue replay rejects a coherent fourth refill card',()=>{
 const before=boss('bl_serpent',5),played=before.hand[0],moved=before.hand[1],actual=act(before,'PLAY_HAND',{cardIds:[played]});assert.equal(actual.error,null);
 const fake=structuredClone(before);fake.hand=fake.hand.filter(id=>id!==moved);fake.drawPile.push(moved);
 const forged=structuredClone(actual.state);forged.lastScore=scoreHand(fake,[fake.cards[played]]);forged.round.score=forged.lastScore.score;
 assert.throws(()=>serializeState(forged));
});
test('Serpent Blue uses no refill on a winning/losing PLAY and caps a short refill at remaining cards',()=>{
 for(const outcome of ['round_won','game_over','short']){
  const s=boss('bl_serpent',5);
  if(outcome==='round_won')s.handLevels.high_card=10000;
  if(outcome==='game_over')s.round.handsRemaining=1;
  if(outcome==='short'){s.discardPile.push(...s.drawPile.splice(0,s.drawPile.length-2));}
  const count=s.drawPile.length,r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);
  assert.equal(r.state.phase,outcome==='short'?'playing':outcome);
  assert.equal(r.state.drawPile.length,outcome==='short'?0:count);
  assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
 }
});
test('Blue binds the current Hanged epoch to its exact active IDs, excluding earlier consumed IDs',()=>{
 let s=run('blue-hanged-identity',true);setReplayTarget(s);const destroyed=[];
 for(let i=0;i<2;i++){
  s.consumables=[{id:'hanged'+i,entityId:'c_hanged_man',originalKey:'c_hanged_man',set:'Tarot',edition:'base',cost:3n,sellCost:1n}];
  const target=s.hand[0];destroyed.push(target);s=act(s,'USE_CONSUMABLE',{cardId:'hanged'+i,targetCardIds:[target]}).state;
  if(i===0)s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;
 }
 const played=s.hand[0],moved=s.hand[1],actual=act(s,'PLAY_HAND',{cardIds:[played]});assert.equal(actual.error,null);
 const fake=structuredClone(s);fake.hand=fake.hand.filter(id=>id!==moved);fake.hangedShortfallCardIds=destroyed;fake.drawPile.push(moved);
 const forged=structuredClone(actual.state);forged.lastScore=scoreHand(fake,[fake.cards[played]]);forged.round.score=s.round.score+forged.lastScore.score;
 assert.throws(()=>serializeState(forged));
 assert.deepEqual(deserializeState(serializeState(actual.state)),actual.state);
});
