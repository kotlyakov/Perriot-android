import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {independentEffect,heldJokerEffects} from '../../src/content/jokers.js';
import {scoreHand} from '../../src/core/score.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const card=(id,rank=8,suit='clubs',enhancement)=>({id,rank,suit,...(enhancement?{enhancement}:{})});
const score=(keys,played=[card('p',14)],held=[],extra={})=>scoreHand({handLevels:{},jokers:keys.map((entityId,i)=>({id:'j'+i,entityId})),cards:Object.fromEntries([...played,...held].map(c=>[c.id,c])),hand:held.map(c=>c.id),money:0n,...extra},played);
const effects=r=>r.trace.filter(e=>e.phase==='independent');
test('Baron and Shoot the Moon activate only held non-Stone Kings and Queens, in held/Joker order',()=>{
 const r=score(['j_baron','j_shoot_the_moon'],[card('p',14)],[card('king',13,'clubs','steel'),card('queen',12),card('stone',13,'clubs','stone')]);
 assert.deepEqual(r.trace.filter(e=>e.phase==='held_card').map(e=>[e.sourceId,e.effectSourceId,e.operation]),[['king',undefined,'multiply_mult'],['king','j0','multiply_mult'],['queen','j1','add_mult']]);
 assert.deepEqual(r.mult,{n:61n,d:4n});assert.equal(r.score,244n);
 assert.equal(score(['j_baron','j_shoot_the_moon'],[card('p',13)],[]).mult,1n);
 assert.equal(score(['j_baron','j_shoot_the_moon'],[card('p',14)],[card('king',13,'spades'),card('queen',12,'spades')],{bossState:{id:'bl_goad'}}).mult,1n);
});
test('Flower Pot assigns each Wild to one missing suit and uses only scoring cards',()=>{
 const four=[card('h',8,'hearts'),card('d',8,'diamonds'),card('s',8,'spades'),card('w',8,'clubs','wild')];
 assert.equal(score(['j_flower_pot'],four).mult,21n);
 assert.equal(effects(score(['j_flower_pot'],[card('w',14,'clubs','wild')])).length,0);
 assert.equal(effects(score(['j_flower_pot'],[card('a',8,'hearts'),card('b',8,'diamonds'),card('c',4,'spades'),card('d',3,'clubs')])).length,0);

});
test('Flower Pot bypasses ordinary debuff but debuffed Wild cannot fill a missing suit',()=>{
 const plain=['hearts','diamonds','spades','clubs'].map((s,i)=>card('p'+i,8,s));
 assert.equal(effects(score(['j_flower_pot'],plain,[],{bossState:{id:'bl_goad'}})).length,1);
 const wild=plain.map((c,i)=>i===2?{...c,enhancement:'wild'}:c);
 assert.equal(effects(score(['j_flower_pot'],wild,[],{bossState:{id:'bl_goad'}})).length,0);
});
test('Seeing Double needs separate scoring suit assignments and respects debuffs',()=>{
 assert.equal(score(['j_seeing_double'],[card('a',8,'clubs'),card('b',8,'hearts')]).mult,4n);
 assert.equal(effects(score(['j_seeing_double'],[card('w',14,'clubs','wild')])).length,0);
 assert.equal(score(['j_seeing_double'],[card('a',8,'clubs'),card('b',8,'clubs','wild')]).mult,4n);
 assert.equal(effects(score(['j_seeing_double'],[card('a',8,'clubs'),card('b',8,'spades')],[],{bossState:{id:'bl_goad'}})).length,0);
});
test('Stone and Steel Jokers count all owned playing cards, with exact fifths and zero boundaries',()=>{
 const p=card('p',14),other=[card('s',2,'clubs','stone'),card('t',4,'hearts','steel')];
 const r=score(['j_stone','j_steel_joker'],[p],[],{cards:Object.fromEntries([p,...other].map(c=>[c.id,c]))});
 assert.equal(r.chips,41n);assert.deepEqual(r.mult,{n:6n,d:5n});assert.equal(r.score,49n);
 assert.equal(effects(score(['j_stone','j_steel_joker'])).length,0);
});
test("Driver's License counts enhancements, never editions, and triggers at exactly 16",()=>{
 for(const count of [0,15,16]){
  const all=Array.from({length:17},(_,i)=>card('c'+i,8,'clubs',i<count?'bonus':undefined));all[16].edition='foil';
  const r=score(['j_drivers_license'],[card('p',14)],[],{cards:Object.fromEntries(all.map(c=>[c.id,c]))});
  assert.equal(r.mult,count===16?3n:1n);
 }
});
test('Bull and Bootstraps use exact money and floor boundaries without negative triggers',()=>{
 for(const amount of [-1n,0n,4n,5n,9n,10n,9007199254740995n]){
  const r=score(['j_bull','j_bootstraps'],undefined,[],{money:amount});
  assert.equal(r.chips,16n+(amount>0n?2n*amount:0n));assert.equal(r.mult,1n+(amount>=5n?2n*(amount/5n):0n));
 }
 const r=score(['j_bootstraps','j_steel_joker'],undefined,[],{money:5n,cards:{t:card('t',7,'hearts','steel')}});
 assert.deepEqual(r.mult,{n:18n,d:5n});
});
const act=(s,type,fields={})=>dispatch(s,{type,expectedRevision:s.revision,...fields});
function playing(keys){let s=act(createRun('snapshot-jokers',{runId:'snapshot-jokers',money:10n}),'START_BLIND').state;s.jokers=keys.map((entityId,i)=>({id:'j'+i,entityId,cost:5n,sellCost:2n}));return s;}
test('score save replays held cards before redraw and pre-PLAY counters for existing and new Jokers',()=>{
 for(const keys of [['j_blackboard'],['j_raised_fist'],['j_acrobat','j_banner','j_mystic_summit'],['j_baron','j_shoot_the_moon']]){
  const s=playing(keys),played=Object.values(s.cards).find(c=>c.rank===2&&c.suit==='hearts').id;
  const held=Object.values(s.cards).filter(c=>c.rank===13||c.rank===12).slice(0,7).map(c=>c.id);
  s.hand=[played,...held];s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));s.discardPile=[];s.round.handsRemaining=keys.includes('j_acrobat')?1:4;s.round.discardsRemaining=0;
  const r=act(s,'PLAY_HAND',{cardIds:[played]});assert.equal(r.error,null);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
 }
});
test('money snapshot replays Bull and Bootstraps before Tooth spending, and rejects corrupt context',()=>{
 let s=createRun('BOSS0111',{runId:'tooth-money',money:10n,referenceRng:true,referenceShop:true});
 s.round.ante=3;s.round.blindId='boss';s.round.target=4000n;s.apkShop.context.ante=3;s.apkBlinds.ante=3;s.apkBlinds.tagContext.ante=3;s.apkBlinds.bossId='bl_tooth';s.apkBlinds.bossesUsed.bl_tooth=1;
 s=act(s,'START_BLIND').state;s.jokers=['j_bull','j_bootstraps'].map((entityId,i)=>({id:'j'+i,entityId,cost:5n,sellCost:2n}));
 const r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);assert.equal(r.state.money,9n);const bull=effects(r.state.lastScore).find(e=>e.sourceId==='j0');assert.equal(bull.after.chips-bull.before.chips,18n);assert.equal(r.state.lastScore.mult,3n);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
 const payload=JSON.parse(serializeState(r.state));payload.state.lastScore.scoringMoneyBefore='11';assert.throws(()=>deserializeState(JSON.stringify(payload)));
});

