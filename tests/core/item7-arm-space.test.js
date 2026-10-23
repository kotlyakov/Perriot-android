import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {bossTarget} from '../../src/core/boss-effects.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';

test('Arm preserves Space Joker level growth after lowering the played hand',()=>{
 let state=createRun('SPACE-ARM',{runId:'arm-space',money:4n,referenceRng:true,referenceShop:true});
 // Two Oops make the Space trigger certain, independent of the seed.
 state.jokers=['j_space','j_oops','j_oops'].map((entityId,i)=>({id:'j'+i,entityId,creationOrdinal:i+1}));
 state.nextJokerCreationOrdinal=4;
 state.round.ante=2;state.apkBlinds.ante=2;state.apkShop.context.ante=2;state.apkBlinds.tagContext.ante=2;
 state.round.blindId='boss';state.apkBlinds.bossId='bl_arm';state.apkBlinds.bossesUsed.bl_arm=1;
 state.round.target=bossTarget(state);state.handLevels.high_card=3;state.apkShop.context=currentApkShopContext(state);
 const started=dispatch(state,{type:'START_BLIND',expectedRevision:state.revision});assert.equal(started.error,null);state=started.state;
 const played=dispatch(state,{type:'PLAY_HAND',cardIds:[state.hand[0]],expectedRevision:state.revision});assert.equal(played.error,null);
 assert.equal(played.state.handLevels.high_card,3);
 assert.deepEqual(deserializeState(serializeState(played.state)),played.state);
});
