import test from 'node:test';
import assert from 'node:assert/strict';
import {setGameSpeed,gameDuration,scorePopDuration,scoreEventDuration} from '../../src/ui/game-speed.js';
import {scorePopFrames} from '../../src/ui/score-animation.js';
test('score reading time has a floor independently of physical movement',()=>{
 try{
  for(const speed of [.5,1,2,4]){
   setGameSpeed(speed);
   assert.equal(gameDuration(480),480/speed);
   assert.equal(scorePopDuration(),Math.max(600,600/speed));
   assert.equal(scoreEventDuration(220),Math.max(180,220/speed));
   assert.ok(scorePopDuration()*.7>=420);
  }
 }finally{setGameSpeed(1);}
});
test('score labels hold still and opaque; multiplication has a distinct restrained pulse',()=>{
 for(const multiply of [false,true]){
  const frames=scorePopFrames({multiply,direction:1}),hold=frames.find(f=>f.offset===.7);
  assert.equal(hold.opacity,1);assert.equal(hold.translate,'0 0');
  assert.ok(frames.slice(0,-1).every(f=>f.opacity===1&&f.translate==='0 0'));
  assert.equal(frames.at(-1).opacity,0);assert.equal(frames.at(-1).translate,'0 12px');
  assert.equal(frames.some(f=>f.scale==='1.16'),multiply);
 }
});
