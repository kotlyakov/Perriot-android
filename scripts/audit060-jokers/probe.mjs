import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {applyRoundEndJokers} from '../../src/core/round-end-jokers.js';
import {initializeItem7Joker,resetItem7RoundTargets} from '../../src/core/joker-item7-lifecycle.js';
function run(seed='AUDITJ'){return createRun(seed,{runId:'audit-jokers',money:20n,referenceRng:true,referenceShop:true});}
const s=run();s.round.score=75n;s.round.target=300n;s.jokers=[{id:'bones1',entityId:'j_mr_bones'},{id:'bones2',entityId:'j_mr_bones'}];
assert.equal(applyRoundEndJokers(s,[],{gameOver:true}).saved,true);
console.log('multiple Bones: expected one surviving, actual',s.jokers.length);
assert.equal(s.jokers.length,0);
const t=run();for(const c of Object.values(t.cards))c.enhancement='stone';t.round.idolCard={rank:7,suit:'hearts'};t.round.mailRank=7;resetItem7RoundTargets(t);
console.log('all Stone target reset: numeric targets retained (native keeps old IDs; display rank differs), actual',t.round.idolCard,t.round.mailRank);
assert.equal(t.round.idolCard.rank,7);assert.equal(t.round.mailRank,7);
