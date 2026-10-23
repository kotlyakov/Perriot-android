import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';

const fresh=()=>createRun('fixture',{runId:'run-test',deckId:'red',money:4n});
const action=(state,type,cardIds)=>({type,expectedRevision:state.revision,...(cardIds?{cardIds}:{})});
function fixture(ids=['card_clubs_8','card_diamonds_8','card_hearts_14']) {
  const state=fresh();state.phase='playing';state.hand=ids;
  state.drawPile=Object.keys(state.cards).filter(id=>!ids.includes(id));
  return state;
}
test('fresh state has52 cards, independent instances, checked deck bonuses',()=>{
  const red=fresh();assert.equal(Object.keys(red.cards).length,52);
  assert.equal(new Set(Object.values(red.cards).map(c=>`${c.rank}/${c.suit}`)).size,52);
  assert.equal(red.round.handsRemaining,4);assert.equal(red.round.discardsRemaining,4);
  const blue=createRun('seed',{runId:'blue',deckId:'blue',money:4n});
  assert.equal(blue.round.handsRemaining,5);assert.equal(blue.round.discardsRemaining,3);
  assert.throws(()=>createRun('seed',{runId:'bad',money:4}));
  assert.throws(()=>createRun('seed',{runId:'bad',deckId:'unknown',money:4n}));
});
test('creation rejects seeds and metadata that cannot be saved',()=>{
  for(const seed of ['',undefined,123,'x'.repeat(1001)])assert.throws(()=>createRun(seed,{runId:'valid',money:4n}));
  for(const runId of ['',null,'x'.repeat(121)])assert.throws(()=>createRun('valid',{runId,money:4n}));
});
test('starting blind shuffles reproducibly and deals8 without changing input',()=>{
  const before=fresh();const snapshot=structuredClone(before);
  const result=dispatch(before,action(before,'START_BLIND'));
  assert.equal(result.error,null);assert.equal(result.state.hand.length,8);assert.equal(result.state.drawPile.length,44);
  assert.equal(result.state.phase,'playing');assert.equal(result.state.revision,1);
  assert.deepEqual(before,snapshot);assert.deepEqual(result,dispatch(fresh(),action(fresh(),'START_BLIND')));
  result.state.cards[result.state.hand[0]].rank=2;
  assert.deepEqual(before,snapshot);
});
test('play consumes one hand, uses hand order, draws to8 and records52',()=>{
  const s=fixture();const snapshot=structuredClone(s);
  const result=dispatch(s,action(s,'PLAY_HAND',[...s.hand].reverse()));
  assert.equal(result.error,null);assert.equal(result.state.round.score,52n);
  assert.equal(result.state.round.handsRemaining,3);assert.equal(result.state.hand.length,8);
  assert.deepEqual(result.state.lastScore.scoringCardIds,['card_clubs_8','card_diamonds_8']);
  assert.deepEqual(result.state.discardPile,s.hand);assert.equal(result.state.money,4n);
  assert.deepEqual(s,snapshot);
});
test('discard does not score or consume a hand',()=>{
  const s=fixture();const result=dispatch(s,action(s,'DISCARD',s.hand.slice(0,2)));
  assert.equal(result.state.round.handsRemaining,4);assert.equal(result.state.round.discardsRemaining,3);
  assert.equal(result.state.round.score,0n);assert.equal(result.state.lastScore,null);
  assert.equal(result.state.hand.length,8);assert.ok(!result.events.some(e=>e.type==='score_step'));
});
test('draw shortage only draws available cards, no mid-blind reshuffle',()=>{
  const s=fixture();s.discardPile=s.drawPile.slice(1);s.drawPile=s.drawPile.slice(0,1);
  const result=dispatch(s,action(s,'PLAY_HAND',s.hand.slice(0,2)));
  assert.equal(result.state.hand.length,2);assert.equal(result.state.drawPile.length,0);
  assert.deepEqual(result.state.rng,s.rng);
});
test('target equality wins before last-hand loss and no reward is fabricated',()=>{
  const s=fixture();s.round.target=52n;s.round.handsRemaining=1;
  const result=dispatch(s,action(s,'PLAY_HAND',s.hand));
  assert.equal(result.state.phase,'round_won');assert.equal(result.state.money,4n);
  assert.ok(result.events.some(e=>e.type==='round_won'));assert.ok(!result.events.some(e=>e.type==='round_lost'));
});
test('last hand below target loses',()=>{
  const s=fixture();s.round.target=53n;s.round.handsRemaining=1;
  const result=dispatch(s,action(s,'PLAY_HAND',s.hand));
  assert.equal(result.state.phase,'game_over');assert.ok(result.events.some(e=>e.type==='round_lost'));
});
test('same expectedRevision cannot consume play twice',()=>{
  const s=fixture();const a=action(s,'PLAY_HAND',s.hand);const first=dispatch(s,a);
  const second=dispatch(first.state,a);
  assert.strictEqual(second.state,first.state);assert.deepEqual(second.events,[]);assert.equal(second.error.code,'STALE_ACTION');
});
test('same expectedRevision cannot consume discard twice',()=>{
  const s=fixture();const a=action(s,'DISCARD',s.hand.slice(0,2));const first=dispatch(s,a);
  const second=dispatch(first.state,a);assert.strictEqual(second.state,first.state);assert.equal(second.error.code,'STALE_ACTION');
});
test('unsupported held modifier rejects play before counters or RNG change',()=>{
  const s=fixture();s.cards[s.hand[2]].enhancement='future';const before=structuredClone(s);
  const r=dispatch(s,action(s,'PLAY_HAND',s.hand.slice(0,2)));
  assert.equal(r.error?.code,'UNSUPPORTED_CONTENT');assert.strictEqual(r.state,s);assert.deepEqual(s,before);
});
test('invalid actions leave state, RNG, money, cards and counters unchanged',()=>{
  for (const a of [
    {type:'UNKNOWN',expectedRevision:0}, {type:'PLAY_HAND',expectedRevision:1,cardIds:['missing']},
    {type:'PLAY_HAND',expectedRevision:0,cardIds:['missing']},
    {type:'PLAY_HAND',expectedRevision:0,cardIds:[]},
    {type:'PLAY_HAND',expectedRevision:0,cardIds:['card_clubs_8','card_clubs_8']},
    {type:'PLAY_HAND',expectedRevision:0,cardIds:Array(6).fill('card_clubs_8')},
    {type:'START_BLIND',expectedRevision:0}, {type:'DISCARD'}, null,
  ]) {
    const s=fixture();const before=structuredClone(s);const r=dispatch(s,a);
    assert.ok(r.error);assert.strictEqual(r.state,s);assert.deepEqual(r.events,[]);assert.deepEqual(s,before);
  }
});
test('exhausted counters and unsupported content fail atomically',()=>{
  for(const [type,change] of [
    ['PLAY_HAND',s=>s.round.handsRemaining=0], ['DISCARD',s=>s.round.discardsRemaining=0],
    ['PLAY_HAND',s=>s.jokers.push({id:'j1',entityId:'joker_blueprint'})],
  ]) {
    const s=fixture();change(s);const before=structuredClone(s);const r=dispatch(s,action(s,type,s.hand));
    assert.ok(r.error);assert.strictEqual(r.state,s);assert.deepEqual(s,before);
  }
});

