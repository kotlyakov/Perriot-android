import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../../src/content/apk-shop-catalog.js';
const art=await import('../../src/content/consumable-illustrations.js').catch(()=>({}));
test('every Tarot, Planet and Spectral identity has a distinct original engraving',()=>{
 assert.equal(typeof art.consumableArtworkSvg,'function');
 for(const [set,count] of [['Tarot',22],['Planet',12],['Spectral',18]]){
  const ids=catalog.centres.filter(c=>c.set===set).map(c=>c.key);assert.equal(ids.length,count);
  const scenes=ids.map(id=>{const svg=art.consumableArtworkSvg(id);assert.ok(svg.includes(`data-consumable-id="${id}"`),id);assert.match(svg,/viewBox="0 0 118 138"/);assert.ok(art.CONSUMABLE_ILLUSTRATIONS[id].scene.length>120,id);assert.doesNotMatch(svg,/undefined|NaN|Infinity/);return art.CONSUMABLE_ILLUSTRATIONS[id].scene;});
  assert.equal(new Set(scenes).size,count);
 }
 assert.equal(art.consumableArtworkSvg('unknown'),'');
});
