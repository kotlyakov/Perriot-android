import test from 'node:test';
import assert from 'node:assert/strict';
const model=async()=>{const m=await import('../../src/ui/card-description.js').catch(()=>({}));assert.equal(typeof m.cardDescription,'function','approved card description model is implemented');return m.cardDescription;};
test('description separates base chips, permanent bonus, material, edition and wax seal',async()=>{
 const describe=await model(),card={rank:13,suit:'spades',enhancement:'steel',edition:'polychrome',seal:'red',permaBonus:5};
 const copy=structuredClone(card),d=describe(card);
 assert.equal(d.baseChips,10);assert.equal(d.modifiers.length,2);assert.deepEqual(d.modifiers.map(m=>m.id),['steel','polychrome']);
 assert.match(d.descriptions.join(' '),/Постоянный.*\+5/);assert.equal(d.seal.id,'red');assert.equal(d.sale,null);assert.deepEqual(card,copy);
});
test('owned accumulated bonuses and status names are separate from descriptions',async()=>{
 const describe=await model(),d=describe({entityId:'j_trousers',set:'Joker',edition:'foil',mult:12,perishable:true,perishRounds:3,rental:true,sellCost:1n},{owned:true});
 assert.deepEqual(d.accumulated,[{value:'+12',kind:'mult'}]);assert.deepEqual(d.statuses.map(s=>s.id),['rental','perishable']);
 assert.equal(d.sale,'$1');assert.equal(d.modifiers[0].id,'foil');assert.doesNotMatch(d.descriptions.join(' '),/Фольга|Сейчас|После истечения/);
});
test('eternal excludes temporary and forbids sale while rental stays independent',async()=>{
 const describe=await model(),d=describe({entityId:'j_joker',eternal:true,perishable:true,rental:true,sellCost:4n},{owned:true});
 assert.deepEqual(d.statuses.map(s=>s.id),['rental','eternal']);assert.equal(d.sale,null);
 assert.equal(describe({entityId:'j_joker',sellCost:0n},{owned:true}).sale,'$0');
 assert.equal(describe({entityId:'j_joker',sellCost:4n},{owned:true,saleAllowed:false}).sale,null);
});
test('collection and concealed cards never expose runtime values or sale',async()=>{
 const describe=await model(),card={entityId:'j_trousers',mult:12,sellCost:5n,edition:'foil'};
 const c=describe(card,{collection:true});assert.deepEqual(c.accumulated,[]);assert.equal(c.sale,null);
 const hidden=describe({...card,rank:13,suit:'spades',seal:'red'},{concealed:true,title:'Скрытая карта',description:'Неизвестна.'});
 assert.equal(hidden.baseChips,null);assert.deepEqual(hidden.modifiers,[]);assert.equal(hidden.seal,null);assert.equal(hidden.title,'Скрытая карта');
});
test('accumulation preserves zero and fractional coefficient without changing the card',async()=>{
 const describe=await model();
 assert.deepEqual(describe({entityId:'j_runner',chips:0},{owned:true}).accumulated,[{value:'+0',kind:'chips'}]);
 assert.deepEqual(describe({entityId:'j_constellation',xMult:1.4},{owned:true}).accumulated,[{value:'×1,4',kind:'mult'}]);
 assert.equal(describe({rank:2,suit:'clubs',enhancement:'stone'}).baseChips,null);
});
test('all four seal descriptions and expired perishable remain distinct',async()=>{
 const describe=await model();for(const seal of ['red','blue','gold','purple'])assert.equal(describe({rank:7,suit:'clubs',seal}).seal.id,seal);
 const d=describe({entityId:'j_runner',chips:20,perishable:true,perishRounds:0},{owned:true});
 assert.match(d.statuses[0].detail,/Срок истёк/);assert.match(d.descriptions.join(' '),/Ослаблен/);
});