test('Ox removes existing money before independent money Jokers',()=>{
 const r=score(['j_bull','j_bootstraps'],undefined,[],{money:10n,bossState:{id:'bl_ox',oxHand:'high_card'}});
 assert.equal(effects(r).length,0);
});

test('Lucky buffered income feeds Bull and Bootstraps after Tooth or Ox removes starting money',()=>{
 for(const [boss,money] of [[undefined,24n],[{id:'bl_tooth'},23n],[{id:'bl_ox',oxHand:'high_card'},20n]]){
  const s=createRun('LUCKY0018',{runId:'lucky-money-jokers',money:4n,referenceRng:true,referenceShop:true});
  s.jokers=[{id:'bull',entityId:'j_bull'},{id:'boots',entityId:'j_bootstraps'}];s.bossState=boss;
  const r=scoreHand(s,[card('lucky',14,'spades','lucky')]);
  assert.equal(r.trace.find(e=>e.type==='score_money').amount,20n);
  const bull=effects(r)[0];assert.equal(bull.after.chips-bull.before.chips,money*2n);
  assert.equal(r.mult,21n+(money/5n)*2n);
 }
});

test('89 deterministic native Card method fixtures match the supported held, tally, money and suit effects',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../../scripts/reference-rng/joker-deck-money-fixtures.json',import.meta.url)));
 const suits={Hearts:'hearts',Diamonds:'diamonds',Spades:'spades',Clubs:'clubs'};
 for(const c of fixture.cases){
  let effect;
  if(c.phase==='held'){
   const held=card('h',c.rank,'hearts',c.stone?'stone':undefined);
   effect=c.debuff?undefined:heldJokerEffects(c.key,held,[held])[0];
  }else{
   const enhancement={j_stone:'stone',j_steel_joker:'steel',j_drivers_license:'bonus'}[c.key];
   effect=independentEffect(c.key,[],{playingCards:Array.from({length:c.count??0},(_,i)=>card('c'+i,8,'clubs',enhancement)),money:BigInt((c.money??0)+(c.buffer??0)),scoringCards:c.scoring?.map((pc,i)=>({...card('s'+i,pc.rank,suits[pc.suit],pc.stone?'stone':pc.wild?'wild':undefined),debuffed:pc.debuff}))??[]});
  }
  const amount=effect?(typeof effect.amount==='bigint'?Number(effect.amount):Number(effect.amount.n)/Number(effect.amount.d)):undefined;
  const actual=effect?{[c.phase==='held'?(effect.operation==='add_mult'?'h_mult':'x_mult'):{add_chips:'chip_mod',add_mult:'mult_mod',multiply_mult:'Xmult_mod'}[effect.operation]]:amount}:{};
  assert.deepEqual(actual,c.expected,JSON.stringify(c));
 }
 assert.equal(fixture.cases.length,89);
});
test('replay rejects inert forged money and round counters and accepts compatible old score metadata',()=>{
 let s=playing(['j_acrobat','j_banner']);s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;
 const saved=JSON.parse(serializeState(s));const forged=structuredClone(saved);forged.state.lastScore.scoringRoundBefore.handsRemaining=5;
 assert.throws(()=>deserializeState(JSON.stringify(forged)));
 const old=structuredClone(saved);delete old.state.lastScore.scoringRoundBefore;
 assert.doesNotThrow(()=>deserializeState(JSON.stringify(old)));
 s=playing(['j_bull','j_bootstraps']);s.money=0n;s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;
 const inert=JSON.parse(serializeState(s));inert.state.lastScore.scoringMoneyBefore='-1';assert.throws(()=>deserializeState(JSON.stringify(inert)));
});

