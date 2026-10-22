import {resetItem7RoundTargets} from '../../src/core/joker-item7-lifecycle.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRun,dispatch} from '../../src/core/run.js';
import {scoreHand} from '../../src/core/score.js';
import {supportsJoker} from '../../src/content/jokers.js';
import {bossTarget,canEnterBoss,chooseHeartJoker,disableBoss} from '../../src/core/boss-effects.js';
import {nextApkRandom,createApkRng} from '../../src/core/apk-rng.js';
import {getCashout} from '../../src/core/cashout.js';
import {getJokerCashoutBonuses} from '../../src/core/joker-cashout.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {createShop} from '../../src/core/shop.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const fixtures=JSON.parse(readFileSync(new URL('../../scripts/reference-rng/showdown-fixtures.json',import.meta.url))).heart;
const joker=(id,entityId='j_joker',extra={})=>({id,entityId,sellCost:2n,...extra});
const act=(s,type,fields={})=>dispatch(s,{type,expectedRevision:s.revision,...fields});
const reload=s=>deserializeState(serializeState(s));
// Native successful settlement resets four targets after scoring, with no boss poll.
function settledRng(s){const copy=structuredClone(s);resetItem7RoundTargets(copy);return copy.rng;}
function pending(count=2,seed='AAAAAAA1'){
 const s=createRun(seed,{runId:'heart',money:10n,referenceRng:true,referenceShop:true});
 s.round.ante=8;s.round.blindId='boss';s.apkShop.context.ante=8;s.apkBlinds.ante=8;s.apkBlinds.tagContext.ante=8;
 s.apkBlinds.bossId='bl_final_heart';s.apkBlinds.bossesUsed.bl_final_heart=1;s.round.target=bossTarget(s);
 s.jokers=Array.from({length:count},(_,i)=>joker('joker_'+(i+1),'j_joker',{creationOrdinal:i+1}));s.nextJokerCreationOrdinal=count+1;
 return s;
}
function active(count=2,seed){const r=act(pending(count,seed),'START_BLIND');assert.equal(r.error,null);return r.state;}
function sync(s){s.apkShop.context=currentApkShopContext(s);return s;}
function scored(jokers,ids=['card_clubs_2'],held=[]){
 const s=createRun('effects',{runId:'effects',money:10n});s.jokers=jokers;s.hand=[...ids,...held];
 return scoreHand(s,ids.map(id=>s.cards[id]));
}
function glassPlay(count,shattered,terminal='continue'){
 let s=active(count);
 if(terminal==='loss')for(let i=0;i<3;i++){const r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);s=r.state;}
 const id=s.hand[0];s.cards[id].enhancement='glass';sync(s);
 for(let i=0;(nextApkRandom(s.rng.apk,'glass').value<1/4)!==shattered;i++){
  assert.ok(i<30,'deterministic Glass branch available');s.rng.apk=nextApkRandom(s.rng.apk,'glass').rng;
 }
 if(terminal==='win')s.round.score=s.round.target-1n;
 assert.deepEqual(reload(s),s);
 const r=act(s,'PLAY_HAND',{cardIds:[id]});assert.equal(r.error,null);assert.equal(r.state.lastScore.glassRolls[0].destroyed,shattered);
 assert.equal(Object.hasOwn(r.state.cards,id),!shattered);return {before:s,after:r.state};
}

