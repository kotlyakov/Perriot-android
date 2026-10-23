import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {item7BeforeScore,item7ScoredEffects,item7HeldEffects,item7IndependentEffect} from '../../src/core/joker-score-effects.js';
import {applyItem7AfterScore,applyItem7EndRound,applyItem7Discard} from '../../src/core/joker-item7-lifecycle.js';
import {applyItem7EconomyContext} from '../../src/core/joker-item7-economy.js';
import {evaluateHand} from '../../src/core/hands.js';
import {getJokerCashoutBonuses} from '../../src/core/joker-cashout.js';
const fixture=JSON.parse(gunzipSync(readFileSync(new URL('../../scripts/reference-rng/item7-fixtures.json.gz',import.meta.url))));
const number=v=>typeof v==='object'?Number(v.n)/Number(v.d):Number(v);
function normalizeEffects(effects){
 return effects.filter(Boolean).map(e=>({operation:e.operation,amount:number(e.amount)})).filter(e=>e.amount!==(e.operation==='multiply_mult'?1:0));
}
function nativeEffects(expected){
 const operations={chips:'add_chips',chip_mod:'add_chips',mult:'add_mult',mult_mod:'add_mult',h_mult:'add_mult',x_mult:'multiply_mult',Xmult_mod:'multiply_mult',x_mult_mod:'multiply_mult',dollars:'money',h_dollars:'money'};
 return normalizeEffects(Object.entries(expected).map(([key,amount])=>({operation:operations[key],amount})));
}
function setup(f){
 const o=f.options,j={id:'j',entityId:f.key,...o.runtime,...(o.debuff?{debuffed:true}:{})};
 if(j.rocketDollars!=null)j.rocketDollars=BigInt(j.rocketDollars);
 j.loyaltyRemaining=((5-(o.handsPlayed??0))%6+6)%6;
 const cards=[{id:'c1',rank:o.rank??12,suit:(o.suit??'Hearts').toLowerCase(),enhancement:o.kind??'base',...(o.cardDebuff?{debuffed:true}:{})},{id:'c2',rank:13,suit:'spades',enhancement:'base'}];
 const deck=Object.fromEntries(Array.from({length:o.deckCount??52},(_,i)=>[`d${i}`,{id:`d${i}`,rank:2,suit:'spades',enhancement:'base'}]));
 const state={jokers:[j],cards:deck,hand:[],money:BigInt(o.money??20),handUsage:{high_card:(o.played??1)-1},tarotUsed:o.tarot??0,startingDeckSize:52,round:{ancientSuit:'hearts',idolCard:{rank:12,suit:'hearts'},handUsage:{high_card:(o.playedThisRound??1)-1},discardsRemaining:o.discardsLeft??0,discardsUsed:o.discardsUsed??0},consumableUsage:{}};
 for(let n=0;n<(o.planets??0);n++)state.consumableUsage[`planet${n}`]={set:'Planet',count:7};
 state.consumableUsage.tarot={set:'Tarot',count:2};
 const opts={handId:'high_card',scoringCards:cards,roll:()=>o.sample??0,luckyTriggered:o.lucky??false,isDebuffed:c=>!!c.debuffed};
 const context={source:j,target:j,copied:!!o.copied};
 return {state,j,cards,opts,context};
}

test('original item 7 numeric scoring returns and per-card growth match at probability and rank boundaries',()=>{
 const failures=[];let count=0;
 for(const [index,f] of fixture.cases.entries()){
  if(!['independent','scored','held'].includes(f.phase))continue;
  const {state,j,cards,opts,context}=setup(f);let effects=[];
  if(!j.debuffed){
   if(f.phase==='independent')effects=[item7IndependentEffect(state,context,opts)];
   if(f.phase==='scored')effects=item7ScoredEffects(state,context,cards[(f.options.index??1)-1],opts);
   if(f.phase==='held')effects=item7HeldEffects(state,context,cards[0],opts);
  }
  const label=`native item7 case ${index} ${f.key} ${f.phase} ${JSON.stringify(f.options)}`;
  try{
   assert.deepEqual(normalizeEffects(effects),nativeEffects(f.expected),label);
   if(f.phase==='scored'&&f.key==='j_hiker')assert.equal(cards[0].permaBonus??0,f.after.cardBonus,label);
   if(f.phase==='scored'&&f.key==='j_wee')assert.equal(j.chips??0,f.after.chips,label);
   if(f.phase==='scored'&&f.key==='j_lucky_cat')assert.equal(j.xMult??1,f.after.xMult,label);
  }catch(error){failures.push(error.message);}
  count++;
 }
 assert.ok(count>=1500,`expected broad native scoring matrix, got ${count}`);
 assert.deepEqual(failures,[]);
});

