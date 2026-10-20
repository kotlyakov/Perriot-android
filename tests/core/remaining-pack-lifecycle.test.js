import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
const offer=(key,id=key)=>{const c=catalogue.centres.find(c=>c.key===key);return {id,entityId:key,originalKey:key,set:c.set,edition:'base',cost:BigInt(c.cost??1),sellCost:1n};};
const act=(s,type,fields={})=>dispatch(s,{type,expectedRevision:s.revision,...fields});
const reload=s=>deserializeState(serializeState(s));
function shop(key='p_standard_normal_1',seed='PACK8B'){
 let s=createRun(seed,{runId:'pack8b',money:100n,referenceRng:true,referenceShop:true});s=act(s,'START_BLIND').state;s.phase='round_won';s.round.score=s.round.target;s=act(s,'CASH_OUT').state;s.shop.boosters=[offer(key,'pack')];return s;
}
function open(key,seed){const r=act(shop(key,seed),'OPEN_BOOSTER',{offerId:'pack'});assert.equal(r.error,null,key);return r.state;}
function card(s,key){s=structuredClone(s);s.packState.cards[0]=offer(key,s.packState.cards[0].id);s.apkShop.context=currentApkShopContext(s);return s;}
test('all remaining booster identities open with exact kind-specific counts, atomic payment and reload',()=>{
 for(const c of catalogue.centres.filter(c=>c.set==='Booster'&&['Standard','Buffoon','Spectral'].includes(c.kind))){
 const s=shop(c.key),r=act(s,'OPEN_BOOSTER',{offerId:'pack'});assert.equal(r.error,null,c.key);const n=r.state,large=!c.key.includes('_normal_'),size=c.kind==='Standard'?(large?5:3):(large?4:2);
 assert.equal(n.packState.cards.length,size);assert.equal(n.packState.choicesRemaining,c.key.includes('_mega_')?2:1);assert.equal(n.money,s.money-BigInt(c.cost));assert.equal(n.hand.length,c.kind==='Spectral'?8:0);assert.deepEqual(reload(n),n);
 }
});
test('Standard takes enhanced/sealed/edition physical copies to deck bottom, Hologram receives both additions',()=>{
 let s=open('p_standard_mega_1');s.jokers=[{...offer('j_hologram','holo'),xMult:1}];s.apkShop.context=currentApkShopContext(s);const first=s.packState.cards[0];Object.assign(first,{entityId:'m_steel',originalKey:'m_steel',set:'Enhanced',frontKey:'H_A',enhancement:'steel',edition:'polychrome',seal:'red'});const before=structuredClone(s.cards),pile=[...s.drawPile];let r=act(s,'USE_PACK_CARD',{cardId:first.id});assert.equal(r.error,null);s=r.state;assert.equal(s.packState.choicesRemaining,1);assert.deepEqual(Object.fromEntries(Object.keys(before).map(id=>[id,s.cards[id]])),before);const created=s.cards[s.drawPile[0]];assert.equal(created.suit,'hearts');assert.equal(created.rank,14);assert.equal(created.enhancement,'steel');assert.equal(created.seal,'red');assert.equal(created.edition,'polychrome');assert.deepEqual(s.drawPile.slice(1),pile);assert.equal(s.jokers[0].xMult,1.25);assert.deepEqual(reload(s),s);
 r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id});assert.equal(r.error,null);assert.equal(r.state.phase,'shop');assert.equal(Object.keys(r.state.cards).length,54);assert.equal(r.state.jokers[0].xMult,1.5);assert.deepEqual(reload(r.state),r.state);
});
test('Buffoon preserves constructor order despite reversed take order and checks real slot capacity',()=>{
 let s=open('p_buffoon_mega_1');const [left,right]=s.packState.cards;assert.ok(left.creationOrdinal<right.creationOrdinal);
 let r=act(s,'USE_PACK_CARD',{cardId:right.id});assert.equal(r.error,null);s=r.state;r=act(s,'USE_PACK_CARD',{cardId:left.id});assert.equal(r.error,null);assert.deepEqual(r.state.jokers.map(c=>c.id),[right.id,left.id]);assert.ok(r.state.jokers[0].creationOrdinal>r.state.jokers[1].creationOrdinal);assert.deepEqual(reload(r.state),r.state);
 s=open('p_buffoon_normal_1');s.jokerSlots=0;const before=structuredClone(s),bad=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id});assert.equal(bad.error.code,'USE_UNAVAILABLE');assert.deepEqual(s,before);s.packState.cards[0].edition='negative';r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id});assert.equal(r.error,null);assert.deepEqual(reload(r.state),r.state);
});
test('Spectral Cryptid copies actual target including permanent bonus, then returns whole augmented hand',()=>{
 const s=card(open('p_spectral_mega_1'),'c_cryptid'),id=s.hand[0];Object.assign(s.cards[id],{enhancement:'glass',edition:'holographic',seal:'blue',permaBonus:20});s.apkShop.context=currentApkShopContext(s);const r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id,targetCardIds:[id]});assert.equal(r.error,null);assert.equal(r.state.hand.length,10);assert.equal(r.state.packState.handDraw.createdCardIds.length,2);for(const x of r.state.packState.handDraw.createdCardIds)assert.equal(r.state.cards[x].permaBonus,20);assert.deepEqual(reload(r.state),r.state);const closed=act(r.state,'SKIP_PACK');assert.equal(closed.error,null);assert.equal(closed.state.drawPile.length,54);assert.deepEqual(reload(closed.state),closed.state);
});
test('Spectral permanent hand costs and escalating Ectoplasm survive pack reload, closure and following blind',()=>{
 let s=card(open('p_spectral_mega_1'),'c_ectoplasm');s.jokers=[offer('j_joker','j')];s.apkShop.context=currentApkShopContext(s);let r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id});assert.equal(r.error,null);s=r.state;assert.equal(s.round.handSize,7);assert.equal(s.spectralHandSizeDelta,-1);assert.equal(s.ectoMinus,2);assert.deepEqual(reload(s),s);s=act(s,'SKIP_PACK').state;s=act(s,'LEAVE_SHOP').state;assert.equal(s.round.handSize,7);assert.deepEqual(reload(s),s);s=act(s,'START_BLIND').state;assert.equal(s.hand.length,7);assert.deepEqual(reload(s),s);
});
test('Arcana Omen can open full native pool now Spectral effects are supported',()=>{
 const s=shop('p_arcana_mega_1');s.apkShop.context.usedVoucherIds=['v_omen_globe'];const r=act(s,'OPEN_BOOSTER',{offerId:'pack'});assert.equal(r.error,null);assert.deepEqual(reload(r.state),r.state);
});
test('Spectral generation/destruction inside pack preserves provenance and shortfall-free reload',()=>{
 for(const key of ['c_familiar','c_grim','c_incantation','c_immolate']){const s=card(open('p_spectral_mega_1'),key),r=act(s,'USE_PACK_CARD',{cardId:s.packState.cards[0].id});assert.equal(r.error,null,key);assert.equal(r.state.spectralShortfallCardIds,undefined);assert.ok(r.state.spectralDestroyedCardIds.length);assert.deepEqual(reload(r.state),r.state,key);const closed=act(r.state,'SKIP_PACK');assert.equal(closed.error,null);assert.deepEqual(reload(closed.state),closed.state,key);}
});
test('forged pack family, modifier, choice count and creation identity fail save validation',()=>{
 const standard=open('p_standard_normal_1');for(const mutate of [s=>s.packState.cards[0].seal='bad',s=>s.packState.cards[0].frontKey='H_1',s=>s.packState.choicesRemaining=2,s=>s.packState.cards[0].set='Tarot']){const s=structuredClone(standard);mutate(s);assert.throws(()=>reload(s),/Invalid save data/);}
 const spectral=open('p_spectral_normal_1');delete spectral.packState.handDraw;assert.throws(()=>reload(spectral),/Invalid save data/);
});
