import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {nativeBlindTarget} from '../../src/core/blind-progression.js';
import {getCashout} from '../../src/core/cashout.js';
import {bossTarget,disableBoss} from '../../src/core/boss-effects.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {DECKS} from '../../src/content/decks.js';
const run=(stake,deckId='red',seed='STAKE10B')=>createRun(seed,{runId:'stakes',deckId,stake,money:4n,referenceRng:true,referenceShop:true,reducedMotion:true});
const act=(s,type,extra={})=>{const r=dispatch(s,{type,expectedRevision:s.revision,...extra});assert.equal(r.error,null,JSON.stringify(r.error));return r.state;};
const reload=s=>{assert.deepEqual(deserializeState(serializeState(s)),s);return s;};

test('10b all8stakes persist and compose with each of15decks',()=>{
 for(let level=1;level<=8;level++)for(const deckId of Object.keys(DECKS)){
  let s=reload(run(level,deckId));assert.equal(s.stake??1,level);assert.equal(s.round.discardsRemaining,(deckId==='red'?4:3)-(level>=5?1:0));
  assert.equal(!!s.apkShop.context.modifiers.enable_eternals_in_shop,level>=4);assert.equal(!!s.apkShop.context.modifiers.enable_perishables_in_shop,level>=7);assert.equal(!!s.apkShop.context.modifiers.enable_rentals_in_shop,level>=8);
  s=reload(act(s,'START_BLIND'));s=reload(act(s,'PLAY_HAND',{cardIds:s.hand.slice(0,1)}));
 }
});
test('10b native blind curves retain exact8ante values and scaling on Endless',()=>{
 const curves=[[300,800,2000,5000,11000,20000,35000,50000],[300,900,2600,8000,20000,36000,60000,100000],[300,1000,3200,9000,25000,60000,110000,200000]];
 for(let scaling=1;scaling<=3;scaling++)for(let ante=1;ante<=8;ante++)assert.equal(nativeBlindTarget(ante,1,scaling),BigInt(curves[scaling-1][ante-1]));
 assert.equal(nativeBlindTarget(0,1,3),100n);assert.equal(nativeBlindTarget(9,1,2),230000n);assert.equal(nativeBlindTarget(9,1,3),460000n);assert.ok(Number.isNaN(nativeBlindTarget(39,1,3)));
});
test('10b Red suppresses Small blind reward but retains other payout components',()=>{
 for(let level=1;level<=8;level++){const s=run(level);s.phase='round_won';s.round.score=s.round.target;s.round.handsRemaining=2;s.money=25n;const q=getCashout(s);assert.equal(q.reward,level===1?3n:0n);assert.equal(q.hands,2n);assert.equal(q.interest,5n);}
 const green=run(8,'green');green.phase='round_won';green.round.score=green.round.target;green.round.handsRemaining=2;assert.equal(getCashout(green).total,6n);
});
test('10b Blue discard reset survives payout/shop/skip and Green target curves',()=>{
 let s=run(5);s.phase='round_won';s.round.score=s.round.target;s=reload(act(s,'CASH_OUT'));assert.equal(s.round.discardsRemaining,3);s=reload(act(s,'LEAVE_SHOP'));assert.equal(s.round.discardsRemaining,3);assert.equal(s.round.target,450n);
 s.apkBlinds.tags.big='tag_economy';s=reload(act(s,'SKIP_BLIND'));assert.equal(s.round.discardsRemaining,3);
 s=run(6,'plasma');s.round.ante=2;s.apkShop.context.ante=2;s.apkBlinds.ante=2;s.apkBlinds.tagContext.ante=2;s.round.target=2000n;s.apkBlinds.tags={small:'tag_economy',big:'tag_economy'};s=reload(act(s,'SKIP_BLIND'));assert.equal(s.round.target,3000n);s=reload(act(s,'SKIP_BLIND'));assert.equal(s.round.target,bossTarget(s));
});
test('10b stake input and saved stake bounds are validated without silent fallback',()=>{
 for(const level of [0,9,1.5,'gold',null])assert.throws(()=>run(level));
 const s=run(8),raw=JSON.parse(serializeState(s));raw.state.stake=9;assert.throws(()=>deserializeState(JSON.stringify(raw)));
});

