import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {describeShopItem} from '../../src/content/shop-display.js';

test('shop names and descriptions stay Russian across the full offer catalogue',()=>{
 for(const centre of catalogue.centres.filter(c=>['Joker','Voucher','Booster','Tarot','Planet','Spectral'].includes(c.set))){
  const item=describeShopItem({entityId:centre.key});
  assert.match(item.name,/[А-Яа-яЁё]/,centre.key);
  assert.doesNotMatch(item.name+' '+item.description,/[A-Za-z]/,centre.key);
 }
 assert.equal(describeShopItem({entityId:'unknown_future_card'}).name,'Карта');
});
