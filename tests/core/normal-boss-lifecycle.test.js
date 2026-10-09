import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {APK_BOSSES} from '../../src/content/apk-blinds.js';
import {blindBase} from '../../src/core/blind-progression.js';
import {nextApkRandom} from '../../src/core/apk-rng.js';
const act=(s,type,cardIds)=>dispatch(s,{type,cardIds,expectedRevision:s.revision});
const reload=s=>deserializeState(serializeState(s));
function pending(id,ante=2){
 const s=createRun('BOSS0111',{runId:'normal',money:10n,referenceRng:true,referenceShop:true});
 s.round.ante=ante;s.round.blindId='boss';s.round.target=blindBase(ante)*BigInt(APK_BOSSES.find(b=>b.id===id).mult);
 s.apkShop.context.ante=ante;s.apkBlinds.ante=ante;s.apkBlinds.tagContext.ante=ante;
 s.apkBlinds.bossId=id;s.apkBlinds.bossesUsed[id]=1;return s;
}
function active(id,ante=2){const r=act(pending(id,ante),'START_BLIND');assert.equal(r.error,null);return r.state;}
function held(s,ids){s.hand=ids;s.discardPile=[];s.drawPile=Object.keys(s.cards).filter(id=>!ids.includes(id));return s;}
test('all ordinary bosses start at eligible ante and reload exactly',()=>{
 for(const b of APK_BOSSES.filter(b=>!b.showdown)){
  const ante=Math.max(2,b.minAnte),s=active(b.id,ante);assert.equal(s.roundNumber,ante*3);
  assert.equal(s.round.discardsRemaining,b.id==='bl_water'?0:4);
  assert.equal(s.round.handsRemaining,b.id==='bl_needle'?1:4);
  assert.equal(s.hand.length,b.id==='bl_manacle'?7:8);assert.deepEqual(reload(s),s);
 }
});
test('House initial hand concealed; replacements after first discard are revealed and RNG stable',()=>{
 const s=active('bl_house');assert.deepEqual(new Set(s.bossState.hiddenCardIds),new Set(s.hand));
 const ids=s.hand.slice(0,2),r=act(s,'DISCARD',ids),draw=r.events.find(e=>e.type==='cards_drawn').cardIds;
 assert.equal(r.error,null);assert.equal(r.state.bossState.hiddenCardIds.length,6);
 assert.ok(draw.every(id=>!r.state.bossState.hiddenCardIds.includes(id)));assert.deepEqual(reload(r.state),r.state);
 assert.deepEqual(act(reload(s),'DISCARD',ids),r);
});
test('Wheel rolls its own stream once per actual drawn card and persists hidden results',()=>{
 const p=pending('bl_wheel'),s=active('bl_wheel');
 // START_BLIND shuffle is the existing nr2 stream; replay concealment from its returned RNG with wheel reset.
 let rng=structuredClone(s.rng.apk);delete rng.streams.wheel;
 const drawn=s.hand.slice().sort((a,b)=>p.drawPile.indexOf(a)-p.drawPile.indexOf(b));
 const r=act(s,'DISCARD',s.hand.slice(0,3));assert.equal(r.error,null);
 const ids=r.events.find(e=>e.type==='cards_drawn').cardIds;let expected=s.rng.apk,hidden=[];
 for(const id of ids){const draw=nextApkRandom(expected,'wheel');expected=draw.rng;if(draw.value<1/7)hidden.push(id);}
 assert.deepEqual(r.state.rng.apk,expected);assert.deepEqual(r.state.bossState.hiddenCardIds.filter(id=>ids.includes(id)),hidden);
 assert.deepEqual(reload(r.state),r.state);assert.deepEqual(p,reload(p));
});
test('Fish conceals play replacements but not discard replacements; Mark conceals only J Q K',()=>{
 const fish=active('bl_fish');assert.deepEqual(fish.bossState.hiddenCardIds,[]);
 const played=act(fish,'PLAY_HAND',fish.hand.slice(0,1)),draw=played.events.find(e=>e.type==='cards_drawn').cardIds;
 assert.ok(draw.every(id=>played.state.bossState.hiddenCardIds.includes(id)));
 const discarded=act(played.state,'DISCARD',played.state.hand.slice(0,1));
 assert.ok(discarded.events.find(e=>e.type==='cards_drawn').cardIds.every(id=>!discarded.state.bossState.hiddenCardIds.includes(id)));
 assert.deepEqual(reload(discarded.state),discarded.state);
 const mark=active('bl_mark');assert.deepEqual(new Set(mark.bossState.hiddenCardIds),new Set(mark.hand.filter(id=>mark.cards[id].rank>=11&&mark.cards[id].rank<=13)));
});
test('Serpent draws exactly three after an action and can exceed normal hand size',()=>{
 let s=active('bl_serpent',5);assert.equal(s.hand.length,8);
 s=act(s,'DISCARD',s.hand.slice(0,1)).state;assert.equal(s.hand.length,10);assert.deepEqual(reload(s),s);
 const r=act(s,'PLAY_HAND',s.hand.slice(0,5));assert.equal(r.events.find(e=>e.type==='cards_drawn').cardIds.length,3);
 assert.equal(r.state.hand.length,8);assert.deepEqual(reload(r.state),r.state);
});
test('Arm decreases played combination before scoring once, preview and rejected action do not',()=>{
 const s=held(active('bl_arm'),['card_clubs_2','card_spades_2',...['3','5','7','9','11','13'].map(r=>'card_hearts_'+r)]);s.handLevels.pair=3;
 const before=structuredClone(s),r=act(s,'PLAY_HAND',s.hand.slice(0,2));assert.equal(r.error,null);
 assert.equal(r.state.handLevels.pair,2);assert.equal(r.state.lastScore.chips,29n);assert.equal(r.state.lastScore.mult,3n);
 assert.deepEqual(s,before);assert.deepEqual(reload(r.state),r.state);
 const rejected=act(s,'PLAY_HAND',['missing']);assert.ok(rejected.error);assert.deepEqual(s,before);
});
test('Tooth charges each selected card including non-scoring cards and permits negative balance',()=>{
 const s=active('bl_tooth',3);s.money=1n;const r=act(s,'PLAY_HAND',s.hand.slice(0,5));assert.equal(r.error,null);
 assert.equal(r.state.money,-4n);assert.ok(r.events.some(e=>e.type==='money_changed'&&e.delta===-5n));assert.deepEqual(reload(r.state),r.state);
});
test('Ox uses frozen prior-boss hand snapshot, charges once and unresolved ties gate only Ox',()=>{
 const p=pending('bl_ox',6);p.mostPlayedHand='pair';p.apkShop.context.playedHands={'High Card':8,Pair:1};
 const s=held(act(p,'START_BLIND').state,['card_clubs_2','card_spades_2',...['3','5','7','9','11','13'].map(r=>'card_hearts_'+r)]);
 const before=structuredClone(s),r=act(s,'PLAY_HAND',s.hand.slice(0,2));assert.equal(r.error,null);assert.equal(r.state.money,0n);assert.equal(r.state.bossState.oxHand,'pair');assert.deepEqual(s,before);assert.deepEqual(reload(r.state),r.state);
 const stale=dispatch(r.state,{type:'PLAY_HAND',cardIds:s.hand.slice(0,2),expectedRevision:s.revision});assert.equal(stale.error.code,'STALE_ACTION');
 const tied=pending('bl_wall');tied.apkShop.context.playedHands={'High Card':2,Pair:2};let won=act(tied,'START_BLIND').state;won.phase='round_won';won.round.score=won.round.target;
 const cash=act(won,'CASH_OUT');assert.equal(cash.error,null);assert.equal(cash.state.mostPlayedHand,null);assert.deepEqual(reload(cash.state),cash.state);
 const unknown=pending('bl_ox',6);unknown.mostPlayedHand=null;assert.equal(act(unknown,'START_BLIND').error.code,'BOSS_UNAVAILABLE');unknown.apkBlinds.bossId='bl_wall';unknown.round.target=80000n;assert.equal(act(unknown,'START_BLIND').error,null);
});
test('invalid boss snapshots and hidden/history corruption reject save',()=>{
 const s=active('bl_house');for(const mutate of [s=>s.bossState.hiddenCardIds.push(s.bossState.hiddenCardIds[0]),s=>s.bossState.hiddenCardIds.push(s.drawPile[0]),s=>s.bossState.baseHandSize=7]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>serializeState(bad));}
 const eye=held(active('bl_eye',3),['card_clubs_2','card_spades_2',...['3','5','7','9','11','13'].map(r=>'card_hearts_'+r)]),played=act(eye,'PLAY_HAND',eye.hand.slice(0,2)).state;
 delete played.lastScore.bossHistory;assert.throws(()=>serializeState(played));
});
test('concealment metadata must be a valid array even when falsy',()=>{
 for(const id of ['bl_house','bl_wheel','bl_fish','bl_mark'])for(const value of [null,false,0,'']){const s=active(id);s.bossState.hiddenCardIds=value;assert.throws(()=>serializeState(s),id+' '+String(value));}
});
test('Eye and Mouth preserve pre-score history for strict reload and consume disallowed hands',()=>{
 for(const boss of ['bl_eye','bl_mouth']){
  const s=held(active(boss,boss==='bl_eye'?3:2),['card_clubs_2','card_spades_2','card_clubs_3','card_spades_3','card_hearts_4','card_hearts_6','card_hearts_8','card_hearts_10']);
  const first=act(s,'PLAY_HAND',s.hand.slice(0,2));assert.equal(first.error,null);assert.equal(first.state.lastScore.handId,'pair');assert.equal(first.state.lastScore.handDebuffed,undefined);
  assert.deepEqual(reload(first.state),first.state);
  const ids=boss==='bl_eye'?['card_clubs_3','card_spades_3']:['card_hearts_4'];
  const second=act(first.state,'PLAY_HAND',ids);assert.equal(second.error,null);assert.equal(second.state.lastScore.score,0n);assert.equal(second.state.lastScore.handDebuffed,true);
  assert.deepEqual(reload(second.state),second.state);assert.deepEqual(act(reload(first.state),'PLAY_HAND',ids),second);
 }
});
test('ordinary boss cashout advances ante and target using selected boss multiplier; counters reset',()=>{
 for(const id of ['bl_wall','bl_needle','bl_water']){
  const s=active(id);s.phase='round_won';s.round.score=s.round.target;
  const cash=act(s,'CASH_OUT');assert.equal(cash.error,null);assert.deepEqual(reload(cash.state),cash.state);
  const next=act(cash.state,'LEAVE_SHOP');assert.equal(next.error,null);assert.equal(next.state.round.ante,3);assert.equal(next.state.round.target,2000n);assert.equal(next.state.round.handsRemaining,4);assert.equal(next.state.round.discardsRemaining,4);assert.deepEqual(reload(next.state),next.state);
 }
 const s=pending('bl_wall');s.round.blindId='big';s.round.target=1200n;
 let win=act(s,'START_BLIND').state;win.phase='round_won';win.round.score=1200n;
 const boss=act(act(win,'CASH_OUT').state,'LEAVE_SHOP');assert.equal(boss.error,null);assert.equal(boss.state.round.target,3200n);assert.deepEqual(reload(boss.state),boss.state);
});
