import test from 'node:test';
import assert from 'node:assert/strict';
import * as art from '../../src/ui/card-art.js';
test('twelve courts have individual characters and attributes',()=>{
 assert.equal(typeof art.courtArtwork,'function');
 const images=[];
 for(const suit of ['spades','hearts','clubs','diamonds'])for(const rank of [11,12,13]){
  const svg=art.courtArtwork({suit,rank});assert.match(svg,new RegExp(`data-court="${suit}-${rank}"`));assert.match(svg,/viewBox="0 0 70 124"/);assert.match(svg,/data-attribute=/);assert.doesNotMatch(svg,/undefined|NaN/);images.push(svg);
 }
 assert.equal(new Set(images).size,12);
});
