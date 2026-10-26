import test from 'node:test';
import assert from 'node:assert/strict';
import {cardRelatedHelp} from '../../src/content/card-related-help.js';
import {cardDescription} from '../../src/ui/card-description.js';
import catalogue from '../../src/content/apk-shop-catalog.js';

test('all eight enhancement Tarots explain the created material separately from actual properties',()=>{
 const pairs={c_empress:'mult',c_heirophant:'bonus',c_magician:'lucky',c_lovers:'wild',c_chariot:'steel',c_justice:'glass',c_tower:'stone',c_devil:'gold'};
 for(const [entityId,id] of Object.entries(pairs)){
  const d=cardDescription({entityId});assert.equal(d.modifiers.length,0);assert.equal(d.relatedHelp.length,1);assert.equal(d.relatedHelp[0].material,id);assert.match(d.relatedHelp[0].title,/^Создаёт:/);
 }
 assert.match(cardRelatedHelp({entityId:'c_chariot'})[0].description,/остаётся в руке/);
});
test('all twelve planets explain combinations using catalogue handType and level gains',()=>{
 const planets=catalogue.centres.filter(c=>c.set==='Planet');assert.equal(planets.length,12);
 for(const planet of planets){const info=cardRelatedHelp({entityId:planet.key});assert.equal(info.length,1);assert.equal(info[0].kind,'hand');assert.match(info[0].description,/За уровень:/);}
 const pair=cardRelatedHelp({entityId:'c_mercury'},{state:{handLevels:{pair:3}}})[0];assert.match(pair.description,/Уровень 3: 40 фишек, базовый множитель 4/);
 assert.match(cardRelatedHelp({entityId:'c_planet_x'})[0].description,/дополнительные копии/);
 const modified=cardRelatedHelp({entityId:'c_saturn'},{state:{jokers:[{entityId:'j_four_fingers'},{entityId:'j_shortcut'}]}})[0];assert.match(modified.description,/достаточно 4 карт/);assert.match(modified.description,/пропускать один ранг/);
});
test('seal and edition producers show explicit outcomes, including correct negative slot type',()=>{
 assert.deepEqual(cardRelatedHelp({entityId:'c_aura'}).map(i=>i.material),['foil','holographic','polychrome']);
 assert.equal(cardRelatedHelp({entityId:'c_hex'})[0].material,'polychrome');
 for(const [entityId,id] of [['c_talisman','gold'],['c_deja_vu','red'],['c_trance','blue'],['c_medium','purple']])assert.equal(cardRelatedHelp({entityId})[0].id,'seal-'+id);
 assert.match(cardRelatedHelp({entityId:'c_ectoplasm'})[0].description,/место джокера/);
 assert.match(cardRelatedHelp({entityId:'j_perkeo'})[0].description,/место расходной/);
 const negativePerkeo=cardDescription({entityId:'j_perkeo',edition:'negative'});assert.match(negativePerkeo.modifiers[0].description,/место джокера/);assert.match(negativePerkeo.relatedHelp[0].description,/место расходной/);
});
test('referenced joker properties remain subjects of their effects, not attached modifiers',()=>{
 const steel=cardDescription({entityId:'j_steel_joker'});assert.equal(steel.modifiers.length,0);assert.equal(steel.relatedHelp[0].material,'steel');
 assert.equal(cardRelatedHelp({entityId:'j_lucky_cat'})[0].material,'lucky');
 assert.equal(cardRelatedHelp({entityId:'j_trousers'})[0].id,'hand-two_pair');
 assert.equal(cardRelatedHelp({entityId:'joker_sly_joker'})[0].id,'hand-pair');
 assert.match(cardRelatedHelp({entityId:'j_drivers_license'})[0].description,/Издания и печати — отдельные/);
});
test('no guessed links, duplicate attached properties, concealed leaks or mutations',()=>{
 for(const entityId of ['j_golden','j_gold_unknown','c_steel_fake','j_joker',undefined])assert.deepEqual(cardRelatedHelp({entityId}),[]);
 const card={entityId:'c_aura',edition:'foil'};const before=structuredClone(card);
 assert.deepEqual(cardDescription(card).modifiers.map(i=>i.id),['foil']);assert.deepEqual(cardRelatedHelp(card).map(i=>i.material),['holographic','polychrome']);assert.deepEqual(card,before);
 assert.deepEqual(cardRelatedHelp({entityId:'c_chariot',enhancement:'steel'}),[]);
 assert.deepEqual(cardDescription({entityId:'c_chariot'},{concealed:true}).relatedHelp,[]);
});