test('10b actual five rounds charge rent once, expire after scoring, and resume every transition',()=>{
 let s=run(8);s.money=100n;for(const key of Object.keys(s.handLevels))s.handLevels[key]=1000;
 s.jokers=[{id:'lease',entityId:'j_joker',perishable:true,perishRounds:5,rental:true,sellCost:1n}];
 for(let round=1;round<=5;round++){
  s=reload(act(s,'START_BLIND'));const money=s.money,revision=s.revision;
  s=reload(act(s,'PLAY_HAND',{cardIds:s.hand.slice(0,5)}));assert.equal(s.phase,'round_won');assert.equal(s.money,money-3n);assert.equal(s.jokers[0].perishRounds,5-round);assert.equal(s.jokers[0].debuffed===true,round===5);
  assert.equal(dispatch(s,{type:'PLAY_HAND',expectedRevision:revision,cardIds:[]}).error.code,'STALE_ACTION');
  const quote=getCashout(s);s=reload(act(s,'CASH_OUT'));assert.equal(s.jokers[0].perishRounds,5-round);assert.equal(s.money,money-3n+quote.total);s=reload(act(s,'LEAVE_SHOP'));
 }
});
test('10b losing last hand still pays rented expired Joker and saves completed state',()=>{
 let s=run(8);s.jokers=[{id:'expired',entityId:'j_joker',perishable:true,perishRounds:0,rental:true,debuffed:true,sellCost:1n}];s=act(s,'START_BLIND');s.round.handsRemaining=1;s.money=1n;
 s=reload(act(s,'PLAY_HAND',{cardIds:s.hand.slice(0,1)}));assert.equal(s.phase,'game_over');assert.equal(s.money,-2n);assert.equal(s.jokers[0].perishRounds,0);
});
test('10b fifth-round Golden and ToMoon are disabled before earned bonus and interest',()=>{
 let s=run(8);s.money=30n;s.handLevels.high_card=1000;s.jokers=[{id:'gold',entityId:'j_golden',perishable:true,perishRounds:1},{id:'moon',entityId:'j_to_the_moon',perishable:true,perishRounds:1}];s=act(s,'START_BLIND');s=reload(act(s,'PLAY_HAND',{cardIds:s.hand.slice(0,1)}));const q=getCashout(s);assert.equal(q.jokerBonuses,undefined);assert.equal(q.interest,5n);assert.equal(s.jokers.every(j=>j.debuffed),true);
});
test('10b rental is owed by MrBones even after its end-round removal',()=>{
 let s=run(8);s.jokers=[{id:'bones',entityId:'j_mr_bones',rental:true,sellCost:1n}];s=act(s,'START_BLIND');s.round.handsRemaining=1;s.round.score=s.round.target/4n;s.money=0n;
 s=act(s,'PLAY_HAND',{cardIds:s.hand.slice(0,1)});assert.equal(s.phase,'round_won');assert.equal(s.money,-3n);assert.equal(s.jokers.length,0);reload(s);
});
test('10b expiring perishable Oops before a later extinction roll changes its native probability',async()=>{
 const {applyRoundEndJokers}=await import('../../src/core/round-end-jokers.js');const {nextApkRandom}=await import('../../src/core/apk-rng.js');
 let sample;
 for(let i=0;i<300;i++){const s=run(7,'red','STAKE'+i);const poll=nextApkRandom(s.rng.apk,'gros_michel').value;if(poll>=1/6&&poll<1/3){sample=s;break;}}
 assert.ok(sample);sample.jokers=[{id:'oops',entityId:'j_oops',perishable:true,perishRounds:1},{id:'banana',entityId:'j_gros_michel'}];applyRoundEndJokers(sample,[]);assert.ok(sample.jokers.some(j=>j.id==='banana'));
});