test('item 7 cashout agrees with unchanged original calculate_dollar_bonus',()=>{
 for(const [index,f]of fixture.cases.entries()){
  if(f.phase!=='cashout')continue;
  const {state}=setup(f);
  const amount=getJokerCashoutBonuses(state).reduce((sum,row)=>sum+row.amount,0n);
  assert.equal(amount,BigInt(f.expected.dollars??0),`native cashout ${index} ${f.key} ${JSON.stringify(f.options)}`);
 }
});


test('original before-score growth and transformations agree for hands, silent triggers and copies',()=>{
 const names={'Default Base':'base','Gold Card':'gold','Stone Card':'stone','Wild Card':'wild'};
 const failures=[];
 for(const [index,f]of fixture.cases.entries()){
  if(f.phase!=='before'||f.options.copied)continue;
  const {state,j,opts}=setup(f),o=f.options;
  const cards=o.ranks.map((rank,i)=>({id:'c'+i,rank,suit:['hearts','diamonds','spades','clubs'][i%4],enhancement:i===0?'gold':'base'}));
  const handId=evaluateHand(cards).handId;
  state.handLevels={[handId]:1};state.handUsage={pair:o.otherPlayed,[handId]:o.played-1};
  const copy=f.options.debuff?null:fixture.cases.find(c=>c.phase==='before'&&c.key===f.key&&c.options.copied&&!c.options.debuff&&JSON.stringify(c.options.ranks)===JSON.stringify(o.ranks));
  // Native queries copied then owned target in inventory order. The two raw
  // original calls define expected growth; only Space permits copied growth.
  if(copy)state.jokers.unshift({id:'copy',entityId:'j_blueprint'});
  item7BeforeScore(state,{...opts,handId,playedCards:cards,scoringCards:cards});
  const label=`native before ${index} ${f.key} ${JSON.stringify(o)}`;
  try{
   if(['j_trousers','j_ride_the_bus','j_green_joker'].includes(f.key))assert.equal(j.mult??0,f.after.mult,label);
   if(['j_square','j_runner'].includes(f.key))assert.equal(j.chips??0,f.after.chips,label);
   if(['j_obelisk','j_vampire'].includes(f.key))assert.equal(j.xMult??1,f.after.xMult,label);
   if(['j_midas_mask','j_vampire'].includes(f.key))assert.deepEqual(cards.map(c=>c.enhancement),f.after.enhancements.map(name=>names[name]),label);
   if(f.key==='j_space')assert.equal(state.handLevels[handId],1+Number(f.expected.level_up??false)+Number(copy?.expected.level_up??false),label);
  }catch(error){failures.push(error.message);}
 }
 assert.deepEqual(failures,[]);
});

test('original shop and round economy contexts mutate counters with native copy guards',()=>{
 for(const [index,f]of fixture.cases.entries()){
  if(!['reroll_shop','selling_card','skipping_booster','end_of_round'].includes(f.phase))continue;
  const {state,j}=setup(f);state.round.blindId=f.options.boss?'boss':'small';
  // A lone target covers its original owned call. Copied raw calls are checked
  // through a Blueprint + target inventory: only the owned target may advance.
  const own=fixture.cases.find(c=>c.key===f.key&&c.phase===f.phase&&c.options.boss===f.options.boss&&c.options.debuff===f.options.debuff&&!c.options.copied);
  if(f.options.copied)state.jokers.unshift({id:'copy',entityId:'j_blueprint'});
  applyItem7EconomyContext(state,{type:f.phase},[]);
  const label=`native economy ${index} ${f.key} ${JSON.stringify(f.options)}`;
  if(f.key==='j_flash'||f.key==='j_red_card')assert.equal(j.mult??0,own.after.mult,label);
  if(f.key==='j_campfire')assert.equal(j.xMult??1,own.after.xMult,label);
  if(f.key==='j_rocket')assert.equal(j.rocketDollars??1n,BigInt(own.after.rocketDollars),label);
 }
});

