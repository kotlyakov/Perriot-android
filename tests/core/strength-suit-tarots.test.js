import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {canUseConsumable} from '../../src/core/consumables.js';
import {isBossCardDebuffed,bossTarget} from '../../src/core/boss-effects.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {describeShopItem} from '../../src/content/shop-display.js';

const suits={c_star:'diamonds',c_moon:'clubs',c_sun:'hearts',c_world:'spades'};
function run(key){
 let state=createRun('STRENGTH',{runId:'strength-suit',money:4n,referenceRng:true,referenceShop:true});
 state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;
 const centre=catalogue.centres.find(card=>card.key===key);
 state.consumables=[{id:'tarot',entityId:key,originalKey:key,set:'Tarot',edition:'base',cost:BigInt(centre.cost),sellCost:1n}];
 state.apkShop.context=currentApkShopContext(state);return state;
}
const use=(state,targets)=>dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:'tarot',targetCardIds:targets});
const reload=state=>deserializeState(serializeState(state));

test('Strength advances every rank with ace wrapping to two and preserves identity, suit and enhancement',()=>{
 for(let rank=2;rank<=14;rank++){
  const state=run('c_strength'),target=state.hand[0];state.cards[target].rank=rank;state.cards[target].enhancement='stone';state.apkShop.context=currentApkShopContext(state);
  const before=structuredClone(state),result=use(state,[target]);assert.equal(result.error,null);
  assert.deepEqual(result.state.cards[target],{...state.cards[target],rank:rank===14?2:rank+1});
  assert.deepEqual(result.state.rng,before.rng);assert.deepEqual(result.state.hand,before.hand);assert.deepEqual(reload(result.state),result.state);assert.deepEqual(state,before);
  assert.equal(result.state.lastTarotPlanet,'c_strength');assert.equal(result.state.consumableUsage.c_strength.count,1);
 }
});

test('targeted rank and suit Tarots validate their exact limits and reject atomically',()=>{
 for(const key of ['c_strength',...Object.keys(suits)]){
  const maximum=key==='c_strength'?2:3;
  for(let count=1;count<=maximum;count++){const state=run(key);assert.equal(use(state,state.hand.slice(0,count)).error,null);}
  for(const select of [()=>[],s=>s.hand.slice(0,maximum+1),s=>[s.hand[0],s.hand[0]],s=>[s.drawPile[0]],()=>['missing']]){
   const state=run(key),before=structuredClone(state),result=use(state,select(state));assert.equal(result.error?.code,'INVALID_TARGETS');assert.equal(result.state,state);assert.deepEqual(state,before);
  }
 }
});

test('suit Tarots convert up to three selected cards without replacing enhancements or spending RNG',()=>{
 for(const [key,suit] of Object.entries(suits)){
  const state=run(key),targets=state.hand.slice(0,3);targets.forEach((id,i)=>state.cards[id].enhancement=['wild','gold','stone'][i]);state.apkShop.context=currentApkShopContext(state);
  const before=structuredClone(state),result=use(state,[...targets].reverse());assert.equal(result.error,null);
  for(const id of targets)assert.deepEqual(result.state.cards[id],{...state.cards[id],suit});
  for(const id of state.hand.slice(3))assert.deepEqual(result.state.cards[id],state.cards[id]);
  assert.deepEqual(result.state.rng,before.rng);assert.deepEqual(result.state.hand,before.hand);assert.deepEqual(reload(result.state),result.state);assert.deepEqual(state,before);
  assert.equal(result.state.lastTarotPlanet,key);assert.equal(result.state.consumableUsage[key].count,1);
 }
});

test('debuffed rank and suit Tarots consume and count without modifying targets',()=>{
 for(const key of ['c_strength',...Object.keys(suits)]){
  const state=run(key),before=structuredClone(state.cards);state.consumables[0].debuffed=true;
  const result=use(state,[state.hand[0]]);assert.equal(result.error,null);assert.deepEqual(result.state.cards,before);assert.deepEqual(result.state.rng,state.rng);assert.equal(result.state.consumableUsage[key].count,1);assert.equal(result.state.consumables.length,0);
 }
});

test('Strength updates Plant debuff and suit conversion updates suit bosses while Pillar uses identity',()=>{
 const state=run('c_strength'),id=state.hand[0];state.cards[id].rank=10;state.bossState={id:'bl_plant'};
 assert.equal(isBossCardDebuffed(state,state.cards[id]),false);const raised=use(state,[id]);assert.equal(raised.error,null);assert.equal(isBossCardDebuffed(raised.state,raised.state.cards[id]),true);
 for(const [key,suit] of Object.entries(suits)){
  const state=run(key),id=state.hand[0];state.cards[id].suit=suit==='clubs'?'hearts':'clubs';state.bossState={id:{clubs:'bl_club',diamonds:'bl_window',hearts:'bl_head',spades:'bl_goad'}[suit]};
  assert.equal(isBossCardDebuffed(state,state.cards[id]),false);const changed=use(state,[id]);assert.equal(changed.error,null);assert.equal(isBossCardDebuffed(changed.state,changed.state.cards[id]),true);
  changed.state.bossState={id:'bl_pillar',playedBeforeBoss:[id]};assert.equal(isBossCardDebuffed(changed.state,changed.state.cards[id]),true);
 }
});

