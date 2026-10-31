import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {APK_BOSSES} from '../../src/content/apk-blinds.js';
import {createRun} from '../../src/core/run.js';
import {scoreHand} from '../../src/core/score.js';
import {initializeItem7Joker} from '../../src/core/joker-item7-lifecycle.js';
const template=createRun('AUDIT060_MATRIX',{runId:'audit060-matrix',money:20n,referenceRng:true,referenceShop:true});
const c=(suit,rank,extra={})=>({id:`card_${suit}_${rank}`,rank,suit,...extra});
const played=[c('clubs',2),c('diamonds',4),c('hearts',6),c('spades',12),c('hearts',13)];
const held=[c('clubs',13,{enhancement:'steel'}),c('diamonds',12,{seal:'red'})];
function stateFor(key,boss,disabled=false){
 const s=structuredClone(template);s.hand=[...played,...held].map(c=>c.id);for(const card of [...played,...held])s.cards[card.id]=structuredClone(card);
 s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));s.discardPile=[];
 s.round.handsRemaining=1;s.round.discardsRemaining=0;s.round.handsPlayed=1;
 s.round.ancientSuit='hearts';s.round.idolCard={rank:13,suit:'hearts'};
 s.jokers=[{id:'audit-joker',entityId:key,sellCost:3n,cost:6n,creationOrdinal:1}];initializeItem7Joker(s,s.jokers[0]);
 s.consumables=[{id:'planet1',entityId:'c_pluto',set:'Planet',edition:'base'},{id:'planet2',entityId:'c_mercury',set:'Planet',edition:'base'}];
 if(boss)s.bossState={id:boss,disabled,oxHand:'high_card',playedBeforeBoss:[played[4].id],playedHands:['high_card'],firstHand:'pair'};else delete s.bossState;
 return s;
}
const numeric=x=>JSON.stringify({chips:x.chips,mult:x.mult,score:x.score},(_,v)=>typeof v==='bigint'?v.toString():v);
const rows=[];let scoringCalls=0;
for(const {key} of catalogue.centres.filter(c=>c.set==='Joker')){
 const baseline=scoreHand(stateFor(key),played);scoringCalls++;
 for(const {id} of APK_BOSSES){
  const live=scoreHand(stateFor(key,id),played);scoringCalls++;
  const disabled=scoreHand(stateFor(key,id,true),played);scoringCalls++;
  assert.equal(numeric(disabled),numeric(baseline),key+' disabled '+id);
  assert.ok(live.score>=0n,key+' negative '+id);
  rows.push({joker:key,boss:id,baselineScore:String(baseline.score),activeScore:String(live.score),disabledScore:String(disabled.score),disabledEqualsBaseline:true,claim:'smoke + disabled-boss numeric metamorphic check; active result not a native oracle'});
 }
}
const result={scope:'All150 catalogue Jokers; active/disabled bosses with played+held fixture. It does not assert every active-boss output is correct, exercise each Joker positive branch, or execute boss-start/sale lifecycle.',jokers:150,bosses:APK_BOSSES.length,pairs:rows.length,scoringCalls,rows};
mkdirSync('artifacts/audit060-score',{recursive:true});writeFileSync('artifacts/audit060-score/boss-matrix-150.json',JSON.stringify(result,null,2)+'\n');console.log({jokers:150,bosses:APK_BOSSES.length,pairs:rows.length,scoringCalls});
