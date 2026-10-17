import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {getCashout} from '../../src/core/cashout.js';
import {deserializeState,serializeState} from '../../src/persistence/save.js';
function won(money=4n){const s=createRun('bonus-payout',{runId:'bonus-payout',money});s.phase='round_won';s.round.score=300n;s.round.handsRemaining=1;s.jokers=[{id:'golden',entityId:'j_golden',cost:6n,sellCost:3n},{id:'cloud',entityId:'j_cloud_9',cost:7n,sellCost:3n}];return s;}
test('Golden/Cloud bonus rows join cashout total without increasing its interest base',()=>{
 const s=won(),before=structuredClone(s),q=getCashout(s);assert.equal(q.interest,0n);assert.equal(q.total,12n);assert.deepEqual(q.jokerBonuses,[{sourceId:'golden',entityId:'j_golden',amount:4n},{sourceId:'cloud',entityId:'j_cloud_9',amount:4n}]);assert.deepEqual(s,before);
 assert.equal(getCashout(won(5n)).interest,1n);
});
test('cashout pays Joker bonuses once after save/reload and accepted revision',()=>{
 const s=deserializeState(serializeState(won()));const r=dispatch(s,{type:'CASH_OUT',expectedRevision:s.revision});assert.equal(r.error,null);assert.equal(r.state.money,16n);assert.equal(r.events[0].total,12n);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
 const again=dispatch(r.state,{type:'CASH_OUT',expectedRevision:r.state.revision});assert.equal(again.error.code,'INVALID_PHASE');assert.equal(again.state.money,16n);
});
test('Golden/Cloud do not pay from a losing hand',()=>{
 let s=createRun('bonus-loss',{runId:'bonus-loss',money:4n});s=dispatch(s,{type:'START_BLIND',expectedRevision:0}).state;s.jokers=won().jokers;s.round.handsRemaining=1;const r=dispatch(s,{type:'PLAY_HAND',expectedRevision:s.revision,cardIds:[s.hand[0]]});assert.equal(r.error,null);assert.equal(r.state.phase,'game_over');assert.equal(r.state.money,4n);assert.throws(()=>getCashout(r.state));
});
test('round evaluation fixes earned bonus and interest before a later inventory sale',()=>{
 const s=won(),q=getCashout(s);const sold=dispatch(s,{type:'SELL_OWNED_CARD',expectedRevision:s.revision,area:'jokers',cardId:'golden'});assert.equal(sold.error,null);assert.equal(sold.state.money,7n);assert.deepEqual(getCashout(sold.state),q);const resumed=deserializeState(serializeState(sold.state));assert.deepEqual(getCashout(resumed),q);const paid=dispatch(resumed,{type:'CASH_OUT',expectedRevision:resumed.revision});assert.equal(paid.state.money,19n);
});

function actualWin(money=4n,consumable){
 const s=createRun('bonus-play-freeze',{runId:'bonus-play-freeze',money});
 s.phase='playing';s.revision=1;s.round.handsRemaining=2;s.jokers=won().jokers;
 if(consumable)s.consumables=[consumable];
 s.hand=['card_hearts_10','card_hearts_11','card_hearts_12','card_hearts_13','card_hearts_14','card_clubs_2','card_diamonds_3','card_spades_4'];
 s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));
 const before=structuredClone(s),result=dispatch(s,{type:'PLAY_HAND',expectedRevision:s.revision,cardIds:s.hand.slice(0,5)});
 assert.equal(result.error,null);assert.equal(result.state.phase,'round_won');assert.deepEqual(s,before);
 return result.state;
}
const action=(s,type,fields={})=>dispatch(s,{type,expectedRevision:s.revision,...fields});
const moneyTarot=entityId=>({id:'money-tarot',entityId,originalKey:entityId,set:'Tarot',cost:3n,sellCost:1n});

