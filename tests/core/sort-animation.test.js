import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {sortHand} from '../../src/core/sort.js';
import {flameHeight} from '../../src/ui/flame.js';
import {scoreDelta,scoreMoneyText} from '../../src/ui/score-animation.js';
test('chosen sort survives play, discard and save; reordering has no RNG cost',()=>{
 let s=dispatch(createRun('sorting',{runId:'sorting',money:4n}),{type:'START_BLIND',expectedRevision:0}).state;
 for(const mode of ['suit','rank']){
  const rng=structuredClone(s.rng);
  s=dispatch(s,{type:'SET_SORT',mode,expectedRevision:s.revision}).state;assert.deepEqual(s.rng,rng);
  s=deserializeState(serializeState(s));assert.equal(s.sortMode,mode);
  for(const type of ['DISCARD','PLAY_HAND']){
   s=dispatch(s,{type,cardIds:s.hand.slice(0,1),expectedRevision:s.revision}).state;
   const sorted=structuredClone(s);sortHand(sorted,mode);assert.deepEqual(s.hand,sorted.hand);
  }
 }
 const old=structuredClone(s);delete old.sortMode;assert.deepEqual(deserializeState(serializeState(old)),old);
 const invalid=structuredClone(s);invalid.sortMode='unknown';assert.throws(()=>serializeState(invalid));
 assert.equal(dispatch(s,{type:'SET_SORT',mode:'bad',expectedRevision:s.revision}).state,s);
});
test('flame is monotonic and bounded even for thousand digit scores',()=>{
 assert.equal(flameHeight(300n,300n),0);
 let previous=0;for(const score of [301n,600n,3000n,10n**30n,10n**1000n]){const h=flameHeight(score,300n);assert.ok(h>previous && h<62);previous=h;}
});
test('score labels distinguish chip/mult addition and multiplication',()=>{
 assert.deepEqual(scoreDelta({operation:'add_chips',before:{chips:5n,mult:2n},after:{chips:12n,mult:2n}}),{kind:'chips',multiply:false,text:'+7'});
 assert.deepEqual(scoreDelta({operation:'multiply_mult',before:{chips:5n,mult:2n},after:{chips:5n,mult:6n}}),{kind:'mult',multiply:true,text:'×3'});
 assert.equal(scoreMoneyText({type:'score_money',amount:20n}),'+$20');
});

