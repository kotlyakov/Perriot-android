import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../../src/core/run.js';
import {applySkipBlind,getSkipAvailability} from '../../src/core/skip-blind.js';
import {APK_TAGS} from '../../src/content/apk-tags.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {generateApkShop,rerollApkShop,session} from '../../src/core/apk-shop.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {createShop} from '../../src/core/shop.js';
import {queueTagReward,takeTagPack,validateTagState,applyTagRoundStart,applyTagRoundEnd,getTagInvestmentBonus,consumeTagInvestment,applyTagShopStart,createTagShopHooks,applyTagShopFinal} from '../../src/core/tag-effects.js';
const run=()=>createRun('ITEM9TAGS',{runId:'item9tags',money:15n,referenceRng:true,referenceShop:true});
const skip=(state,tagId)=>{state.apkBlinds.tags[state.round.blindId]=tagId;return applySkipBlind(state,{type:'SKIP_BLIND',expectedRevision:state.revision});};
function shop(state){const generated=generateApkShop(state.rng.apk,currentApkShopContext(state),{voucherId:state.apkShop.voucherId,firstShopBuffoon:state.apkShop.firstShopBuffoon,mainHooks:createTagShopHooks(state)});state.shop=createShop({offers:generated.offers});state.rng.apk=generated.rng;state.phase='shop';applyTagShopStart(state);applyTagShopFinal(state);return state;}
const centre=id=>catalogue.centres.find(c=>c.key===id);
test('all24 native tag rewards are available and rejected invalid queues remain immutable',()=>{
 assert.equal(APK_TAGS.length,24);
 for(const {id}of APK_TAGS){const state=run();state.apkBlinds.tags.small=id;const before=structuredClone(state);assert.equal(getSkipAvailability(state).available,true,id);const result=applySkipBlind(state,{type:'SKIP_BLIND',expectedRevision:0});assert.equal(result.error,null,id);assert.deepEqual(state,before,id);assert.equal(result.state.runStats.skips,1,id);assert.equal(result.state.round.blindId,'big',id);}
 const state=run();state.pendingTags=['unknown'];state.apkBlinds.tags.small='tag_coupon';const before=structuredClone(state),r=applySkipBlind(state,{type:'SKIP_BLIND',expectedRevision:0});assert.equal(r.error.code,'SKIP_UNAVAILABLE');assert.strictEqual(r.state,state);assert.deepEqual(state,before);
});
test('Double copies next non-Double in acquisition order, immediate Economy compounds and all copies consumed',()=>{
 const state=run();queueTagReward(state,'tag_double');queueTagReward(state,'tag_double');assert.equal(state.pendingDoubleTags,2);const r=skip(state,'tag_economy');assert.equal(r.error,null);assert.equal(r.state.money,100n);assert.equal(r.state.pendingDoubleTags,0);assert.equal(state.money,15n);
 const next=run();queueTagReward(next,'tag_double');queueTagReward(next,'tag_investment');assert.deepEqual(next.pendingTags,['tag_investment','tag_investment']);assert.equal(getTagInvestmentBonus(next),0n);next.round.blindId='boss';assert.equal(getTagInvestmentBonus(next),50n);consumeTagInvestment(next);assert.equal(getTagInvestmentBonus(next),0n);
});
test('Juggle waits through skips, grants next played round and is removed exactly once',()=>{
 const state=run();queueTagReward(state,'tag_juggle');queueTagReward(state,'tag_double');queueTagReward(state,'tag_juggle');assert.equal(state.round.handSize,8);applyTagRoundStart(state);assert.equal(state.round.handSize,17);assert.equal(state.activeTagHandSize,9);assert.equal(state.pendingTags,undefined);applyTagRoundEnd(state);assert.equal(state.round.handSize,8);assert.equal(state.activeTagHandSize,undefined);applyTagRoundEnd(state);assert.equal(state.round.handSize,8);
});
test('free pack copies defer variant RNG until their own opening and preserve ordered families',()=>{
 const state=run(),rng=structuredClone(state.rng);queueTagReward(state,'tag_double');queueTagReward(state,'tag_charm');queueTagReward(state,'tag_ethereal');assert.deepEqual(state.pendingTagPacks,['tag_charm','tag_charm','tag_ethereal']);assert.deepEqual(state.rng,rng);assert.match(takeTagPack(state),/^p_arcana_mega_[12]$/);assert.notDeepEqual(state.rng,rng);assert.deepEqual(state.pendingTagPacks,['tag_charm','tag_ethereal']);assert.match(takeTagPack(state),/^p_arcana_mega_[12]$/);assert.equal(takeTagPack(state),'p_spectral_normal_1');assert.equal(takeTagPack(state),null);
});
test('Top-up creates only common Jokers, respects occupied/negative capacity and consumes no RNG when full',()=>{
 const state=run();queueTagReward(state,'tag_top_up');assert.equal(state.jokers.length,2);assert.ok(state.jokers.every(card=>centre(card.entityId).rarity===1));assert.equal(new Set(state.jokers.map(c=>c.entityId)).size,2);
 state.jokerSlots=state.jokers.length;const rng=structuredClone(state.rng);queueTagReward(state,'tag_top_up');assert.equal(state.jokers.length,2);assert.deepEqual(state.rng,rng);
 state.jokers[0].edition='negative';queueTagReward(state,'tag_top_up');assert.equal(state.jokers.length,3);
});
test('Rare/Uncommon intercept generation before ordinary polls, are free and retain native sell value',()=>{
 for(const [tagId,rarity]of [['tag_rare',3],['tag_uncommon',2]]){
  const state=run();queueTagReward(state,tagId);const hooks=createTagShopHooks(state),s=session(state.rng.apk,currentApkShopContext(state));const card=hooks.create(s,'forced');assert.equal(centre(card.entityId).rarity,rarity);assert.equal(card.cost,0n);assert.ok(card.sellCost>=1n);assert.equal(card.couponed,true);assert.equal(state.pendingTags,undefined);assert.equal(Object.hasOwn(s.rng.streams??{},'cdt1'),false);assert.ok(Object.hasOwn(s.rng.streams,tagId==='tag_rare'?'edirta1':'ediuta1'));assert.equal(Object.hasOwn(s.rng.streams,'edisho1'),false);
 }
});
test('edition tags skip non-Jokers and existing editions, claim distinct eligible cards and keep coupon sell quote',()=>{
 const state=run();queueTagReward(state,'tag_foil');queueTagReward(state,'tag_negative');const hooks=createTagShopHooks(state),s=session(state.rng.apk,currentApkShopContext(state));const planet=s.construct('c_pluto','planet'),existing=s.construct('j_joker','existing');existing.edition='holographic';hooks.modify(s,planet);hooks.modify(s,existing);assert.deepEqual(state.pendingTags,['tag_foil','tag_negative']);const first=s.construct('j_jolly','foil'),second=s.construct('j_sly','negative');hooks.modify(s,first);hooks.modify(s,second);assert.equal(first.edition,'foil');assert.equal(second.edition,'negative');assert.equal(first.cost,0n);assert.equal(second.cost,0n);assert.ok(second.sellCost>1n);assert.equal(state.pendingTags,undefined);
});
test('D6 and Coupon consume one copy per shop; coupon excludes vouchers and rerolled stock',()=>{
 const state=run();for(const id of ['tag_d_six','tag_d_six','tag_coupon','tag_coupon'])queueTagReward(state,id);shop(state);assert.equal(state.shop.rerollBase,0n);assert.deepEqual(state.pendingTags,['tag_d_six','tag_coupon']);assert.ok([...state.shop.main,...state.shop.boosters].every(card=>card.cost===0n));assert.ok(state.shop.vouchers.every(card=>card.cost>0n));const next=rerollApkShop(state.rng.apk,currentApkShopContext(state),{previousMain:state.shop.main,mainHooks:createTagShopHooks(state)});assert.ok(next.main.some(card=>card.cost>0n));assert.deepEqual(state.pendingTags,['tag_d_six','tag_coupon']);
});
test('Voucher tags add paid unique vouchers with fromtag stream and consume queue once',()=>{
 const state=run();queueTagReward(state,'tag_double');queueTagReward(state,'tag_voucher');shop(state);assert.equal(state.shop.vouchers.length,3);assert.equal(new Set(state.shop.vouchers.map(card=>card.entityId)).size,3);assert.ok(state.shop.vouchers.every(card=>card.cost>0n));assert.ok(Object.hasOwn(state.rng.apk.streams,'Voucher_fromtag'));assert.equal(Object.hasOwn(state.rng.apk.streams,'Voucher_fromtag1'),false);assert.equal(state.pendingTags,undefined);const rng=structuredClone(state.rng);applyTagShopFinal(state);assert.equal(state.shop.vouchers.length,3);assert.deepEqual(state.rng,rng);
});
test('tag state validation rejects invented IDs, impossible hand grants and noninteger doubles',()=>{
 for(const state of [{pendingTags:['tag_economy']},{pendingTagPacks:['p_arcana_mega_1']},{activeTagHandSize:4},{activeTagHandSize:-3},{pendingDoubleTags:1.2}])assert.throws(()=>validateTagState(state));assert.equal(validateTagState({pendingTags:['tag_coupon','tag_coupon'],pendingTagPacks:['tag_meteor'],activeTagHandSize:6}),true);
});

