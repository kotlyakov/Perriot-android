import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../../src/ui/flame.js',import.meta.url),'utf8')
 .replace(/^export /gm,'')
 +'\n globalThis.__flameQA={showFlame};';

test('flame does not schedule or clear canvas in background, resumes only while active',()=>{
 let raf=[],visibilityHandler,contexts=0;
 const canvas={hidden:false,isConnected:true,dataset:{},getContext(){contexts++;return {clearRect(){}};}};
 const doc={
  hidden:true,
  addEventListener(type,cb){if(type==='visibilitychange')visibilityHandler=cb;},
  createElement(type){assert.equal(type,'canvas');return canvas;},
  getElementById(){return {prepend(){}};}
 };
 const scope={document:doc,requestAnimationFrame(cb){raf.push(cb);},globalThis:null,matchMedia(){return {matches:true}}};
 scope.globalThis=scope;
 runInNewContext(source,scope);
 scope.__flameQA.showFlame(100n,1n);
 assert.equal(raf.length,0,'Background showFlame must not schedule frames');
 doc.hidden=false;visibilityHandler();assert.equal(raf.length,1,'Foreground must resume active flame');
 doc.hidden=true;raf.shift()(1000);assert.equal(raf.length,0);
 assert.equal(contexts,0,'Background frame must not touch Canvas');
 doc.hidden=false;visibilityHandler();assert.equal(raf.length,1);
 scope.__flameQA.showFlame(0n,1n);
 raf.shift()(1100);
 assert.equal(contexts,0,'Inactive flame must not touch Canvas');
 visibilityHandler();assert.equal(raf.length,0,'Inactive flame must not restart');
});