test('Heart initial/continuing choices match independently executed native fixtures for zero, one, two and five Jokers',()=>{
 for(const fixture of fixtures){
  const count=fixture.count;let s=active(count,fixture.seed);
  assert.equal(s.bossState.heartDebuffedJokerId,fixture.steps[0].after.disabledIds[0]??null);
  assert.deepEqual(s.jokers.filter(j=>j.debuffed).map(j=>j.id),fixture.steps[0].after.disabledIds);
  assert.deepEqual(reload(s),s);
  if(!count)assert.equal(s.rng.apk.streams.crimson_heart,undefined);
  else assert.equal(s.rng.apk.streams.crimson_heart,fixture.steps[0].after.streams.crimson_heart);
  const before=structuredClone(s.rng),id=s.bossState.heartDebuffedJokerId;
  s=act(s,'DISCARD',{cardIds:[s.hand[0]]}).state;assert.deepEqual(s.rng,before);assert.equal(s.bossState.heartDebuffedJokerId,id);
  for(let i=2;i<=4;i++){
   const previous=s.bossState.heartDebuffedJokerId,r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);s=r.state;
   assert.equal(s.lastScore.bossHistory.heartDebuffedJokerId,previous);
   assert.equal(s.bossState.heartDebuffedJokerId,fixture.steps[i].after.disabledIds[0]??null);
   if(count>1)assert.notEqual(s.bossState.heartDebuffedJokerId,previous);
   if(count)assert.equal(s.rng.apk.streams.crimson_heart,fixture.steps[i].after.streams.crimson_heart);
   else assert.equal(s.rng.apk.streams.crimson_heart,undefined);
   assert.deepEqual(reload(s),s);
  }
 }
});
test('Heart builds candidate pool before clearing old debuffs and uses creation order after manual reorder',()=>{
 const p=pending(4),reversed=structuredClone(p);reversed.jokers.reverse();
 const a=act(p,'START_BLIND').state,b=act(reversed,'START_BLIND').state;
 assert.equal(a.bossState.heartDebuffedJokerId,b.bossState.heartDebuffedJokerId);assert.deepEqual(a.rng,b.rng);
 const restricted=pending(4);for(const j of restricted.jokers)j.debuffed=j.id!=='joker_3';
 const r=act(restricted,'START_BLIND');assert.equal(r.error,null);assert.equal(r.state.bossState.heartDebuffedJokerId,'joker_3');
 assert.deepEqual(r.state.jokers.filter(j=>j.debuffed).map(j=>j.id),['joker_3']);assert.deepEqual(reload(r.state),r.state);
});
test('terminal Heart success or failure consumes no replacement poll',()=>{
 for(const win of [false,true]){
  let s=active();if(!win)for(let i=0;i<3;i++)s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;
  else s.round.score=s.round.target-1n;
  const rng=win?settledRng(s):structuredClone(s.rng),id=s.bossState.heartDebuffedJokerId,drawPile=[...s.drawPile];
  const r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);
  assert.equal(r.state.phase,win?'round_won':'game_over');assert.equal(r.state.bossState.heartDebuffedJokerId,id);
  assert.deepEqual(r.state.rng,rng);assert.deepEqual(r.state.drawPile,drawPile);assert.deepEqual(reload(r.state),r.state);
 }
});
test('disabled Splash, Four Fingers and Shortcut lose recognition and scoring-card expansion',()=>{
 const splash=joker('splash','j_splash',{debuffed:true}),ids=['card_clubs_2','card_spades_2','card_hearts_14'];
 assert.deepEqual(scored([splash],ids).scoringCardIds,ids.slice(0,2));assert.equal(scored([{...splash,debuffed:false}],ids).scoringCardIds.length,3);
 const four=joker('four','j_four_fingers',{debuffed:true}),fourIds=['card_clubs_2','card_clubs_3','card_clubs_4','card_clubs_5'];
 assert.equal(scored([four],fourIds).handId,'high_card');assert.equal(scored([{...four,debuffed:false}],fourIds).handId,'straight_flush');
 const shortcut=joker('shortcut','j_shortcut',{debuffed:true}),gapIds=['card_clubs_2','card_hearts_4','card_spades_6','card_diamonds_8','card_clubs_10'];
 assert.equal(scored([shortcut],gapIds).handId,'high_card');assert.equal(scored([{...shortcut,debuffed:false}],gapIds).handId,'straight');
});
test('disabled scored, held, independent and edition effects all vanish',()=>{
 for(const entityId of ['j_even_steven','j_joker','j_stencil','j_abstract','j_baron'])for(const edition of ['base','foil','holographic','polychrome','negative']){
  const j=joker('disabled',entityId,{debuffed:true,edition});
  const actual=scored([j],['card_clubs_2'],['card_spades_13']),expected=scored([],['card_clubs_2'],['card_spades_13']);
  assert.equal(actual.score,expected.score,entityId+' '+edition);assert.deepEqual(actual.trace,expected.trace);
 }
});
test('disabled owned Jokers still count for Abstract, Stencil, Negative capacity and Swashbuckler quantities',()=>{
 const disabled=joker('other','j_joker',{debuffed:true,sellCost:7n});
 assert.equal(scored([joker('abstract','j_abstract'),disabled]).mult,7n);
 assert.equal(scored([joker('stencil','j_stencil'),disabled]).mult,4n);
 assert.equal(scored([joker('stencil','j_stencil'),{...disabled,entityId:'j_stencil'}]).mult,5n);
 assert.equal(scored([joker('stencil','j_stencil'),{...disabled,edition:'negative'}]).mult,5n);
 assert.equal(scored([joker('swash','j_swashbuckler'),disabled]).mult,8n);
 const overfull=active(5);overfull.jokers.push(joker('extra','j_joker',{creationOrdinal:6}));overfull.nextJokerCreationOrdinal=7;
 assert.throws(()=>serializeState(overfull));overfull.jokers.at(-1).edition='negative';assert.deepEqual(reload(overfull),overfull);
});
test('owned boolean debuff support permits sale while shop support and malformed modifiers stay closed',()=>{
 const j=joker('disabled','j_joker',{debuffed:true});assert.equal(supportsJoker(j,{owned:true}),true);assert.equal(supportsJoker(j),false);
 for(const debuffed of ['true',1,null])assert.equal(supportsJoker({...j,debuffed},{owned:true}),false);
 for(const extra of [{rental:'true'},{perishable:true},{edition:'unknown'},{entityId:'j_unsupported'}])assert.equal(supportsJoker({...j,...extra},{owned:true}),false);
 const shop=pending();shop.phase='shop';shop.round.blindId='big';shop.round.target=75000n;shop.round.score=75000n;
 shop.shop=createShop({offers:{main:[{...j,cost:1n}],vouchers:[],boosters:[]}});shop.jokers=[];
 assert.equal(act(shop,'BUY_SHOP_CARD',{offerId:j.id}).error.code,'UNSUPPORTED_CONTENT');
});
test('Heart admission rejects ambiguous creation order and invalid preexisting candidate pools without mutating state',()=>{
 for(const mutate of [s=>delete s.jokers[0].creationOrdinal,s=>s.jokers[0].creationOrdinal=s.jokers[1].creationOrdinal,s=>s.jokers.forEach(j=>j.debuffed=true)]){
  const s=pending(),before=structuredClone(s);mutate(s);const altered=structuredClone(s);
  assert.equal(canEnterBoss(s),false);const result=act(s,'START_BLIND');assert.equal(result.error.code,'BOSS_UNAVAILABLE');assert.equal(result.state,s);assert.deepEqual(s,altered);assert.deepEqual(result.events,[]);
  assert.notDeepEqual(s,before);
 }
});
test('Heart replay rejects an impossible unchanged multi-Joker target even if all Joker effects are identical',()=>{
 const s=active(),played=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;assert.deepEqual(reload(played),played);
 const bad=structuredClone(played),chosen=bad.lastScore.bossHistory.heartDebuffedJokerId;
 bad.bossState.heartDebuffedJokerId=chosen;for(const j of bad.jokers)j.debuffed=j.id===chosen;
 assert.throws(()=>serializeState(bad));
 const won=active();won.round.score=won.round.target-1n;const terminal=act(won,'PLAY_HAND',{cardIds:[won.hand[0]]}).state;
 const forged=structuredClone(terminal);forged.lastScore.bossHistory.heartDebuffedJokerId=forged.jokers.find(j=>!j.debuffed).id;
 assert.throws(()=>serializeState(forged));
});
test('reorder retains Heart target and selling disabled target reconciles to null without RNG',()=>{
 let s=active();const id=s.bossState.heartDebuffedJokerId,rng=structuredClone(s.rng);
 s=act(s,'REORDER_JOKERS',{cardIds:s.jokers.map(j=>j.id).reverse()}).state;
 assert.equal(s.bossState.heartDebuffedJokerId,id);assert.deepEqual(s.rng,rng);assert.deepEqual(reload(s),s);
 const sold=act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:id});assert.equal(sold.error,null);s=sold.state;
 assert.equal(s.bossState.heartDebuffedJokerId,null);assert.ok(s.jokers.every(j=>!j.debuffed));assert.deepEqual(s.rng,rng);assert.deepEqual(reload(s),s);
 s=act(s,'DISCARD',{cardIds:[s.hand[0]]}).state;assert.equal(s.bossState.heartDebuffedJokerId,null);assert.deepEqual(s.rng,rng);
 const played=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(played.error,null);assert.equal(played.state.lastScore.bossHistory.heartDebuffedJokerId,null);
 assert.equal(played.state.bossState.heartDebuffedJokerId,s.jokers[0].id);assert.deepEqual(reload(played.state),played.state);
});
test('score-time disabled identity replays independently from new draw identity and survives save',()=>{
 const s=active();s.jokers[0].entityId='j_joker';s.jokers[1].entityId='j_half';sync(s);
 const prior=s.bossState.heartDebuffedJokerId,expected=scoreHand(s,[s.cards[s.hand[0]]]);
 const r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);
 assert.equal(r.state.lastScore.score,expected.score);assert.deepEqual(r.state.lastScore.trace,expected.trace);
 assert.equal(r.state.lastScore.bossHistory.heartDebuffedJokerId,prior);assert.notEqual(r.state.bossState.heartDebuffedJokerId,prior);
 assert.deepEqual(reload(r.state),r.state);
 for(const mutate of [s=>s.lastScore.bossHistory.heartDebuffedJokerId='missing',s=>s.lastScore.bossHistory.heartDebuffedJokerId=s.bossState.heartDebuffedJokerId,s=>delete s.lastScore.bossHistory,s=>s.bossState.heartDebuffedJokerId='missing',s=>s.bossState.heartDebuffedJokerId=null,s=>s.jokers[0].debuffed=s.jokers[1].debuffed,s=>s.bossState.unknown=true]){
  const bad=structuredClone(r.state);mutate(bad);assert.throws(()=>serializeState(bad));
 }
 const sale=act(r.state,'SELL_OWNED_CARD',{area:'jokers',cardId:prior});assert.equal(sale.error,null);assert.equal(sale.state.lastScore,null);assert.deepEqual(reload(sale.state),sale.state);
});
test('Heart score replay retains disabled recognition, card/held/edition effects and native pile/money contexts',()=>{
 const played=['card_clubs_2','card_clubs_3','card_clubs_4','card_clubs_5'],held=['card_spades_13','card_hearts_12','card_diamonds_8','card_clubs_10'];
 for(const entityId of ['j_splash','j_four_fingers','j_shortcut','j_even_steven','j_baron','j_stencil','j_abstract','j_blue_joker','j_bull','j_bootstraps']){
  const s=active(),target=s.bossState.heartDebuffedJokerId;
  s.hand=[...played,...held];s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));s.discardPile=[];
  for(const j of s.jokers){j.entityId=j.id===target?entityId:'j_joker';if(j.id===target)j.edition='polychrome';}sync(s);
  const expected=scoreHand(s,played.map(id=>s.cards[id])),r=act(s,'PLAY_HAND',{cardIds:played});assert.equal(r.error,null,entityId);
  assert.deepEqual(r.state.lastScore.trace,expected.trace,entityId);assert.deepEqual(reload(r.state),r.state,entityId);
  const discarded=act(r.state,'DISCARD',{cardIds:[r.state.hand[0]]});assert.equal(discarded.error,null);assert.deepEqual(reload(discarded.state),discarded.state,entityId);
 }
});
test('selling the lone Heart target leaves zero Jokers with no later discard/play Heart poll',()=>{
 let s=active(1),rng=structuredClone(s.rng);s=act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:s.jokers[0].id}).state;
 assert.equal(s.bossState.heartDebuffedJokerId,null);assert.deepEqual(s.rng,rng);assert.deepEqual(reload(s),s);
 for(const type of ['DISCARD','PLAY_HAND']){const r=act(s,type,{cardIds:[s.hand[0]]});assert.equal(r.error,null);s=r.state;assert.equal(s.bossState.heartDebuffedJokerId,null);assert.deepEqual(s.rng,rng);assert.deepEqual(reload(s),s);}
});
test('Heart generic disable clears flags/target once without RNG and resumes active effects',()=>{
 const s=active(),rng=structuredClone(s.rng),events=[];disableBoss(s,events);s.revision++;
 assert.equal(s.bossState.disabled,true);assert.equal(s.bossState.heartDebuffedJokerId,null);assert.ok(s.jokers.every(j=>!j.debuffed));
 assert.deepEqual(s.rng,rng);assert.deepEqual(reload(s),s);const before=structuredClone(s);disableBoss(s,events);assert.deepEqual(s,before);
 assert.equal(scoreHand(s,[s.cards.card_clubs_2]).mult,9n);
});
test('disabled Golden and Cloud9 never enter earned bonus context and cleanup/sale cannot change frozen quote',()=>{
 for(const entityId of ['j_golden','j_cloud_9']){
  let s=active(1);s.jokers[0].entityId=entityId;sync(s);assert.deepEqual(getJokerCashoutBonuses(s),[]);
  s.round.score=s.round.target-1n;s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;assert.equal(s.phase,'round_won');
  const quote=getCashout(s),snapshot=structuredClone(s.cashoutQuote);assert.deepEqual(snapshot.bonusContext.sources,[]);assert.equal(quote.jokerBonuses,undefined);assert.deepEqual(reload(s),s);
  const cleaned=act(s,'CONTINUE_ENDLESS').state;disableBoss(cleaned,[]);cleaned.revision++;delete cleaned.effectReplay;assert.deepEqual(getCashout(cleaned),quote);assert.deepEqual(cleaned.cashoutQuote,snapshot);assert.deepEqual(reload(cleaned),cleaned);
  const sold=act(cleaned,'SELL_OWNED_CARD',{area:'jokers',cardId:cleaned.jokers[0].id});assert.equal(sold.error,null);
  assert.deepEqual(getCashout(sold.state),quote);assert.deepEqual(sold.state.cashoutQuote,snapshot);assert.deepEqual(reload(sold.state),sold.state);
  const fresh=structuredClone(s),sourceId=fresh.jokers[0].id;fresh.cashoutQuote.bonusContext.sources.push({id:sourceId,entityId});
  const nineCardIds=Object.values(fresh.cards).filter(c=>c.rank===9&&c.enhancement!=='stone').map(c=>c.id).sort(),amount=entityId==='j_golden'?4n:BigInt(nineCardIds.length);
  if(entityId==='j_cloud_9')fresh.cashoutQuote.bonusContext.nineCardIds=nineCardIds;
  fresh.cashoutQuote.quote.jokerBonuses=[{sourceId,entityId,amount}];fresh.cashoutQuote.quote.total+=amount;
  assert.throws(()=>serializeState(fresh));
  const older=structuredClone(s);older.cashoutQuote.earnedRevision--;assert.throws(()=>serializeState(older));
 }
});
test('Glass score history and post-score Heart poll both survive reload for zero/one/two Jokers, survive/shatter and continuing/terminal plays',()=>{
 for(const count of [0,1,2])for(const shattered of [false,true])for(const terminal of ['continue','win','loss']){
  const {before,after}=glassPlay(count,shattered,terminal),label=`${count} ${shattered} ${terminal}`;
  assert.equal(after.phase,{continue:'playing',win:'round_won',loss:'game_over'}[terminal],label);
  assert.equal(after.lastScore.bossHistory.heartDebuffedJokerId,before.bossState.heartDebuffedJokerId,label);
  assert.equal(after.rng.apk.streams.glass,after.lastScore.glassRngAfter.glass,label);
  if(terminal==='win'){
   assert.equal(after.rng.apk.streams.crimson_heart,before.rng.apk.streams.crimson_heart,label);
   for(const key of ['idol8','mail8','anc8','cas8'])assert.notEqual(after.rng.apk.streams[key],before.rng.apk.streams[key],label+' '+key);
   assert.notDeepEqual(after.rng.apk.mathState,after.lastScore.glassRngAfter.mathState,label);
  }else if(terminal==='continue'&&count)assert.notDeepEqual(after.rng.apk.mathState,after.lastScore.glassRngAfter.mathState,label);
  else assert.deepEqual(after.rng.apk.mathState,after.lastScore.glassRngAfter.mathState,label);
  assert.deepEqual(reload(after),after,label);
  if(terminal==='continue'){
   const discarded=act(after,'DISCARD',{cardIds:[after.hand[0]]});assert.equal(discarded.error,null);
   assert.deepEqual(discarded.state.rng,after.rng,label);assert.equal(discarded.state.bossState.heartDebuffedJokerId,after.bossState.heartDebuffedJokerId,label);
   assert.deepEqual(reload(discarded.state),discarded.state,label);
  }
 }
});
test('Glass→Heart replay rejects coherent target, stream, raw-state and conditional history forgeries',()=>{
 for(const shattered of [false,true]){
  const {after:s}=glassPlay(3,shattered);assert.deepEqual(reload(s),s);
  const previous=s.lastScore.bossHistory.heartDebuffedJokerId;
  const target=structuredClone(s),other=target.jokers.find(j=>j.id!==previous&&j.id!==target.bossState.heartDebuffedJokerId).id;
  target.bossState.heartDebuffedJokerId=other;for(const j of target.jokers)j.debuffed=j.id===other;assert.throws(()=>serializeState(target));
  const raw=structuredClone(s);raw.rng.apk.mathState=createApkRng('tampered-raw').mathState;assert.throws(()=>serializeState(raw));
  const later=structuredClone(s),candidateJokers=later.jokers.map(j=>({...j,debuffed:j.id===previous}));
  const extraPoll=chooseHeartJoker(later.rng.apk,candidateJokers);later.rng.apk=extraPoll.rng;later.bossState.heartDebuffedJokerId=extraPoll.jokerId;
  for(const j of later.jokers)j.debuffed=j.id===extraPoll.jokerId;assert.throws(()=>serializeState(later));
  for(const mutate of [s=>delete s.lastScore.bossHistory.heartRngBefore,s=>s.lastScore.bossHistory.heartRngBefore='0.5',s=>s.lastScore.bossHistory.heartRngBefore=-1,s=>s.lastScore.bossHistory.heartRngBefore=1.1,s=>s.lastScore.bossHistory.heartRngBefore=null,s=>s.lastScore.glassRngAfter.mathState=s.rng.apk.mathState]){
   const bad=structuredClone(s);mutate(bad);assert.throws(()=>serializeState(bad));
  }
 }
 const plain=active(),played=act(plain,'PLAY_HAND',{cardIds:[plain.hand[0]]}).state;
 played.lastScore.bossHistory.heartRngBefore=0.5;assert.throws(()=>serializeState(played));
});
test('zero-Joker and terminal Glass→Heart history rejects a forged post-score poll',()=>{
 for(const count of [0,1,2])for(const terminal of ['continue','win','loss']){
  if(count&&terminal==='continue')continue;
  const {after:s}=glassPlay(count,true,terminal);assert.deepEqual(reload(s),s);
  const bad=structuredClone(s);bad.rng.apk=nextApkRandom(bad.rng.apk,'crimson_heart',1,Math.max(1,count)).rng;
  assert.throws(()=>serializeState(bad));
 }
});