test('an actual winning PLAY_HAND freezes earned rows and original interest before sales',()=>{
 const s=actualWin(),q=getCashout(s);
 assert.deepEqual(s.cashoutQuote,{moneyBefore:4n,handsRemainingBefore:1,earnedRevision:s.revision,bonusContext:{sources:[{id:'golden',entityId:'j_golden'},{id:'cloud',entityId:'j_cloud_9'}],nineCardIds:Object.values(s.cards).filter(c=>c.rank===9&&c.enhancement!=='stone').map(c=>c.id).sort()},quote:{reward:3n,hands:1n,interest:0n,total:12n,jokerBonuses:[
  {sourceId:'golden',entityId:'j_golden',amount:4n},{sourceId:'cloud',entityId:'j_cloud_9',amount:4n}
 ]}});
 assert.equal(s.money,4n);
 const sold=action(s,'SELL_OWNED_CARD',{area:'jokers',cardId:'golden'});assert.equal(sold.error,null);
 assert.equal(sold.state.money,7n);assert.deepEqual(getCashout(sold.state),q);
 const soldAgain=action(sold.state,'SELL_OWNED_CARD',{area:'jokers',cardId:'cloud'});assert.equal(soldAgain.error,null);
 assert.equal(soldAgain.state.money,10n);assert.deepEqual(soldAgain.state.jokers,[]);
 const resumed=deserializeState(serializeState(soldAgain.state));assert.deepEqual(getCashout(resumed),q);
 const paid=action(resumed,'CASH_OUT');assert.equal(paid.error,null);assert.equal(paid.state.money,22n);
 assert.equal(Object.hasOwn(paid.state,'cashoutQuote'),false);assert.deepEqual(paid.events[0],{type:'cash_out',...q});
 assert.equal(action(paid.state,'CASH_OUT').error.code,'INVALID_PHASE');
});

test('an earned quote survives later debuffs, changed money, reorder and mutated returned quote',()=>{
 const s=actualWin(5n),q=getCashout(s);assert.equal(q.interest,1n);
 const moved=action(s,'REORDER_JOKERS',{cardIds:['cloud','golden']});assert.equal(moved.error,null);
 moved.state.jokers.forEach(j=>j.debuffed=true);moved.state.money=100n;
 assert.deepEqual(getCashout(moved.state),q);
 const returned=getCashout(moved.state);returned.jokerBonuses[0].amount=999n;returned.total=999n;
 assert.deepEqual(getCashout(moved.state),q);
 // Persisted debuffed owned Jokers remain outside the supported save slice.
 moved.state.jokers.forEach(j=>delete j.debuffed);
 const resumed=deserializeState(serializeState(moved.state));assert.deepEqual(getCashout(resumed),q);
 const paid=action(resumed,'CASH_OUT');assert.equal(paid.error,null);assert.equal(paid.state.money,113n);
});

test('money Tarots used after a fresh win do not change earned bonuses or interest',()=>{
 for(const [key,moneyAfter] of [['c_hermit',8n],['c_temperance',10n]]){
  const s=actualWin(4n,moneyTarot(key)),q=getCashout(s);
  const used=action(s,'USE_CONSUMABLE',{cardId:'money-tarot'});assert.equal(used.error,null,key);
  assert.equal(used.state.money,moneyAfter,key);assert.deepEqual(used.state.consumables,[]);
  assert.deepEqual(getCashout(used.state),q,key);assert.equal(q.interest,0n);
  const resumed=deserializeState(serializeState(used.state));assert.deepEqual(getCashout(resumed),q,key);
  const paid=action(resumed,'CASH_OUT');assert.equal(paid.error,null,key);assert.equal(paid.state.money,moneyAfter+12n,key);
 }
});

