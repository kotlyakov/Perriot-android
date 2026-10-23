import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch,replayEffectActions} from '../../src/core/run.js';
import {changeHandSize,realHandSize} from '../../src/core/hand-size.js';
import {finishItem7Action} from '../../src/core/joker-item7-actions.js';
import {disableBoss,bossTarget} from '../../src/core/boss-effects.js';

const run=()=>createRun('SPECTRALSIZE',{runId:'spectral-size',money:100n,referenceRng:true,referenceShop:true});
const act=(state,type,extra={})=>{const result=dispatch(state,{type,expectedRevision:state.revision,...extra});assert.equal(result.error,null);return result.state;};
function debt(state,delta){state.spectralHandSizeDelta=(state.spectralHandSizeDelta??0)+delta;changeHandSize(state,delta);return state;}
function boss(state,id,ante=1){state.round.blindId='boss';state.round.ante=ante;state.apkBlinds.ante=ante;state.apkBlinds.tagContext.ante=ante;state.apkBlinds.bossId=id;state.apkBlinds.bossesUsed[id]=1;state.apkShop.context.ante=ante;state.round.target=bossTarget(state);return state;}
function addPassive(state,entityId,fields={}){const next=structuredClone(state);next.jokers.push({id:`joker-${next.jokers.length}`,entityId,sellCost:1n,creationOrdinal:next.nextJokerCreationOrdinal++,...fields});finishItem7Action(state,next,{type:'USE_CONSUMABLE'},[]);return next;}

test('negative spectral debt survives zero and passive acquisition/removal',()=>{
 let state=debt(run(),-10);assert.equal(state.round.handSize,0);assert.equal(realHandSize(state),-2);
 state=addPassive(state,'j_juggler');assert.equal(state.round.handSize,0);assert.equal(realHandSize(state),-1);
 state=addPassive(state,'j_troubadour');assert.equal(state.round.handSize,1);assert.equal(realHandSize(state),1);
 const before=state;state=structuredClone(state);state.jokers=state.jokers.filter(j=>j.entityId!=='j_juggler');finishItem7Action(before,state,{type:'SELL_OWNED_CARD',cardId:'joker-0'},[]);
 assert.equal(state.round.handSize,0);assert.equal(realHandSize(state),0);
});

test('native positive grants repay debt then draw their raw delta only above one',()=>{
 let state=act(run(),'START_BLIND');state=debt(state,-10);const held=state.hand.length;
 state=addPassive(state,'j_troubadour');assert.equal(realHandSize(state),0);assert.equal(state.hand.length,held);
 state=addPassive(state,'j_juggler');assert.equal(realHandSize(state),1);assert.equal(state.hand.length,held);
 state=addPassive(state,'j_troubadour');assert.equal(realHandSize(state),3);assert.equal(state.hand.length,held+2);
});

test('zero hand size loses on initial draw and final residual play/discard only',()=>{
 for(const delta of [-8,-10]){const state=act(debt(run(),delta),'START_BLIND');assert.equal(state.phase,'game_over');assert.equal(state.hand.length,0);}
 for(const type of ['PLAY_HAND','DISCARD']){
  let state=debt(act(run(),'START_BLIND'),-10);state.round.target=999999n;
  while(state.hand.length>1){state=act(state,type,{cardIds:state.hand.slice(0,Math.min(5,state.hand.length-1))});assert.equal(state.phase,'playing');}
  state=act(state,type,{cardIds:[state.hand[0]]});assert.equal(state.phase,'game_over');assert.equal(state.hand.length,0);
 }
});

test('Manacle stores raw baseline and disabling restores only its own subtraction',()=>{
 for(const delta of [-7,-9]){
  let state=act(boss(debt(run(),delta),'bl_manacle'),'START_BLIND');assert.equal(state.bossState.baseHandSize,8+delta);assert.equal(realHandSize(state),7+delta);assert.equal(state.phase,'game_over');
  // Disable is available in an active round with residual cards, including size zero.
  state.phase='playing';state.hand=[state.drawPile.pop()];const count=state.hand.length;disableBoss(state,[]);
  assert.equal(realHandSize(state),8+delta);assert.equal(state.hand.length,count);
 }
});