test('unchanged native discard and depletion branches agree on counters, money and scheduled removals',()=>{
 const failures=[];
 for(const [index,f]of fixture.cases.entries()){
  if(f.phase!=='discard'&&f.phase!=='after'&&!(f.phase==='end_of_round'&&['j_popcorn','j_turtle_bean'].includes(f.key)))continue;
  const {state,j}=setup(f),o=f.options;
  state.round.castleSuit='hearts';state.round.mailRank=12;
  const cards=(o.ranks??[12,13]).map((rank,i)=>({id:'c'+i,rank,suit:['hearts','diamonds','spades','clubs'][i%4],enhancement:'base',...(o.cardDebuff&&i===0?{debuffed:true}:{})}));
  state.cards=Object.fromEntries(cards.map(c=>[c.id,c]));
  if(o.cardDebuff)state.bossState={id:'bl_pillar',playedBeforeBoss:['c0']};
  let removedCards=[];
  if(f.phase==='discard')removedCards=applyItem7Discard(state,cards.map(c=>c.id),[]);
  if(f.phase==='after')applyItem7AfterScore(state,[]);
  if(f.phase==='end_of_round')applyItem7EndRound(state,[]);
  const label=`native lifecycle ${index} ${f.key} ${f.phase} ${JSON.stringify(o)}`;
  try{
   // For these three depletion effects, the native original schedules its
   // removal callback without mutating the exhausted counter synchronously.
   const queuedRemoval=['j_ramen','j_ice_cream','j_popcorn','j_turtle_bean'].includes(f.key)&&f.after.queuedEvents>0;
   assert.equal(!state.jokers.includes(j),queuedRemoval,label);
   if(!queuedRemoval){
    if(f.key==='j_ramen'||f.key==='j_hit_the_road'||f.key==='j_yorick')assert.ok(Math.abs((j.xMult??(f.key==='j_ramen'?2:1))-f.after.xMult)<1e-9,label);
    if(f.key==='j_green_joker'||f.key==='j_popcorn')assert.equal(j.mult??0,f.after.mult,label);
    if(f.key==='j_castle'||f.key==='j_ice_cream')assert.equal(j.chips??0,f.after.chips,label);
    if(f.key==='j_yorick')assert.equal(j.yorickDiscards??23,f.after.yorickDiscards,label);
    if(f.key==='j_turtle_bean')assert.equal(j.turtleHandSize??5,f.after.turtleHandSize,label);
   }
   assert.equal(state.money,20n+BigInt(f.after.pendingMoney),label);
   assert.equal(removedCards.length,Number(f.after.removeCard),label);
  }catch(error){failures.push(error.message);}
 }
 assert.deepEqual(failures,[]);
});

test('item 7 oracle pins source hashes and declares injected probability and lifecycle scope',()=>{
 assert.equal(fixture.cases.length,2000);
 assert.equal(Object.keys(fixture.source.filesSha256).length,3);
 assert.equal(fixture.source.filesSha256['card.lua'],'a3a613f90eca3e39042d28a70b129ece292644cbe79970e127e27c49bf4dee53');
 assert.match(fixture.source.method,/Unchanged original Card:set_ability/);
 assert.match(fixture.source.method,/JIT on\/off identical/);
 assert.match(fixture.source.limits,/Probability samples injected/);
 assert.match(fixture.source.limits,/callbacks not executed/);
 assert.ok(fixture.cases.some(f=>f.options.sample===0.5));
 assert.ok(fixture.cases.some(f=>f.options.kind==='gold'&&f.key==='j_ticket'&&f.expected.dollars===4));
 assert.ok(fixture.cases.some(f=>f.key==='j_photograph'&&f.options.index===2&&f.expected.x_mult==null));
});