test('money Tarot on a legacy won state captures the quote before increasing its balance',()=>{
 const s=won();s.consumables=[moneyTarot('c_hermit')];const q=getCashout(s);
 assert.equal(Object.hasOwn(s,'cashoutQuote'),false);
 const used=action(s,'USE_CONSUMABLE',{cardId:'money-tarot'});assert.equal(used.error,null);
 assert.equal(used.state.money,8n);assert.equal(used.state.cashoutQuote.moneyBefore,4n);assert.deepEqual(getCashout(used.state),q);
 const resumed=deserializeState(serializeState(used.state));assert.equal(action(resumed,'CASH_OUT').state.money,20n);
});

test('saved earned quotes reject malformed types, fields, rows and inconsistent totals',()=>{
 const valid=JSON.parse(serializeState(actualWin()));
 const cases=[
  ['missing money snapshot',s=>delete s.cashoutQuote.moneyBefore],
  ['numeric money snapshot',s=>s.cashoutQuote.moneyBefore=4],
  ['changed interest base',s=>s.cashoutQuote.moneyBefore='5'],
  ['missing quote',s=>delete s.cashoutQuote.quote],
  ['unknown snapshot field',s=>s.cashoutQuote.extra=true],
  ['missing total',s=>delete s.cashoutQuote.quote.total],
  ['numeric total',s=>s.cashoutQuote.quote.total=12],
  ['negative total',s=>s.cashoutQuote.quote.total='-1'],
  ['noncanonical decimal',s=>s.cashoutQuote.quote.total='012'],
  ['incorrect reward',s=>s.cashoutQuote.quote.reward='4'],
  ['incorrect remaining hands',s=>s.cashoutQuote.quote.hands='2'],
  ['incorrect interest',s=>s.cashoutQuote.quote.interest='1'],
  ['incorrect total',s=>s.cashoutQuote.quote.total='13'],
  ['unknown quote field',s=>s.cashoutQuote.quote.bogus=true],
  ['null bonus rows',s=>s.cashoutQuote.quote.jokerBonuses=null],
  ['empty bonus rows',s=>s.cashoutQuote.quote.jokerBonuses=[]],
  ['missing bonus amount',s=>delete s.cashoutQuote.quote.jokerBonuses[0].amount],
  ['numeric bonus amount',s=>s.cashoutQuote.quote.jokerBonuses[0].amount=4],
  ['zero bonus',s=>{s.cashoutQuote.quote.jokerBonuses[0].amount='0';s.cashoutQuote.quote.total='8';}],
  ['incorrect Golden bonus',s=>{s.cashoutQuote.quote.jokerBonuses[0].amount='5';s.cashoutQuote.quote.total='13';}],
  ['coherent inflated Cloud bonus',s=>{s.cashoutQuote.quote.jokerBonuses[1].amount='10000';s.cashoutQuote.quote.total='10008';}],
  ['downgraded earning revision',s=>s.cashoutQuote.earnedRevision--],
  ['coherent phantom provenance',s=>{const q=s.cashoutQuote;q.earnedRevision--;q.bonusContext.nineCardIds.push('card_clubs_2');q.quote.jokerBonuses[1].amount='5';q.quote.total='13';}],
  ['phantom Golden source',s=>s.cashoutQuote.quote.jokerBonuses[0].sourceId='phantom'],
  ['oversized Cloud bonus',s=>{s.cashoutQuote.quote.jokerBonuses[1].amount='10001';s.cashoutQuote.quote.total='10009';}],
  ['unsupported bonus entity',s=>s.cashoutQuote.quote.jokerBonuses[0].entityId='j_bull'],
  ['empty source ID',s=>s.cashoutQuote.quote.jokerBonuses[0].sourceId=''],
  ['duplicate source ID',s=>s.cashoutQuote.quote.jokerBonuses[1].sourceId='golden'],
  ['unknown row field',s=>s.cashoutQuote.quote.jokerBonuses[0].extra=true]
 ];
 for(const [label,mutate] of cases){const payload=structuredClone(valid);mutate(payload.state);assert.throws(()=>deserializeState(JSON.stringify(payload)),label);}
 assert.deepEqual(deserializeState(JSON.stringify(valid)),actualWin());
});
