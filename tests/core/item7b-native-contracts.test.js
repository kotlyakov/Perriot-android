import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {createApkRng,nextApkRandom} from '../../src/core/apk-rng.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {generateApkEffectCards,createApkShopContext} from '../../src/core/apk-shop.js';
import {quoteShopCard} from '../../src/core/shop-pricing.js';
import {item7EconomyModifiers} from '../../src/core/joker-item7-economy.js';
import {scoreHand} from '../../src/core/score.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {canUseConsumable} from '../../src/core/consumables.js';
import {ITEM7B_JOKERS} from '../../src/content/jokers.js';
import {item7IndependentEffect,item7ScoredEffects,item7BeforeScore} from '../../src/core/joker-score-effects.js';
import {applyJokerBeforeScore} from '../../src/core/joker-lifecycle.js';
import * as life from '../../src/core/joker-item7-lifecycle.js';
import {applyItem7EconomyContext,applyItem7SoldJoker} from '../../src/core/joker-item7-economy.js';
import {applyItem7SixthSense} from '../../src/core/joker-item7-creation.js';
import {evaluateHand} from '../../src/core/hands.js';
import {isCardSuit} from '../../src/core/card-suits.js';
const path=new URL('../../scripts/reference-rng/item7b-fixtures.json.gz',import.meta.url);
const fixture=JSON.parse(gunzipSync(readFileSync(path)));
const array=value=>Array.isArray(value)?value:[];
const rows=phase=>fixture.cases.filter(f=>f.phase===phase);
const fresh=()=>createRun('NATIVE7B',{runId:'native7b',money:4n,referenceRng:true,referenceShop:true});
function setup(f){
 const s=fresh(),o=f.options;s.phase='playing';
 const j={id:'j',entityId:f.key,originalKey:f.key,set:'Joker',sellCost:2n,extraValue:0n,debuffed:!!o.debuff};s.jokers=[j];life.initializeItem7Joker(s,j);
 s.consumables=Array.from({length:o.occupied??0},(_,i)=>({id:'con'+i,entityId:'c_empress',set:'Tarot',sellCost:1n,extraValue:0n}));s.consumableSlots=o.capacity??2;s.jokerSlots=o.jokerCapacity??5;
 s.round.blindId=o.boss?'boss':'small';s.round.score=BigInt(o.chips??0);s.round.target=100n;s.round.handsPlayed=o.handsPlayed??0;s.round.handsRemaining=4;s.round.discardsRemaining=3;
 s.bossState=o.boss?{id:'bl_club',disabled:false}:null;
 const cards=(o.ranks??[2,3,4,5,14]).map((rank,i)=>({id:'c'+i,rank,suit:o.flush?'hearts':['hearts','diamonds','spades','clubs'][i%4],enhancement:'base',shattered:!!o.shattered}));
 s.cards=Object.fromEntries(cards.map(c=>[c.id,c]));s.hand=cards.map(c=>c.id);s.drawPile=[];s.discardPile=[];
 return {s,j,cards};
}
const n=v=>typeof v==='object'?Number(v.n)/Number(v.d):Number(v);
const numeric=es=>es.filter(Boolean).map(e=>[e.operation,n(e.amount)]).filter(([op,a])=>a!==(op==='multiply_mult'?1:0));
const native=e=>numeric(Object.entries(e).map(([key,amount])=>({operation:({chips:'add_chips',chip_mod:'add_chips',mult_mod:'add_mult',mult:'add_mult',Xmult_mod:'multiply_mult',x_mult:'multiply_mult',dollars:'money'})[key],amount})));
const label=f=>`${f.key} ${f.phase} ${JSON.stringify(f.options)}`;

test('item7b native manifest covers all43 identities with pinned unchanged source and drained callbacks',()=>{
 assert.equal(fixture.cases.length,1004);
 assert.deepEqual(new Set(rows('main').map(f=>f.key)),new Set(ITEM7B_JOKERS));
 assert.equal(fixture.source.filesSha256['card.lua'],'a3a613f90eca3e39042d28a70b129ece292644cbe79970e127e27c49bf4dee53');
 assert.match(fixture.source.method,/JIT on\/off identical/);assert.match(fixture.source.limits,/callbacks drained FIFO/);assert.match(fixture.source.limits,/recording stubs/);
});

