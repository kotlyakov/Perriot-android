import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {getJokerCashoutBonuses} from '../../src/core/joker-cashout.js';

const joker=(id,entityId,extra={})=>({id,entityId,...extra});
const card=(id,rank,extra={})=>({id,rank,suit:'hearts',...extra});
const state=(jokers=[],cards=[])=>({jokers,cards:Object.fromEntries(cards.map(c=>[c.id,c])),money:4n,hand:[],drawPile:[],discardPile:[]});

test('Golden Joker returns exactly four dollars for each owned active copy',()=>{
 const s=state([joker('first','j_golden'),joker('second','j_golden')]);
 assert.deepEqual(getJokerCashoutBonuses(s),[
  {sourceId:'first',entityId:'j_golden',amount:4n},
  {sourceId:'second',entityId:'j_golden',amount:4n}
 ]);
});

test('Cloud 9 counts actual rank-nine playing cards across all piles, including debuffs',()=>{
 const s=state([joker('cloud','j_cloud_9')],[
  card('held',9),card('drawn',9,{enhancement:'wild'}),card('discarded',9,{debuffed:true}),
  card('unlisted',9,{enhancement:'steel'}),card('stone',9,{enhancement:'stone'}),card('eight',8)
 ]);
 s.hand=['held'];s.drawPile=['drawn','stone'];s.discardPile=['discarded','eight','destroyed-nine'];
 assert.deepEqual(getJokerCashoutBonuses(s),[{sourceId:'cloud',entityId:'j_cloud_9',amount:4n}]);
 delete s.cards.held;
 assert.deepEqual(getJokerCashoutBonuses(s),[{sourceId:'cloud',entityId:'j_cloud_9',amount:3n}]);
});

test('cashout bonuses omit zero Cloud 9, unrelated Jokers and debuffed Jokers',()=>{
 assert.deepEqual(getJokerCashoutBonuses(state()),[]);
 assert.deepEqual(getJokerCashoutBonuses(state([joker('cloud','j_cloud_9')],[card('stone',9,{enhancement:'stone'}),card('ten',10)])),[]);
 assert.deepEqual(getJokerCashoutBonuses(state([
  joker('gold','j_golden',{debuffed:true}),joker('cloud','j_cloud_9',{debuffed:true}),joker('other','j_bull')
 ],[card('nine',9)])),[]);
 assert.deepEqual(getJokerCashoutBonuses(state([joker('cloud','j_cloud_9')],[card('nine',9)])),[
  {sourceId:'cloud',entityId:'j_cloud_9',amount:1n}
 ]);
});

test('cashout rows retain inventory order and copy multiplicity',()=>{
 const s=state([joker('c1','j_cloud_9'),joker('g1','j_golden'),joker('other','j_joker'),joker('c2','j_cloud_9'),joker('g2','j_golden',{debuffed:true})],[card('nine',9)]);
 assert.deepEqual(getJokerCashoutBonuses(s),[
  {sourceId:'c1',entityId:'j_cloud_9',amount:1n},
  {sourceId:'g1',entityId:'j_golden',amount:4n},
  {sourceId:'c2',entityId:'j_cloud_9',amount:1n}
 ]);
 s.jokers.reverse();
 assert.deepEqual(getJokerCashoutBonuses(s).map(row=>row.sourceId),['c2','g1','c1']);
});

test('bonus quotation is immutable and never credits balance before interest',()=>{
 for(const money of [-1n,0n,4n,5n,24n,25n,10n**100n]){
  const s=state([joker('gold','j_golden'),joker('cloud','j_cloud_9')],[card('nine',9)]);s.money=money;
  const before=structuredClone(s);
  Object.freeze(s.jokers);Object.freeze(s.cards);Object.freeze(s);
  const first=getJokerCashoutBonuses(s);
  assert.deepEqual(first,[{sourceId:'gold',entityId:'j_golden',amount:4n},{sourceId:'cloud',entityId:'j_cloud_9',amount:1n}]);
  assert.deepEqual(s,before);
  first[0].amount=999n;first.reverse();
  assert.deepEqual(getJokerCashoutBonuses(s),[{sourceId:'gold',entityId:'j_golden',amount:4n},{sourceId:'cloud',entityId:'j_cloud_9',amount:1n}]);
  assert.equal(s.money,money);
 }
});

const lua=process.env.LUAJIT_BIN??'/workspace/scratch/669d7c37bc9d/private-apk-research/LuaJIT-43d0a19158ceabaa51b0462c1ebc97612b420a2e/src/luajit';
const source=process.env.NATIVE_APK_ASSETS?`${process.env.NATIVE_APK_ASSETS}/card.lua`:fileURLToPath(new URL('../../../reference-apk/assets/card.lua',import.meta.url));
test('cashout helper agrees with native APK tally, get_id and calculate_dollar_bonus methods',{
 skip:!existsSync(lua)||!existsSync(source)?'Private APK source and verified LuaJIT required for native oracle':false
},()=>{
 const native=readFileSync(source,'utf8').replaceAll('\r\n','\n');
 const refresh=native.match(/if self\.ability\.name == "Cloud 9" then[\s\S]*?(?=\n        if self\.ability\.name == "Stone Joker")/)?.[0];
 assert.ok(refresh,'native Cloud 9 tally block exists');
 const cases=[];
 for(const count of [0,1,2,52])for(const debuffed of [false,true])for(const entityId of ['j_golden','j_cloud_9']){
  const cards=Array.from({length:count},(_,i)=>card('nine'+i,9,{debuffed:i%2===0}));
  cards.push(card('stone',9,{enhancement:'stone'}),card('ten',10));
  cases.push(state([joker('joker',entityId,{debuffed})],cards));
 }
 const script='Moveable={extend=function() return {} end}\n'+native+'\nfunction refresh(self)\n'+refresh+'\nend\n'+cases.map(s=>{
  const j=s.jokers[0];
  const cards=Object.values(s.cards).map(c=>`setmetatable({base={id=${c.rank}},ability={effect=${JSON.stringify(c.enhancement==='stone'?'Stone Card':'')}},debuff=${!!c.debuffed}},{__index=Card})`).join(',');
  return `G={playing_cards={${cards}}}; local j=setmetatable({debuff=${!!j.debuffed},ability={set="Joker",name=${JSON.stringify(j.entityId==='j_golden'?'Golden Joker':'Cloud 9')},extra=${j.entityId==='j_golden'?4:1}}},{__index=Card});refresh(j);print(j:calculate_dollar_bonus() or 0)`;
 }).join('\n');
 const result=spawnSync(lua,['-'],{input:script,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const expected=result.stdout.trim().split('\n').map(value=>BigInt(value));
 assert.equal(expected.length,cases.length);
 for(const [i,s] of cases.entries())assert.equal(getJokerCashoutBonuses(s).reduce((sum,row)=>sum+row.amount,0n),expected[i],'native case '+i);
});
