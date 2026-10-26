import test from 'node:test';
import assert from 'node:assert/strict';
import {collectionArtworkSvg,COLLECTION_ART_IDS} from '../../src/content/collection-illustrations.js';
import {collectionEntries,createProfile} from '../../src/core/profile.js';

test('every remaining collection identity has an original object illustration',()=>{
 const sets=new Set(['Voucher','Booster','Back','Enhanced','Seal','Edition','Tag','Blind']);
 const entries=collectionEntries(createProfile()).filter(row=>sets.has(row.set));
 assert.equal(entries.length,150);
 assert.equal(new Set(COLLECTION_ART_IDS).size,150);
 assert.deepEqual(new Set(COLLECTION_ART_IDS),new Set(entries.map(row=>row.id)));
 const illustrations=new Set();
 for(const entry of entries){
  const art=collectionArtworkSvg(entry.id);
  assert.ok(art,entry.id);
  assert.ok(art.includes(`data-collection-art="${entry.id}"`),entry.id);
  assert.ok(art.includes(`data-art-family="${entry.set}"`),entry.id);
  assert.ok(art.includes('viewBox="0 0 118 138"'),entry.id);
  assert.doesNotMatch(art,/undefined|NaN|foreignObject|<script|href=/,entry.id);
  illustrations.add(art.replaceAll(entry.id,'identity'));
 }
 assert.equal(illustrations.size,150,'Each catalogue plate has distinct geometry/material');
});
test('unknown catalogue keys do not masquerade as a discovered plate',()=>{
 for(const id of ['p_arcana_normal_5','p_buffoon_jumbo_2','v_missing','b_missing','m_missing','e_missing','seal_missing','tag_missing','bl_missing',null])assert.equal(collectionArtworkSvg(id),null);
});
test('unmodified approved Joker and consumable plates are outside this renderer',()=>{
 for(const id of ['j_joker','j_blueprint','c_fool','c_pluto','c_ankh'])assert.equal(collectionArtworkSvg(id),null);
});