test('10b Gold shop offers with stickers can actually be bought and resumed',async()=>{
 const {generateApkShop}=await import('../../src/core/apk-shop.js'),{createShop}=await import('../../src/core/shop.js'),{currentApkShopContext}=await import('../../src/core/apk-shop-state.js');
 const seen=new Set();
 for(let seed=0;seed<100&&seen.size<3;seed++){
  let s=run(8,'red','STICKER'+seed);s.money=100n;s.phase='shop';s.round.score=s.round.target;
  const generated=generateApkShop(s.rng.apk,s.apkShop.context,{voucherId:s.apkShop.voucherId});s.rng.apk=generated.rng;s.shop=createShop({offers:generated.offers});s.apkShop.context=currentApkShopContext(s);reload(s);
  for(const offer of [...s.shop.main])if(offer.set==='Joker'&&(offer.eternal||offer.perishable||offer.rental)){
   const before=s.money;s=reload(act(s,'BUY_SHOP_CARD',{offerId:offer.id}));assert.equal(s.money,before-offer.cost);const bought=s.jokers.find(j=>j.id===offer.id);
   for(const flag of ['eternal','perishable','rental'])if(offer[flag]){seen.add(flag);assert.equal(bought[flag],true);}
   if(offer.perishable)assert.equal(bought.perishRounds,5);if(offer.rental){assert.equal(offer.cost,1n);assert.equal(offer.sellCost,1n);}
  }
 }
 assert.deepEqual([...seen].sort(),['eternal','perishable','rental']);
});
test('10b Ankh copies the current perish lifetime and rental flag without renewal',async()=>{
 const {currentApkShopContext}=await import('../../src/core/apk-shop-state.js');
 for(const remaining of [0,2]){
  let s=run(8);s.jokers=[{id:'lease',entityId:'j_joker',originalKey:'j_joker',set:'Joker',perishable:true,perishRounds:remaining,rental:true,edition:'negative',debuffed:remaining===0,sellCost:1n,cost:1n}];s.consumables=[{id:'ankh',entityId:'c_ankh',originalKey:'c_ankh',set:'Spectral',cost:4n,sellCost:2n}];s.apkShop.context=currentApkShopContext(s);s=reload(s);
  s=reload(act(s,'USE_CONSUMABLE',{cardId:'ankh'}));assert.equal(s.jokers.length,2);const copy=s.jokers.find(j=>j.id!=='lease');assert.equal(copy.perishRounds,remaining);assert.equal(copy.rental,true);assert.equal(copy.perishable,true);assert.equal(copy.edition,'base');assert.equal(copy.debuffed,remaining===0);
 }
});
test('10b Heart clearing cannot revive expired perishables',()=>{
 let s=run(8);s.round.ante=8;s.round.blindId='boss';s.apkBlinds.ante=8;s.apkBlinds.tagContext.ante=8;s.apkShop.context.ante=8;s.apkBlinds.bossId='bl_final_heart';s.apkBlinds.bossesUsed.bl_final_heart=1;s.apkBlinds.tags={small:'tag_economy',big:'tag_economy'};s.round.target=bossTarget(s);
 s.jokers=[{id:'expired',entityId:'j_joker',creationOrdinal:1,perishable:true,perishRounds:0,debuffed:true},{id:'active',entityId:'j_joker',creationOrdinal:2}];s.nextJokerCreationOrdinal=3;s=reload(act(s,'START_BLIND'));assert.equal(s.jokers[0].debuffed,true);const events=[];disableBoss(s,events);s.revision++;s=reload(s);assert.equal(s.jokers[0].debuffed,true);assert.equal(s.jokers[1].debuffed,false);
});
test('10b Heart victory remains payable and advances after all perishables expire',()=>{
 let s=run(8,'red','STAKEREV');s.money=100n;s.jokers=[{id:'expired',entityId:'j_juggler',creationOrdinal:1,perishable:true,perishRounds:1,rental:true,edition:'negative',cost:1n,sellCost:1n},{id:'spare',entityId:'j_joker',creationOrdinal:2,perishable:true,perishRounds:1,sellCost:2n}];s.nextJokerCreationOrdinal=3;s.round.handSize++;
 s.round.ante=8;s.round.blindId='boss';s.apkBlinds.ante=8;s.apkBlinds.tagContext.ante=8;s.apkShop.context.ante=8;s.apkBlinds.tags={small:'tag_economy',big:'tag_economy'};s.apkBlinds.bossId='bl_final_heart';s.apkBlinds.bossesUsed.bl_final_heart=1;s.round.target=bossTarget(s);for(const h of Object.keys(s.handLevels))s.handLevels[h]=10000;
 s=reload(act(s,'START_BLIND'));s=reload(act(s,'PLAY_HAND',{cardIds:s.hand.slice(0,5)}));assert.equal(s.phase,'round_won');assert.ok(s.jokers.every(j=>j.debuffed));assert.equal(s.jokers[0].perishRounds,0);assert.equal(s.money,97n);
 s=reload(act(s,'CONTINUE_ENDLESS'));s=reload(act(s,'CASH_OUT'));assert.ok(s.jokers.every(j=>j.debuffed));s=reload(act(s,'LEAVE_SHOP'));assert.equal(s.round.ante,9);s=reload(act(s,'START_BLIND'));
});