test('Boss tag after glyph ante zero binds replacement selection to actual ante',()=>{
 const state=run();state.round.ante=0;state.apkBlinds.ante=1;state.apkShop.context.ante=0;state.apkShop.context.usedVoucherIds=['v_hieroglyph'];const result=skip(state,'tag_boss');assert.equal(result.error,null);assert.equal(result.state.apkBlinds.bossSelectionAnte,0);assert.equal(result.state.bossRerollUsed,true);assert.equal(state.round.ante,0);
});

test('forced shop tag edition stream uses next ante at boss cashout',()=>{
 const state=run();state.phase='shop';state.round.blindId='boss';queueTagReward(state,'tag_rare');const s=session(state.rng.apk,currentApkShopContext(state)),card=createTagShopHooks(state).create(s,'boss-rare');assert.equal(centre(card.entityId).rarity,3);assert.ok(Object.hasOwn(s.rng.streams,'edirta2'));assert.equal(Object.hasOwn(s.rng.streams,'edirta1'),false);
});
test('Voucher extras still exclude live shop offers while Showman permits ordinary duplicate centres',()=>{
 const state=run();state.jokers.push({id:'showman',entityId:'j_ring_master',originalKey:'j_ring_master',set:'Joker',edition:'base',cost:5n,sellCost:2n,creationOrdinal:1});for(let i=0;i<12;i++)queueTagReward(state,'tag_voucher');shop(state);assert.equal(state.shop.vouchers.length,13);assert.equal(new Set(state.shop.vouchers.map(c=>c.entityId)).size,13);
});
