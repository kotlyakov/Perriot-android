import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfile,updateProfile,collectionEntries,deckUnlocked} from '../../src/core/profile.js';
const state=(fields={})=>({runId:'rules',revision:0,deckId:'red',phase:'blind_selection',money:4n,round:{ante:1,blindId:'small',handSize:8,handsPlayed:0},jokers:[],cards:{},...fields});
// Explicit factual thresholds from APK game.lua483–643, independent of exported rule data.
for(const [id,key,threshold] of [
 ['j_mr_bones','c_losses',5],['j_acrobat','c_hands_played',200],['j_sock_and_buskin','c_face_cards_played',300],['j_swashbuckler','c_jokers_sold',20],['j_burnt','c_cards_sold',50],
 ['v_overstock_plus','c_shop_dollars_spent',2500],['v_reroll_glut','c_shop_rerolls',100],['v_omen_globe','c_tarot_reading_used',25],['v_observatory','c_planetarium_used',25],['v_nacho_tong','c_cards_played',2500],['v_recyclomancy','c_cards_discarded',2500],['v_tarot_tycoon','c_tarots_bought',50],['v_planet_tycoon','c_planets_bought',50],['v_illusion','c_playing_cards_bought',20],
])test('native career threshold '+id,()=>{for(const delta of [-1,0]){const p=createProfile();p.career[key]=threshold+delta;const q=updateProfile(p,state(),state({revision:1}));assert.equal(q.unlocked.includes(id),delta===0);}});
for(const [id,threshold] of [['blue',20],['yellow',50],['green',75],['black',100]])test('native discovery deck threshold '+id,()=>{
 for(const delta of [-1,0]){const p=createProfile();const lower=['blue','yellow','green','black'].filter(x=>({blue:20,yellow:50,green:75,black:100})[x]<threshold);p.unlocked.push(...lower.map(id=>'b_'+id));const prefix=['b_red','j_joker',...lower.map(id=>'b_'+id)];const valid=collectionEntries(p).filter(e=>!['Enhanced','Seal'].includes(e.set));p.discovered=[...prefix,...valid.map(e=>e.id).filter(id=>!prefix.includes(id))].slice(0,threshold+delta);const q=updateProfile(p,state(),state({revision:1}));assert.equal(deckUnlocked(q,id),delta===0);}
});
for(const [won,unlocked] of [['red','magic'],['blue','nebula'],['yellow','ghost'],['green','abandoned'],['black','checkered']])test('native deck victory unlock '+unlocked,()=>{
 const p=createProfile();p.deckWins[won]=[1,0,0,0,0,0,0,0];const q=updateProfile(p,state(),state({revision:1}));assert.ok(deckUnlocked(q,unlocked));
});
for(const [id,stake] of [['zodiac',2],['painted',3],['anaglyph',4],['plasma',5],['erratic',7]])test('native stake deck threshold '+id,()=>{
 for(const delta of [-1,0]){const p=createProfile();p.deckWins.red=Array(8).fill(0);p.deckWins.red[stake+delta-1]=1;const q=updateProfile(p,state(),state({revision:1}));assert.equal(deckUnlocked(q,id),delta===0);}
});
test('Arcana completion counts one used pack, opening and skipping count zero',()=>{
 const start=state(),opened=state({revision:1,phase:'pack',packState:{sourceEntityId:'p_arcana_mega_1'}});let p=updateProfile(createProfile(),start,opened,[{type:'booster_opened',entityId:'p_arcana_mega_1'}]);assert.equal(p.career.c_tarot_reading_used,0);
 const chosen=state({revision:2,phase:'pack',packState:opened.packState});p=updateProfile(p,opened,chosen,[{type:'pack_card_used',entityId:'c_fool'}]);assert.equal(p.career.c_tarot_reading_used,0);
 p=updateProfile(p,chosen,state({revision:3}),[{type:'pack_card_used',entityId:'c_fool'},{type:'booster_closed'}]);assert.equal(p.career.c_tarot_reading_used,1);
});
test('seeded usage counters persist without career progress; challenge high scores follow native exclusion split',()=>{
 for(const context of [{seeded:true},{challenge:true}]){let p=updateProfile(createProfile(),null,state(),[],context);p=updateProfile(p,state(),state({revision:1,lastScore:{handId:'pair',score:100n}}),[{type:'hand_played',cardIds:[]}]);assert.equal(p.career.c_hands_played,0);assert.equal(p.usage.hands.pair,1);assert.equal(p.highScores.hand,context.seeded?'0':'100');}
});
test('actual entered rounds govern speed-win unlock instead of skipped blind slot index',()=>{
 let p=updateProfile(createProfile(),null,state());for(let i=1;i<=12;i++)p=updateProfile(p,state({revision:i-1}),state({revision:i}),[{type:'round_started'}]);
 const q=updateProfile(p,state({revision:12}),state({revision:13,roundNumber:24,phase:'round_won',winPending:true}),[{type:'round_won'}]);assert.ok(q.unlocked.includes('j_merry_andy'));assert.equal(q.highScores.furthestRound,12);
});
test('deck and Joker losses record actual stake without a victory or lower stake synthesis',()=>{
 const p=updateProfile(createProfile(),state(),state({revision:1,stake:3,phase:'game_over',jokers:[{entityId:'j_joker'}]}));assert.deepEqual(p.deckLosses.red,[0,0,1,0,0,0,0,0]);assert.deepEqual(p.jokerLosses.j_joker,[0,0,1,0,0,0,0,0]);assert.equal(p.career.c_wins,0);
});
test('Hook forced discards contribute to native career card-discard total',()=>{
 const p=updateProfile(createProfile(),state(),state({revision:1}),[{type:'cards_forced_discarded',cardIds:['a','b']}]);assert.equal(p.career.c_cards_discarded,2);
});

for(const [source,key,unlock] of [['p_arcana_mega_1','c_tarot_reading_used','v_omen_globe'],['p_celestial_mega_1','c_planetarium_used','v_observatory']]){
 for(const firstType of ['pack_card_taken','pack_card_used'])for(const finalType of ['pack_card_taken','pack_card_used'])test(`${source} completion ${firstType}/${finalType} counts once and unlocks`,()=>{
  let p=createProfile();p.career[key]=24;
  const before=state({phase:'pack',packState:{sourceEntityId:source}}),middle=state({revision:1,phase:'pack',packState:before.packState}),after=state({revision:2});
  p=updateProfile(p,before,middle,[{type:firstType,entityId:'c_fool'}]);assert.equal(p.career[key],24);
  const events=[{type:finalType,entityId:'c_fool'},{type:'booster_closed'}];p=updateProfile(p,middle,after,events);
  assert.equal(p.career[key],25);assert.ok(p.unlocked.includes(unlock));
  assert.equal(updateProfile(p,middle,after,events).career[key],25);
 });
}

test('skipped and excluded pack completions do not advance career unlocks',()=>{
 for(const context of [{},{seeded:true},{challenge:true}]){
  const before=state({phase:'pack',packState:{sourceEntityId:'p_arcana_mega_1'}}),after=state({revision:1});
  const initial=updateProfile(createProfile(),null,before,[],context);
  const events=context.seeded||context.challenge?[{type:'pack_card_taken',entityId:'c_fool'},{type:'booster_closed'}]:[{type:'booster_closed'}];
  const p=updateProfile(initial,before,after,events);assert.equal(p.career.c_tarot_reading_used,0);
 }
});
