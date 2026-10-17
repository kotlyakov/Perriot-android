import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as shop from '../../src/core/apk-shop.js';
import {createApkRng,createApkMathState,nextApkMathRandom} from '../../src/core/apk-rng.js';
const fixtures=JSON.parse(fs.readFileSync(new URL('../../scripts/reference-rng/shop-fixtures.json',import.meta.url))).cases;
const summary=o=>({key:o.entityId,set:o.set,edition:o.edition==='base'?false:{[o.edition==='holographic'?'holo':o.edition]:true},cost:Number(o.cost),sell_cost:Number(o.sellCost),...(o.toDoPokerHand?{to_do:o.toDoPokerHand}:{})});
function replay(state,trace){for(const event of trace){if(event.kind==='randomseed')state=createApkMathState(event.seed);else if(event.kind==='random'){const args=Array.isArray(event.args)?event.args:[];const result=nextApkMathRandom(state,...args);assert.equal(result.value,event.value);state=result.state;}}return state;}
for(const fixture of fixtures)test(`APK shop and reroll ${fixture.seed} reduced=${fixture.reduced_motion}`,()=>{
 const context=shop.createApkShopContext({reducedMotion:fixture.reduced_motion,playedHands:{'High Card':1}});
 assert.deepEqual(JSON.parse(JSON.stringify(context)),context);
 const initial=createApkRng(fixture.seed);const voucher=shop.chooseApkVoucher(initial,context);
 const first=shop.generateApkShop(voucher.rng,context,{voucherId:voucher.voucherId});
 assert.deepEqual(first.offers.main.map(summary),fixture.items);
 assert.deepEqual(first.offers.vouchers.map(summary),[fixture.voucher]);
 assert.deepEqual(first.offers.boosters.map(summary),fixture.packs);
 assert.deepEqual(first.rng.mathState,replay(initial.mathState,fixture.first_trace));
 const reroll=shop.rerollApkShop(first.rng,context,{previousMain:first.offers.main});
 assert.deepEqual(reroll.main.map(summary),fixture.reroll_items);
 assert.deepEqual(reroll.rng.streams,Object.fromEntries(Object.entries(fixture.key_state).filter(([k])=>!['seed','hashed_seed'].includes(k))));
 assert.deepEqual(reroll.rng.mathState,replay(first.rng.mathState,fixture.reroll_trace));
 assert.equal(first.firstShopBuffoon,true);
});
test('complete factual pools',()=>{assert.deepEqual(shop.getApkShopCatalogCounts(),{Joker:150,Tarot:22,Planet:12,Spectral:18,Voucher:32,Booster:32,Enhanced:8});});
import catalogue from '../../src/content/apk-shop-catalog.js';
const ids=set=>catalogue.centres.filter(c=>c.set===set).map(c=>c.key);
function forceMain(set,allowed,extra={}){
 const context=shop.createApkShopContext({mainSlots:1,boosterSlots:0,rates:{Joker:0,Tarot:0,Planet:0,Base:0,Spectral:0,[set]:1},bannedCentreIds:ids(set).filter(id=>!allowed.includes(id)),...extra});
 return Array.from({length:16},(_,i)=>shop.rerollApkShop(createApkRng('GATE'+i),context).main[0]);
}
test('hidden planets remain unavailable until their hand was played',()=>{
 assert.ok(forceMain('Planet',['c_eris']).every(o=>o.entityId==='c_pluto'));
 assert.ok(forceMain('Planet',['c_eris'],{playedHands:{'Flush Five':1}}).every(o=>o.entityId==='c_eris'));
});
test('unlock and actual enhancement are both required for enhancement-gated Joker',()=>{
 assert.ok(forceMain('Joker',['j_glass']).every(o=>o.entityId==='j_joker'));
 assert.ok(forceMain('Joker',['j_glass'],{unlockedCentreIds:['j_glass']}).every(o=>o.entityId==='j_joker'));
 assert.ok(forceMain('Joker',['j_glass'],{unlockedCentreIds:['j_glass'],enhancementIds:['m_glass']}).some(o=>o.entityId==='j_glass'));
});
test('pool flags select extinct-banana replacement',()=>{
 assert.ok(forceMain('Joker',['j_cavendish']).every(o=>o.entityId==='j_joker'));
 assert.ok(forceMain('Joker',['j_cavendish'],{poolFlags:{gros_michel_extinct:true}}).some(o=>o.entityId==='j_cavendish'));
 assert.ok(forceMain('Joker',['j_gros_michel'],{poolFlags:{gros_michel_extinct:true}}).every(o=>o.entityId==='j_joker'));
});
test('ownership excludes duplicates and owned Showman permits them',()=>{
 assert.ok(forceMain('Tarot',['c_empress'],{ownedCentreIds:['c_empress']}).every(o=>o.entityId==='c_strength'));
 assert.ok(forceMain('Tarot',['c_empress'],{ownedCentreIds:['c_empress','j_ring_master']}).every(o=>o.entityId==='c_empress'));
});
test('voucher upgrade requires unlock and used prerequisite',()=>{
 const options={bannedCentreIds:ids('Voucher').filter(id=>id!=='v_overstock_plus'),unlockedCentreIds:['v_overstock_plus']};
 assert.equal(shop.chooseApkVoucher(createApkRng('VOUCHER'),shop.createApkShopContext(options)).voucherId,'v_blank');
 assert.equal(shop.chooseApkVoucher(createApkRng('VOUCHER'),shop.createApkShopContext({...options,usedVoucherIds:['v_overstock_norm']})).voucherId,'v_overstock_plus');
 assert.equal(shop.chooseApkVoucher(createApkRng('VOUCHER'),shop.createApkShopContext({...options,usedVoucherIds:['v_overstock_norm'],shopVoucherIds:['v_overstock_plus']})).voucherId,'v_blank');
});
test('forced first Buffoon checks normal1 ban, including original normal2-ban exception',()=>{
 const context=shop.createApkShopContext({bannedCentreIds:['p_buffoon_normal_2'],reducedMotion:true});
 const v=shop.chooseApkVoucher(createApkRng('AAAAAAA1'),context);
 const first=shop.generateApkShop(v.rng,context,{voucherId:v.voucherId});
 assert.equal(first.offers.boosters[0].entityId,'p_buffoon_normal_2');
 const ban1=shop.createApkShopContext({bannedCentreIds:['p_buffoon_normal_1'],boosterSlots:1});
 const result=shop.generateApkShop(v.rng,ban1,{voucherId:v.voucherId});
 assert.equal(result.firstShopBuffoon,false);assert.notEqual(result.offers.boosters[0].entityId,'p_buffoon_normal_1');
});
test('generators preserve caller inputs and deterministic instance identity',()=>{
 const context=shop.createApkShopContext();const rng=createApkRng('IMMUTABLE');const before=structuredClone({context,rng});
 const voucher=shop.chooseApkVoucher(rng,context);const first=shop.generateApkShop(voucher.rng,context,{voucherId:voucher.voucherId,instancePrefix:'round_1'});
 assert.deepEqual({context,rng},before);
 assert.equal(new Set(Object.values(first.offers).flat().map(o=>o.id)).size,5);
 assert.equal(first.offers.main[0].id,'round_1_main_1');
});
test('context rejects malformed and unsupported inputs',()=>{
 for(const options of [{ownedCentreIds:{}},{ownedCentreIds:[1]},{reducedMotion:'false'},{poolFlags:{flag:1}},{rates:{Unexpected:1}},{playedHands:{Pair:-1}},{editionRate:NaN},{modifiers:{enable_rentals_in_shop:1}},{tags:['tag_juggle']},{visibleHandOrder:[]}])assert.throws(()=>shop.createApkShopContext(options));
});
test('explicit absent redeemed voucher produces empty voucher area without reselection',()=>{
 const context=shop.createApkShopContext();const rng=createApkRng('REDEEMED');
 const result=shop.generateApkShop(rng,context,{voucherId:null,firstShopBuffoon:true});
 assert.deepEqual(result.offers.vouchers,[]);assert.ok(!Object.hasOwn(result.rng.streams,'Voucher1'));
});
test('public generator entries reject raw malformed contexts and invalid categories',()=>{
 const rng=createApkRng('VALIDATION');const context=shop.createApkShopContext();
 assert.throws(()=>shop.chooseApkVoucher(rng,{...context,rates:{...context.rates,Unexpected:1}}));
 assert.throws(()=>shop.generateApkShop(rng,{...context,reducedMotion:'false'},{voucherId:null}));
 assert.throws(()=>shop.rerollApkShop(rng,{...context,mainSlots:-1}));
 for(const options of [{rates:{Joker:1e308,Tarot:1e308}},{visibleHandOrder:['Imaginary Hand']},{playedHands:{Fake:1}},{usedVoucherIds:['j_joker']},{shopVoucherIds:['j_joker']},{enhancementIds:['c_empress']}])assert.throws(()=>shop.createApkShopContext(options));
});
