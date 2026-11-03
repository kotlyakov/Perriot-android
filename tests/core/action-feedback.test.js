import test from 'node:test';
import assert from 'node:assert/strict';
import {paintActionFeedback} from '../../src/ui/action-feedback.js';
test('action press paints before heavy work and release removes the feedback',async()=>{
 const frames=[],classes=new Set(),element={isConnected:true,classList:{add:key=>classes.add(key),remove:key=>classes.delete(key)}};
 const previous=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=callback=>frames.push(callback);
 try{
  let ready=false;const pending=paintActionFeedback(element).then(release=>{ready=true;return release;});
  assert.equal(classes.has('action-pending'),true);assert.equal(ready,false);
  frames.shift()();await Promise.resolve();assert.equal(ready,false);
  frames.shift()();const release=await pending;assert.equal(ready,true);assert.equal(classes.has('action-pending'),true);
  release();assert.equal(classes.has('action-pending'),false);
 }finally{globalThis.requestAnimationFrame=previous;}
});
