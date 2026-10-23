import test from 'node:test';
import assert from 'node:assert/strict';
import * as shop from '../../src/core/apk-shop.js';
import {createApkRng} from '../../src/core/apk-rng.js';

test('effect generation creates deterministic common Jokers without mutating input RNG',()=>{
 assert.equal(typeof shop.generateApkEffectCards,'function');
 const rng=createApkRng('ITEM7'),before=structuredClone(rng),context=shop.createApkShopContext();
 const result=shop.generateApkEffectCards(rng,context,{set:'Joker',count:2,instancePrefix:'rif',append:'rif',rarity:0});
 assert.equal(result.cards.length,2);assert.equal(result.cards[0].set,'Joker');
 assert.equal(result.rng.streams.rarity1rif,undefined);
 assert.ok(result.rng.streams.Joker1rif1!==undefined);
 assert.deepEqual(rng,before);
 assert.deepEqual(shop.generateApkEffectCards(rng,context,{set:'Joker',count:2,instancePrefix:'rif',append:'rif',rarity:0}),result);
});
test('effect generation validates requests before consuming RNG',()=>{
 assert.equal(typeof shop.generateApkEffectCards,'function');
 const rng=createApkRng('ITEM7');
 for(const opts of [{set:'Base',count:1},{set:'Joker',count:-1},{set:'Joker',count:1,rarity:4}])assert.throws(()=>shop.generateApkEffectCards(rng,shop.createApkShopContext(),{instancePrefix:'x',append:'jud',...opts}));
});
