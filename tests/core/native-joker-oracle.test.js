import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {NATIVE_JOKERS,independentEffect,scoredJokerEffects} from '../../src/content/jokers.js';
import {evaluateHand} from '../../src/core/hands.js';
const fixture=JSON.parse(readFileSync(new URL('../../scripts/reference-rng/joker-score-fixtures.json',import.meta.url)));
const suits={Spades:'spades',Hearts:'hearts',Clubs:'clubs',Diamonds:'diamonds'};
const convert=(c,i)=>({id:'c'+i,rank:c.rank,suit:suits[c.suit],...(c.stone?{enhancement:'stone'}:c.wild?{enhancement:'wild'}:{})});
test('supported Joker branches match independent original Lua method outputs',()=>{
 let checked=0;
 for(const c of fixture.cases){
  if(!NATIVE_JOKERS.includes(c.key)||c.debuff)continue;
  if(c.phase==='individual-play'){
   const effects=scoredJokerEffects(c.key,{id:'c',rank:c.rank,suit:suits[c.suit]});
   const actual={};for(const e of effects)actual[e.operation==='add_chips'?'chips':'mult']=Number(e.amount);
   assert.deepEqual(actual,c.expected,c.key+' '+c.rank+'/'+c.suit);checked++;
  }else if(c.phase==='independent'){
   const h=fixture.contains.find(h=>h.case===c.case);
   const played=h?h.ranks.map((rank,i)=>({id:'c'+i,rank,suit:h.flush?'spades':['spades','hearts','clubs','diamonds'][i%4]})):c.played?.map(convert);
   if(!played?.length)continue;
   const counts=new Map();for(const card of played)counts.set(card.rank,(counts.get(card.rank)??0)+1);
   const empty=(c.jokerLimit??5)-(c.jokerCount??1);
   const e=independentEffect(c.key,[...counts.values()],{playedCards:played,scoringCards:played.map((card,i)=>({...card,debuffed:c.played?.[i]?.debuff??false})),handId:evaluateHand(played).handId,jokerCount:c.jokerCount??1,
    discardsRemaining:c.discards,heldCards:c.held?.map(convert)??[],deckCount:c.deckCount,jokerSlots:c.jokerLimit??5,stencilCount:Math.max(0,(c.stencilX??0)-empty)});
   const actual=e?{[{add_chips:'chip_mod',add_mult:'mult_mod',multiply_mult:'Xmult_mod'}[e.operation]]:Number(e.amount)}:{};
   assert.deepEqual(actual,c.expected,c.key+' '+c.case);checked++;
  }
 }
 assert.ok(checked>=850,'expected full supported native method matrix, got '+checked);
});