test('implemented rank and suit Tarot descriptions and purchase capability are truthful',()=>{
 for(const key of ['c_strength',...Object.keys(suits)]){
  const state=run(key),description=describeShopItem(state.consumables[0]);assert.equal(description.canBuy,true);assert.doesNotMatch(description.description,/предварительной/);assert.equal(canUseConsumable(state,state.consumables[0],[state.hand[0]]).available,true);
 }
});

test('Mark preserves concealment and saving when Strength turns a transformed hidden king into an ace',()=>{
 let state=createRun('MARK24',{runId:'strength-mark',money:4n,referenceRng:true,referenceShop:true});
 state.round.ante=2;state.round.blindId='boss';state.apkBlinds.ante=2;state.apkBlinds.tagContext.ante=2;state.apkBlinds.bossId='bl_mark';state.apkBlinds.bossesUsed.bl_mark=1;state.round.target=bossTarget(state);
 for(const card of Object.values(state.cards))card.rank=13;
 state.consumables=run('c_strength').consumables;state.apkShop.context=currentApkShopContext(state);state.apkShop.context.ante=2;
 state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;
 const target=state.hand.find(id=>!/_1[123]$/.test(id));assert.ok(target);assert.ok(state.bossState.hiddenCardIds.includes(target));assert.deepEqual(reload(state),state);
 const result=use(state,[target]);assert.equal(result.error,null);assert.equal(result.state.cards[target].rank,14);assert.ok(result.state.bossState.hiddenCardIds.includes(target));assert.deepEqual(reload(result.state),result.state);
 const discarded=dispatch(result.state,{type:'DISCARD',expectedRevision:result.state.revision,cardIds:[target]});assert.equal(discarded.error,null);assert.deepEqual(reload(discarded.state),discarded.state);
 for(const mutate of [s=>s.bossState.hiddenFaceRanks[target]=14,s=>delete s.bossState.hiddenFaceRanks[target],s=>s.bossState.hiddenFaceRanks.missing=13]){const bad=structuredClone(result.state);mutate(bad);assert.throws(()=>serializeState(bad),/Invalid save data/);}
});

test('legacy Mark snapshots capture concealment before Strength and Death transformations',()=>{
 for(const key of ['c_strength','c_death']){
  let state=createRun('MARK0',{runId:key+'-legacy',money:4n,referenceRng:true,referenceShop:true});state.round.ante=2;state.round.blindId='boss';state.apkBlinds.ante=2;state.apkBlinds.tagContext.ante=2;state.apkBlinds.bossId='bl_mark';state.apkBlinds.bossesUsed.bl_mark=1;state.round.target=bossTarget(state);state.apkShop.context=currentApkShopContext(state);state.apkShop.context.ante=2;
  state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;delete state.bossState.hiddenFaceRanks;state.consumables=run(key).consumables;state.apkShop.context=currentApkShopContext(state);assert.deepEqual(reload(state),state);
  const hidden=state.bossState.hiddenCardIds[0];assert.ok(hidden);const targets=key==='c_strength'?[hidden]:[hidden,state.hand.find(id=>state.cards[id].rank<11)];
  const result=use(state,targets);assert.equal(result.error,null);assert.ok(result.state.bossState.hiddenFaceRanks);assert.deepEqual(reload(result.state),result.state);
 }
});

test('legacy Mark snapshots migrate existing concealed cards before drawing a new face',()=>{
 let state=createRun('MARK5',{runId:'mark-draw-legacy',money:4n,referenceRng:true,referenceShop:true});state.round.ante=2;state.round.blindId='boss';state.apkBlinds.ante=2;state.apkBlinds.tagContext.ante=2;state.apkBlinds.bossId='bl_mark';state.apkBlinds.bossesUsed.bl_mark=1;state.round.target=bossTarget(state);state.apkShop.context=currentApkShopContext(state);state.apkShop.context.ante=2;
 state=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision}).state;delete state.bossState.hiddenFaceRanks;assert.deepEqual(reload(state),state);
 const result=dispatch(state,{type:'DISCARD',cardIds:['card_hearts_10'],expectedRevision:state.revision});assert.equal(result.error,null);assert.deepEqual(result.state.bossState.hiddenCardIds,['card_spades_11','card_diamonds_13']);assert.deepEqual(reload(result.state),result.state);
});
