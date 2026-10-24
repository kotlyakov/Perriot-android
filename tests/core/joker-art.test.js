import test from 'node:test';
import assert from 'node:assert/strict';
import {JOKER_IDENTITIES} from '../../src/content/joker-identities.js';
import {JOKER_SCENES,JOKER_BACKDROPS,jokerArtworkSvg} from '../../src/ui/joker-art.js';

test('all 150 approved jokers have individually authored scenes in production order',()=>{
  assert.equal(Object.keys(JOKER_SCENES).length,150);
  assert.deepEqual(Object.keys(JOKER_SCENES),Object.keys(JOKER_IDENTITIES));
  assert.equal(new Set(Object.values(JOKER_SCENES)).size,150);
  assert.deepEqual(Object.keys(JOKER_BACKDROPS),Object.keys(JOKER_IDENTITIES));
  assert.ok(new Set(Object.values(JOKER_BACKDROPS)).size>=10);
});

for(const [id,identity] of Object.entries(JOKER_IDENTITIES)){
  test(`engraving ${String(identity.number).padStart(3,'0')}: ${id}`,()=>{
    const svg=jokerArtworkSvg(id);
    assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(svg.endsWith('</svg>'));
    assert.ok(svg.includes('viewBox="0 0 118 138"'));
    assert.ok(svg.includes(`data-joker-id="${id}"`));
    assert.ok(svg.includes(`<title>${identity.name}</title>`));
    assert.ok(svg.includes(JOKER_SCENES[id]));
    assert.doesNotMatch(svg,/undefined|NaN|Infinity|<image|<filter|<linearGradient|<radialGradient|\bhref\s*=|<script|\bon\w+\s*=/);
    assert.doesNotMatch(svg,/url\(|\sid=/);
    assert.ok(JOKER_SCENES[id].includes('<path'));
    const colors=[...svg.matchAll(/#[\da-fA-F]{6}/g)].map(match=>match[0]);
    const inks=['#fff1d6','#20213f','#f04452','#3285ed','#ffc34a','#a9c9de','#9460d5','#24bdba','#ff873f','#ffe15c','#82cb63','#ec72af'];
    const grounds=['#9dcff4','#79b4e7','#8ddcce','#61c6b7','#f4aed2','#e28ab8','#c4a5ef','#a283d7','#f5d47a','#e4b54e','#bddd81','#98bd5e','#ffb77e','#ef995b','#ff9f99','#ed7e7c','#c3e6ed','#91cedb','#6e72b2','#565b96','#76c4cf','#51a5b8','#f3c68e','#dbac71'];
    for(const color of colors)assert.ok([...inks,...grounds].includes(color),color);
    assert.ok(new Set(colors).size>=6,`${id} needs multiple coloured inks and its own ground`);
    assert.ok(grounds.some(color=>svg.includes(`fill="${color}"`)),`${id} needs a coloured ground`);
  });
}

test('unrecognized and prototype-like joker IDs return null',()=>{
  for(const id of ['j_unknown','constructor','toString','__proto__','',null,undefined])assert.equal(jokerArtworkSvg(id),null);
});
