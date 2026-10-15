import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {scoreHand} from '../../src/core/score.js';
import {getCashout} from '../../src/core/cashout.js';
import {handRecognitionOptions,NATIVE_JOKERS} from '../../src/content/jokers.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {nextApkRandom} from '../../src/core/apk-rng.js';
import {createShop} from '../../src/core/shop.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {APK_BOSSES} from '../../src/content/apk-blinds.js';
import * as effects from '../../src/core/boss-effects.js';
const act=(s,type,fields={})=>dispatch(s,{type,expectedRevision:s.revision,...fields});
const reload=s=>deserializeState(serializeState(s));
const joker=(id='sale',entityId='j_joker')=>({id,entityId,sellCost:2n});
const tarot=entityId=>({id:entityId,entityId,originalKey:entityId,set:'Tarot',cost:3n,sellCost:1n});
function pending(id='bl_final_leaf',ante=8){
 const s=createRun('LEAF0111',{runId:'showdown',money:10n,referenceRng:true,referenceShop:true});
 s.round.ante=ante;s.round.blindId='boss';s.apkShop.context.ante=ante;s.apkBlinds.ante=ante;s.apkBlinds.tagContext.ante=ante;
 s.apkBlinds.bossId=id;s.apkBlinds.bossesUsed[id]=1;s.round.target=effects.bossTarget(s);s.jokers=[joker()];return s;
}
function active(id='bl_final_leaf',ante=8){const r=act(pending(id,ante),'START_BLIND');assert.equal(r.error,null);return r.state;}
function held(s,ids){s.hand=ids;s.discardPile=[];s.drawPile=Object.keys(s.cards).filter(id=>!ids.includes(id));return s;}
function sync(s){s.apkShop.context=currentApkShopContext(s);return s;}
function disable(s){const events=[];assert.equal(typeof effects.disableBoss,'function');effects.disableBoss(s,events);s.revision++;return events;}

