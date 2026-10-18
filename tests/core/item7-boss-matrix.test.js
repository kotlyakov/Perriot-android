import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {ITEM7_JOKERS} from '../../src/content/jokers.js';
import {APK_BOSSES} from '../../src/content/apk-blinds.js';
import {initializeItem7Joker,item7CapacityDeltas} from '../../src/core/joker-item7-lifecycle.js';
import {bossTarget} from '../../src/core/boss-effects.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';

test('every first-half Joker can start and play against every boss with a valid saved state',()=>{
 for(const key of ITEM7_JOKERS)for(const boss of APK_BOSSES){
  const label=key+'/'+boss.id;
  let s=createRun('MATRIX7',{runId:'matrix7',money:100n,referenceRng:true,referenceShop:true});
  s.jokers=[initializeItem7Joker(s,{id:'j1',entityId:key,sellCost:2n,creationOrdinal:1})];s.nextJokerCreationOrdinal=2;
  const delta=item7CapacityDeltas(s.jokers);s.round.handSize+=delta.handSize;s.round.handsRemaining+=delta.hands;s.round.discardsRemaining+=delta.discards;
  if(key==='j_credit_card')s.bankruptAt=-20n;
  const ante=boss.showdown?8:Math.max(1,boss.minAnte);
  s.round.ante=ante;s.round.blindId='boss';s.apkShop.context.ante=ante;s.apkBlinds.ante=ante;s.apkBlinds.tagContext.ante=ante;s.apkBlinds.bossId=boss.id;s.apkBlinds.bossesUsed[boss.id]=1;s.round.target=bossTarget(s);s.apkShop.context=currentApkShopContext(s);
  const start=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision});assert.equal(start.error,null,label+' start');s=start.state;
  assert.doesNotThrow(()=>assert.deepEqual(deserializeState(serializeState(s)),s),label+' started save');
  const ids=boss.id==='bl_psychic'?s.hand.slice(0,5):[s.bossState?.forcedCardId??s.hand[0]];
  const played=dispatch(s,{type:'PLAY_HAND',cardIds:ids,expectedRevision:s.revision});assert.equal(played.error,null,label+' play');
  assert.doesNotThrow(()=>assert.deepEqual(deserializeState(serializeState(played.state)),played.state),label+' played save');
 }
});
