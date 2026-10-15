import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRun,dispatch} from '../../src/core/run.js';
import {bossTarget,chooseBellCard,disableBoss} from '../../src/core/boss-effects.js';
import {createApkRng,createApkMathState,nextApkRandom} from '../../src/core/apk-rng.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {describeShopItem} from '../../src/content/shop-display.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const fixtures=JSON.parse(readFileSync(new URL('../../scripts/reference-rng/showdown-fixtures.json',import.meta.url)));
const act=(s,type,fields={})=>dispatch(s,{type,expectedRevision:s.revision,...fields});
const reload=s=>deserializeState(serializeState(s));
function pending(id='bl_final_bell',count=0,seed='AAAAAAA1'){
 const s=createRun(seed,{runId:'bell-acorn',money:10n,referenceRng:true,referenceShop:true});
 s.round.ante=8;s.round.blindId='boss';s.apkShop.context.ante=8;s.apkBlinds.ante=8;s.apkBlinds.tagContext.ante=8;
 s.apkBlinds.bossId=id;s.apkBlinds.bossesUsed[id]=1;s.round.target=bossTarget(s);
 s.jokers=Array.from({length:count},(_,i)=>({id:'joker_'+(i+1),entityId:'j_joker',creationOrdinal:i+1,cost:4n,edition:'base',sellCost:2n}));s.nextJokerCreationOrdinal=count+1;return s;
}
function active(id,count,seed){const result=act(pending(id,count,seed),'START_BLIND');assert.equal(result.error,null);return result.state;}
test('Bell initially forces native canonical choice and rejects omitted selection atomically',()=>{
 let s=active();assert.ok(s.hand.includes(s.bossState.forcedCardId));assert.deepEqual(reload(s),s);
 for(const type of ['PLAY_HAND','DISCARD']){
  const before=structuredClone(s),r=act(s,type,{cardIds:[s.hand.find(id=>id!==s.bossState.forcedCardId)]});
  assert.equal(r.error.code,'FORCED_SELECTION');assert.equal(r.state,s);assert.deepEqual(r.events,[]);assert.deepEqual(s,before);
  const expected=chooseBellCard(s.rng.apk,[...s.hand.filter(id=>id!==s.bossState.forcedCardId).map(id=>s.cards[id]),s.cards[s.drawPile.at(-1)]]);
  const accepted=act(s,type,{cardIds:[s.bossState.forcedCardId]});assert.equal(accepted.error,null);assert.equal(accepted.state.bossState.forcedCardId,expected.cardId);assert.deepEqual(accepted.state.rng.apk,expected.rng);assert.deepEqual(reload(accepted.state),accepted.state);
 }
});
test('Bell zero-new-card draw still polls; empty native hand error becomes atomic dispatcher rejection',()=>{
 const s=active();s.discardPile.push(...s.drawPile);s.drawPile=[];
 const r=act(s,'DISCARD',{cardIds:[s.bossState.forcedCardId]});assert.equal(r.error,null);assert.ok(!r.events.some(e=>e.type==='cards_drawn'));
 const expected=chooseBellCard(s.rng.apk,r.state.hand.map(id=>r.state.cards[id]));assert.equal(r.state.bossState.forcedCardId,expected.cardId);assert.deepEqual(r.state.rng.apk,expected.rng);assert.deepEqual(reload(r.state),r.state);
 const lone=active();lone.discardPile.push(...lone.drawPile,...lone.hand.filter(id=>id!==lone.bossState.forcedCardId));lone.drawPile=[];lone.hand=[lone.bossState.forcedCardId];
 const before=structuredClone(lone),empty=act(lone,'DISCARD',{cardIds:lone.hand});assert.equal(empty.error.code,'UNSUPPORTED_BOSS_STATE');assert.equal(empty.state,lone);assert.deepEqual(empty.events,[]);assert.deepEqual(lone,before);
 const p=pending();p.cards={card_clubs_2:p.cards.card_clubs_2};p.drawPile=['card_clubs_2'];const one=act(p,'START_BLIND');assert.equal(one.error,null);assert.equal(one.state.bossState.forcedCardId,'card_clubs_2');assert.ok(one.state.rng.apk.streams.cerulean_bell);
});
test('Bell force clears after supported destruction, disable and terminal play without an extra poll',()=>{
 let s=active();s.consumables=[{id:'hanged',entityId:'c_hanged_man',originalKey:'c_hanged_man',set:'Tarot',sellCost:1n}];
 const destroyed=act(s,'USE_CONSUMABLE',{cardId:'hanged',targetCardIds:[s.bossState.forcedCardId]});assert.equal(destroyed.error,null);s=destroyed.state;assert.equal(s.bossState.forcedCardId,null);assert.deepEqual(reload(s),s);
 s=act(s,'DISCARD',{cardIds:[s.hand[0]]}).state;assert.ok(s.hand.includes(s.bossState.forcedCardId));assert.deepEqual(reload(s),s);
 disableBoss(s,[]);s.revision++;assert.equal(s.bossState.forcedCardId,null);assert.deepEqual(reload(s),s);
 const won=active();won.round.score=won.round.target-1n;const rng=structuredClone(won.rng);const result=act(won,'PLAY_HAND',{cardIds:[won.bossState.forcedCardId]});assert.equal(result.state.phase,'round_won');assert.equal(result.state.bossState.forcedCardId,null);assert.deepEqual(result.state.rng,rng);assert.deepEqual(reload(result.state),result.state);
});
test('Acorn integrated setup matches native nr8 then three shuffles, full raw RNG and reload',()=>{
 for(const row of fixtures.acorn){
  const p=pending('bl_final_acorn',row.count,row.seed);p.rng.apk=createApkRng(row.seed,createApkMathState(42));if(row.reverse)p.jokers.reverse();
  for(const j of p.jokers)p.rng.apk=nextApkRandom(p.rng.apk,'setup_oracle',1,5).rng;
  const r=act(p,'START_BLIND');assert.equal(r.error,null);const s=r.state;
  assert.deepEqual(s.jokers.map(j=>j.id),row.after.jokerIds);assert.deepEqual(s.bossState.hiddenJokerIds,p.jokers.map(j=>j.id));assert.deepEqual(s.rng.apk.streams,row.after.streams);assert.deepEqual(s.rng.apk.mathState,row.after.mathState);assert.deepEqual(reload(s),s);
 }
});
test('Acorn new Joker stays visible; reorder/sale and reveal retain real identity/order/sell value',()=>{
 let s=active('bl_final_acorn',3);s.jokers.push({id:'new',entityId:'j_joker',creationOrdinal:4,sellCost:7n});s.nextJokerCreationOrdinal=5;s.apkShop.context=currentApkShopContext(s);
 assert.equal(s.bossState.hiddenJokerIds.includes('new'),false);assert.deepEqual(reload(s),s);
 s=act(s,'REORDER_JOKERS',{cardIds:s.jokers.map(j=>j.id).reverse()}).state;assert.deepEqual(reload(s),s);
 const hidden=s.bossState.hiddenJokerIds[0],money=s.money;s=act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:hidden}).state;assert.equal(s.money,money+2n);assert.equal(s.bossState.hiddenJokerIds.includes(hidden),false);assert.deepEqual(reload(s),s);
 const order=s.jokers.map(j=>j.id),rng=structuredClone(s.rng);disableBoss(s,[]);s.revision++;assert.deepEqual(s.bossState.hiddenJokerIds,[]);assert.deepEqual(s.jokers.map(j=>j.id),order);assert.deepEqual(s.rng,rng);assert.deepEqual(reload(s),s);
 const won=active('bl_final_acorn',2);won.round.score=won.round.target-1n;const result=act(won,'PLAY_HAND',{cardIds:[won.hand[0]]}).state;assert.equal(result.phase,'round_won');assert.deepEqual(result.bossState.hiddenJokerIds,[]);assert.deepEqual(result.jokers,won.jokers);assert.deepEqual(reload(result),result);
});
test('Bell Glass replay authenticates subsequent discard polls, target, named stream and raw state',()=>{
 for(const shattered of [false,true])for(const terminal of ['continue','win','loss','no-draw']){
  let s=active();if(terminal==='loss')for(let i=0;i<3;i++)s=act(s,'PLAY_HAND',{cardIds:[s.bossState.forcedCardId]}).state;
  const id=s.bossState.forcedCardId;s.cards[id].enhancement='glass';s.apkShop.context=currentApkShopContext(s);
  for(let i=0;(nextApkRandom(s.rng.apk,'glass').value<1/4)!==shattered;i++){assert.ok(i<30);s.rng.apk=nextApkRandom(s.rng.apk,'glass').rng;}
  if(terminal==='win')s.round.score=s.round.target-1n;if(terminal==='no-draw'){s.discardPile.push(...s.drawPile);s.drawPile=[];}
  const r=act(s,'PLAY_HAND',{cardIds:[id]});assert.equal(r.error,null);s=r.state;assert.equal(s.lastScore.glassRolls[0].destroyed,shattered);assert.deepEqual(reload(s),s);
  if(['continue','no-draw'].includes(terminal))for(let i=0;i<3;i++){s=act(s,'DISCARD',{cardIds:[s.bossState.forcedCardId]}).state;assert.deepEqual(reload(s),s);}
  for(const mutate of [x=>x.rng.apk.mathState=createApkRng('forged').mathState,x=>x.rng.apk=nextApkRandom(x.rng.apk,'cerulean_bell',1,Math.max(1,x.hand.length)).rng,x=>delete x.lastScore.bossHistory.bellRngBefore,x=>x.lastScore.bossHistory.bellRngBefore='0.5',x=>x.lastScore.glassRngAfter.mathState=x.rng.apk.mathState]){
   const bad=structuredClone(s);mutate(bad);if(JSON.stringify(bad,(_,v)=>typeof v==='bigint'?String(v):v)!==JSON.stringify(s,(_,v)=>typeof v==='bigint'?String(v):v))assert.throws(()=>serializeState(bad));
  }
  if(s.phase==='playing'){const bad=structuredClone(s);bad.bossState.forcedCardId=s.hand.find(id=>id!==s.bossState.forcedCardId);assert.throws(()=>serializeState(bad));}
 }
});
test('Acorn and Bell save rejects missing, foreign, duplicate and disabled flags',()=>{
 for(const [id,field,invalid] of [['bl_final_acorn','hiddenJokerIds',['missing']],['bl_final_acorn','hiddenJokerIds',['joker_1','joker_1']],['bl_final_bell','forcedCardId','missing']]){
  const s=active(id,2);s.bossState[field]=invalid;assert.throws(()=>serializeState(s));
 }
 for(const id of ['bl_final_bell','bl_final_acorn']){
  const s=active(id,2),before=structuredClone(s.bossState);disableBoss(s,[]);s.revision++;assert.deepEqual(reload(s),s);
  if(id==='bl_final_bell'){s.bossState.forcedCardId=before.forcedCardId;s.bossState.bellChoice=before.bellChoice;}else s.bossState.hiddenJokerIds=before.hiddenJokerIds;
  assert.throws(()=>serializeState(s));
 }
});
test('Bell genuine choice survives RNG-consuming Wheel, transforms, sorting and other-card Hanged destruction',()=>{
 let s=active('bl_final_bell',2),force=s.bossState.forcedCardId,choice=structuredClone(s.bossState.bellChoice),rng=structuredClone(s.rng);
 s.consumables=[{id:'wheel',entityId:'c_wheel_of_fortune',originalKey:'c_wheel_of_fortune',set:'Tarot',sellCost:1n}];
 const wheel=act(s,'USE_CONSUMABLE',{cardId:'wheel'});assert.equal(wheel.error,null);s=wheel.state;assert.notDeepEqual(s.rng.apk.mathState,rng.apk.mathState);assert.deepEqual(s.bossState.bellChoice,choice);assert.equal(s.bossState.forcedCardId,force);assert.deepEqual(reload(s),s);
 s=act(s,'SET_SORT',{mode:'suit'}).state;assert.deepEqual(s.bossState.bellChoice,choice);assert.deepEqual(reload(s),s);
 s.consumables=[{id:'strength',entityId:'c_strength',originalKey:'c_strength',set:'Tarot',sellCost:1n}];s=act(s,'USE_CONSUMABLE',{cardId:'strength',targetCardIds:[force]}).state;assert.equal(s.bossState.forcedCardId,force);assert.deepEqual(reload(s),s);
 for(let i=0;i<2;i++){
  s.consumables=[{id:'hanged_'+i,entityId:'c_hanged_man',originalKey:'c_hanged_man',set:'Tarot',sellCost:1n}];const other=s.hand.find(id=>id!==force);
  const result=act(s,'USE_CONSUMABLE',{cardId:'hanged_'+i,targetCardIds:[other]});assert.equal(result.error,null);s=result.state;assert.equal(s.bossState.forcedCardId,force);assert.deepEqual(s.bossState.bellChoice,choice);assert.deepEqual(reload(s),s);
 }
 const before=structuredClone(s.rng);s=act(s,'DISCARD',{cardIds:[force]}).state;assert.notDeepEqual(s.rng,before);assert.ok(s.hand.includes(s.bossState.forcedCardId));assert.deepEqual(reload(s),s);
});
test('Bell source choice rejects forged initial target/null, stale Hanged epoch and historical dead-card pool injection',()=>{
 const initial=active();
 for(const mutate of [s=>s.bossState.forcedCardId=s.hand.find(id=>id!==s.bossState.forcedCardId),s=>s.bossState.forcedCardId=null,s=>s.bossState.bellChoice=null,s=>s.bossState.bellChoice.streamBefore=0.5,s=>s.bossState.bellChoice.cardIds.pop(),s=>s.bossState.bellChoice.cardIds.push(s.drawPile[0])]){
  const bad=structuredClone(initial);mutate(bad);assert.throws(()=>serializeState(bad));
 }
 let s=active();s.consumables=[{id:'hanged',entityId:'c_hanged_man',originalKey:'c_hanged_man',set:'Tarot',sellCost:1n}];const destroyed=s.hand.find(id=>id!==s.bossState.forcedCardId);s=act(s,'USE_CONSUMABLE',{cardId:'hanged',targetCardIds:[destroyed]}).state;
 const oldEpoch=structuredClone(s);oldEpoch.hangedShortfallEpoch.revision=s.bossState.bellChoice.revision;assert.throws(()=>serializeState(oldEpoch));
 s=act(s,'DISCARD',{cardIds:[s.bossState.forcedCardId]}).state;const injected=structuredClone(s);injected.bossState.bellChoice.cardIds.push(destroyed);assert.throws(()=>serializeState(injected));
});
test('Bell Glass score context clears on consumables and inventory mutations, never exempts unrelated raw state',()=>{
 let s=active('bl_final_bell',2);const id=s.bossState.forcedCardId;s.cards[id].enhancement='glass';s.apkShop.context=currentApkShopContext(s);s=act(s,'PLAY_HAND',{cardIds:[id]}).state;assert.deepEqual(reload(s),s);
 const wheel=structuredClone(s);wheel.consumables=[{id:'wheel',entityId:'c_wheel_of_fortune',originalKey:'c_wheel_of_fortune',set:'Tarot',sellCost:1n}];const used=act(wheel,'USE_CONSUMABLE',{cardId:'wheel'});assert.equal(used.error,null);assert.equal(used.state.lastScore,null);assert.deepEqual(reload(used.state),used.state);
 for(const [type,fields] of [['REORDER_JOKERS',{cardIds:s.jokers.map(j=>j.id).reverse()}],['SELL_OWNED_CARD',{area:'jokers',cardId:s.jokers[0].id}]]){const r=act(s,type,fields);assert.equal(r.error,null);assert.equal(r.state.lastScore,null);assert.deepEqual(reload(r.state),r.state);}
 const plain=active();const result=act(plain,'PLAY_HAND',{cardIds:[plain.bossState.forcedCardId]}).state;result.lastScore.bossHistory={bellRngBefore:0.5};assert.throws(()=>serializeState(result));
});

