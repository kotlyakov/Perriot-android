import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createRun} from '../../src/core/run.js';
import {finishItem7Action} from '../../src/core/joker-item7-actions.js';
import {canUseConsumable,applyConsumableAction} from '../../src/core/consumables.js';
import {createApkRng,createApkMathState,nextApkMathRandom} from '../../src/core/apk-rng.js';
import {createApkShopContext} from '../../src/core/apk-shop.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {realHandSize} from '../../src/core/hand-size.js';

const fixture=JSON.parse(gunzipSync(readFileSync(new URL('../fixtures/spectral-native.json.gz',import.meta.url))));
const suits={Clubs:'clubs',Diamonds:'diamonds',Hearts:'hearts',Spades:'spades'};
const edition=value=>value==='holo'?'holographic':value;
function fresh(input){
 const state=createRun(input.seed,{runId:'spectral-native',referenceRng:true,referenceShop:true,money:BigInt(input.opts.dollars??20)});
 state.phase='playing';state.round.ante=2;
 state.hand=input.hand.map(c=>c.id);state.drawPile=Object.keys(state.cards).filter(id=>!state.hand.includes(id));state.discardPile=[];
 for(const spec of input.hand){const card=state.cards[spec.id];if(spec.center!=='c_base')card.enhancement=spec.center.slice(2);if(spec.edition!=='base')card.edition=edition(spec.edition);if(spec.seal!=='base')card.seal=spec.seal.toLowerCase();}
 state.jokers=input.jokers.map(j=>({id:j.id,entityId:j.center,originalKey:j.center,set:'Joker',creationOrdinal:j.ordinal,edition:edition(j.edition),eternal:j.eternal,debuffed:j.debuffed,...(j.toDoPokerHand?{toDoPokerHand:j.toDoPokerHand}:{}),cost:4n,sellCost:2n}));
 state.nextJokerCreationOrdinal=104;state.jokerSlots=input.opts.jokerLimit??5;
 state.consumables=[{id:'spectral',entityId:input.key,originalKey:input.key,set:'Spectral',edition:'base',debuffed:input.opts.debuffed??false,cost:4n,sellCost:2n}];
 state.ectoMinus=input.opts.ectoMinus??1;
 if(input.opts.withPassives&&input.mode==='passives')state.round.handSize=12;
 state.apkShop.context=createApkShopContext({ante:2,bannedCentreIds:input.opts.banned??[],unlockedCentreIds:input.opts.unlockedAll?catalogue.centres.filter(c=>c.set==='Joker').map(c=>c.key):[],editionRate:input.opts.editionRate??1,modifiers:{all_eternal:!!input.opts.allEternal}});
 state.rng.apk=createApkRng(input.seed,createApkMathState(17));
 return state;
}
const playing=c=>({id:c.id,rank:c.rank,suit:c.suit,enhancement:c.enhancement??'base',edition:c.edition??'base',seal:c.seal??'base'});
const nativePlaying=c=>({id:c.id,rank:c.rank,suit:suits[c.suit],enhancement:c.center==='c_base'?'base':c.center.slice(2),edition:edition(c.edition),seal:c.seal.toLowerCase()});
const joker=c=>({id:c.id.startsWith('owned_')?c.id:'new',entityId:c.entityId,edition:c.edition??'base',eternal:!!c.eternal,debuffed:!!c.debuffed,toDoPokerHand:c.toDoPokerHand});
const nativeJoker=c=>({id:c.id.startsWith('owned_')?c.id:'new',entityId:c.center,edition:edition(c.edition),eternal:c.eternal,debuffed:c.debuffed,toDoPokerHand:c.toDoPokerHand});