test('remaining Joker native default main output and creation callbacks agree at capacity and probability boundaries',()=>{
 for(const f of fixture.cases){
  if(!['main','scored'].includes(f.phase))continue;
  const {s,j,cards}=setup(f),created=[];
  const ctx={source:j,target:j,copied:!!f.options.copied};
  const opts={handId:evaluateHand(cards).handId,scoringCards:cards,roll:()=>f.options.sample??0,blindTriggered:f.options.triggered,create:creation=>{if(s.consumables.length>=s.consumableSlots)return;created.push({set:creation.set??'Tarot',append:creation.append,legendary:false});s.consumables.push({});}};
  let actual=[];
  if(!j.debuffed)actual=f.phase==='scored'?item7ScoredEffects(s,ctx,cards[0],opts):[item7IndependentEffect(s,ctx,opts)];
  assert.deepEqual(numeric(actual),native(f.expected),label(f));
  assert.deepEqual(created,array(f.after.created),label(f));
 }
});

test('native drained destruction/addition callbacks agree on Caino, Glass and Hologram copy guards',()=>{
 for(const f of fixture.cases.filter(f=>['cards_destroyed','playing_card_added'].includes(f.phase))){
  const {s,j,cards}=setup(f);
  // Raw copied calls never mutate these owners. The owned call is checked by
  // its own fixture; a Blueprint inventory would also invoke the owned target.
  if(!f.options.copied){if(f.phase==='cards_destroyed')life.applyItem7CardsDestroyed(s,cards,[]);else life.applyItem7PlayingCardsAdded(s,cards,[]);}
  assert.equal(j.xMult??1,f.after.xMult,label(f));
  if(f.key==='j_caino')assert.equal(j.cainoXMult,f.after.cainoXMult,label(f));
 }
});

test('Sixth Sense original return destroys singleton6 even at full capacity but excludes copied calls',()=>{
 for(const f of rows('destroying_card')){
  const {s,j,cards}=setup(f);let removed=[];
  if(!f.options.copied)removed=applyItem7SixthSense(s,[cards[0].id],[]);
  assert.equal(removed.length,Number(f.after.destroyed),label(f));
  assert.equal(s.consumables.length-(f.options.occupied??0),array(f.after.created).length,label(f));
  assert.equal(s.jokers.includes(j),true);
 }
});

test('native general endround callbacks agree at Bones quarter-score boundary and with copy/debuff guards',()=>{
 for(const f of rows('end_of_round')){
  const {s,j}=setup(f);let saved=false;
  if(!f.options.copied){saved=life.applyItem7EndRound(s,[],{gameOver:f.options.gameOver}).saved;applyItem7EconomyContext(s,{type:'end_of_round'},[]);}
  assert.equal(saved,f.after.saved,label(f));assert.equal(!s.jokers.includes(j),f.after.removed,label(f));
  assert.equal(j.extraValue??0n,BigInt(f.after.extraValue??0),label(f));
  if(f.key==='j_invisible')assert.equal(j.invisibleRounds,f.after.invisibleRounds,label(f));
  if(['j_hit_the_road','j_campfire'].includes(f.key))assert.equal(j.xMult,f.after.xMult,label(f));
 }
});

test('native blind callbacks agree on queued Chicot and Dagger mutation with eternal and copy guards',()=>{
 for(const f of rows('setting_blind').filter(f=>['j_chicot','j_madness','j_ceremonial'].includes(f.key))){
  const {s,j}=setup(f);s.jokers.push({id:'neighbour',entityId:'j_joker',sellCost:3n,eternal:f.options.eternal});
  if(!f.options.copied)life.applyItem7BlindStart(s,[]);
  assert.equal(s.bossState?.disabled??false,f.after.disabled,label(f));
  if(f.key==='j_ceremonial')assert.equal(j.mult,f.after.mult,label(f));
  if(f.key==='j_madness')assert.equal(j.xMult,f.after.xMult,label(f));
 }
});

