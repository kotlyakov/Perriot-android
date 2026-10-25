import test from 'node:test';
import assert from 'node:assert/strict';
import {JOKER_IDENTITIES} from '../../src/content/joker-identities.js';
import {JOKER_SCENES,jokerArtworkSvg} from '../../src/ui/joker-art.js';

test('all 150 approved jokers have individually authored scenes in production order',()=>{
  assert.equal(Object.keys(JOKER_SCENES).length,150);
  assert.deepEqual(Object.keys(JOKER_SCENES),Object.keys(JOKER_IDENTITIES));
  assert.equal(new Set(Object.values(JOKER_SCENES)).size,150);
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
    for(const color of colors)assert.ok(['#f0e5c8','#143d39','#ca3d2a','#267d9b','#b88935','#8b9c94'].includes(color));
  });
}

test('unrecognized and prototype-like joker IDs return null',()=>{
  for(const id of ['j_unknown','constructor','toString','__proto__','',null,undefined])assert.equal(jokerArtworkSvg(id),null);
});
