import test from 'node:test';
import assert from 'node:assert/strict';
import {quoteShopCard,canAfford} from '../../src/core/shop-pricing.js';

test('ordinary prices and selling use integer rounding',()=>{
  assert.deepEqual(quoteShopCard({baseCost:5n}),{cost:5n,sellCost:2n});
  assert.equal(quoteShopCard({baseCost:5n,discountPercent:25n}).cost,4n);
  assert.equal(quoteShopCard({baseCost:1n,discountPercent:100n}).cost,1n);
});
test('inflation and editions precede discount',()=>{
  assert.equal(quoteShopCard({baseCost:5n,inflation:2n,edition:{foil:true},discountPercent:25n}).cost,7n);
  assert.equal(quoteShopCard({baseCost:4n,edition:{foil:true,holo:true,polychrome:true,negative:true}}).cost,19n);
});
test('booster ante and tutorial surcharge follow discount',()=>{
  assert.equal(quoteShopCard({baseCost:4n,set:'Booster',discountPercent:50n,boosterAnteScaling:true,ante:4n,tutorialShopSurcharge:true}).cost,8n);
  assert.equal(quoteShopCard({baseCost:4n,set:'Joker',boosterAnteScaling:true,ante:4n,tutorialShopSurcharge:true}).cost,4n);
});
test('Astronomer frees planets and celestial boosters only',()=>{
  for(const opts of [{set:'Planet'},{set:'Booster',name:'Celestial Pack'}])
    assert.deepEqual(quoteShopCard({baseCost:4n,astronomer:true,...opts}),{cost:0n,sellCost:1n});
  assert.equal(quoteShopCard({baseCost:4n,set:'Tarot',astronomer:true}).cost,4n);
});
test('rental takes precedence over Astronomer',()=>{
  assert.deepEqual(quoteShopCard({baseCost:6n,set:'Planet',astronomer:true,rental:true}),{cost:1n,sellCost:1n});
});
test('coupon overrides purchase after sell value; limited to shop areas',()=>{
  for(const area of ['shop_jokers','shop_booster'])
    assert.deepEqual(quoteShopCard({baseCost:10n,extraValue:3n,couponed:true,area}),{cost:0n,sellCost:8n});
  assert.deepEqual(quoteShopCard({baseCost:10n,couponed:true,area:'owned'}),{cost:10n,sellCost:5n});
});
test('pricing above Number precision stays exact',()=>{
  assert.deepEqual(quoteShopCard({baseCost:9007199254740993n}),{cost:9007199254740993n,sellCost:4503599627370496n});
});
test('affordability respects bankruptcy floor and free purchases',()=>{
  assert.equal(canAfford(1n,5n,-4n),true);
  assert.equal(canAfford(0n,5n,-4n),false);
  assert.equal(canAfford(-10n,0n,0n),true);
});
test('invalid price inputs are rejected',()=>{
  assert.throws(()=>quoteShopCard({baseCost:5}),TypeError);
  assert.throws(()=>quoteShopCard({baseCost:5n,discountPercent:101n}),RangeError);
});
