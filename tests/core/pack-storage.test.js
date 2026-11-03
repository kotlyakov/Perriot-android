import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {shopDropActions} from '../../src/ui/shop-actions.js';
const offer=(key,id=key)=>{const c=catalogue.centres.find(c=>c.key===key);return {id,entityId:key,originalKey:key,set:c.set,edition:'base',cost:BigInt(c.cost),sellCost:BigInt(Math.max(1,Math.floor(c.cost/2)))};};
const act=(s,type,fields={})=>dispatch(s,{type,expectedRevision:s.revision,...fields});
const reload=s=>deserializeState(serializeState(s));
function open(key){let s=createRun('STOREPACK',{runId:'store-pack',money:100n,referenceRng:true,referenceShop:true});s=act(s,'START_BLIND').state;s.phase='round_won';s.round.score=s.round.target;s=act(s,'CASH_OUT').state;s.shop.boosters=[offer(key,'pack')];const r=act(s,'OPEN_BOOSTER',{offerId:'pack'});assert.equal(r.error,null);return r.state;}
for(const family of ['arcana','celestial','spectral'])test(`${family}: take a card without targets, keep effect unused, save, and use later`,()=>{
 let s=open(`p_${family}_normal_1`),card=s.packState.cards.find(c=>c.set!=='Joker'),before=structuredClone(s),levels=structuredClone(s.handLevels);
 const model=shopDropActions(s,card,'pack');assert.equal(model.buy.label,'Забрать');assert.equal(model.buy.action,'TAKE_PACK_CARD');assert.equal(model.buy.available,true);
 const r=act(s,'TAKE_PACK_CARD',{cardId:card.id});assert.equal(r.error,null);s=r.state;assert.equal(s.phase,'shop');assert.ok(s.consumables.some(c=>c.id===card.id));assert.deepEqual(s.handLevels,levels);assert.deepEqual(before.packState.cards.length,3-(family==='spectral'?1:0));assert.deepEqual(reload(s),s);assert.equal(s.money,before.money);assert.equal(s.hand.length,0);
 s=act(s,'LEAVE_SHOP').state;s=act(s,'START_BLIND').state;const targets=card.set==='Planet'?[]:s.hand.slice(0,card.entityId==='c_death'?2:1);const used=act(s,'USE_CONSUMABLE',{cardId:card.id,targetCardIds:targets});assert.equal(used.error,null,card.entityId);assert.ok(!used.state.consumables.some(c=>c.id===card.id));assert.deepEqual(reload(used.state),used.state);
});
test('full pocket rejects take atomically, keeps pack open, then sell and retry succeeds',()=>{
 let s=open('p_celestial_mega_1');s.consumables=[offer('c_pluto','held1'),offer('c_mercury','held2')];let card=s.packState.cards[0],before=structuredClone(s),r=act(s,'TAKE_PACK_CARD',{cardId:card.id});assert.equal(r.error?.code,'NO_SPACE');assert.equal(r.state,s);assert.deepEqual(s,before);
 s=act(s,'SELL_OWNED_CARD',{area:'consumables',cardId:'held1'}).state;r=act(s,'TAKE_PACK_CARD',{cardId:card.id});assert.equal(r.error,null);s=r.state;assert.equal(s.packState.choicesRemaining,1);assert.deepEqual(reload(s),s);const skipped=act(s,'SKIP_PACK');assert.equal(skipped.error,null);assert.equal(skipped.state.phase,'shop');assert.ok(skipped.state.consumables.some(c=>c.id===card.id));
});