test('Leaf and Vessel enter Ante8 despite min10; all five showdown bosses are admitted',()=>{
 assert.equal(effects.bossTarget(pending()),100000n);assert.equal(effects.bossTarget(pending('bl_final_vessel')),300000n);
 for(const id of ['bl_final_leaf','bl_final_vessel']){
  const s=active(id);assert.equal(s.bossState.disabled,false);assert.deepEqual(reload(s),s);
  for(const ante of [1,2,7])assert.equal(effects.canEnterBoss(pending(id,ante)),false);
 }
 for(const b of APK_BOSSES.filter(b=>b.showdown)){
  assert.equal(b.dollars,8);const s=pending(b.id);s.jokers=[];assert.equal(act(s,'START_BLIND').error,null);
 }
});
test('Leaf suppresses card chips, enhancements, Lucky/Glass RNG and held Steel without suppressing base or independent Joker',()=>{
 const s=held(active(),['card_clubs_2','card_spades_2','card_hearts_4','card_diamonds_6','card_clubs_8','card_spades_10','card_hearts_12','card_diamonds_14']);
 s.cards[s.hand[0]].enhancement='lucky';s.cards[s.hand[1]].enhancement='glass';s.cards[s.hand[2]].enhancement='steel';s.cards[s.hand[3]].enhancement='gold';sync(s);
 const before=structuredClone(s),score=scoreHand(s,s.hand.slice(0,2).map(id=>s.cards[id]));
 assert.equal(score.handId,'pair');assert.equal(score.chips,10n);assert.equal(score.mult,6n);assert.equal(score.score,60n);
 assert.equal(score.luckyRolls,undefined);assert.equal(score.glassRolls,undefined);assert.equal(score.trace.filter(e=>['scored_card','held_card'].includes(e.phase)).length,0);assert.deepEqual(s,before);
 const r=act(s,'PLAY_HAND',{cardIds:s.hand.slice(0,2)});assert.equal(r.error,null);assert.deepEqual(r.state.rng,s.rng);assert.deepEqual(reload(r.state),r.state);
 for(const suit of ['clubs','diamonds','hearts','spades'])for(const rank of [2,11,14])for(const enhancement of [undefined,'stone','wild','bonus','mult','gold','steel','glass','lucky'])assert.equal(effects.isBossCardDebuffed(s,{id:'probe',rank,suit,enhancement}),true);
});
test('Leaf recognition retains Four Fingers/Shortcut, independently debuffed recognition Jokers are inactive',()=>{
 const s=active();s.jokers=[joker('four','j_four_fingers'),joker('shortcut','j_shortcut')];
 const played=['card_clubs_2','card_hearts_4','card_spades_6','card_diamonds_8'].map(id=>s.cards[id]);
 assert.equal(scoreHand(s,played).handId,'straight');
 assert.deepEqual(handRecognitionOptions(s.jokers.map(j=>({...j,debuffed:true}))),{fourFingers:false,shortcut:false});
});
test('supported Joker drag sale disables Leaf once, pays only sellCost, clears derived debuffs and persists without RNG',()=>{
 const s=active(),before=structuredClone(s),r=act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:'sale'});
 assert.equal(r.error,null);assert.equal(r.state.bossState.disabled,true);assert.equal(r.state.money,12n);assert.deepEqual(r.state.rng,s.rng);assert.deepEqual(s,before);
 assert.ok(Object.values(r.state.cards).every(c=>!effects.isBossCardDebuffed(r.state,c)));assert.deepEqual(reload(r.state),r.state);
 for(const expectedRevision of [s.revision,r.state.revision]){const result=dispatch(r.state,{type:'SELL_OWNED_CARD',area:'jokers',cardId:'sale',expectedRevision});assert.ok(result.error);assert.equal(result.state,r.state);assert.deepEqual(result.events,[]);}
 const once=structuredClone(r.state),events=[];effects.disableBoss(r.state,events);assert.deepEqual(r.state,once);assert.deepEqual(events,[]);
 assert.equal(scoreHand(r.state,[r.state.cards.card_clubs_2]).score,7n);
});
test('consumable sale, destruction/use, eternal rejection and pre-blind Joker sale do not disable a new Leaf',()=>{
 const s=active();s.consumables=[tarot('c_hanged_man')];const sale=act(s,'SELL_OWNED_CARD',{area:'consumables',cardId:'c_hanged_man'});assert.equal(sale.error,null);assert.equal(sale.state.bossState.disabled,false);
 const destroyed=act(s,'USE_CONSUMABLE',{cardId:'c_hanged_man',targetCardIds:[s.hand[0]]});assert.equal(destroyed.error,null);assert.equal(destroyed.state.bossState.disabled,false);assert.deepEqual(reload(destroyed.state),destroyed.state);
 const eternal=structuredClone(s);eternal.jokers[0].eternal=true;const before=structuredClone(eternal),failed=act(eternal,'SELL_OWNED_CARD',{area:'jokers',cardId:'sale'});assert.ok(failed.error);assert.equal(failed.state,eternal);assert.deepEqual(eternal,before);
 const pre=act(pending(),'SELL_OWNED_CARD',{area:'jokers',cardId:'sale'});assert.equal(pre.error,null);assert.equal(act(pre.state,'START_BLIND').state.bossState.disabled,false);
 const removed=structuredClone(s);removed.jokers=[];assert.equal(act(removed,'DISCARD',{cardIds:[removed.hand[0]]}).state.bossState.disabled,false);
});
test('legacy SELL_JOKER remains shop-only and cannot disable a newly entered Leaf',()=>{
 const s=active(),before=structuredClone(s),blocked=act(s,'SELL_JOKER',{jokerId:'sale'});assert.equal(blocked.error.code,'INVALID_PHASE');assert.equal(blocked.state,s);assert.deepEqual(s,before);
 const shop=pending();shop.phase='shop';shop.round.blindId='big';shop.round.target=75000n;shop.round.score=75000n;shop.shop=createShop();
 const sale=act(shop,'SELL_JOKER',{jokerId:'sale'});assert.equal(sale.error,null);assert.equal(sale.state.money,12n);assert.deepEqual(sale.state.rng,shop.rng);
 for(const expectedRevision of [shop.revision,sale.state.revision])assert.ok(dispatch(sale.state,{type:'SELL_JOKER',jokerId:'sale',expectedRevision}).error);
 const entered=act(act(sale.state,'LEAVE_SHOP').state,'START_BLIND');assert.equal(entered.error,null);assert.equal(entered.state.bossState.disabled,false);
});
test('Vessel disable divides target by3 and settles Gold and frozen cashout once if new target is met',()=>{
 const s=active('bl_final_vessel');s.round.score=100000n;s.cards[s.hand[0]].enhancement='gold';sync(s);
 const rng=structuredClone(s.rng),events=disable(s);assert.equal(s.round.target,100000n);assert.equal(s.bossState.disabled,true);assert.equal(s.phase,'round_won');assert.equal(s.money,13n);assert.deepEqual(s.rng,rng);
 assert.equal(events.filter(e=>e.type==='round_won').length,1);assert.equal(events.filter(e=>e.type==='gold_card_paid').length,1);assert.equal(getCashout(s).reward,8n);assert.deepEqual(reload(s),s);
 const snapshot=structuredClone(s),again=[];effects.disableBoss(s,again);assert.deepEqual(s,snapshot);assert.deepEqual(again,[]);
 const continued=act(s,'CONTINUE_ENDLESS');assert.equal(continued.error,null);
 const sold=act(continued.state,'SELL_OWNED_CARD',{area:'jokers',cardId:'sale'});assert.equal(sold.error,null);assert.deepEqual(getCashout(sold.state),getCashout(s));assert.deepEqual(reload(sold.state),sold.state);
 const below=active('bl_final_vessel');below.round.score=99999n;disable(below);assert.equal(below.phase,'playing');assert.deepEqual(reload(below),below);
});
test('enabled Leaf win suppresses held Gold while paying native $8 reward',()=>{
 const s=active();s.round.score=99995n;s.jokers=[];s.cards[s.hand[1]].enhancement='gold';sync(s);
 const r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);assert.equal(r.state.phase,'round_won');assert.equal(r.state.money,10n);assert.equal(getCashout(r.state).reward,8n);assert.deepEqual(reload(r.state),r.state);
});
test('disabled save invariants reject wrong Vessel target and malformed/unknown boss fields',()=>{
 for(const id of ['bl_final_leaf','bl_final_vessel']){
  const s=active(id);disable(s);assert.deepEqual(reload(s),s);
  for(const mutate of [s=>s.bossState.disabled='true',s=>s.bossState.unknown=1,s=>s.round.target=300000n]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>serializeState(bad));}
 }
});
test('generic disable restores Water/Needle resource subtractions once and Manacle size/draw without RNG',()=>{
 for(const id of ['bl_water','bl_needle','bl_manacle']){
  const s=active(id,2),rng=structuredClone(s.rng),events=disable(s);assert.equal(s.round.discardsRemaining,4);assert.equal(s.round.handsRemaining,4);assert.equal(s.round.handSize,8);assert.equal(s.hand.length,8);assert.deepEqual(s.rng,rng);assert.deepEqual(reload(s),s);
  if(id==='bl_manacle')assert.equal(events.find(e=>e.type==='cards_drawn').cardIds.length,1);
  const before=structuredClone(s);effects.disableBoss(s,[]);assert.deepEqual(s,before);
 }
});
test('generic disable restores ordinary card debuffs, concealment, hand rules and exact Wall target',()=>{
 for(const boss of APK_BOSSES.filter(b=>!b.showdown)){
  const s=active(boss.id,Math.max(2,boss.minAnte));disable(s);assert.ok(Object.values(s.cards).every(c=>!effects.isBossCardDebuffed(s,c)));
  assert.equal(effects.isBossHandDebuffed(s,[s.cards.card_clubs_2],'pair'),false);
  if(s.bossState.hiddenCardIds)assert.deepEqual(s.bossState.hiddenCardIds,[]);
  if(boss.id==='bl_wall')assert.equal(s.round.target,1600n);
  assert.deepEqual(reload(s),s);
 }
});
test('disabled Hook/Arm/Tooth/Ox/Flint/Serpent/Eye/Mouth never reactivate their gameplay hooks',()=>{
 for(const id of ['bl_hook','bl_arm','bl_tooth','bl_ox','bl_flint','bl_serpent','bl_eye','bl_mouth']){
  const s=held(active(id,id==='bl_ox'?6:id==='bl_serpent'?5:id==='bl_tooth'||id==='bl_eye'?3:2),['card_clubs_2','card_spades_2','card_hearts_4','card_diamonds_6','card_clubs_8','card_spades_10','card_hearts_12','card_diamonds_14']);
  s.jokers=[joker('bull','j_bull')];s.handLevels.pair=3;disable(s);
  const ordinary={...s,bossState:undefined},expected=scoreHand(ordinary,s.hand.slice(0,2).map(id=>s.cards[id]));
  const r=act(s,'PLAY_HAND',{cardIds:s.hand.slice(0,2)});assert.equal(r.error,null,id);assert.equal(r.state.lastScore.score,expected.score,id);assert.equal(r.state.money,s.money,id);assert.equal(r.state.handLevels.pair,3,id);assert.equal(r.state.hand.length,8,id);assert.deepEqual(r.state.rng,s.rng,id);assert.deepEqual(reload(r.state),r.state,id);
 }
});
test('disabling Serpent retains the already oversized hand and native redraw waits for free slots',()=>{
 let s=active('bl_serpent',5);s.jokers=[joker('blue','j_blue_joker')];
 s=act(s,'DISCARD',{cardIds:[s.hand[0]]}).state;assert.equal(s.hand.length,10);disable(s);assert.equal(s.hand.length,10);
 const r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);assert.equal(r.state.hand.length,9);assert.equal(r.events.some(e=>e.type==='cards_drawn'),false);assert.deepEqual(reload(r.state),r.state);
});
test('disabled concealment bosses never hide replacements or consume Wheel RNG',()=>{
 for(const id of ['bl_house','bl_wheel','bl_fish','bl_mark']){
  const s=active(id,2);disable(s);const rng=structuredClone(s.rng),r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);assert.deepEqual(r.state.bossState.hiddenCardIds,[]);assert.deepEqual(r.state.rng,rng);assert.deepEqual(reload(r.state),r.state);
 }
});
test('native resource restoration preserves used actions and handles both admitted decks and legacy saves',()=>{
 for(const deckId of ['red','blue'])for(const id of ['bl_water','bl_needle']){
  const p=pending(id,2);p.deckId=deckId;p.round.handsRemaining=deckId==='blue'?5:4;p.round.discardsRemaining=deckId==='red'?4:3;
  const s=act(p,'START_BLIND').state;if(id==='bl_water')s.round.handsRemaining--;else s.round.discardsRemaining--;
  const old=structuredClone(s);delete old.bossState.disabled;delete old.bossState.discardsSub;delete old.bossState.handsSub;assert.deepEqual(reload(old),old);
  for(const copy of [s,old]){disable(copy);assert.equal(copy.round.handsRemaining,(deckId==='blue'?5:4)-(id==='bl_water'?1:0));assert.equal(copy.round.discardsRemaining,(deckId==='red'?4:3)-(id==='bl_needle'?1:0));assert.deepEqual(reload(copy),copy);}
 }
});
test('all current53 native Jokers sell to disable Leaf without RNG or extra sale income',()=>{
 assert.equal(NATIVE_JOKERS.length,53);
 for(const entityId of NATIVE_JOKERS){
  const s=active();s.jokers=[joker('sale',entityId)];const r=act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:'sale'});
  assert.equal(r.error,null,entityId);assert.equal(r.state.money,s.money+2n,entityId);assert.equal(r.state.bossState.disabled,true,entityId);assert.deepEqual(r.state.rng,s.rng,entityId);assert.deepEqual(reload(r.state),r.state,entityId);
 }
});
test('Leaf sale after settlement preserves captured Golden/Cloud9 sources and does not repay held Gold',()=>{
 const s=active();s.jokers=[joker('golden','j_golden'),joker('cloud','j_cloud_9')];s.round.score=99995n;s.cards[s.hand[1]].enhancement='gold';sync(s);
 const won=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(won.error,null);assert.equal(won.state.phase,'round_won');assert.equal(won.state.money,10n);
 const quote=getCashout(won.state);assert.deepEqual(quote.jokerBonuses.map(row=>row.amount),[4n,4n]);
 const continued=act(won.state,'CONTINUE_ENDLESS');assert.equal(continued.error,null);
 const sold=act(continued.state,'SELL_OWNED_CARD',{area:'jokers',cardId:'golden'});assert.equal(sold.error,null);assert.equal(sold.state.money,12n);assert.equal(sold.state.bossState.disabled,true);assert.equal(sold.events.some(e=>e.type==='gold_card_paid'||e.type==='round_won'),false);assert.deepEqual(getCashout(sold.state),quote);assert.deepEqual(reload(sold.state),sold.state);
});
test('post-win Needle/Water disable returns resources while preserving already earned cashout and Gold',()=>{
 for(const id of ['bl_needle','bl_water']){
  const s=active(id,2);s.round.score=s.round.target-1n;s.cards[s.hand[1]].enhancement='gold';sync(s);
  const won=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;assert.equal(won.phase,'round_won');const earned=getCashout(won),money=won.money;
  assert.equal(won.cashoutQuote.handsRemainingBefore,won.round.handsRemaining);
  for(const legacy of [false,true]){
   const copy=structuredClone(won);if(legacy){delete copy.cashoutQuote.handsRemainingBefore;assert.deepEqual(reload(copy),won);}else assert.deepEqual(reload(copy),copy);
   const events=disable(copy);assert.equal(copy.round.handsRemaining,3);assert.equal(copy.round.discardsRemaining,4);assert.equal(copy.money,money);assert.equal(events.some(e=>e.type==='gold_card_paid'||e.type==='round_won'),false);
   assert.deepEqual(getCashout(copy),earned);const resumed=reload(copy);assert.equal(resumed.cashoutQuote.handsRemainingBefore,Number(earned.hands));assert.deepEqual(getCashout(resumed),earned);
   const cash=act(copy,'CASH_OUT');assert.equal(cash.error,null);assert.equal(cash.state.money,money+earned.total);assert.deepEqual(reload(cash.state),cash.state);
  }
 }
});
test('earned hand-counter snapshot is bounded, strict and matches fresh unchanged round context',()=>{
 const s=active('bl_needle',2);s.round.score=s.round.target-1n;const won=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;
 for(const handsRemainingBefore of [-1,5,0.5,'0',null]){const bad=structuredClone(won);bad.cashoutQuote.handsRemainingBefore=handsRemainingBefore;assert.throws(()=>serializeState(bad));}
 const fresh=structuredClone(won);fresh.cashoutQuote.handsRemainingBefore=1;fresh.cashoutQuote.quote.hands=1n;fresh.cashoutQuote.quote.total++;assert.throws(()=>serializeState(fresh));
 const unknown=structuredClone(won);unknown.cashoutQuote.unknown=1;assert.throws(()=>serializeState(unknown));
});
test('old quote migration derives earned hands from its row even after counters were restored',()=>{
 const s=active('bl_needle',2);s.round.score=s.round.target-1n;const won=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state,earned=getCashout(won);disable(won);
 const payload=JSON.parse(serializeState(won));delete payload.state.cashoutQuote.handsRemainingBefore;
 const resumed=deserializeState(JSON.stringify(payload));assert.equal(resumed.round.handsRemaining,3);assert.equal(resumed.cashoutQuote.handsRemainingBefore,0);assert.deepEqual(getCashout(resumed),earned);assert.deepEqual(reload(resumed),resumed);
 const legacy=structuredClone(won);delete legacy.cashoutQuote;const quote=getCashout(legacy);assert.equal(quote.hands,3n);
});
test('disabling Serpent also retains a short hand until the next ordinary refill and Blue replay survives',()=>{
 let s=active('bl_serpent',5);s.jokers=[joker('blue','j_blue_joker')];
 s=act(s,'DISCARD',{cardIds:s.hand.slice(0,5)}).state;assert.equal(s.hand.length,6);disable(s);assert.equal(s.hand.length,6);assert.deepEqual(reload(s),s);
 const r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(r.error,null);assert.equal(r.state.hand.length,8);assert.equal(r.events.find(e=>e.type==='cards_drawn').cardIds.length,3);assert.deepEqual(reload(r.state),r.state);
});
test('disabled Serpent rejects coherent held-to-before-draw Blue forgeries for short and oversized origins',()=>{
 for(const count of [1,5]){
  let s=active('bl_serpent',5);s.jokers=[joker('blue','j_blue_joker')];s=act(s,'DISCARD',{cardIds:s.hand.slice(0,count)}).state;disable(s);
  const result=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(result.error,null);assert.deepEqual(reload(result.state),result.state);
  const bad=structuredClone(result.state),prior=bad.lastScore,held=prior.heldCardIds.slice(),moved=held.shift(),before=structuredClone(prior.scoringPilesBefore);before.drawPile.push(moved);
  const replay={...bad,hand:held,drawPile:before.drawPile,discardPile:before.discardPile,round:{...bad.round,...prior.scoringRoundBefore}};
  bad.lastScore=scoreHand(replay,prior.playedCardIds.map(id=>bad.cards[id]));bad.round.score+=bad.lastScore.score-prior.score;
  assert.equal(bad.lastScore.score,prior.score+2n);assert.throws(()=>serializeState(bad));
 }
});
test('earned counters reject coherent post-disable Water/Needle raises, including omitted legacy hand snapshot',()=>{
 for(const id of ['bl_water','bl_needle']){
  const s=active(id,2);s.round.score=s.round.target-1n;const won=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;disable(won);assert.deepEqual(reload(won),won);
  for(const omitted of [false,true]){
   const bad=structuredClone(won),q=bad.cashoutQuote.quote,prior=q.hands;q.hands=4n;q.total+=4n-prior;
   if(omitted)delete bad.cashoutQuote.handsRemainingBefore;else bad.cashoutQuote.handsRemainingBefore=4;
   assert.throws(()=>serializeState(bad));
   const payload=JSON.parse(serializeState(won));payload.state.cashoutQuote.quote.hands='4';payload.state.cashoutQuote.quote.total=q.total.toString();
   if(omitted)delete payload.state.cashoutQuote.handsRemainingBefore;else payload.state.cashoutQuote.handsRemainingBefore=4;
   assert.throws(()=>deserializeState(JSON.stringify(payload)));
  }
 }
});
test('disabled Serpent origin remains exact across later plays, discards and Hanged destruction before and after disable',()=>{
 for(const beforeDisable of [false,true])for(const selectionCount of [1,5]){
  let s=active('bl_serpent',5);s.jokers=[joker('blue','j_blue_joker')];s.consumables=[tarot('c_hanged_man')];
  s=act(s,'DISCARD',{cardIds:s.hand.slice(0,selectionCount)}).state;
  if(beforeDisable){s=act(s,'USE_CONSUMABLE',{cardId:'c_hanged_man',targetCardIds:s.hand.slice(0,2)}).state;assert.deepEqual(reload(s),s);}
  disable(s);assert.deepEqual(reload(s),s);
  if(!beforeDisable){s=act(s,'USE_CONSUMABLE',{cardId:'c_hanged_man',targetCardIds:s.hand.slice(0,2)}).state;assert.deepEqual(reload(s),s);}
  for(const [type,count] of [['PLAY_HAND',1],['DISCARD',1],['DISCARD',2],['PLAY_HAND',2]]){
   const r=act(s,type,{cardIds:s.hand.slice(0,count)});assert.equal(r.error,null);s=r.state;assert.deepEqual(reload(s),s);
  }
 }
});
test('disabled Serpent validates Glass destruction and the terminal play with no refill',()=>{
 let s=active('bl_serpent',5);s.jokers=[joker('blue','j_blue_joker')];s=act(s,'DISCARD',{cardIds:s.hand.slice(0,5)}).state;disable(s);
 const glassId=s.hand[0];s.cards[glassId].enhancement='glass';sync(s);
 // Advance the existing native stream to an explicit deterministic break branch.
 while(nextApkRandom(s.rng.apk,'glass').value>=1/4)s.rng.apk=nextApkRandom(s.rng.apk,'glass').rng;
 const glass=act(s,'PLAY_HAND',{cardIds:[glassId]});assert.equal(glass.error,null);assert.equal(glass.state.cards[glassId],undefined);assert.deepEqual(reload(glass.state),glass.state);s=glass.state;
 s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;assert.deepEqual(reload(s),s);
 s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;s.consumables=[tarot('c_hanged_man')];
 s=act(s,'USE_CONSUMABLE',{cardId:'c_hanged_man',targetCardIds:s.hand.slice(0,2)}).state;assert.deepEqual(reload(s),s);
 const drawBefore=s.drawPile.slice(),lost=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.equal(lost.error,null);assert.equal(lost.state.phase,'game_over');assert.deepEqual(lost.state.drawPile,drawBefore);assert.deepEqual(reload(lost.state),lost.state);
});
test('Needle restoration before earning and later quote migration retain actual earned hands',()=>{
 const s=active('bl_needle',2);disable(s);s.round.score=s.round.target-1n;
 const won=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;assert.equal(won.round.handsRemaining,3);assert.equal(getCashout(won).hands,3n);assert.deepEqual(reload(won),won);
 const later=act(won,'REORDER_JOKERS',{cardIds:won.jokers.map(j=>j.id)}).state;const payload=JSON.parse(serializeState(later));delete payload.state.cashoutQuote.handsRemainingBefore;
 assert.equal(getCashout(deserializeState(JSON.stringify(payload))).hands,3n);
 const bad=structuredClone(later);bad.cashoutQuote.handsRemainingBefore=4;bad.cashoutQuote.quote.hands=4n;bad.cashoutQuote.quote.total++;assert.throws(()=>serializeState(bad));
});
test('Serpent disable-origin native cardinality rejects coherently moving a held card into both origin and score draw piles',()=>{
 let s=active('bl_serpent',5);s.jokers=[joker('blue','j_blue_joker')];s=act(s,'DISCARD',{cardIds:s.hand.slice(0,5)}).state;disable(s);
 const result=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state,bad=structuredClone(result),prior=bad.lastScore,held=prior.heldCardIds.slice(),moved=held.shift(),before=structuredClone(prior.scoringPilesBefore);before.drawPile.push(moved);
 const origin=bad.bossState.serpentDisableOrigin;origin.hand=origin.hand.filter(id=>id!==moved);origin.drawPile.push(moved);
 bad.lastScore=scoreHand({...bad,hand:held,drawPile:before.drawPile,discardPile:before.discardPile,round:{...bad.round,...prior.scoringRoundBefore}},prior.playedCardIds.map(id=>bad.cards[id]));bad.round.score+=bad.lastScore.score-prior.score;
 assert.throws(()=>serializeState(bad));
 for(const mutate of [s=>delete s.bossState.serpentDisableOrigin,s=>s.bossState.serpentDisableOrigin.extra=true,s=>s.bossState.disabledRevision='2',s=>s.bossState.serpentInitialCardCount=53]){const malformed=structuredClone(result);mutate(malformed);assert.throws(()=>serializeState(malformed));}
});
test('disabled Serpent winning play cannot forge an ordinary refill by deleting terminal exclusions',()=>{
 let s=active('bl_serpent',5);s.jokers=[joker('blue','j_blue_joker')];s=act(s,'DISCARD',{cardIds:s.hand.slice(0,5)}).state;disable(s);s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;s.round.score=s.round.target-1n;
 const won=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;assert.equal(won.phase,'round_won');assert.equal(won.hand.length,7);assert.deepEqual(reload(won),won);
 const bad=structuredClone(won);bad.hand.push(bad.drawPile.pop());bad.bossState.serpentTerminalUnfilledCardIds=[];assert.throws(()=>serializeState(bad));
});
test('disabled Serpent cannot erase a spent play counter after inventory clears its lastScore',()=>{
 let s=active('bl_serpent',5);s.jokers=[joker('blue','j_blue_joker')];s=act(s,'DISCARD',{cardIds:[s.hand[0]]}).state;disable(s);
 s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;s=act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:'blue'}).state;assert.equal(s.lastScore,null);assert.deepEqual(reload(s),s);
 const bad=structuredClone(s);bad.round.handsRemaining++;assert.throws(()=>serializeState(bad));
});
test('first post-disable terminal play keeps the original short hand and later won mutations retain that origin',()=>{
 let s=active('bl_serpent',5);s.jokers=[joker('blue','j_blue_joker')];s=act(s,'DISCARD',{cardIds:s.hand.slice(0,5)}).state;disable(s);s.round.score=s.round.target-1n;
 s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;assert.equal(s.phase,'round_won');assert.equal(s.hand.length,5);assert.deepEqual(reload(s),s);
 s.consumables=[tarot('c_hanged_man')];s=act(s,'USE_CONSUMABLE',{cardId:'c_hanged_man',targetCardIds:s.hand.slice(0,2)}).state;assert.deepEqual(reload(s),s);
 const quote=getCashout(s);s=act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:'blue'}).state;assert.deepEqual(getCashout(s),quote);assert.deepEqual(reload(s),s);
});
test('legacy enabled Serpent captures exact remaining-deck provenance and exhausted decks without inventing a card count',()=>{
 for(const exhausted of [false,true]){
  const p=pending('bl_serpent',5);
  if(exhausted){const ids=Object.keys(p.cards),kept=ids.slice(0,10);p.destroyedCardIds=ids.slice(10);p.cards=Object.fromEntries(kept.map(id=>[id,p.cards[id]]));p.drawPile=kept;sync(p);}
  let s=act(p,'START_BLIND').state;s.jokers=[joker('blue','j_blue_joker')];s=act(s,'DISCARD',{cardIds:[s.hand[0]]}).state;
  delete s.bossState.serpentInitialCardCount;assert.deepEqual(reload(s),s);disable(s);
  assert.equal(s.bossState.serpentInitialCardCount,exhausted?null:52);assert.deepEqual(reload(s),s);
  s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;assert.deepEqual(reload(s),s);
 }
});
test('enabled Serpent post-win disable preserves terminal no-refill for current and published legacy saves',()=>{
 for(const legacy of [false,true])for(const laterMutation of [false,true]){
  let s=active('bl_serpent',5);if(legacy)delete s.bossState.serpentInitialCardCount;s.round.score=s.round.target-1n;
  s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;assert.equal(s.phase,'round_won');assert.deepEqual(reload(s),s);const quote=getCashout(s),draw=s.drawPile.slice();
  if(laterMutation)s=act(s,'REORDER_JOKERS',{cardIds:s.jokers.map(j=>j.id)}).state;
  disable(s);assert.equal(s.bossState.serpentInitialCardCount,52);assert.deepEqual(s.drawPile,draw);assert.deepEqual(getCashout(s),quote);assert.deepEqual(reload(s),s);
 }
});
test('Needle rejects equal and earlier disable/earning timing forgeries with coherent quotes and old-counter migration',()=>{
 for(const beforeWinMutations of [0,2]){
  let s=active('bl_needle',2);for(let i=0;i<beforeWinMutations;i++)s=act(s,'REORDER_JOKERS',{cardIds:s.jokers.map(j=>j.id)}).state;
  s.round.score=s.round.target-1n;s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;disable(s);assert.equal(getCashout(s).hands,0n);assert.deepEqual(reload(s),s);
  for(const timing of [s.cashoutQuote.earnedRevision,s.cashoutQuote.earnedRevision-1,1])for(const omitted of [false,true]){
   const bad=structuredClone(s);bad.bossState.disabledRevision=timing;bad.cashoutQuote.quote.hands=3n;bad.cashoutQuote.quote.total+=3n;
   if(omitted)delete bad.cashoutQuote.handsRemainingBefore;else bad.cashoutQuote.handsRemainingBefore=3;
   assert.throws(()=>serializeState(bad));
   const payload=JSON.parse(serializeState(s));payload.state.bossState.disabledRevision=timing;payload.state.cashoutQuote.quote.hands='3';payload.state.cashoutQuote.quote.total=(s.cashoutQuote.quote.total+3n).toString();
   if(omitted)delete payload.state.cashoutQuote.handsRemainingBefore;else payload.state.cashoutQuote.handsRemainingBefore=3;
   assert.throws(()=>deserializeState(JSON.stringify(payload)));
  }
 }
});
test('Needle cannot earn every restored hand after a winning play even after inventory clears lastScore',()=>{
 const s=active('bl_needle',2);disable(s);s.round.score=s.round.target-1n;
 let won=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;won=act(won,'REORDER_JOKERS',{cardIds:won.jokers.map(j=>j.id)}).state;assert.deepEqual(reload(won),won);
 const bad=structuredClone(won);bad.round.handsRemaining++;bad.cashoutQuote.handsRemainingBefore++;bad.cashoutQuote.quote.hands++;bad.cashoutQuote.quote.total++;assert.throws(()=>serializeState(bad));
});
test('Needle fixed origin rejects moving both timing fields earlier and recovers published enabled states at the accepted boundary',()=>{
 for(const beforeEarning of [false,true]){
  let s=active('bl_needle',2);delete s.bossState.startedRevision;assert.deepEqual(reload(s),s);
  for(let i=0;i<2;i++)s=act(s,'REORDER_JOKERS',{cardIds:s.jokers.map(j=>j.id)}).state;
  if(beforeEarning)disable(s);s.round.score=s.round.target-1n;s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;if(!beforeEarning)disable(s);
  assert.equal(getCashout(s).hands,beforeEarning?3n:0n);assert.equal(s.bossState.startedRevision,undefined);assert.deepEqual(reload(s),s);
  const payload=JSON.parse(serializeState(s));delete payload.state.cashoutQuote.handsRemainingBefore;assert.equal(getCashout(deserializeState(JSON.stringify(payload))).hands,beforeEarning?3n:0n);
  if(!beforeEarning){
   const bad=structuredClone(s);bad.bossState.disabledRevision=bad.cashoutQuote.earnedRevision-1;bad.bossState.needleDisableOrigin.acceptedRevision=bad.bossState.disabledRevision-1;bad.cashoutQuote.handsRemainingBefore=3;bad.cashoutQuote.quote.hands=3n;bad.cashoutQuote.quote.total+=3n;assert.throws(()=>serializeState(bad));
  }
 }
});
test('Serpent pre-origin terminal marker stays bound to its frozen win despite later inventory or Hanged mutations',()=>{
 let s=active('bl_serpent',5);s=act(s,'DISCARD',{cardIds:s.hand.slice(0,5)}).state;s.round.score=s.round.target-1n;s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]}).state;
 disable(s);assert.equal(s.bossState.serpentDisableOrigin.phase,'round_won');assert.equal(s.bossState.serpentInitialCardCount,52);assert.deepEqual(reload(s),s);
 s.consumables=[tarot('c_hanged_man')];s=act(s,'USE_CONSUMABLE',{cardId:'c_hanged_man',targetCardIds:s.hand.slice(0,2)}).state;assert.deepEqual(reload(s),s);
 s=act(s,'REORDER_JOKERS',{cardIds:s.jokers.map(j=>j.id)}).state;assert.deepEqual(reload(s),s);
 for(const mutate of [s=>s.bossState.serpentDisableOrigin.phase='playing',s=>s.bossState.serpentDisableOrigin.earnedRevision--,s=>delete s.bossState.serpentDisableOrigin.earnedRevision,s=>s.bossState.serpentDisableOrigin.handsRemaining--]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>serializeState(bad));}
});
