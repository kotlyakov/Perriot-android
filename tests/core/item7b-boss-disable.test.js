import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {initializeItem7Joker,item7CapacityDeltas} from '../../src/core/joker-item7-lifecycle.js';
import {bossTarget,SUPPORTED_BOSSES} from '../../src/core/boss-effects.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const reload=s=>deserializeState(serializeState(s));
function act(s,type,rest={}){const r=dispatch(s,{type,expectedRevision:s.revision,...rest});assert.equal(r.error,null,JSON.stringify(r.error));return r.state;}
function setup(boss,keys,{empty=false}={}){
 const s=createRun('ITEM7B-BOSS',{runId:'7b-boss',money:100n,referenceRng:true,referenceShop:true});
 s.jokers=keys.map((entityId,i)=>initializeItem7Joker(s,{id:'j'+i,entityId,creationOrdinal:i+1,sellCost:2n}));s.nextJokerCreationOrdinal=keys.length+1;
 const d=item7CapacityDeltas(s.jokers);s.round.handSize+=d.handSize;s.round.handsRemaining+=d.hands;s.round.discardsRemaining+=d.discards;
 if(empty){s.destroyedCardIds=Object.keys(s.cards);s.cards={};s.drawPile=[];}
 const ante=boss.startsWith('bl_final_')?8:boss==='bl_serpent'?5:7;s.round.ante=ante;s.round.blindId='boss';s.apkShop.context.ante=ante;s.apkBlinds.ante=ante;s.apkBlinds.tagContext.ante=ante;s.apkBlinds.bossId=boss;s.apkBlinds.bossesUsed[boss]=1;s.round.target=bossTarget(s);s.apkShop.context=currentApkShopContext(s);
 return act(s,'START_BLIND');
}
for(const boss of ['bl_water','bl_needle','bl_serpent'])for(const keys of [['j_chicot','j_juggler','j_drunkard','j_troubadour'],['j_burglar','j_chicot'],['j_chicot','j_burglar'],['j_luchador','j_burglar','j_merry_andy','j_troubadour']])test(`${boss} disable with ${keys.join('/')} survives save and real play`,()=>{
 let s=setup(boss,keys);
 if(keys.includes('j_luchador'))s=act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:s.jokers.find(j=>j.entityId==='j_luchador').id});
 assert.equal(s.bossState.disabled,true);assert.equal(s.bossState.disabledRevision,s.revision);assert.deepEqual(reload(s),s);
 s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.deepEqual(reload(s),s);
 if(s.phase==='playing'&&s.round.discardsRemaining){s=act(s,'DISCARD',{cardIds:[s.hand[0]]});assert.deepEqual(reload(s),s);}
});
test('Chicot Serpent origin binds the shuffled initial deal after later Burglar callbacks',()=>{
 const s=setup('bl_serpent',['j_chicot','j_burglar','j_juggler']);
 assert.equal(s.hand.length,9);assert.equal(s.round.handsRemaining,7);
 assert.deepEqual(s.bossState.serpentDisableOrigin.hand,s.hand);
 assert.deepEqual(s.bossState.serpentDisableOrigin.drawPile,s.drawPile);
 assert.equal(s.bossState.serpentDisableOrigin.handsRemaining,7);
 const raw=JSON.parse(serializeState(s));
 for(const mutate of [p=>p.state.bossState.serpentInitialHandSize++,p=>p.state.bossState.serpentDisableOrigin.drawPile.reverse(),p=>p.state.bossState.serpentDisableOrigin.refillsBefore++]){
  const p=structuredClone(raw);mutate(p);assert.throws(()=>deserializeState(JSON.stringify(p)));
 }
});
test('passive Needle restoration binds captured subtraction rather than deck defaults',()=>{
 const s=setup('bl_needle',['j_luchador','j_troubadour']);
 assert.equal(s.bossState.handsSub,2);
 const disabled=act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:s.jokers[0].id});
 assert.equal(disabled.round.handsRemaining,3);assert.deepEqual(reload(disabled),disabled);
 const raw=JSON.parse(serializeState(disabled));
 for(const mutate of [p=>p.state.bossState.needleDisableOrigin.handsRemaining++,p=>p.state.bossState.handsSub=-1,p=>p.state.bossState.needleDisableOrigin.acceptedRevision++]){const p=structuredClone(raw);mutate(p);assert.throws(()=>deserializeState(JSON.stringify(p)));}
});

for(const keys of [['j_chicot'],['j_luchador'],['j_chicot','j_certificate'],['j_luchador','j_certificate']])for(const empty of [false,true])test(`Serpent initial count with ${keys.join('/')} and empty=${empty} roundtrips`,()=>{
 let s=setup('bl_serpent',keys,{empty});
 assert.equal(s.bossState.serpentInitialCardCount,Object.keys(s.cards).length);
 assert.equal(s.bossState.serpentInitialHandSize,s.hand.length);
 assert.deepEqual(reload(s),s);
 if(keys.includes('j_luchador'))s=act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:s.jokers.find(j=>j.entityId==='j_luchador').id});
 assert.deepEqual(reload(s),s);
 if(s.hand.length){s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.deepEqual(reload(s),s);}
});
for(const boss of SUPPORTED_BOSSES)for(const key of ['j_chicot','j_luchador'])test(`${boss} ${key} disable/save/play/discard regression`,()=>{
 let s=setup(boss,[key]);assert.deepEqual(reload(s),s);
 const debuffed=s.jokers[0].debuffed===true;
 if(key==='j_luchador')s=act(s,'SELL_OWNED_CARD',{area:'jokers',cardId:s.jokers[0].id});
 assert.equal(s.bossState.disabled,!debuffed);assert.deepEqual(reload(s),s);
 const target=s.round.target,hands=s.round.handsRemaining,discards=s.round.discardsRemaining;
 if(s.round.discardsRemaining){s=act(s,'DISCARD',{cardIds:[s.hand[0]]});assert.deepEqual(reload(s),s);assert.equal(s.round.discardsRemaining,discards-1);}
 s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});assert.deepEqual(reload(s),s);
 assert.equal(s.round.handsRemaining,hands-1);assert.equal(s.round.target,target);
});
for(const [level,disabled,bonus] of [[2,false,8n],[1,false,0n],[2,true,0n]])test(`Matador Arm reducer observes original level ${level}, disabled=${disabled}`,()=>{
 let s=setup('bl_arm',disabled?['j_matador','j_chicot']:['j_matador']);s.handLevels.high_card=level;
 const before=s.money;
 s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});
 assert.equal(s.handLevels.high_card,disabled?level:Math.max(1,level-1));
 assert.equal(s.money,before+bonus);assert.deepEqual(reload(s),s);
});

test('Sixth Sense destroys a debuffed Glass Six once and grows Glass Joker without Glass RNG',()=>{
 let s=setup('bl_club',['j_sixth_sense','j_glass']);const id='card_clubs_6';
 s.cards[id].enhancement='glass';
 if(!s.hand.includes(id)){const index=s.drawPile.indexOf(id);s.drawPile[index]=s.hand[0];s.hand[0]=id;}
 s.apkShop.context=currentApkShopContext(s);
 const glassStream=s.rng.apk.streams.glass;
 s=act(s,'PLAY_HAND',{cardIds:[id]});
 assert.equal(s.cards[id],undefined);assert.equal(s.destroyedCardIds.filter(key=>key===id).length,1);
 assert.equal(s.jokers.find(j=>j.entityId==='j_glass').xMult,1.75);
 assert.equal(s.rng.apk.streams.glass,glassStream);assert.equal(s.consumables.length,1);
 assert.deepEqual(reload(s),s);
});
