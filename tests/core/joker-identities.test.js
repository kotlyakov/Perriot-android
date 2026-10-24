import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../../src/content/apk-shop-catalog.js';
import {JOKER_IDENTITIES} from '../../src/content/joker-identities.js';
import {describeShopItem} from '../../src/content/shop-display.js';
import names from '../../src/content/shop-names-ru.js';
test('all150 native jokers display approved identity everywhere, with existing effects',()=>{
 const jokers=catalog.centres.filter(c=>c.set==='Joker').sort((a,b)=>a.order-b.order);
 assert.equal(Object.keys(JOKER_IDENTITIES).length,150);
 assert.equal(new Set(Object.values(JOKER_IDENTITIES).map(m=>m.name)).size,150);
 for(const [index,c]of jokers.entries()){
  const identity=JOKER_IDENTITIES[c.key];assert.equal(identity.number,index+1);assert.ok(identity.scene.length>15,c.key);
  const display=describeShopItem({entityId:c.key});assert.equal(display.name,identity.name,c.key);assert.equal(names[c.key],identity.name,c.key);
  assert.ok(display.description.length>0,c.key);assert.doesNotMatch(display.description,/предварительной версии/,c.key);
 }
});
test('legacy joker identities share approved names and dynamic descriptions remain',()=>{
 for(const [alias,id]of [['joker_joker','j_joker'],['joker_sly_joker','j_sly'],['joker_clever_joker','j_clever'],['joker_splash','j_splash']])assert.equal(describeShopItem({entityId:alias}).name,JOKER_IDENTITIES[id].name);
 assert.match(describeShopItem({entityId:'j_selzer',repeatHandsRemaining:3}).description,/Осталось рук: 3/);
 assert.match(describeShopItem({entityId:'j_perkeo',edition:'negative'}).description,/Негатив/);
});
