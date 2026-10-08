import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const start=()=>{const s=createRun('persist',{runId:'save-test',money:4n});return dispatch(s,{type:'START_BLIND',expectedRevision:0}).state;};

test('save roundtrip preserves BigInt, RNG, order and next action/events',()=>{
  const s=start();const restored=deserializeState(serializeState(s));assert.deepEqual(restored,s);
  const a={type:'PLAY_HAND',expectedRevision:s.revision,cardIds:s.hand.slice(0,3)};
  assert.deepEqual(dispatch(s,a),dispatch(restored,a));
});
test('last score trace roundtrips without number conversion',()=>{
  const s=start();const next=dispatch(s,{type:'PLAY_HAND',expectedRevision:1,cardIds:s.hand.slice(0,3)}).state;
  next.money=9007199254740993n;
  assert.deepEqual(deserializeState(serializeState(next)),next);
});
test('corrupt import rejects invalid schema, numeric strings, RNG and card references',()=>{
  const original=JSON.parse(serializeState(start()));
  for(const change of [
    p=>p.version=2, p=>p.format='other', p=>p.state.money='01', p=>p.state.money='NaN',
    p=>p.state.money=4, p=>p.state.round.target='-1', p=>p.state.phase='unknown',
    p=>p.state.rng.deck.state=-1,p=>p.state.rng.deck.algorithm='other',
    p=>p.state.hand.push(p.state.hand[0]),p=>p.state.hand[0]='missing',
    p=>delete p.state.cards[p.state.hand[0]], p=>p.state.handLevels.pair=0,
    p=>p.state.cards[p.state.hand[0]].rank=20,p=>p.state.revision=1.5,
    p=>p.state.round.handsRemaining=-1,p=>p.state.jokers=[{id:'j1',entityId:'joker_blueprint'}],
    p=>p.state.extra={n:'999'},p=>p.state.cards.constructor={id:'constructor',rank:2,suit:'spades'},
  ]) {
    const payload=structuredClone(original);change(payload);
    assert.throws(()=>deserializeState(JSON.stringify(payload)));
  }
});
test('corrupt score and trace are rejected',()=>{
  const s=start();const next=dispatch(s,{type:'PLAY_HAND',expectedRevision:1,cardIds:s.hand.slice(0,3)}).state;
  for(const change of [
    p=>p.state.lastScore.score='999999',p=>p.state.lastScore.trace[1].before.chips='99999',
    p=>p.state.lastScore.scoringCardIds=['missing'],p=>p.state.lastScore.trace.at(-1).score='999999',
  ]) {
    const p=JSON.parse(serializeState(next));change(p);assert.throws(()=>deserializeState(JSON.stringify(p)));
  }
});
test('oversized or malformed input fails before use',()=>{
  for(const text of [null,'{','[]','"hello"',' '.repeat(2*1024*1024+1)])assert.throws(()=>deserializeState(text));
});
test('active phase cannot bypass its required draw or invent extra actions',()=>{
  for(const change of [
    p=>{p.state.drawPile.push(...p.state.hand);p.state.hand=[];},
    p=>{p.state.drawPile.push(p.state.hand.pop());},
    p=>p.state.round.handsRemaining=Number.MAX_SAFE_INTEGER,
    p=>p.state.round.discardsRemaining=Number.MAX_SAFE_INTEGER,
  ]) {
    const p=JSON.parse(serializeState(start()));change(p);assert.throws(()=>deserializeState(JSON.stringify(p)));
  }
});
test('a base card cannot be forged into add_mult in a continuous trace',()=>{
  const s=start();const next=dispatch(s,{type:'PLAY_HAND',expectedRevision:1,cardIds:s.hand.slice(0,1)}).state;
  const p=JSON.parse(serializeState(next));const v=p.state.lastScore;
  v.trace[1].operation='add_mult';v.trace[1].after={chips:'5',mult:'2'};
  v.chips='5';v.mult='2';v.score='10';Object.assign(v.trace.at(-1),{chips:'5',mult:'2',score:'10'});
  assert.throws(()=>deserializeState(JSON.stringify(p)));
});
