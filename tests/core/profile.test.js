import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../../src/core/profile.js';
const state=(fields={})=>({runId:'r1',revision:0,deckId:'red',phase:'blind_selection',money:4n,round:{ante:1,blindId:'small',handSize:8,handsPlayed:0},jokers:[],cards:{},...fields});
test('fresh native profile grants red and white only without discovering inaccessible content',()=>{
 const p=api.createProfile();assert.equal(api.validateProfile(p),p);assert.ok(api.deckUnlocked(p,'red'));assert.equal(api.deckUnlocked(p,'blue'),false);assert.ok(api.stakeUnlocked(p,'red',1));assert.equal(api.stakeUnlocked(p,'red',2),false);
 assert.equal(api.collectionEntries(p).filter(x=>x.set==='Joker').length,150);assert.equal(api.collectionEntries(p).filter(x=>x.set==='Back').length,15);
});
test('hand statistics and face count are idempotent across reload and do not mutate input',()=>{
 const p=api.createProfile(),prev=state({cards:{k:{rank:13,suit:'clubs'},a:{rank:14,suit:'hearts'}}}),next=state({revision:1,cards:prev.cards,lastScore:{handId:'high_card',score:100n}}),events=[{type:'hand_played',cardIds:['k','a']}];
 const q=api.updateProfile(p,prev,next,events);assert.equal(q.career.c_hands_played,1);assert.equal(q.career.c_cards_played,2);assert.equal(q.career.c_face_cards_played,1);assert.equal(q.highScores.hand,'100');assert.equal(p.career.c_hands_played,0);assert.deepEqual(api.updateProfile(q,prev,next,events),q);
});
test('seeded and challenge contexts never unlock, discover or increment career counters',()=>{
 for(const context of [{seeded:true},{challenge:true}]){let p=api.updateProfile(api.createProfile(),null,state(),[],context);p=api.updateProfile(p,state(),state({revision:1,money:500n,jokers:[{entityId:'j_caino'}]}),[{type:'hand_played',cardIds:['a']}]);assert.equal(p.career.c_hands_played,0);assert.equal(p.unlocked.includes('j_satellite'),false);assert.equal(p.discovered.includes('j_caino'),false);}
});
test('win requires actual winPending and never the misleading won flag on a losing Boss',()=>{
 let p=api.updateProfile(api.createProfile(),state(),state({revision:1,phase:'game_over',won:true,round:{ante:8,blindId:'boss'},jokers:[{entityId:'j_caino'}]}));assert.equal(p.career.c_wins,0);assert.equal(p.career.c_losses,1);assert.deepEqual(api.legendaryWinIds(p),[]);
});
test('Gold win fills lower deck stakes, records only actual Joker stake and unlocks decks',()=>{
 const n=state({revision:10,stake:8,phase:'round_won',winPending:true,won:true,round:{ante:8,blindId:'boss',handsPlayed:1},jokers:[{entityId:'j_caino'}]});
 let p=api.updateProfile(api.createProfile(),state(),n,[{type:'round_won'}]);assert.equal(p.career.c_wins,1);assert.deepEqual(p.deckWins.red,[1,1,1,1,1,1,1,1]);assert.deepEqual(p.jokerWins.j_caino,[0,0,0,0,0,0,0,1]);assert.ok(api.deckUnlocked(p,'magic'));assert.ok(api.deckUnlocked(p,'erratic'));assert.deepEqual(api.legendaryWinIds(p),['j_caino']);assert.equal(api.updateProfile(p,n,{...n,revision:11,winPending:false}).career.c_wins,1);
});
test('White Legendary victory does not enter Gold seed exclusion',()=>{
 const p=api.updateProfile(api.createProfile(),state(),state({revision:2,phase:'round_won',winPending:true,jokers:[{entityId:'j_perkeo'}]}));assert.deepEqual(api.legendaryWinIds(p),[]);
});
test('career thresholds unlock only when reached',()=>{
 const p=api.createProfile();p.career.c_hands_played=199;const prev=state(),n=state({revision:1});const q=api.updateProfile(p,prev,n,[{type:'hand_played',cardIds:[]}]);assert.ok(q.unlocked.includes('j_acrobat'));assert.ok(api.profileRunContext(q).unlockedCentreIds.includes('j_acrobat'));
});
test('modified deck unlocks use actual physical cards and distinct enhancement conditions',()=>{
 const cards=Object.fromEntries(Array.from({length:30},(_,i)=>['c'+i,{rank:2,suit:'hearts',enhancement:i<3?'wild':undefined}]));
 const p=api.updateProfile(api.createProfile(),state(),state({revision:1,cards}));assert.ok(p.unlocked.includes('j_bloodstone'));assert.ok(p.unlocked.includes('j_smeared'));assert.equal(p.unlocked.includes('j_glass'),false);
});
test('five discarded jacks and royal straight flush trigger their separate unlocks',()=>{
 const cards=Object.fromEntries([10,11,12,13,14].map(n=>['h'+n,{rank:n,suit:'hearts'}]));let p=api.updateProfile(api.createProfile(),state({cards}),state({revision:1,cards}),[{type:'cards_discarded',cardIds:Object.keys(cards)}]);assert.ok(p.unlocked.includes('j_brainstorm'));assert.equal(p.unlocked.includes('j_hit_the_road'),false);
 const jacks=Object.fromEntries(Array.from({length:5},(_,i)=>['j'+i,{rank:11,suit:'hearts'}]));p=api.updateProfile(p,state({revision:1,cards:jacks}),state({revision:2,cards:jacks}),[{type:'cards_discarded',cardIds:Object.keys(jacks)}]);assert.ok(p.unlocked.includes('j_hit_the_road'));
});
test('ownership discovers content whereas visible shop offers do not',()=>{
 const n=state({revision:1,jokers:[{entityId:'j_caino',edition:'negative'}],shop:{main:[{entityId:'j_zany'}]}});const p=api.updateProfile(api.createProfile(),state(),n);assert.ok(p.discovered.includes('j_caino'));assert.ok(p.unlocked.includes('j_caino'));assert.ok(p.discovered.includes('e_negative'));assert.equal(p.discovered.includes('j_zany'),false);
});
test('blank redemption count and current run voucher count are separate unlock sources',()=>{
 let p=api.createProfile();p.usage.vouchers.v_blank=9;const n=state({revision:1,apkShop:{context:{usedVoucherIds:['v_blank']}}});p=api.updateProfile(p,state(),n,[{type:'voucher_redeemed',voucherId:'v_blank',cost:10n}]);assert.ok(p.unlocked.includes('v_antimatter'));assert.equal(p.unlocked.includes('v_liquidation'),false);assert.equal(p.career.c_shop_dollars_spent,10);
});
test('strict profile validator rejects corrupted counters, unknown identities and invalid revisions',()=>{
 for(const mutate of [p=>p.career.c_wins=-1,p=>p.unlocked.push('invented'),p=>p.highScores.hand='NaN',p=>p.runs.r={revision:-1}]){const p=api.createProfile();mutate(p);assert.throws(()=>api.validateProfile(p));}
});
test('round start counts attempts but blind discovery requires a win',()=>{
 const n=state({revision:1,phase:'playing'});let p=api.updateProfile(api.createProfile(),state(),n,[{type:'round_started'}]);assert.equal(p.career.c_rounds,1);assert.equal(p.discovered.includes('bl_small'),false);
 p=api.updateProfile(p,n,state({revision:2,phase:'round_won'}),[{type:'round_won'}]);assert.equal(p.career.c_rounds,1);assert.ok(p.discovered.includes('bl_small'));
});
test('unlocking a back also discovers it and ordinary Joker discovers base edition',()=>{
 const p=api.updateProfile(api.createProfile(),state(),state({revision:1,phase:'round_won',winPending:true,jokers:[{entityId:'j_joker'}]}));assert.ok(p.discovered.includes('b_magic'));assert.ok(p.discovered.includes('e_base'));assert.equal(api.collectionEntries(p).filter(e=>e.set==='Edition').length,5);
});
test('explicit continuation unlock is idempotent on an unchanged run revision',()=>{
 const n=state();const p=api.updateProfile(api.createProfile(),null,n);assert.equal(p.unlocked.includes('j_throwback'),false);const q=api.updateProfile(p,n,n,[],{continued:true});assert.ok(q.unlocked.includes('j_throwback'));assert.equal(q.usage.decks.red,1);assert.deepEqual(api.updateProfile(q,n,n,[],{continued:true}),q);
});
test('profile tracks most played hands and boss streak across successive boss wins',()=>{
 const n=state({revision:1,lastScore:{handId:'pair',score:20n},round:{ante:2,blindId:'boss',handsPlayed:1},apkBlinds:{bossId:'bl_hook'}});let p=api.updateProfile(api.createProfile(),state(),n,[{type:'hand_played',cardIds:[]},{type:'round_won'}]);assert.equal(p.usage.hands.pair,1);assert.equal(p.highScores.bossStreak,1);
 p=api.updateProfile(p,n,state({revision:2,round:{ante:3,blindId:'boss',handsPlayed:1}}),[{type:'round_won'}]);assert.equal(p.highScores.bossStreak,2);
});

test('per-run discovery count survives profile reload and does not repeat',()=>{
 let p=api.createProfile();const n=state({revision:1,jokers:[{entityId:'j_joker'}]});
 const before=p.discovered.length;p=api.updateProfile(p,null,n);
 assert.equal(p.runs[n.runId].discoveries,p.discovered.length-before);
 const restored=JSON.parse(JSON.stringify(p));assert.deepEqual(api.validateProfile(restored),p);
 assert.equal(api.updateProfile(restored,n,n).runs[n.runId].discoveries,p.runs[n.runId].discoveries);
});
