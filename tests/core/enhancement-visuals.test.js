import test from 'node:test';
import assert from 'node:assert/strict';
import {collectionArtworkSvg} from '../../src/content/collection-illustrations.js';
import {cardMarkup} from '../../src/ui/field.js';
test('wild replaces suit marks with four-colour blurred orbs for every rank',()=>{
 for(const rank of [2,7,10,11,12,13,14])for(const suit of ['hearts','spades','diamonds','clubs']){
  const html=cardMarkup({rank,suit,enhancement:'wild'});assert.ok(html.includes('data-wild-symbol'),rank+':'+suit);assert.ok(html.includes('blur('));assert.equal((html.match(/data-wild-symbol/g)||[]).length,rank>=11&&rank<=13?3:(rank===14?3:rank+2));
 }
});
test('improvement examples protect rank zones and contain no decorative horizontal rules',()=>{
 for(const key of ['bonus','mult','wild','glass','steel','gold','lucky']){
  const svg=collectionArtworkSvg('m_'+key);assert.ok(svg.includes('data-enhancement-art="'+key+'"'));assert.ok(svg.includes('data-rank="top"'));assert.ok(svg.includes('data-rank="bottom"'));assert.ok(!/M34 17H84|M28 18H88|M28 115H88/.test(svg));
 }
 assert.ok(collectionArtworkSvg('m_lucky').includes('data-four-leaf-clover'));
});
