import test from 'node:test';
import assert from 'node:assert/strict';
import * as tags from '../../src/core/apk-tags.js';
import {createApkRng} from '../../src/core/apk-rng.js';

test('all 24 skip rewards are selectable with original ante and discovery gates',()=>{
 assert.equal(typeof tags.chooseApkTag,'function');
 const fresh=tags.createApkTagContext();
 const pool=tags.getApkTagPool(fresh);assert.equal(pool.length,24);
 assert.equal(pool[1],'UNAVAILABLE');assert.equal(pool[2],'UNAVAILABLE');
 assert.equal(pool[3],'UNAVAILABLE');assert.equal(pool[22],'UNAVAILABLE');
 const all=tags.getApkTagPool(tags.createApkTagContext({ante:2,discoveredCentreIds:['j_blueprint','e_negative','e_foil','e_holo','e_polychrome']}));
 assert.equal(new Set(all).size,24);assert.ok(!all.includes('UNAVAILABLE'));
});
test('tag selection preserves sparse positions, resamples and never mutates input',()=>{
 const rng=createApkRng('TAGSTART'),context=tags.createApkTagContext(),before=structuredClone({rng,context});
 let next=rng;const selected=[];
 for(let i=0;i<80;i++){const out=tags.chooseApkTag(next,context);selected.push(out.tagId);next=out.rng;}
 assert.ok(selected.every(id=>tags.getApkTagPool(context).includes(id)));
 assert.ok(Object.keys(next.streams).some(k=>k.startsWith('Tag1_resample')));
 assert.deepEqual({rng,context},before);
 const bans=tags.getApkTagPool(tags.createApkTagContext({ante:2,discoveredCentreIds:['j_blueprint','e_negative','e_foil','e_holo','e_polychrome']}));
 assert.deepEqual(tags.getApkTagPool(tags.createApkTagContext({bannedKeys:bans})),['tag_handy']);
});
test('orbital hand selection uses the supplied visible order and rejects malformed contexts',()=>{
 const context=tags.createApkTagContext({visibleHandOrder:['Pair']});
 const out=tags.chooseApkOrbitalHand(createApkRng('ORBITAL1'),context);assert.equal(out.hand,'Pair');assert.ok(Object.hasOwn(out.rng.streams,'orbital'));
 for(const options of [{ante:-2},{discoveredCentreIds:['unknown']},{bannedKeys:['fake']},{visibleHandOrder:[]},{visibleHandOrder:['Pair','Pair']},{anything:true}])assert.throws(()=>tags.createApkTagContext(options));
});
