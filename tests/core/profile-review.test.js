import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfile,updateProfile} from '../../src/core/profile.js';
const state=(fields={})=>({runId:'profile-review',revision:0,deckId:'red',phase:'blind_selection',money:4n,round:{ante:1,blindId:'small',handSize:8,handsPlayed:0},jokers:[],cards:{},...fields});
test('profile review: five ordinary base Jokers do not satisfy Glow Up',()=>{
 const jokers=['j_joker','j_zany','j_mad','j_crazy','j_droll'].map((entityId,i)=>({id:'j'+i,entityId,edition:'base'}));
 const next=state({revision:1,jokers});const p=updateProfile(createProfile(),state(),next);
 assert.equal(p.unlocked.includes('v_glow_up'),false);
});
test('profile review: cash_out payout enters career earnings exactly once',()=>{
 const prev=state({phase:'round_won'}),next=state({revision:1,phase:'shop',money:14n});
 const events=[{type:'cash_out',reward:3n,hands:3,interest:0n,total:10n},{type:'shop_entered'}];
 const p=updateProfile(createProfile(),prev,next,events);assert.equal(p.career.c_dollars_earned,10);assert.equal(updateProfile(p,prev,next,events).career.c_dollars_earned,10);
});
test('profile review: Seeing Double accepts spade sevens with active Smeared Joker',()=>{
 const cards=Object.fromEntries(Array.from({length:4},(_,i)=>['seven'+i,{id:'seven'+i,rank:7,suit:'spades'}]));
 const prev=state({cards,jokers:[{id:'smeared',entityId:'j_smeared'}]});
 const next={...prev,revision:1,lastScore:{handId:'four_of_a_kind',score:100n}};
 const p=updateProfile(createProfile(),prev,next,[{type:'hand_played',cardIds:Object.keys(cards)}]);assert.ok(p.unlocked.includes('j_seeing_double'));
});
test('profile review: free rerolls do not count toward Reroll Glut',()=>{
 const p=createProfile();p.career.c_shop_rerolls=99;
 const next=state({revision:1,phase:'shop'}),q=updateProfile(p,state({phase:'shop'}),next,[{type:'shop_rerolled',cost:0n}]);
 assert.equal(q.career.c_shop_rerolls,99);assert.equal(q.unlocked.includes('v_reroll_glut'),false);
});
test('profile review: Four Fingers four-card royal discard unlocks Brainstorm',()=>{
 const cards=Object.fromEntries([10,11,12,13].map(rank=>['r'+rank,{id:'r'+rank,rank,suit:'hearts'}]));
 const prev=state({cards,jokers:[{id:'four',entityId:'j_four_fingers'}]});const next={...prev,revision:1};
 const p=updateProfile(createProfile(),prev,next,[{type:'cards_discarded',cardIds:Object.keys(cards)}]);assert.ok(p.unlocked.includes('j_brainstorm'));
});
test('profile review: Plant-debuffed face does not increment face-card career stat',()=>{
 const cards={king:{id:'king',rank:13,suit:'hearts'}};
 const prev=state({cards,phase:'playing',bossState:{id:'bl_plant',disabled:false}}),next={...prev,revision:1,lastScore:{handId:'high_card',score:5n}};
 const p=updateProfile(createProfile(),prev,next,[{type:'hand_played',cardIds:['king']}]);assert.equal(p.career.c_face_cards_played,0);
});
test('profile review: score rewards count gross earnings despite Tooth loss in aggregate money event',()=>{
 const cards={gold:{id:'gold',rank:2,suit:'hearts',seal:'gold'}};
 const prev=state({phase:'playing',money:10n,cards});const next={...prev,revision:1,money:12n,lastScore:{handId:'high_card',score:50n}};
 const events=[{type:'money_changed',reason:'scoring',before:10n,after:12n,delta:2n},{type:'hand_played',cardIds:['gold']},{type:'score_money',sourceId:'gold',amount:3n}];
 const p=updateProfile(createProfile(),prev,next,events);assert.equal(p.career.c_dollars_earned,3);
});
test('profile review: temporary money peak unlocks Satellite before end-round rental payment',()=>{
 const prev=state({phase:'playing',money:399n}),next=state({revision:1,phase:'round_won',money:399n});
 const events=[{type:'money_changed',before:399n,after:402n,delta:3n},{type:'money_changed',before:402n,after:399n,delta:-3n},{type:'round_won'}];
 const p=updateProfile(createProfile(),prev,next,events);assert.ok(p.unlocked.includes('j_satellite'));assert.equal(p.highScores.mostMoney,'402');
});
test('profile review: Brainstorm cannot use a debuffed Wild as another suit',()=>{
 const cards=Object.fromEntries([10,11,12,13,14].map(rank=>['r'+rank,{id:'r'+rank,rank,suit:rank===14?'spades':'hearts',...(rank===14?{enhancement:'wild'}:{})}]));
 const prev=state({cards,bossState:{id:'bl_pillar',disabled:false,playedBeforeBoss:['r14']}}),next={...prev,revision:1};
 const p=updateProfile(createProfile(),prev,next,[{type:'cards_discarded',cardIds:Object.keys(cards)}]);assert.equal(p.unlocked.includes('j_brainstorm'),false);
});
