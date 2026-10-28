import test from 'node:test';
import assert from 'node:assert/strict';
import {describeShopItem} from '../../src/content/shop-display.js';
import {createProfile,collectionEntries} from '../../src/core/profile.js';
import catalog from '../../src/content/apk-shop-catalog.js';

test('face-card terminology uses correct singular plural and instrumental grammar',()=>{
 const text=key=>describeShopItem({entityId:key}).description;
 assert.match(text('j_scary_face'),/Каждая засчитываемая карта с лицом даёт/);
 assert.match(text('j_sock_and_buskin'),/засчитываемые карты с лицом — валетов, дам и королей/);
 assert.match(text('j_ride_the_bus'),/без засчитываемых карт с лицом\. Засчитываемая карта с лицом/);
 assert.match(text('j_faceless'),/не менее 3 карт с лицом/);
 assert.match(text('j_pareidolia'),/Все карты считаются картами с лицом/);
 assert.match(text('c_familiar'),/3 случайные усиленные карты с лицом/);
});
test('catalog descriptions and profile unlock conditions have no old face-card term',()=>{
 for(const card of catalog.centres)assert.doesNotMatch(describeShopItem({entityId:card.key,set:card.set}).description??'',/фигурн/iu,card.key);
 const entries=collectionEntries(createProfile());for(const entry of entries)assert.doesNotMatch(entry.condition,/фигурн/iu,entry.id);
 assert.match(entries.find(e=>e.id==='j_sock_and_buskin').condition,/карт с лицом/);
});