test('Heart passive transitions preserve debt and cashout restores active passives',()=>{
 let state=addPassive(debt(run(),-8),'j_juggler');state=addPassive(state,'j_joker');state=act(boss(state,'bl_final_heart',8),'START_BLIND');
 assert.equal(realHandSize(state),state.jokers.find(j=>j.entityId==='j_juggler').debuffed?0:1);
 assert.equal(state.round.handSize,Math.max(0,realHandSize(state)));
 state.phase='round_won';state.round.score=state.round.target;state=act(state,'CASH_OUT');assert.equal(realHandSize(state),1);assert.equal(state.round.handSize,1);
});

test('Turtle decay preserves raw spectral debt through terminal play and replay',()=>{
 let state=addPassive(debt(run(),-10),'j_turtle_bean');state=act(state,'START_BLIND');assert.equal(state.round.handSize,3);
 state.round.target=999999n;state.round.handsRemaining=1;state=act(state,'PLAY_HAND',{cardIds:[state.hand[0]]});assert.equal(state.round.handSize,2);assert.equal(realHandSize(state),2);
 const replay=replayEffectActions(state.effectReplay.before,state.effectReplay.actions),expected=structuredClone(state);delete expected.effectReplay;assert.deepEqual(replay,expected);
});

test('spectral debt persists through cashout, shop, blind selection and next draw',()=>{
 let state=debt(act(run(),'START_BLIND'),-7);state.round.score=state.round.target;state.phase='round_won';state=act(state,'CASH_OUT');state=act(state,'LEAVE_SHOP');assert.equal(state.round.handSize,1);state=act(state,'START_BLIND');assert.equal(state.hand.length,1);
});

test('Spectral and Hanged shortfall epochs coexist and consume on refill or cashout',()=>{
 for(const type of ['PLAY_HAND','DISCARD','CASH_OUT']){
  let state=act(run(),'START_BLIND');
  for(const prefix of ['spectral','hanged']){state[`${prefix}ShortfallCardIds`]=[`${prefix}-destroyed`];state[`${prefix}ShortfallEpoch`]={cardIds:[`${prefix}-destroyed`],revision:state.revision,ante:state.round.ante,blindId:state.round.blindId,handsRemaining:state.round.handsRemaining};}
  if(type==='CASH_OUT'){state.phase='round_won';state.round.score=state.round.target;}
  state=act(state,type,type==='CASH_OUT'?{}:{cardIds:[state.hand[0]]});
  for(const prefix of ['spectral','hanged']){assert.equal(state[`${prefix}ShortfallCardIds`],undefined);assert.equal(state[`${prefix}ShortfallEpoch`].consumed,true);assert.equal(state[`${prefix}ShortfallEpoch`].consumedBy,type);}
 }
});

test('disabling Heart with Chicot acquisition restores passive debt exactly once',()=>{
 let state=debt(run(),-8);state=addPassive(state,'j_juggler');state=addPassive(state,'j_joker');state=act(boss(state,'bl_final_heart',8),'START_BLIND');
 // Fix a valid disabled passive outcome independently of the seeded selection.
 for(const joker of state.jokers)joker.debuffed=joker.entityId==='j_juggler';state.bossState.heartDebuffedJokerId=state.jokers[0].id;
 state.round.handSize=0;state.round.realHandSize=0;state.bossState.baseHandSize=0;state.phase='playing';
 state=addPassive(state,'j_chicot');assert.equal(state.bossState.disabled,true);assert.equal(realHandSize(state),1);assert.equal(state.bossState.baseHandSize,1);
});
