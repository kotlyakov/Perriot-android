import test from 'node:test';
import assert from 'node:assert/strict';
import {deckStats} from '../../src/ui/deck-view.js';
import * as view from '../../src/ui/deck-view.js';
import {createRun} from '../../src/core/run.js';
test('deck statistics reflect remaining cards and changed full run deck',()=>{
 const s=createRun('deck-screen',{runId:'deck-screen',money:4n});
 delete s.cards.card_clubs_2;
 s.drawPile=['card_spades_14','card_hearts_13','card_clubs_10','card_diamonds_2'];
 assert.equal(typeof view.deckStats,'function','Missing actual deck statistics');
 const r=view.deckStats(s,'remaining');
 assert.deepEqual(r.categories,{aces:1,faces:1,numbered:2});
 assert.deepEqual(r.suits,{spades:1,hearts:1,clubs:1,diamonds:1});
 assert.equal(r.ranks[14],1);assert.equal(r.ranks[13],1);assert.equal(r.ranks[11],0);
 const full=view.deckStats(s,'full');assert.equal(full.total,51);assert.equal(full.ranks[2],3);assert.equal(full.suits.clubs,12);
 assert.deepEqual(full.categories,{aces:4,faces:12,numbered:35});
});

test('remaining deck statistics conceal hidden hand identities in the unknown card pool',()=>{
 const state={cards:{a:{id:'a',rank:14,suit:'hearts'},b:{id:'b',rank:2,suit:'clubs'},c:{id:'c',rank:13,suit:'spades'}},drawPile:['a'],hand:['b','c'],bossState:{hiddenCardIds:['b']}};
 const stats=deckStats(state,'remaining');assert.equal(stats.total,2);assert.equal(stats.ranks[14],1);assert.equal(stats.ranks[2],1);assert.equal(stats.ranks[13],0);
});
