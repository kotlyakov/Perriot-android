import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRun,dispatch,replayEffectActions} from '../../src/core/run.js';
import {bossTarget,resolveMostPlayedHand} from '../../src/core/boss-effects.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
const act=(s,type,fields={})=>{const r=dispatch(s,{type,expectedRevision:s.revision,...fields});assert.ifError(r.error);return r.state;};
const reload=s=>deserializeState(serializeState(s));
function tiedShop(){
 let s=createRun('OXTIE6',{runId:'ox061',money:20n,referenceRng:true,referenceShop:true});
 Object.assign(s.round,{ante:5,blindId:'boss'});Object.assign(s.apkBlinds,{ante:5,bossId:'bl_wall'});s.apkBlinds.bossesUsed.bl_wall=1;s.apkBlinds.tagContext.ante=5;s.apkShop.context.ante=5;s.round.target=bossTarget(s);s=act(s,'START_BLIND');
 s.hand=['card_clubs_3','card_clubs_2','card_spades_2','card_hearts_4','card_hearts_6','card_hearts_8','card_hearts_10','card_diamonds_12'];s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));
 s=act(s,'PLAY_HAND',{cardIds:['card_clubs_3']});s.round.score=s.round.target-1n;s=act(s,'PLAY_HAND',{cardIds:['card_clubs_2','card_spades_2']});s=act(s,'CASH_OUT');
 assert.equal(s.nextAnteBlinds.bossId,'bl_ox');return s;
}
test('canonical tie resolution is total while legacy resolver retains historical null',()=>{
 assert.equal(resolveMostPlayedHand({'High Card':1,Pair:1},{allowTies:true}),'high_card');
 assert.equal(resolveMostPlayedHand({},{allowTies:true}),'high_card');
 assert.equal(resolveMostPlayedHand({Pair:3,'High Card':2},{allowTies:true}),'pair');
 assert.equal(resolveMostPlayedHand({'High Card':1,Pair:1}),null);
});
test('real tied plays permit Big skip and Ox entry across a save',()=>{
 let s=reload(tiedShop());assert.equal(s.mostPlayedHand,'high_card');s=act(s,'LEAVE_SHOP');s=act(s,'SKIP_BLIND');s=act(s,'SKIP_BLIND');s=reload(s);s=act(s,'START_BLIND');assert.equal(s.bossState.id,'bl_ox');assert.equal(s.bossState.oxHand,'high_card');assert.equal(reload(s).bossState.oxHand,'high_card');
});
test('playing Big instead of skipping can leave its shop and start Ox',()=>{
 let s=tiedShop();s=act(s,'LEAVE_SHOP');s=act(s,'SKIP_BLIND');s=act(s,'START_BLIND');s.round.score=s.round.target-1n;s=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});s=act(s,'CASH_OUT');s=act(s,'LEAVE_SHOP');s=act(s,'START_BLIND');assert.equal(s.bossState.id,'bl_ox');
});
test('accepted legacy transition repairs an old null snapshot; stale action does not',()=>{
 const s=deserializeState(readFileSync(new URL('../fixtures/mechanics-legacy-060-sort.json',import.meta.url),'utf8').trim());s.mostPlayedHand=null;s.apkShop.context.playedHands={'High Card':2,Pair:2};
 const stale=dispatch(s,{type:'SET_SORT',mode:'rank',expectedRevision:s.revision-1});assert.equal(stale.state,s);assert.equal(s.mostPlayedHand,null);
 const next=act(s,'SET_SORT',{mode:'rank'});assert.equal(next.mostPlayedHand,'high_card');assert.equal(s.mostPlayedHand,null);assert.equal(reload(next).mostPlayedHand,'high_card');
});
