import test from 'node:test';
import assert from 'node:assert/strict';
import * as deck from '../../src/core/apk-deck.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {chooseHookDiscards,chooseBellCard,bossTarget} from '../../src/core/boss-effects.js';
import {createApkRng} from '../../src/core/apk-rng.js';
import {readFileSync} from 'node:fs';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';

const run=()=>createRun('IDENTITY4',{runId:'identity4',money:4n,referenceRng:true,referenceShop:true});
const reload=s=>deserializeState(serializeState(s));
const add=(s,card,area='drawPile')=>{assert.equal(typeof deck.createPlayingCard,'function');return deck.createPlayingCard(s,card,{area});};

test('new physical copies receive stable creation order after every original identity',()=>{
 const s=run(),source=s.cards.card_clubs_2,before=structuredClone(s.rng);
 const a=add(s,source),b=add(s,source);
 assert.notEqual(a.id,b.id);assert.equal(a.creationOrdinal,53);assert.equal(b.creationOrdinal,54);
 assert.equal(s.nextPlayingCardOrdinal,55);assert.deepEqual(s.rng,before);
 assert.equal(s.cards[a.id],a);assert.equal(s.drawPile.at(-1),b.id);
 assert.deepEqual(deck.canonicalCards([b,source,a]),[source.id,a.id,b.id]);
 a.rank=14;a.suit='spades';
 assert.deepEqual(deck.canonicalCards([b,a,source]),[source.id,a.id,b.id]);
 assert.deepEqual(reload(s),s);
});

test('legacy transformed original identities retain order without a face-based migration',()=>{
 const s=run();s.cards.card_clubs_2.rank=14;s.cards.card_clubs_2.suit='spades';
 const loaded=reload(s);assert.deepEqual(loaded,s);
 const a=add(loaded,loaded.cards.card_clubs_2);
 assert.equal(a.creationOrdinal,53);
 assert.deepEqual(deck.canonicalCards([a,loaded.cards.card_spades_14,loaded.cards.card_clubs_2]),['card_clubs_2','card_spades_14',a.id]);
});

test('destroyed copies do not release identities or lower the saved allocation counter',()=>{
 const s=run(),a=add(s,s.cards.card_clubs_2);
 delete s.cards[a.id];s.drawPile=s.drawPile.filter(id=>id!==a.id);s.destroyedCardIds=[a.id];
 const loaded=reload(s),b=add(loaded,loaded.cards.card_clubs_2);
 assert.equal(b.creationOrdinal,54);assert.notEqual(a.id,b.id);assert.deepEqual(reload(loaded),loaded);
});

test('identity metadata rejects ambiguity, gaps, counter rollback and forged original order',()=>{
 const s=run(),a=add(s,s.cards.card_clubs_2);
 for(const mutate of [
  n=>delete n.cards[a.id].creationOrdinal,
  n=>n.cards[a.id].creationOrdinal=54,
  n=>n.cards.card_clubs_2.creationOrdinal=2,
  n=>n.nextPlayingCardOrdinal=53,
  n=>n.nextPlayingCardOrdinal=55,
  n=>delete n.nextPlayingCardOrdinal,
  n=>{const c=n.cards[a.id];delete n.cards[a.id];c.id='legacy_unknown';n.cards[c.id]=c;n.drawPile[n.drawPile.indexOf(a.id)]=c.id;},
 ]){const n=structuredClone(s);mutate(n);assert.throws(()=>serializeState(n));}
 assert.throws(()=>deck.canonicalCards([{id:'legacy_unknown',rank:2,suit:'clubs',creationOrdinal:53}]));
 const before=structuredClone(s);assert.throws(()=>add(s,{id:'source',rank:15,suit:'clubs'}));assert.deepEqual(s,before);
});

test('Hook and Bell use physical creation order for duplicated faces and reverse inputs',()=>{
 const s=run(),a=add(s,s.cards.card_clubs_2),b=add(s,s.cards.card_clubs_2);
 const cards=[a,s.cards.card_clubs_2,b],ids=cards.map(c=>c.id);
 assert.deepEqual(chooseBellCard(s.rng.apk,cards),chooseBellCard(s.rng.apk,[...cards].reverse()));
 assert.deepEqual(chooseHookDiscards(s.rng.apk,ids),chooseHookDiscards(s.rng.apk,[...ids].reverse()));
 assert.deepEqual(deck.shuffleApkDeck(cards,s.rng.apk,'nr1'),deck.shuffleApkDeck([...cards].reverse(),s.rng.apk,'nr1'));
});

test('Death changes a generated target face while retaining its allocated identity',()=>{
 let s=run();const a=add(s,s.cards.card_clubs_2);s=dispatch(s,{type:'START_BLIND',expectedRevision:0}).state;
 if(!s.hand.includes(a.id)){s.drawPile.splice(s.drawPile.indexOf(a.id),1);s.drawPile.push(s.hand.pop());s.hand.unshift(a.id);}
 const right=s.hand.find(id=>id!==a.id);s.hand=[a.id,right,...s.hand.filter(id=>id!==a.id&&id!==right)];
 s.consumables=[{id:'death',entityId:'c_death',originalKey:'c_death',set:'Tarot',edition:'base',cost:3n,sellCost:1n}];
 s.apkShop.context=currentApkShopContext(s);
 const result=dispatch(s,{type:'USE_CONSUMABLE',expectedRevision:s.revision,cardId:'death',targetCardIds:[right,a.id]});
 assert.equal(result.error,null);assert.equal(result.state.cards[a.id].creationOrdinal,53);
 assert.equal(result.state.cards[a.id].rank,s.cards[right].rank);assert.equal(result.state.cards[a.id].suit,s.cards[right].suit);
 assert.deepEqual(reload(result.state),result.state);
});