test('Bell Glass rejects a coherent extra poll even when its current target, pool and RNG agree',()=>{
 let s=active();const id=s.bossState.forcedCardId;s.cards[id].enhancement='glass';s.apkShop.context=currentApkShopContext(s);
 s=act(s,'PLAY_HAND',{cardIds:[id]}).state;
 for(let i=0;i<3;i++){
  assert.deepEqual(reload(s),s);
  const bad=structuredClone(s),streamBefore=bad.rng.apk.streams.cerulean_bell,extra=chooseBellCard(bad.rng.apk,bad.hand.map(id=>bad.cards[id]));
  bad.rng.apk=extra.rng;bad.bossState.forcedCardId=extra.cardId;bad.bossState.bellChoice={cardIds:[...bad.hand],streamBefore,revision:bad.revision};
  assert.throws(()=>serializeState(bad));
  s=act(s,'DISCARD',{cardIds:[s.bossState.forcedCardId]}).state;
 }
});

test('Bell mixed Glass and Lucky scoring preserves both score streams through later discards',()=>{
 let s=active('bl_final_bell',1);s.jokers[0].entityId='j_splash';const glass=s.bossState.forcedCardId,lucky=s.hand.find(id=>id!==glass);
 s.cards[glass].enhancement='glass';s.cards[lucky].enhancement='lucky';s.apkShop.context=currentApkShopContext(s);
 const result=act(s,'PLAY_HAND',{cardIds:[glass,lucky]});assert.equal(result.error,null);s=result.state;assert.equal(s.lastScore.glassRolls.length,1);assert.ok(s.lastScore.luckyRolls.length);assert.deepEqual(reload(s),s);
 for(let i=0;i<3;i++){s=act(s,'DISCARD',{cardIds:[s.bossState.forcedCardId]}).state;assert.deepEqual(reload(s),s);}
});

