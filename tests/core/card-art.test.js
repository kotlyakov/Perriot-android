import test from 'node:test';
import assert from 'node:assert/strict';
import {PIP_LAYOUTS,pipArtwork} from '../../src/ui/card-art.js';
test('standard pip counts/rows and bounded artwork for all ranks and suits',()=>{
 for(let rank=1;rank<=10;rank++){
  assert.equal(PIP_LAYOUTS[rank].length,rank);
  for(const [x,y] of PIP_LAYOUTS[rank])assert.ok(x>=10 && x<=62 && y>=10 && y<=104);
  for(const suit of ['clubs','hearts','spades','diamonds'])assert.equal((pipArtwork({rank:rank===1?14:rank,suit}).match(/class="pip"/g)||[]).length,rank);
 }
 assert.deepEqual(PIP_LAYOUTS[7],[[20,12],[52,12],[20,57],[52,57],[20,102],[52,102],[36,34.5]]);
 assert.deepEqual(PIP_LAYOUTS[10].slice(-2),[[36,27],[36,87]]);
});