test('native economy callbacks create the same counts and sets at reservation boundaries',()=>{
 for(const f of fixture.cases.filter(f=>['setting_blind','open_booster','ending_shop','selling_self'].includes(f.phase)&&!['j_chicot','j_madness','j_ceremonial'].includes(f.key))){
  const {s,j}=setup(f);const events=[];
  if(f.phase==='open_booster'){
   // Injected oracle samples establish both branches; choose a real native
   // stream seed in the matching half for the integrated runtime callback.
   let found=false;
   for(let i=0;i<100;i++){const rng=createApkRng('NATIVEHALU'+i);if((nextApkRandom(rng,'halu'+s.round.ante).value<.5)===(f.options.sample<.5)){s.rng.apk=rng;found=true;break;}}
   assert.ok(found);
  }
  if(f.phase==='selling_self'){
   s.jokers=[];applyItem7SoldJoker(s,j,events);
   assert.equal(s.pendingDoubleTags??0,array(f.after.tags).length,label(f));
   assert.equal(s.bossState?.disabled??false,f.after.disabled,label(f));
  }else{
   applyItem7EconomyContext(s,{type:f.phase},events);
   const actual=events.filter(e=>['joker_created','consumable_created'].includes(e.type));
   assert.equal(actual.length,array(f.after.created).length+(f.phase==='ending_shop'&&!f.options.debuff?1:0),label(f));
   if(f.phase!=='ending_shop')assert.deepEqual(actual.map(e=>e.set),array(f.after.created).map(c=>c.set),label(f));
  }
 }
});

test('native Showman pool permits owned duplicates while respecting locks and bans',()=>{
 for(const f of rows('pool')){
  const context=createApkShopContext({ownedCentreIds:['j_ring_master','c_empress'],activeCentreIds:f.options.debuff?[]:['j_ring_master'],bannedCentreIds:catalogue.centres.filter(c=>c.set==='Tarot'&&(f.options.banned||c.key!=='c_empress')).map(c=>c.key)});
  // Default Tarot centres have no locked native rows. A locked source fixture
  // exercises the original gate independently; the runtime accepts explicit locks.
  if(f.options.locked)context.lockedCentreIds=['c_empress'];
  const result=generateApkEffectCards(createApkRng('NATIVEPOOL'),context,{set:'Tarot',count:1,append:'native',instancePrefix:'native'});
  assert.equal(result.cards[0].entityId,f.pool.find(c=>c!=='UNAVAILABLE'),label(f));
 }
});

test('native Astronomer own passive pricing matches original set_cost',()=>{
 for(const f of rows('price')){
  const {s}=setup(f),q=quoteShopCard({baseCost:3n,set:'Planet',name:'Mercury',astronomer:item7EconomyModifiers(s).astronomer});
  assert.equal(q.cost,BigInt(f.cost),label(f));assert.equal(q.sellCost,BigInt(f.sellCost),label(f));
 }
});

test('native matching To Do before callbacks pay owned and copied contexts',()=>{
 for(const f of rows('before')){
  const {s,j,cards}=setup(f);j.toDoPokerHand='High Card';let money=0n;
  if(!j.debuffed)item7BeforeScore(s,{handId:'high_card',playedCards:cards,scoringCards:cards,money:amount=>money+=amount},[{source:j,target:j,copied:f.options.copied}]);
  assert.equal(money,BigInt(f.after.money),label(f));
 }
});

test('native Burnt pre-discard boundaries agree with runtime forced-discard guard',()=>{
 for(const f of rows('pre_discard')){
  const {s,j,cards}=setup(f);const start=s.handLevels.high_card;
  if(!f.options.copied)life.applyItem7Discard(s,cards.map(c=>c.id),[],{forced:f.options.hook});
  assert.equal(s.handLevels.high_card-start,f.options.copied?0:f.after.levels,label(f));
  if(f.options.copied&&!j.debuffed&&!f.options.hook)assert.equal(f.after.levels,1,label(f));
 }
});

test('native Smeared accessor returns exactly the runtime color-class suits',()=>{
 for(const f of rows('suit')){const {s,cards}=setup(f);assert.deepEqual(['hearts','diamonds','spades','clubs'].map(suit=>isCardSuit(cards[0],suit,{jokers:s.jokers})),f.values,label(f));}
});

test('native Judgement capacity/use callback contract agrees including debuffed use',()=>{
 for(const f of rows('use')){
  const s=fresh();s.jokers=Array.from({length:f.options.occupied},(_,i)=>({id:'j'+i,entityId:'j_joker',set:'Joker',edition:'base'}));
  const c={id:'jud',entityId:'c_judgement',originalKey:'c_judgement',set:'Tarot',edition:'base',debuffed:f.options.debuff};s.consumables=[c];
  assert.equal(canUseConsumable(s,c).available,f.available,label(f));
  const result=dispatch(s,{type:'USE_CONSUMABLE',cardId:'jud',expectedRevision:s.revision});
  if(!f.available){assert.ok(result.error,label(f));continue;}
  assert.equal(result.error,null,label(f));assert.equal(result.state.jokers.length-s.jokers.length,array(f.created).length,label(f));
  for(const created of array(f.created))assert.deepEqual(created,{set:'Joker',append:'jud',legendary:false});
 }
});