test('generated Glass destruction retains its historical identity through strict score replay',()=>{
 let s=run();const a=add(s,{rank:2,suit:'clubs',enhancement:'glass'});s=dispatch(s,{type:'START_BLIND',expectedRevision:0}).state;
 if(!s.hand.includes(a.id)){s.drawPile.splice(s.drawPile.indexOf(a.id),1);s.drawPile.push(s.hand.pop());s.hand.unshift(a.id);}
 s.apkShop.context=currentApkShopContext(s);
 // Native keyed Glass trial selected by seed, not an injected outcome.
 let destroyed=null;
 for(let i=0;i<40;i++){
  const candidate=structuredClone(s);candidate.rng.apk.streams.glass=i/40;
  const result=dispatch(candidate,{type:'PLAY_HAND',expectedRevision:candidate.revision,cardIds:[a.id]});assert.equal(result.error,null);
  if(!result.state.cards[a.id]){destroyed=result.state;break;}
 }
 assert.ok(destroyed);assert.equal(destroyed.lastScore.glassDestroyedCards[0].creationOrdinal,53);
 assert.deepEqual(reload(destroyed),destroyed);
 const next=add(destroyed,destroyed.cards.card_clubs_2);assert.equal(next.creationOrdinal,54);
 const forged=structuredClone(destroyed);forged.lastScore.glassDestroyedCards[0].creationOrdinal=54;
 assert.throws(()=>serializeState(forged));
 const payload=JSON.parse(serializeState(destroyed));
 payload.state.lastScore=JSON.parse(JSON.stringify(payload.state.lastScore).replaceAll(a.id,'card_created_999'));
 payload.state.lastScore.glassDestroyedCards[0].creationOrdinal=999;
 assert.throws(()=>deserializeState(JSON.stringify(payload)),'unissued Glass snapshot must reject');
});

test('physical card order and copies match the isolated original shuffle/Bell/Hook oracle',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../../scripts/reference-rng/card-identity-fixtures.json',import.meta.url)));
 const cards=fixture.identities.map(({sort_id,...card})=>card);
 for(const [seed,expected] of Object.entries(fixture.seeds)){
  let rng=createApkRng(seed);
  const first=deck.shuffleApkDeck([...cards].reverse(),rng,'identity');rng=first.rng;
  assert.deepEqual(first.cardIds,expected.firstShuffle);
  const second=deck.shuffleApkDeck(first.cardIds.map(id=>cards.find(c=>c.id===id)),rng,'identity');rng=second.rng;
  assert.deepEqual(second.cardIds,expected.secondShuffle);
  const bell=chooseBellCard(rng,cards);rng=bell.rng;assert.equal(bell.cardId,expected.bell);
  const hook=chooseHookDiscards(rng,cards.map(c=>c.id));rng=hook.rng;assert.deepEqual(hook.cardIds,expected.hook);
  const later=[...cards.filter(c=>c.id!=='card_created_54'),{id:'card_created_56',rank:14,suit:'spades',creationOrdinal:56}];
  const third=deck.shuffleApkDeck(later,rng,'identity');assert.deepEqual(third.cardIds,expected.afterDeleteAndCreateShuffle);
  assert.equal(chooseBellCard(third.rng,later).cardId,expected.afterDeleteAndCreateBell);
 }
});

test('Bell destruction validates a historical choice containing a now-removed generated card',()=>{
 const s=run(),a=add(s,s.cards.card_clubs_2);
 s.round.ante=8;s.round.blindId='boss';s.apkShop.context.ante=8;s.apkBlinds.ante=8;s.apkBlinds.tagContext.ante=8;
 s.apkBlinds.bossId='bl_final_bell';s.apkBlinds.bossesUsed.bl_final_bell=1;s.round.target=bossTarget(s);
 s.phase='playing';s.revision=1;s.roundNumber=24;
 s.hand=[a.id];s.drawPile=s.drawPile.filter(id=>id!==a.id);s.discardPile=[];
 const before=s.rng.apk.streams.cerulean_bell??null,choice=chooseBellCard(s.rng.apk,[a]);s.rng.apk=choice.rng;
 s.bossState={version:1,id:'bl_final_bell',disabled:false,playedBeforeBoss:[],baseHandSize:8,forcedCardId:a.id,bellChoice:{cardIds:[a.id],streamBefore:before,revision:1}};
 // A legitimately shortened one-card hand after the remaining deck was discarded.
 s.discardPile.push(...s.drawPile);s.drawPile=[];
 s.consumables=[{id:'hanged',entityId:'c_hanged_man',originalKey:'c_hanged_man',set:'Tarot',sellCost:1n}];s.apkShop.context=currentApkShopContext(s);
 assert.deepEqual(reload(s),s);
 const result=dispatch(s,{type:'USE_CONSUMABLE',expectedRevision:1,cardId:'hanged',targetCardIds:[a.id]});assert.equal(result.error,null);
 assert.equal(result.state.bossState.forcedCardId,null);assert.deepEqual(reload(result.state),result.state);
});
