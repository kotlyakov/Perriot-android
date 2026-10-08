import test from 'node:test';
import assert from 'node:assert/strict';
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