test('native before inventory ordering preserves DNA enhancement and permanent bonus with Hologram growth',()=>{
 const names={'Default Base':'base','Gold Card':'gold'};
 for(const f of rows('before-order')){
  const s=fresh();s.jokers=[...f.options.order,'j_hologram'].map((entityId,i)=>({id:'j'+i,entityId,set:'Joker'}));for(const j of s.jokers)life.initializeItem7Joker(s,j);
  const c=s.cards.card_hearts_12;c.enhancement=f.options.order[0]==='j_vampire'?'gold':'base';c.permaBonus=15;s.hand=[c.id];s.round.handsPlayed=0;
  const opts={handId:'high_card',playedCards:[c],scoringCards:[c],roll:()=>0,isDebuffed:()=>false},vampired=new Set();
  applyJokerBeforeScore(s,[c.id],[],ctx=>item7BeforeScore(s,opts,[ctx],vampired));
  assert.deepEqual(s.hand.map(id=>s.cards[id].enhancement??'base'),f.after.enhancements.map(name=>names[name]),label(f));
  assert.deepEqual(s.hand.map(id=>s.cards[id].permaBonus??0),f.after.bonuses,label(f));
  assert.equal(s.jokers.at(-1).xMult,f.after.xMult,label(f));
 }
});

test('Baseball other-Joker multiplier matches unchanged native rarity return',()=>{
 const target={1:'j_joker',2:'j_burglar',3:'j_stuntman',4:'j_chicot'};
 for(const f of rows('other_joker')){
  const {s,j,cards}=setup(f);s.jokers=[{id:'target',entityId:target[f.options.rarity],set:'Joker'},j];s.handLevels.high_card=1;
  const baseline=structuredClone(s);baseline.jokers.pop();
  const played=[cards[0]],a=scoreHand(s,played),b=scoreHand(baseline,played);
  assert.equal(n(a.mult)/n(b.mult),f.expected.Xmult_mod??1,label(f));
 }
});

test('native unowned round targets match original reset functions with actual RNG and physical sort_id order',()=>{
 const groups=new Map();
 for(const f of rows('round-targets')){
  const key=f.options.seed+f.options.prior;let s=groups.get(key);
  if(!s){s=fresh();s.rng.apk=createApkRng(f.options.seed);s.jokers=[];s.round={ante:1,...(f.options.prior==='unset'?{}:{ancientSuit:f.options.prior.toLowerCase()})};
   const cards=[['card_clubs_4',13,'clubs'],['card_clubs_2',2,'hearts'],['card_clubs_3',14,'spades'],['card_clubs_5',9,'diamonds']].map(([id,rank,suit],i)=>({id,rank,suit,enhancement:i===3?'stone':'base'}));s.cards=Object.fromEntries(cards.map(c=>[c.id,c]));groups.set(key,s);
  }
  life.resetItem7RoundTargets(s);
  assert.deepEqual(s.round.idolCard,{rank:f.after.idol.rank,suit:f.after.idol.suit.toLowerCase()},label(f));
  assert.equal(s.round.mailRank,f.after.mail,label(f));assert.equal(s.round.ancientSuit,f.after.ancient.toLowerCase(),label(f));assert.equal(s.round.castleSuit,f.after.castle.toLowerCase(),label(f));
  assert.deepEqual(s.rng.apk.streams,f.after.streams,label(f));assert.deepEqual(s.rng.apk.mathState,f.after.mathState,label(f));
  const before=structuredClone(s);life.resetItem7RoundTargets(s,{onlyMissing:true});assert.deepEqual(s,before,label(f));
 }
 assert.ok(rows('round-targets').some(f=>f.options.round===1&&f.options.prior==='unset'&&f.after.ancient==='Spades'));
});

test('private original oracle reproduces committed item7b fixtures byte-for-byte',{skip:!(process.env.NATIVE_APK_ASSETS&&process.env.NATIVE_LUAJIT)},()=>{
 const dir=mkdtempSync(join(tmpdir(),'item7b-native-'));try{
  const output=join(dir,'fixtures.json.gz');const result=spawnSync('python',['scripts/reference-rng/generate-item7b-fixtures.py','--assets',process.env.NATIVE_APK_ASSETS,'--luajit',process.env.NATIVE_LUAJIT,'--output',output],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.deepEqual(readFileSync(output),readFileSync(path));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