for(const key of [...new Set(fixture.cases.map(c=>c.input.key))])test(`${key}: native use identities, physical order, mutations, streams and raw callback chronology`,()=>{
 for(const expected of fixture.cases.filter(c=>c.input.key===key)){
  const {input}=expected,label=`${input.seed}/${key}/${input.mode}`,state=fresh(input),before=structuredClone(state);
  const targetCardIds=key==='c_cryptid'&&input.hand.length?[input.target]:[];
  assert.equal(canUseConsumable(state,state.consumables[0],targetCardIds).available,expected.available,label+'/available');
  const action={type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:'spectral',targetCardIds};
  const result=applyConsumableAction(state,action);
  // Match the admitted native use/add/remove callback boundary. Global dispatch
  // also advances the next-frame empty-hand refill, which this oracle excludes.
  if(input.opts.withPassives&&!result.error)finishItem7Action(state,result.state,action,result.events);
  assert.deepEqual(state,before,label+'/immutable');
  if(!expected.available){assert.ok(result.error,label+'/reject');assert.equal(result.state,state,label+'/same state');continue;}
  assert.equal(result.error,null,label+'/use');
  assert.deepEqual(result.state.hand.map(id=>playing(result.state.cards[id])),expected.hand.map(nativePlaying),label+'/hand');
  assert.deepEqual(result.state.jokers.map(joker),expected.jokers.map(nativeJoker),label+'/jokers');
  assert.deepEqual(result.events.filter(e=>e.type==='playing_card_destroyed'||e.type==='joker_removed').map(e=>e.cardId??e.joker.id),expected.removed,label+'/destruction order');
  assert.equal(realHandSize(result.state),expected.realHandLimit,label+'/real hand limit');
  assert.equal(result.state.round.handSize,expected.handLimit,label+'/clamped hand limit');
  assert.equal((result.state.jokerSlots??5)+result.state.jokers.filter(j=>j.edition==='negative').length,expected.jokerLimit,label+'/joker limit');
  assert.equal(result.state.money,BigInt(expected.dollars),label+'/money');
  assert.equal(result.state.ectoMinus,expected.ectoMinus,label+'/ecto cost');
  assert.deepEqual(result.state.rng.apk.streams,expected.streams,label+'/streams');
  let math=result.state.rng.apk.mathState;
  for(const value of expected.followingMath){const next=nextApkMathRandom(math);assert.equal(next.value,value,label+'/following raw');math=next.state;}
 }
});

test('native Spectral oracle retains explicit adapter scope and independent source provenance',()=>{
 assert.equal(fixture.cases.length,796);assert.equal(fixture.jitEquality,true);
 assert.equal(Object.keys(fixture.sourceSha256).length,4);
 const wraith=fixture.cases.filter(c=>c.input.key==='c_wraith');
 assert.deepEqual([...new Set(wraith.flatMap(c=>c.created.map(j=>edition(j.edition))))].sort(),['base','foil','holographic','negative','polychrome']);
 assert.equal(new Set(wraith.filter(c=>c.input.mode==='unlocked').flatMap(c=>c.created.map(j=>j.center))).size,20);
 assert.ok(wraith.filter(c=>c.input.mode==='empty_pool').every(c=>c.created[0].center==='j_joker'));
 assert.equal(fixture.cases.filter(c=>c.input.opts.withPassives).length,24);
 assert.ok(fixture.cases.filter(c=>c.input.mode==='negative_hand_size').every(c=>c.handLimit===0&&c.realHandLimit===-2));
 const createdEnhancements=new Set(fixture.cases.filter(c=>['c_familiar','c_grim','c_incantation'].includes(c.input.key)).flatMap(c=>c.created.map(card=>card.center)));
 assert.deepEqual([...createdEnhancements].sort(),['m_bonus','m_glass','m_gold','m_lucky','m_mult','m_steel','m_wild']);
 assert.match(fixture.scope,/unchanged Card:can_use_consumeable and Card:use_consumeable/);
 for(const key of ['c_familiar','c_grim','c_incantation','c_cryptid','c_sigil','c_ouija','c_immolate','c_ankh','c_hex','c_ectoplasm','c_wraith']){
  const cases=fixture.cases.filter(c=>c.input.key===key);
  assert.ok(cases.some(c=>c.available&&c.input.mode==='base'),key+'/positive');
  assert.ok(cases.some(c=>!c.available),key+'/boundary');
  const debuffed=cases.filter(c=>c.input.opts.debuffed);
  assert.ok(debuffed.length,key+'/debuffed source');
  for(const c of debuffed){assert.deepEqual(c.draws,[]);assert.deepEqual(c.created,[]);assert.deepEqual(c.removed,[]);}
 }
});