test('Driver tally replay retains the sixteenth enhanced Glass card destroyed after independent scoring',()=>{
 let s=act(createRun('GLASS2',{runId:'glass-driver',money:4n,referenceRng:true,referenceShop:true}),'START_BLIND').state;
 const glassId=s.hand[0];s.cards[glassId].enhancement='glass';
 for(const c of Object.values(s.cards).filter(c=>c.id!==glassId).slice(0,15))c.enhancement='bonus';
 s.jokers=[{id:'driver',entityId:'j_drivers_license',cost:7n,sellCost:3n}];s.apkShop.context=currentApkShopContext(s);
 const r=act(s,'PLAY_HAND',{cardIds:[glassId]});assert.equal(r.error,null);
 assert.equal(r.state.lastScore.glassRolls[0].destroyed,true);
 assert.equal(effects(r.state.lastScore).find(e=>e.sourceId==='driver').operation,'multiply_mult');
 assert.equal(Object.values(r.state.cards).filter(c=>c.enhancement).length,15);
 assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
});
test('held snapshot cannot invent an un-drawn card even with a coherent Blackboard trace',()=>{
 const s=playing(['j_blackboard']);
 const selected=s.hand.find(id=>s.cards[id].suit==='hearts')??s.hand[0];
 s.hand=[selected];s.drawPile=Object.keys(s.cards).filter(id=>id!==selected);s.round.handSize=1;
 const r=act(s,'PLAY_HAND',{cardIds:[selected]});assert.equal(r.error,null);
 const payload=JSON.parse(serializeState(r.state));
 payload.state.lastScore.heldCardIds=[payload.state.drawPile.find(id=>s.cards[id].suit==='spades')];
 assert.throws(()=>deserializeState(JSON.stringify(payload)));
});
test('ordinary held snapshot respects pre-PLAY capacity after subtracting the played card count',()=>{
 const s=playing(['j_blackboard']),selected='card_clubs_2';
 const held=Object.values(s.cards).filter(c=>c.suit==='hearts').slice(0,7).map(c=>c.id);
 s.hand=[selected,...held];s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));
 const r=act(s,'PLAY_HAND',{cardIds:[selected]});assert.equal(r.error,null);
 const payload=JSON.parse(serializeState(r.state));payload.state.lastScore.heldCardIds.push(r.state.hand.find(id=>!held.includes(id)));
 assert.throws(()=>deserializeState(JSON.stringify(payload)));
});
