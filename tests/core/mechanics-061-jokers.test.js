import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../../src/core/run.js';
import {applyRoundEndJokers} from '../../src/core/round-end-jokers.js';
import {item7BeforeScore} from '../../src/core/joker-score-effects.js';

for(const count of [2,3])for(const score of [74n,75n])test(`Bones current slots: ${count} at ${score}/300`,()=>{
 const s=createRun('BONES061',{runId:'jokers-061',money:20n});s.round.score=score;s.round.target=300n;
 s.jokers=Array.from({length:count},(_,i)=>({id:`b${i}`,entityId:'j_mr_bones'}));const events=[];
 assert.equal(applyRoundEndJokers(s,events,{gameOver:true}).saved,score===75n);
 assert.equal(s.jokers.length,count-(score===75n?1:0));
 assert.equal(events.filter(e=>e.type==='joker_removed').length,score===75n?1:0);
});
test('legacy aggregate Bones remains unchanged',()=>{
 const s=createRun('BONESOLD',{runId:'jokers-061',money:20n});delete s.mechanicsVersion;s.round.score=75n;s.round.target=300n;
 s.jokers=[{id:'b1',entityId:'j_mr_bones'},{id:'b2',entityId:'j_mr_bones'}];
 assert.equal(applyRoundEndJokers(s,[],{gameOver:true}).saved,true);assert.equal(s.jokers.length,0);
});
test('debuffed Bones does not save; first active slot saves and leaves next',()=>{
 const s=createRun('BONESDEBUFF',{runId:'jokers-061',money:20n});s.round.score=75n;s.round.target=300n;
 s.jokers=[{id:'d',entityId:'j_mr_bones',debuffed:true},{id:'a',entityId:'j_mr_bones'},{id:'b',entityId:'j_mr_bones'}];
 applyRoundEndJokers(s,[],{gameOver:true});assert.deepEqual(s.jokers.map(j=>j.id),['d','b']);
});
for(const current of [true,false])for(const reverse of [true,false])test(`Bus stone traversal current=${current} reverse=${reverse}`,()=>{
 const cards=[{id:'face',rank:11,suit:'hearts'},{id:'stone',rank:5,suit:'spades',enhancement:'stone'}];if(reverse)cards.reverse();
 const s={jokers:[{id:'bus',entityId:'j_ride_the_bus',mult:3}],...(current?{mechanicsVersion:1}:{})};let draws=0;
 item7BeforeScore(s,{handId:'high_card',playedCards:cards,scoringCards:cards,rankGetter:c=>c.enhancement==='stone'?(draws++,-123):c.rank});
 assert.equal(draws,current||reverse?1:0);assert.equal(s.jokers[0].mult,0);
});
test('Bus traverses every stone once and Blueprint does not add growth traversal',()=>{
 const cards=[{id:'face',rank:11},{id:'s1',rank:5,enhancement:'stone'},{id:'s2',rank:6,enhancement:'stone'}];
 const s={mechanicsVersion:1,jokers:[{id:'blue',entityId:'j_blueprint'},{id:'bus',entityId:'j_ride_the_bus',mult:3}]};let draws=0;
 item7BeforeScore(s,{handId:'high_card',playedCards:cards,scoringCards:cards,rankGetter:c=>c.enhancement==='stone'?(draws++,-123):c.rank});
 assert.equal(draws,2);assert.equal(s.jokers[1].mult,0);
});
