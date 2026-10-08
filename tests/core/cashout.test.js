import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {createRepository} from '../../src/persistence/repository.js';

function won({money=4n,hands=1,deckId='red'}={}) {
 const s=createRun('cashout',{runId:'cashout',money,deckId});s.phase='playing';s.revision=1;s.round.handsRemaining=hands+1;
 s.hand=['card_hearts_10','card_hearts_11','card_hearts_12','card_hearts_13','card_hearts_14','card_clubs_2','card_diamonds_3','card_spades_4'];
 s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));
 return dispatch(s,{type:'PLAY_HAND',expectedRevision:s.revision,cardIds:s.hand.slice(0,5)}).state;
}
const cashout=s=>dispatch(s,{type:'CASH_OUT',expectedRevision:s.revision});

test('cash out pays the quoted reward once, collects all cards and preserves RNG/input',()=>{
 const s=won(),before=structuredClone(s);assert.equal(s.phase,'round_won');assert.equal(s.money,4n);
 const r=cashout(s);assert.equal(r.error,null);assert.equal(r.state.phase,'shop');assert.equal(r.state.money,8n);assert.equal(r.state.revision,s.revision+1);
 assert.deepEqual(r.state.hand,[]);assert.deepEqual(r.state.discardPile,[]);assert.deepEqual(r.state.drawPile,Object.keys(s.cards));assert.equal(r.state.lastScore,null);
 assert.deepEqual(r.state.round,s.round);assert.deepEqual(r.state.rng,s.rng);assert.deepEqual(r.state.cards,s.cards);assert.deepEqual(r.state.jokers,s.jokers);assert.deepEqual(s,before);
 assert.deepEqual(r.events,[{type:'cash_out',reward:3n,hands:1n,interest:0n,total:4n},{type:'shop_entered'}]);
 r.state.cards[r.state.drawPile[0]].rank=9;assert.deepEqual(s,before);
});
test('cashout interest uses balance before rewards, clamps debt and caps huge balances',async()=>{
 const {getCashout}=await import('../../src/core/cashout.js');
 for(const [money,interest,total] of [[-9n,0n,4n],[-1n,0n,4n],[0n,0n,4n],[4n,0n,4n],[5n,1n,5n],[24n,4n,8n],[25n,5n,9n],[10n**500n,5n,9n]]) {
  const s=won({money}),before=structuredClone(s);assert.deepEqual(getCashout(s),{reward:3n,hands:1n,interest,total});assert.deepEqual(s,before);
  const r=cashout(s);assert.equal(r.state.money,money+total);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
 }
});
test('zero unused hands still pay reward; blue deck pays for four unused hands',async()=>{
 const {getCashout}=await import('../../src/core/cashout.js');
 assert.deepEqual(getCashout(won({hands:0})),{reward:3n,hands:0n,interest:0n,total:3n});
 assert.deepEqual(getCashout(won({hands:4,deckId:'blue',money:5n})),{reward:3n,hands:4n,interest:1n,total:8n});
 assert.equal(cashout(won({hands:4,deckId:'blue',money:5n})).state.money,13n);
});
test('stale and repeated cash out cannot pay a second time',()=>{
 const s=won(),r=cashout(s);
 const stale=dispatch(r.state,{type:'CASH_OUT',expectedRevision:s.revision});assert.equal(stale.error.code,'STALE_ACTION');assert.strictEqual(stale.state,r.state);assert.deepEqual(stale.events,[]);
 const repeated=cashout(r.state);assert.equal(repeated.error.code,'INVALID_PHASE');assert.strictEqual(repeated.state,r.state);assert.equal(repeated.state.money,8n);
});
test('cash out rejects other phases and malformed won state without mutation',async()=>{
 const {getCashout}=await import('../../src/core/cashout.js');
 for(const phase of ['blind_selection','playing','game_over','shop']) {
  const s=won();s.phase=phase;const before=structuredClone(s),r=cashout(s);assert.equal(r.error.code,'INVALID_PHASE');assert.strictEqual(r.state,s);assert.deepEqual(r.events,[]);assert.deepEqual(s,before);assert.throws(()=>getCashout(s));
 }
 for(const mutate of [s=>s.round.blindId='boss',s=>s.round.handsRemaining=-1,s=>s.round.handsRemaining=1.5,s=>s.money=4,s=>s.round.score=0n]) {
  const s=won();mutate(s);const before=structuredClone(s),r=cashout(s);assert.equal(r.error.code,'INVALID_STATE');assert.strictEqual(r.state,s);assert.deepEqual(r.events,[]);assert.deepEqual(s,before);assert.throws(()=>getCashout(s));
 }
});
test('shop save/reload keeps schema version one and cannot replay payout',()=>{
 const shop=cashout(won()).state,text=serializeState(shop),payload=JSON.parse(text);
 assert.equal(payload.version,1);assert.equal(payload.state.schemaVersion,1);const restored=deserializeState(text);assert.deepEqual(restored,shop);assert.equal(cashout(restored).error.code,'INVALID_PHASE');
});
test('shop save rejects unmet target, held/discarded cards and residual score trace',()=>{
 const s=won(),shop=cashout(s).state;
 for(const mutate of [p=>p.round.score='0',p=>p.hand.push(p.drawPile.pop()),p=>p.discardPile.push(p.drawPile.pop()),p=>p.lastScore=JSON.parse(serializeState(s)).state.lastScore]) {
  const p=JSON.parse(serializeState(shop));mutate(p.state);assert.throws(()=>deserializeState(JSON.stringify(p)));
 }
});
test('legacy won version-one saves remain loadable and await explicit cash out',()=>{
 const s=won();delete s.sortMode;const restored=deserializeState(serializeState(s));assert.deepEqual(restored,s);assert.equal(restored.phase,'round_won');assert.equal(restored.money,4n);assert.equal(cashout(restored).state.money,8n);
});
test('repository failure leaves the won save available; retry pays once after persistence',()=>{
 for(const broken of ['backup','current']) {
  const s=won(),text=serializeState(s),data={current:text,backup:''};let fail=true;
  const io={read:slot=>data[slot],write:(slot,value)=>{if(fail&&slot===broken)throw Error('full');data[slot]=value;}};
  const repo=createRepository(io);assert.equal(repo.load().status,'current');const paid=cashout(s).state;assert.throws(()=>repo.save(paid));assert.equal(data.current,text);assert.equal(deserializeState(data.current).money,4n);
  fail=false;repo.save(cashout(s).state);const resumed=createRepository(io).load().state;assert.equal(resumed.phase,'shop');assert.equal(resumed.money,8n);assert.equal(cashout(resumed).error.code,'INVALID_PHASE');
 }
});
