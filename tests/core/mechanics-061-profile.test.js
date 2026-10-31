import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfile,updateProfile,validateProfile} from '../../src/core/profile.js';
const base=(fields={})=>({runId:'profile061',revision:0,deckId:'red',phase:'playing',money:4n,round:{ante:2,blindId:'boss',handSize:8,handsPlayed:0,discardsRemaining:4,discardsUsed:0},jokers:[],cards:{},...fields});
const reload=p=>validateProfile(JSON.parse(JSON.stringify(p)));
function discard(ranks,jokers=[],context={}){const cards=Object.fromEntries(ranks.map(rank=>['r'+rank,{id:'r'+rank,rank,suit:'hearts'}]));const s=base({cards,jokers});return updateProfile(createProfile(),s,{...s,revision:1},[{type:'cards_discarded',cardIds:Object.keys(cards)}],context);}
test('Brainstorm accepts Four Fingers JQKA but still requires a royal straight flush',()=>{
 assert.ok(discard([11,12,13,14],[{entityId:'j_four_fingers'}]).unlocked.includes('j_brainstorm'));
 assert.equal(discard([11,12,13,14]).unlocked.includes('j_brainstorm'),false);
 assert.equal(discard([9,10,11,12,13],[{entityId:'j_four_fingers'}]).unlocked.includes('j_brainstorm'),false);
 for(const context of [{seeded:true},{challenge:true}])assert.equal(discard([10,11,12,13,14],[],context).unlocked.includes('j_brainstorm'),false);
});
function win(fields={},remaining=4,context={},profile=createProfile()){
 const s=base(fields),n={...s,revision:1,phase:'round_won',round:{...s.round,handsPlayed:1,discardsRemaining:remaining}};
 return updateProfile(profile,s,n,[{type:'round_won'}],context);
}
test('Matador compares untouched reset allowance rather than absence of voluntary discards',()=>{
 for(const id of ['bl_water','bl_hook'])assert.equal(win({bossState:{id,disabled:false}},0).unlocked.includes('j_matador'),false);
 assert.ok(win({bossState:{id:'bl_water',disabled:true}},4).unlocked.includes('j_matador'));
 assert.equal(win({jokers:[{entityId:'j_burglar'}]},0).unlocked.includes('j_matador'),false);
 for(const [fields,allowance] of [[{},4],[{deckId:'blue'},3],[{stake:5},3],[{apkShop:{context:{usedVoucherIds:['v_wasteful','v_recyclomancy','v_petroglyph']}}},5],[{jokers:[{entityId:'j_drunkard',edition:'negative'},{entityId:'j_merry_andy'}]},8],[{jokers:[{entityId:'j_drunkard',debuffed:true}]},4],[{jokers:[{entityId:'j_burglar',debuffed:true}]},4],[{jokers:[{entityId:'j_drunkard',perishable:true,perishTally:0,debuffed:true}]},4],[{stake:5,deckId:'blue',apkShop:{context:{usedVoucherIds:['v_petroglyph']}},jokers:[{entityId:'j_drunkard',eternal:true,rental:true}]},2]]){
  assert.ok(win(fields,allowance).unlocked.includes('j_matador'));
  assert.equal(win(fields,allowance-1).unlocked.includes('j_matador'),false);
 }
 for(const context of [{seeded:true},{challenge:true}])assert.equal(win({},4,context).unlocked.includes('j_matador'),false);
 const p=createProfile();p.unlocked.push('j_matador');assert.ok(win({},0,{},reload(p)).unlocked.includes('j_matador'));
});
function step(p,s,blindId,event){const n={...s,revision:s.revision+1,round:{...s.round,blindId,handsPlayed:1}};return [updateProfile(p,s,n,[{type:event}]),n];}
test('normal blind starts reset current boss streak; skips preserve it, historical records survive reload and retries',()=>{
 let s=base(),p=updateProfile(createProfile(),null,s);
 [p,s]=step(p,s,'boss','round_won');
 [p,s]=step(reload(p),s,'small','round_started');assert.equal(p.runs[s.runId].bossStreak,0);
 [p,s]=step(p,s,'small','round_won');[p,s]=step(p,s,'big','round_started');[p,s]=step(p,s,'big','round_won');[p,s]=step(p,s,'boss','round_won');assert.equal(p.highScores.bossStreak,1);
 [p,s]=step(p,s,'small','blind_skipped');[p,s]=step(p,s,'big','blind_skipped');[p,s]=step(p,s,'boss','round_won');assert.equal(p.highScores.bossStreak,2);
 assert.deepEqual(updateProfile(reload(p),s,s,[{type:'round_won'}]),p);
 p.highScores.bossStreak=99;[p,s]=step(reload(p),s,'big','round_started');assert.equal(p.highScores.bossStreak,99);assert.equal(p.runs[s.runId].bossStreak,0);
 for(const context of [{seeded:true},{challenge:true}]){let excluded=updateProfile(createProfile(),null,base(),[],context);excluded=updateProfile(excluded,base(),base({revision:1}),[{type:'round_won'}]);assert.equal(excluded.highScores.bossStreak,0);}
});

test('unlock progress survives JSON reload and duplicate revisions without mutation',()=>{
 const s=base(),n={...s,revision:1,round:{...s.round,handsPlayed:1}};const input=createProfile(),before=structuredClone(input);
 const p=updateProfile(input,s,n,[{type:'round_won'}]);assert.deepEqual(input,before);assert.ok(reload(p).unlocked.includes('j_matador'));
 assert.deepEqual(updateProfile(reload(p),s,n,[{type:'round_won'}]),p);
 const brainstorm=discard([11,12,13,14],[{entityId:'j_four_fingers'}]);assert.ok(reload(brainstorm).unlocked.includes('j_brainstorm'));
});
