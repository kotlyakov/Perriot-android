import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreHand} from '../../src/core/score.js';
import {createApkRng,nextApkRandom} from '../../src/core/apk-rng.js';
import {applyItem7SixthSense} from '../../src/core/joker-item7-creation.js';
import {item7BeforeScore,item7ScoredEffects,item7IndependentEffect} from '../../src/core/joker-score-effects.js';
const card=(id,rank=2,suit='hearts',extra={})=>({id,rank,suit,...extra});
const joker=(entityId,id=entityId,extra={})=>({id,entityId,...extra});
const state=(jokers,cards=[card('c')],extra={})=>({jokers,cards:Object.fromEntries(cards.map(c=>[c.id,c])),hand:cards.map(c=>c.id),handLevels:{high_card:1},money:0n,round:{handsRemaining:3,discardsRemaining:3},rng:{apk:createApkRng('ITEM7B-SCORING')},...extra});
const context=j=>({source:j,target:j,copied:false});
const opts={handId:'high_card',scoringCards:[],playedCards:[],isDebuffed:()=>false,roll:()=>0};
// Original card.lua:2739 debuffed_hand and :3722 joker_main are exclusive.
test('Matador pays copied and owned contexts once on a rejected Psychic hand',()=>{
 const s=state([joker('j_blueprint'),joker('j_matador')],undefined,{bossState:{id:'bl_psychic',disabled:false}});
 const result=scoreHand(s,[s.cards.c]);
 assert.equal(result.handDebuffed,true);
 assert.equal(result.score,0n);
 assert.deepEqual(result.trace.filter(e=>e.type==='score_money').map(e=>[e.sourceId,e.amount]),[['j_blueprint',8n],['j_matador',8n]]);
});
// Original state_events.lua:895–964 invokes other_joker for every owned slot,
// including a debuffed target; calculate_joker guards the Baseball source.
test('Baseball multiplies at a debuffed uncommon target slot in inventory order',()=>{
 const cards=[card('c')],s=state([joker('j_trousers','target',{debuffed:true,mult:20}),joker('j_baseball'),joker('j_joker')],cards);
 const result=scoreHand(s,cards);
 assert.deepEqual(result.mult,{n:11n,d:2n});
 const hit=result.trace.find(e=>e.effectSourceId==='j_baseball');
 assert.equal(hit.sourceId,'target');
 assert.equal(hit.after.mult.n,3n);
 assert.equal(hit.after.mult.d,2n);
});
test('debuffed Baseball source is silent while a copied Baseball keeps slot timing',()=>{
 const cards=[card('c')];
 const muted=scoreHand(state([joker('j_trousers','target',{debuffed:true}),joker('j_baseball','b',{debuffed:true})],cards),cards);
 assert.equal(muted.mult,1n);
 const copied=scoreHand(state([joker('j_trousers','target',{mult:2}),joker('j_blueprint'),joker('j_baseball')],cards),cards);
 assert.deepEqual(copied.mult,{n:27n,d:4n});
 assert.equal(copied.trace.filter(e=>e.effectSourceId==='j_baseball'||e.effectSourceId==='j_blueprint').length,2);
});
test('Idol with an empty native target never invents an Ace numeric id',()=>{
 const j=joker('j_idol'),s=state([j]);s.round.idolCard={suit:'spades'};
 assert.deepEqual(item7ScoredEffects(s,context(j),card('ace',14,'spades'),opts),[]);
 delete s.round.idolCard;
 assert.deepEqual(item7ScoredEffects(s,context(j),card('ace',14,'spades'),opts),[]);
});
// Original native predicates invoke get_id before Blueprint guards; Stone's
// accessor draws every time, so equivalent boolean results can consume more RNG.
test('copied Wee and Triboulet retain native rank accessor chronology',()=>{
 let draws=0;
 const stone=card('stone',2,'hearts',{enhancement:'stone'}),o={...opts,rankGetter:()=>{draws++;return -100;}};
 const wee=joker('j_wee');item7ScoredEffects(state([wee]),{...context(wee),copied:true},stone,o);
 assert.equal(draws,1);assert.equal(wee.chips,undefined);
 const trib=joker('j_triboulet');item7ScoredEffects(state([trib]),context(trib),stone,o);
 assert.equal(draws,3);
});
test('Superposition scans every scored rank before testing Straight and skips scan at capacity',()=>{
 const j=joker('j_superposition'),cards=[card('ace',14),card('stone',2,'hearts',{enhancement:'stone'})],s=state([j],cards);
 const ranks=[],created=[],o={...opts,scoringCards:cards,rankGetter:c=>{ranks.push(c.id);return c.enhancement==='stone'?-100:c.rank;},create:c=>created.push(c)};
 item7IndependentEffect(s,context(j),o);
 assert.deepEqual(ranks,['ace','stone']);assert.deepEqual(created,[]);
 ranks.length=0;item7IndependentEffect(s,context(j),{...o,handId:'straight'});
 assert.deepEqual(ranks,['ace','stone']);assert.equal(created.length,1);
 ranks.length=0;s.consumables=[{id:'a'},{id:'b'}];item7IndependentEffect(s,context(j),{...o,handId:'straight'});
 assert.deepEqual(ranks,[]);assert.equal(created.length,1);
});
test('Obelisk tie grows against postplay usage and resets when current hand becomes strictly greatest',()=>{
 const j=joker('j_obelisk','o',{xMult:2}),s=state([joker('j_blueprint'),j],undefined,{handUsage:{high_card:3,pair:4}});
 item7BeforeScore(s,opts);assert.equal(j.xMult,2.2);
 s.handUsage.high_card=4;item7BeforeScore(s,opts);assert.equal(j.xMult,1);
});
test('Vampire before Midas preserves final Gold and only the first Vampire consumes each card',()=>{
 const c=card('queen',12,'hearts',{enhancement:'bonus'}),v=joker('j_vampire','v'),v2=joker('j_vampire','v2'),s=state([v,joker('j_midas_mask'),v2],[c]);
 item7BeforeScore(s,{...opts,playedCards:[c],scoringCards:[c]});
 assert.equal(v.xMult,1.1);assert.equal(v2.xMult,undefined);assert.equal(c.enhancement,'gold');
});
// state_events.lua before loop invokes DNA at its own inventory slot, so the
// physical copy captures precisely the enhancements present at that boundary.
test('DNA captures Midas and Vampire transformations in inventory order',()=>{
 for(const [keys,enhancement] of [
  [['j_midas_mask','j_dna'],'gold'],
  [['j_dna','j_midas_mask'],'bonus'],
  [['j_vampire','j_dna'],undefined],
  [['j_dna','j_vampire'],'bonus'],
 ]){
  const c=card('card_hearts_12',12,'hearts',{enhancement:'bonus'}),jokers=keys.map(k=>joker(k));
  jokers.push(joker('j_hologram','h',{xMult:1}));
  const s=state(jokers,[c]),before=structuredClone(s),result=scoreHand(s,[c]);
  assert.equal(result.createdPlayingCards[0].enhancement,enhancement,keys.join('→'));
  assert.equal(result.item7State.jokers.at(-1).xMult,1.25);
  assert.deepEqual(s,before);
 }
});
test('8 Ball materializes after all individual chance rolls regardless of its slot',()=>{
 const c=card('eight',8),oops=Array.from({length:2},(_,i)=>joker('j_oops','o'+i));
 const score=keys=>{const s=state([...keys.map(k=>joker(k)),...oops],[c],{apkShop:{context:{}}});s.round.ante=1;return scoreHand(s,[c]);};
 const first=score(['j_8_ball','j_bloodstone']),last=score(['j_bloodstone','j_8_ball']);
 assert.equal(first.createdConsumables.length,1);
 assert.equal(last.createdConsumables.length,1);
 assert.deepEqual(first.actionRng.after.mathState,last.actionRng.after.mathState);
});
test('copied 8 Ball reserves the final slot before its target can roll',()=>{
 const c=card('eight',8),s=state([joker('j_blueprint'),joker('j_8_ball'),joker('j_oops','o'),joker('j_oops','o2')],[c],{apkShop:{context:{}},consumableSlots:1});s.round.ante=1;
 const r=scoreHand(s,[c]);
 assert.equal(r.createdConsumables.length,1);
 assert.equal(r.actionRng.draws.filter(d=>d.key==='8ball').length,1);
 assert.equal(r.lifecycleEvents.find(e=>e.type==='consumable_created').sourceId,'j_blueprint');
});
test('Oops stacks only active physical sources and strict chance boundaries remain exact',()=>{
 const blood=joker('j_bloodstone'),s=state([blood,joker('j_oops','a'),joker('j_oops','b'),joker('j_oops','muted',{debuffed:true}),joker('j_blueprint')]);
 const effects=item7ScoredEffects(s,context(blood),card('h',2),{...opts,roll:()=>.999});
 assert.equal(effects.length,1);
 s.jokers[2].debuffed=true;
 assert.equal(item7ScoredEffects(s,context(blood),card('h',2),{...opts,roll:()=>1}).length,0);
 s.jokers[1].debuffed=true;
 assert.equal(item7ScoredEffects(s,context(blood),card('h',2),{...opts,roll:()=>.5}).length,0);
});
// Blind:debuff_hand clears press_play triggers (blind.lua519), then Arm/Ox,
// modify_hand Flint, and scored debuffs may establish the payable trigger.
test('Matador follows native blind trigger reset and actual scored debuffs',()=>{
 const cases=[['bl_flint',{},true],['bl_head',{},true],['bl_goad',{},false],
  ['bl_tooth',{},false],['bl_fish',{},false],['bl_manacle',{},false],
  ['bl_arm',{level:2},true],['bl_arm',{level:1},false],
  ['bl_ox',{oxHand:'high_card'},true],['bl_ox',{oxHand:'pair'},false],
  ['bl_flint',{disabled:true},false],['bl_head',{disabled:true},false]];
 for(const [id,options,pays]of cases){
  const s=state([joker('j_matador')]);s.handLevels.high_card=options.level??1;s.bossState={id,disabled:!!options.disabled,...(options.oxHand?{oxHand:options.oxHand}:{})};
  assert.equal(scoreHand(s,[s.cards.c]).trace.filter(e=>e.type==='score_money').reduce((a,e)=>a+e.amount,0n),pays?8n:0n,id+JSON.stringify(options));
 }
});
test('Sixth Sense creates its Spectral before guaranteed Glass destruction',()=>{
 const c=card('card_hearts_6',6,'hearts',{enhancement:'glass'}),s=state([joker('j_sixth_sense'),joker('j_oops','o'),joker('j_oops','o2')],[c],{apkShop:{context:{}}});s.round.ante=1;
 const before=structuredClone(s),r=scoreHand(s,[c]);
 assert.equal(r.createdConsumables?.length,1);
 assert.equal(r.createdConsumables[0].set,'Spectral');
 const expected=structuredClone(s);applyItem7SixthSense(expected,[c.id],[],{remove:false});
 const glass=nextApkRandom(expected.rng.apk,'glass');
 assert.deepEqual(r.actionRng.after,glass.rng);
 assert.equal(r.glassRolls[0].roll,glass.value);
 assert.equal(r.lifecycleEvents.filter(e=>e.type==='playing_card_destroyed'&&e.reason==='sixth_sense').length,1);
 assert.equal(r.glassRolls[0].destroyed,true);
 assert.deepEqual(s,before);
});
test('Sixth Sense forces Glass shattering even when its independent chance fails',()=>{
 let failedChance;
 for(let n=0;n<30;n++){
  const c=card('card_hearts_6',6,'hearts',{enhancement:'glass'}),s=state([joker('j_sixth_sense')],[c],{apkShop:{context:{}},consumableSlots:0});s.round.ante=1;s.rng.apk=createApkRng('SIXTH-GLASS'+n);
  const r=scoreHand(s,[c]);
  if(r.glassRolls[0].roll>=.25){failedChance=r;break;}
 }
 assert.ok(failedChance);
 assert.equal(failedChance.glassRolls[0].destroyed,true);
 assert.equal(failedChance.glassDestroyedCards.length,1);
 assert.equal(failedChance.createdConsumables,undefined);
});

test('Sixth Sense discovers a debuffed Glass6 without making a Glass chance roll',()=>{
 const c=card('card_hearts_6',6,'hearts',{enhancement:'glass'}),s=state([joker('j_sixth_sense')],[c],{apkShop:{context:{}},bossState:{id:'bl_head',disabled:false}});s.round.ante=1;
 const r=scoreHand(s,[c]);
 assert.equal(r.createdConsumables.length,1);
 assert.equal(r.lifecycleEvents.filter(e=>e.reason==='sixth_sense').length,1);
 assert.equal(r.glassRolls,undefined);
 assert.equal(r.actionRng.after.streams.glass,undefined);
});
test('Sixth Sense queries Stone rank before its first-hand condition',()=>{
 const c=card('card_hearts_6',6,'hearts',{enhancement:'stone'}),s=state([joker('j_sixth_sense')],[c]);s.round.handsPlayed=1;
 const before=structuredClone(s.rng.apk);
 applyItem7SixthSense(s,[c.id],[],{remove:false});
 assert.notDeepEqual(s.rng.apk.mathState,before.mathState);
 assert.deepEqual(s.rng.apk.streams,before.streams);
});
