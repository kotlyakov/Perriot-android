import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {APK_TAGS} from '../../src/content/apk-tags.js';
import {chooseApkBoss} from '../../src/core/apk-blinds.js';
const act=(s,type,extra={})=>dispatch(s,{type,expectedRevision:s.revision,...extra});
function run(tag='tag_economy',money=15n){const s=createRun('SKIP1',{runId:'skip-test',money,referenceRng:true,referenceShop:true});s.apkBlinds.tags.small=tag;return s;}
function ante2(tag){const s=run(tag);s.round.ante=2;s.round.target=800n;s.apkBlinds.ante=2;s.apkBlinds.tagContext.ante=2;s.apkShop.context.ante=2;s.roundNumber=4;return s;}
test('skip Economy credits actual capped money, advances Small to Big without shop or RNG, and persists atomically',()=>{
 const s=run(),before=structuredClone(s),r=act(s,'SKIP_BLIND');assert.equal(r.error,null);assert.equal(r.state.money,30n);assert.equal(r.state.round.blindId,'big');assert.equal(r.state.round.target,450n);assert.equal(r.state.phase,'blind_selection');assert.equal(r.state.revision,1);assert.equal(r.state.runStats.skips,1);assert.deepEqual(r.state.rng,s.rng);assert.deepEqual(s,before);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);assert.equal(act(r.state,'SKIP_BLIND',{expectedRevision:0}).error.code,'STALE_ACTION');
 for(const [money,expected] of [[100n,140n],[-5n,-5n],[0n,0n]])assert.equal(act(run('tag_economy',money),'SKIP_BLIND').state.money,expected);
});
test('Speed counts the current skip, and second skip only enters supported first-ante Boss',()=>{
 const s=run('tag_skip',0n);s.apkBlinds.bossId='bl_hook';s.apkBlinds.bossesUsed.bl_hook=1;s.apkBlinds.tags.big='tag_skip';const first=act(s,'SKIP_BLIND');assert.equal(first.error,null);assert.equal(first.state.money,5n);const second=act(first.state,'SKIP_BLIND');assert.equal(second.error,null);assert.equal(second.state.money,15n);assert.equal(second.state.runStats.skips,2);assert.equal(second.state.round.blindId,'boss');assert.equal(second.state.round.target,600n);assert.deepEqual(deserializeState(serializeState(second.state)),second.state);assert.equal(act(second.state,'SKIP_BLIND').error.code,'SKIP_UNAVAILABLE');
});
test('Handy and Garbage credit actual persistent totals; Orbital upgrades the selected hand by three',()=>{
 for(const [tag,counter] of [['tag_handy','handsPlayed'],['tag_garbage','unusedDiscards']]){const s=ante2(tag);s.runStats??={handsPlayed:0,unusedDiscards:0,skips:0};s.runStats[counter]=7;const r=act(s,'SKIP_BLIND');assert.equal(r.error,null);assert.equal(r.state.money,22n);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);}
 const s=ante2('tag_orbital');s.apkBlinds.orbitalHands.small='Flush';const r=act(s,'SKIP_BLIND');assert.equal(r.error,null);assert.equal(r.state.handLevels.flush,4);assert.equal(r.state.handLevels.pair,1);assert.deepEqual(r.state.rng,s.rng);assert.deepEqual(deserializeState(serializeState(r.state)),r.state);
});
test('deferred and unsupported rewards all reject unchanged; full 24-tag selection remains',()=>{
 assert.equal(APK_TAGS.length,24);
 const supported=new Set(['tag_economy','tag_skip','tag_handy','tag_garbage','tag_orbital','tag_boss']);
 for(const tag of APK_TAGS.filter(t=>!supported.has(t.id))){const s=ante2(tag.id),before=structuredClone(s),r=act(s,'SKIP_BLIND');assert.equal(r.error?.code,'SKIP_UNAVAILABLE',tag.id);assert.strictEqual(r.state,s);assert.deepEqual(s,before);assert.match(r.error.message,/./);}
 const legacy=run();delete legacy.runStats;assert.equal(act(legacy,'SKIP_BLIND').error.code,'SKIP_UNAVAILABLE');
 const s=ante2('tag_economy');s.round.blindId='big';s.apkBlinds.tags.big='tag_economy';assert.equal(act(s,'SKIP_BLIND').error.code,'SKIP_UNAVAILABLE');assert.equal(act(run(),'SKIP_BLIND',{blindId:'big'}).error.code,'SKIP_UNAVAILABLE');
});
test('Boss tag consumes only exact boss selection RNG and rejects unsupported results atomically',()=>{
 const s=run('tag_boss');const selected=chooseApkBoss(s.rng.apk,{ante:1,bossesUsed:s.apkBlinds.bossesUsed});const r=act(s,'SKIP_BLIND');assert.equal(r.error,null);assert.equal(r.state.apkBlinds.bossId,selected.bossId);assert.deepEqual(r.state.rng.apk,selected.rng);assert.deepEqual(r.state.apkBlinds.bossesUsed,selected.bossesUsed);assert.deepEqual(r.state.apkBlinds.orbitalHands,s.apkBlinds.orbitalHands);assert.equal(r.state.money,s.money);
 const later=ante2('tag_boss'),before=structuredClone(later);assert.equal(act(later,'SKIP_BLIND').error.code,'SKIP_UNAVAILABLE');assert.deepEqual(later,before);
});
test('played-hand and winning unused-discard totals persist across rounds and reloads',()=>{
 let s=run();s=act(s,'START_BLIND').state;const ids=s.hand.slice(0,1);let r=act(s,'PLAY_HAND',{cardIds:ids});assert.equal(r.error,null);assert.equal(r.state.runStats.handsPlayed,1);assert.equal(r.state.runStats.unusedDiscards,0);s=r.state;s.round.target=1n;s.round.score=0n;r=act(s,'PLAY_HAND',{cardIds:s.hand.slice(0,1)});assert.equal(r.error,null);assert.equal(r.state.phase,'round_won');assert.equal(r.state.runStats.handsPlayed,2);assert.equal(r.state.runStats.unusedDiscards,4);assert.deepEqual(deserializeState(serializeState(r.state)).runStats,r.state.runStats);
});