test('Bell Death transformation retains physical choice identity and Acorn admission rejects ambiguous Joker identities',()=>{
 let s=active(),force=s.bossState.forcedCardId;const before=structuredClone(s.bossState.bellChoice);
 s.consumables=[{id:'death',entityId:'c_death',originalKey:'c_death',set:'Tarot',sellCost:1n}];
 const r=act(s,'USE_CONSUMABLE',{cardId:'death',targetCardIds:[force,s.hand.find(id=>id!==force)]});assert.equal(r.error,null);s=r.state;
 assert.equal(s.bossState.forcedCardId,force);assert.deepEqual(s.bossState.bellChoice,before);assert.deepEqual(reload(s),s);
 for(const mutate of [s=>delete s.jokers[0].creationOrdinal,s=>s.jokers[0].creationOrdinal=s.jokers[1].creationOrdinal]){
  const p=pending('bl_final_acorn',2);mutate(p);const before=structuredClone(p),result=act(p,'START_BLIND');assert.equal(result.error.code,'BOSS_UNAVAILABLE');assert.equal(result.state,p);assert.deepEqual(result.events,[]);assert.deepEqual(p,before);
 }
});

test('Bell integrated initial pool matches native force, named stream and raw state for every oracle seed',()=>{
 for(const row of fixtures.bell.filter(row=>row.count)){
  const p=pending('bl_final_bell',0,row.seed);p.cards=Object.fromEntries(Array.from({length:row.count},(_,i)=>{const id='card_clubs_'+(i+2);return [id,p.cards[id]];}));p.drawPile=Object.keys(p.cards);p.rng.apk=createApkRng(row.seed,createApkMathState(42));
  const r=act(p,'START_BLIND');assert.equal(r.error,null);const native=row.steps[0].after;assert.equal(r.state.bossState.forcedCardId,native.forcedIds[0]);assert.equal(r.state.rng.apk.streams.cerulean_bell,native.streams.cerulean_bell);assert.deepEqual(r.state.rng.apk.mathState,native.mathState);assert.deepEqual(reload(r.state),r.state);
 }
});
test('owned disabled Negative Joker tooltip retains Joker capacity terminology and shop eligibility stays false',()=>{
 const offer={entityId:'j_joker',edition:'negative',debuffed:true};
 assert.equal(describeShopItem(offer).canBuy,false);assert.equal(describeShopItem(offer,{owned:true}).canBuy,true);assert.match(describeShopItem(offer,{owned:true}).description,/этого джокера/);
 for(const debuffed of [null,1,'true'])assert.equal(describeShopItem({...offer,debuffed},{owned:true}).canBuy,false);
});
