import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {createRun} from '../../src/core/run.js';
import {scoreHand} from '../../src/core/score.js';
const template=createRun('AUDIT060_MODIFIERS',{runId:'audit060-modifiers',money:20n,referenceRng:true,referenceShop:true});
const rows=[];
function score(extra={},jokers=[],held=[],boss){const s=structuredClone(template),card={id:'card_spades_2',rank:2,suit:'spades',...extra};s.cards={[card.id]:card,...Object.fromEntries(held.map(c=>[c.id,c]))};s.hand=[card.id,...held.map(c=>c.id)];s.drawPile=[];s.discardPile=[];s.jokers=jokers;s.round.handsPlayed=1;if(boss)s.bossState=boss;else delete s.bossState;return scoreHand(s,[card]);}
const oops=Array.from({length:4},(_,i)=>({id:'oops'+i,entityId:'j_oops'}));
for(const [enhancement,expected]of Object.entries({base:7,bonus:37,mult:35,lucky:147,wild:7,steel:7,glass:14,stone:55,gold:7})){
 for(const [bossMode,boss]of [['none',undefined],['active',{id:'bl_goad'}],['disabled',{id:'bl_goad',disabled:true}]]){
  const actual=score({enhancement},oops,[],boss);const want=bossMode==='active'&&enhancement!=='stone'?5:expected;
  assert.equal(actual.score,BigInt(want),enhancement+' '+bossMode);rows.push({kind:'enhancement',enhancement,bossMode,expected:want,actual:Number(actual.score)});
 }
}
for(const [edition,expected]of Object.entries({base:7,foil:57,holographic:77,polychrome:10})){
 for(const disabled of [false,true]){const r=score({edition},[],[],{id:'bl_goad',disabled});assert.equal(r.score,BigInt(disabled?expected:5));rows.push({kind:'edition',edition,disabled,expected:disabled?expected:5,actual:Number(r.score)});}
}
for(const [seal,expected,money]of [['red',9,0],['gold',7,3],['blue',7,0],['purple',7,0]]){
 const r=score({seal});assert.equal(r.score,BigInt(expected));const dollars=r.trace.filter(e=>e.type==='score_money').reduce((sum,e)=>sum+e.amount,0n);assert.equal(dollars,BigInt(money));rows.push({kind:'seal-scoring',seal,expected,actual:Number(r.score),money:Number(dollars)});
}
const held=[{id:'card_hearts_13',rank:13,suit:'hearts',enhancement:'steel',seal:'red'}];
assert.equal(score({},[],held).score,15n);rows.push({kind:'held-Red-Steel',expected:15,actual:15});
const hiker=score({},[{id:'hiker',entityId:'j_hiker'},{id:'chad',entityId:'j_hanging_chad'}]);assert.equal(hiker.score,26n);assert.equal(hiker.item7State.cards.card_spades_2.permaBonus,15);rows.push({kind:'Hiker-Chad',expected:26,actual:Number(hiker.score),permaBonus:15});
mkdirSync('artifacts/audit060-score',{recursive:true});writeFileSync('artifacts/audit060-score/modifier-arithmetic.json',JSON.stringify({limits:'Independent fixed numeric expectations from native contracts; not a whole-loop native execution. Gold/Blue/Purple held/endround/discard lifecycles delegated.',count:rows.length,rows},null,2)+'\n');console.log({passed:rows.length});
