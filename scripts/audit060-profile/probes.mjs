import {createProfile,updateProfile} from '../../src/core/profile.js';
const base=(fields={})=>({runId:'profile-audit060',revision:0,deckId:'red',phase:'blind_selection',money:4n,round:{ante:1,blindId:'small',handSize:8,handsPlayed:0},jokers:[],cards:{},...fields});
const out=[];
// Native state_events.lua:342/346 resets current_boss_streak when entering Small/Big.
let p=createProfile(),s=base();p=updateProfile(p,null,s);
for(const [revision,blindId,event,ante] of [[1,'boss','round_won',1],[2,'small','round_started',2],[3,'small','round_won',2],[4,'big','round_started',2],[5,'big','round_won',2],[6,'boss','round_started',2],[7,'boss','round_won',2]]){const n=base({revision,round:{...s.round,blindId,ante,handsPlayed:1}});p=updateProfile(p,s,n,[{type:event}]);s=n;}
out.push({id:'PROFILE-01',input:'win boss; enter/play next small; win next boss',expected:{bestBossStreak:1},actual:{bestBossStreak:p.highScores.bossStreak}});
// Native common_events.lua:1581 starts min=10, only decreases it; JQKA is sufficient with Four Fingers.
const cards=Object.fromEntries([11,12,13,14].map(rank=>['r'+rank,{id:'r'+rank,rank,suit:'hearts'}]));
s=base({cards,jokers:[{id:'four',entityId:'j_four_fingers'}]});p=updateProfile(createProfile(),s,{...s,revision:1},[{type:'cards_discarded',cardIds:Object.keys(cards)}]);
out.push({id:'PROFILE-02',input:'discard JQKA hearts with Four Fingers',expected:{brainstormUnlocked:true},actual:{brainstormUnlocked:p.unlocked.includes('j_brainstorm')}});
// Native common_events.lua:1501 requires discards_left == round_resets.discards; The Water removes initial discards.
s=base({phase:'playing',cards:{king:{id:'king',rank:13,suit:'hearts'}},hand:['king'],round:{ante:2,blindId:'boss',handSize:8,handsPlayed:0,discardsRemaining:0,discardsUsed:0},bossState:{id:'bl_water',disabled:false},apkBlinds:{bossId:'bl_water'}});
const n={...s,revision:1,phase:'round_won',round:{...s.round,handsPlayed:1},lastScore:{handId:'high_card',score:10000n}};
p=updateProfile(createProfile(),s,n,[{type:'hand_played',cardIds:['king']},{type:'round_won'}]);
out.push({id:'PROFILE-03',input:'win The Water in one hand with zero initial discards (base discards 4)',expected:{matadorUnlocked:false},actual:{matadorUnlocked:p.unlocked.includes('j_matador')}});
console.log(JSON.stringify(out,null,2));
