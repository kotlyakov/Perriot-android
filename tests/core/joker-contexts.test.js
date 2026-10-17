import test from 'node:test';
import assert from 'node:assert/strict';
import {jokerEffectContext} from '../../src/core/joker-contexts.js';
import {isCardFace} from '../../src/core/card-faces.js';
import {scoredJokerEffects,scoredJokerRepetitions,supportsJoker,NATIVE_JOKERS} from '../../src/content/jokers.js';
const joker=(entityId,id=entityId)=>({entityId,id});
const card=(rank,enhancement)=>({id:'card',rank,suit:'clubs',enhancement});
test('copy resolution preserves original source and mutable target across chains and ordering',()=>{
 const [a,b,c]=[joker('j_blueprint'),joker('j_blueprint','second'),joker('j_joker')];
 assert.deepEqual(jokerEffectContext([a,b,c],0),{source:a,target:c,copied:true});
 assert.deepEqual(jokerEffectContext([c,joker('j_brainstorm')],1),{source:joker('j_brainstorm'),target:c,copied:true});
 assert.deepEqual(jokerEffectContext([c],0),{source:c,target:c,copied:false});
 assert.equal(jokerEffectContext([a],0),null);
 assert.equal(jokerEffectContext([joker('j_brainstorm'),c],0),null);
 assert.equal(jokerEffectContext([a,joker('j_brainstorm')],0),null);
});
test('debuff stops source and target; compatibility metadata is no forwarding gate',()=>{
 const copy=joker('j_blueprint'),target=joker('j_pareidolia');
 assert.equal(jokerEffectContext([{...copy,debuffed:true},target],0),null);
 assert.equal(jokerEffectContext([copy,{...target,debuffed:true}],0),null);
 assert.equal(jokerEffectContext([copy,target],0).target,target);
});
test('face accessor observes debuff before native rank draw and Pareidolia after it',()=>{
 const p=joker('j_pareidolia'),s=card(2,'stone');let calls=0;
 const rankGetter=()=>{calls++;return -123;};
 assert.equal(isCardFace(s,[p],{rankGetter}),true);assert.equal(calls,1);
 assert.equal(isCardFace(s,[],{rankGetter}),false);assert.equal(calls,2);
 assert.equal(isCardFace(s,[{...p,debuffed:true}],{rankGetter}),false);assert.equal(calls,3);
 assert.equal(isCardFace(s,[p],{debuffed:true,rankGetter}),false);assert.equal(calls,3);
 assert.equal(isCardFace({...s,debuffed:true},[p],{rankGetter}),false);assert.equal(calls,3);
 for(let rank=2;rank<=14;rank++)assert.equal(isCardFace(card(rank),[]),rank>=11&&rank<=13);
 assert.equal(isCardFace(card(12,'stone'),[]),false);
 assert.equal(isCardFace(card(2),[joker('j_blueprint'),{...p,debuffed:true}]),false);
});
test('face scoring and repeat effects admit Pareidolia Stone without changing rank and suit effects',()=>{
 const c=card(2,'stone'),options={jokers:[joker('j_pareidolia')],rankGetter:()=>-123};
 assert.deepEqual(scoredJokerEffects('j_scary_face',c,options),[{operation:'add_chips',amount:30n}]);
 assert.deepEqual(scoredJokerEffects('j_smiley',c,options),[{operation:'add_mult',amount:5n}]);
 assert.equal(scoredJokerRepetitions('j_sock_and_buskin',c,options),1);
 assert.deepEqual(scoredJokerEffects('j_arrowhead',c,options),[]);
 assert.deepEqual(scoredJokerEffects('j_even_steven',c,options),[]);
 assert.equal(scoredJokerRepetitions('j_hack',c,options),0);
 assert.equal(scoredJokerRepetitions('j_selzer',c),1);
});
test('seven mechanism sentinels are admitted and only Seltzer permits bounded lifetime state',()=>{
 for(const key of ['j_mime','j_pareidolia','j_blueprint','j_brainstorm','j_selzer','j_dna','j_marble']){assert.equal(NATIVE_JOKERS.includes(key),true);assert.equal(supportsJoker(joker(key)),true);}
 for(const remaining of [1,10])assert.equal(supportsJoker({...joker('j_selzer'),repeatHandsRemaining:remaining},{owned:true}),true);
 for(const remaining of [0,11,-1,1.5,'10',null])assert.equal(supportsJoker({...joker('j_selzer'),repeatHandsRemaining:remaining},{owned:true}),false);
 assert.equal(supportsJoker({...joker('j_joker'),repeatHandsRemaining:5},{owned:true}),false);
});
