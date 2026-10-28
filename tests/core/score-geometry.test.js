import test from 'node:test';
import assert from 'node:assert/strict';
import {showNumbers} from '../../src/ui/field.js';
test('score number fitting uses the fixed stage width without synchronous layout on each paint',()=>{
 const prior=globalThis.document;let reads=0;const nodes=Object.fromEntries(['chips_value','mult_value'].map(id=>[id,{dataset:{},style:{},textContent:'',parentElement:{style:{width:'111px'},get clientWidth(){reads++;return 111;}}}]));
 globalThis.document={getElementById:id=>nodes[id]};
 try{for(let i=0;i<12;i++)showNumbers(BigInt(i),BigInt(i));assert.equal(reads,0);assert.equal(nodes.mult_value.textContent,'11');assert.ok(parseFloat(nodes.mult_value.style.fontSize)>0);}finally{globalThis.document=prior;}
});
