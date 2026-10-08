import { HANDS } from '../content/hands.js';
import { SUPPORTED_JOKERS } from '../content/jokers.js';
import { evaluateHand } from '../core/hands.js';
import { randomInt } from '../core/rng.js';
import { scoreHand } from '../core/score.js';

const LIMIT=2*1024*1024;
const PHASES=['blind_selection','playing','round_won','game_over','shop'];
function requireValue(condition) { if (!condition) throw new TypeError('Invalid save data'); }
function object(value,keys) {
  requireValue(value!==null && typeof value==='object' && !Array.isArray(value));
  requireValue(Object.keys(value).length===keys.length && keys.every(key=>Object.hasOwn(value,key)));
}
function integer(value,min=0,max=Number.MAX_SAFE_INTEGER) { requireValue(Number.isSafeInteger(value) && value>=min && value<=max); }
function id(value) { requireValue(typeof value==='string' && value.length>0 && value.length<=120 && !['__proto__','prototype','constructor'].includes(value)); }
function decimal(value,negative=false) {
  requireValue(typeof value==='string' && value.length<=4096 && /^(0|-?[1-9][0-9]*)$/.test(value));
  const n=BigInt(value);requireValue(negative || n>=0n);return n;
}
function pair(value) { object(value,['chips','mult']);return {chips:decimal(value.chips),mult:decimal(value.mult)}; }
function encodeScore(score) {
  if(score===null)return null;
  return {...score,chips:score.chips.toString(),mult:score.mult.toString(),score:score.score.toString(),trace:score.trace.map(event=>event.type==='score_total'
    ? {...event,chips:event.chips.toString(),mult:event.mult.toString(),score:event.score.toString()}
    : {...event,before:{chips:event.before.chips.toString(),mult:event.before.mult.toString()},after:{chips:event.after.chips.toString(),mult:event.after.mult.toString()}})};
}
function decodeScore(value,state) {
  if(value===null)return null;
  object(value,['handId','isRoyal','scoringCardIds','chips','mult','score','trace']);
  requireValue(Object.hasOwn(HANDS,value.handId) && typeof value.isRoyal==='boolean');
  requireValue(!value.isRoyal || value.handId==='straight_flush');
  requireValue(Array.isArray(value.scoringCardIds) && value.scoringCardIds.length>=1 && value.scoringCardIds.length<=5);
  requireValue(new Set(value.scoringCardIds).size===value.scoringCardIds.length && value.scoringCardIds.every(key=>Object.hasOwn(state.cards,key)));
  const chips=decimal(value.chips),mult=decimal(value.mult),score=decimal(value.score);
  requireValue(score===chips*mult && Array.isArray(value.trace) && value.trace.length>=3 && value.trace.length<=100);
  let previous={chips:0n,mult:0n};
  const trace=value.trace.map((event,i)=>{
    if(i===value.trace.length-1) {
      object(event,['type','phase','chips','mult','score']);
      requireValue(event.type==='score_total' && event.phase==='total');
      const total={...event,chips:decimal(event.chips),mult:decimal(event.mult),score:decimal(event.score)};
      requireValue(total.chips===chips && total.mult===mult && total.score===score && previous.chips===chips && previous.mult===mult);
      return total;
    }
    object(event,['type','phase','sourceId','operation','before','after']);
    const before=pair(event.before),after=pair(event.after);
    requireValue(event.type==='score_step' && before.chips===previous.chips && before.mult===previous.mult);
    if(i===0) requireValue(event.phase==='base' && event.operation==='base' && event.sourceId===`hand:${value.handId}`);
    else {
      requireValue(['add_chips','add_mult'].includes(event.operation));
      requireValue(event.operation==='add_chips' ? after.chips>=before.chips && after.mult===before.mult : after.mult>=before.mult && after.chips===before.chips);
      requireValue(event.phase==='scored_card' ? value.scoringCardIds.includes(event.sourceId) : event.phase==='independent' && state.jokers.some(j=>j.id===event.sourceId));
    }
    previous=after;return {...event,before,after};
  });
  const expected=scoreHand(state,value.scoringCardIds.map(key=>state.cards[key]));
  requireValue(expected.handId===value.handId && expected.isRoyal===value.isRoyal && expected.chips===chips && expected.mult===mult && expected.score===score);
  requireValue(expected.scoringCardIds.length===value.scoringCardIds.length && expected.scoringCardIds.every((key,i)=>key===value.scoringCardIds[i]));
  requireValue(expected.trace.length===trace.length && expected.trace.every((event,i)=>{
    const actual=trace[i];
    return event.phase===actual.phase && (event.type==='score_total' || event.sourceId===actual.sourceId && event.operation===actual.operation && event.before.chips===actual.before.chips && event.before.mult===actual.before.mult && event.after.chips===actual.after.chips && event.after.mult===actual.after.mult);
  }));
  return {...value,chips,mult,score,trace};
}
function decode(payload) {
  object(payload,['format','version','state']);requireValue(payload.format==='card-cascade-save' && payload.version===1);
  const state=payload.state;
  const sortMode=state.sortMode;
  if(Object.hasOwn(state,'sortMode')){requireValue(['rank','suit'].includes(sortMode));delete state.sortMode;}
  object(state,['schemaVersion','runId','seed','revision','phase','deckId','cards','hand','drawPile','discardPile','jokers','handLevels','discoveredHands','rng','money','round','lastScore']);
  requireValue(state.schemaVersion===1 && PHASES.includes(state.phase) && ['red','blue'].includes(state.deckId));
  requireValue(typeof state.runId==='string' && state.runId.length>=1 && state.runId.length<=120);
  requireValue(typeof state.seed==='string' && state.seed.length>=1 && state.seed.length<=1000);integer(state.revision);
  requireValue(state.cards!==null && typeof state.cards==='object' && !Array.isArray(state.cards));
  const cardIds=Object.keys(state.cards);requireValue(cardIds.length>=1 && cardIds.length<=10000);
  for(const key of cardIds) { id(key);object(state.cards[key],['id','rank','suit']);requireValue(state.cards[key].id===key);evaluateHand([state.cards[key]]); }
  const partitions=[state.hand,state.drawPile,state.discardPile];requireValue(partitions.every(Array.isArray));
  const all=partitions.flat();requireValue(all.length===cardIds.length && new Set(all).size===all.length && all.every(key=>Object.hasOwn(state.cards,key)));
  requireValue(Array.isArray(state.jokers) && state.jokers.length<=5);
  const jokerIds=new Set(cardIds);
  for(const joker of state.jokers) {
    object(joker,['id','entityId']);id(joker.id);requireValue(!jokerIds.has(joker.id) && SUPPORTED_JOKERS.includes(joker.entityId));jokerIds.add(joker.id);
  }
  object(state.handLevels,Object.keys(HANDS));for(const level of Object.values(state.handLevels))integer(level,1);
  requireValue(Array.isArray(state.discoveredHands) && new Set(state.discoveredHands).size===state.discoveredHands.length && state.discoveredHands.every(key=>Object.hasOwn(HANDS,key)));
  object(state.rng,['deck','effects']);
  for(const rng of Object.values(state.rng)) { object(rng,['algorithm','state']);randomInt(rng,1); }
  state.money=decimal(state.money,true);
  object(state.round,['blindId','ante','target','score','handsRemaining','discardsRemaining','handSize']);
  const round=state.round;requireValue(round.blindId==='small');integer(round.ante,1,8);integer(round.handsRemaining,0,state.deckId==='blue'?5:4);integer(round.discardsRemaining,0,state.deckId==='red'?4:3);integer(round.handSize,1,10000);
  round.target=decimal(round.target);round.score=decimal(round.score);requireValue(round.target>0n);
  if(state.phase==='round_won')requireValue(round.score>=round.target);
  if(state.phase==='shop')requireValue(round.score>=round.target && state.hand.length===0 && state.discardPile.length===0 && state.drawPile.length===cardIds.length && state.lastScore===null);
  if(state.phase==='game_over')requireValue(round.handsRemaining===0 && round.score<round.target);
  if(state.phase==='playing')requireValue(round.handsRemaining>0 && round.score<round.target && state.hand.length>0 && (state.hand.length>=round.handSize || state.drawPile.length===0));
  if(state.phase==='blind_selection')requireValue(state.hand.length===0 && state.discardPile.length===0 && round.score===0n);
  state.lastScore=decodeScore(state.lastScore,state);
  if(state.lastScore!==null)requireValue(state.lastScore.score<=round.score);
  if(sortMode!==undefined)state.sortMode=sortMode;
  return state;
}
export function serializeState(state) {
  requireValue(typeof state.money==='bigint' && typeof state.round.target==='bigint' && typeof state.round.score==='bigint');
  const payload={format:'card-cascade-save',version:1,state:{...state,money:state.money.toString(),round:{...state.round,target:state.round.target.toString(),score:state.round.score.toString()},lastScore:encodeScore(state.lastScore)}};
  const text=JSON.stringify(payload);
  deserializeState(text); // Validate the exact bytes that will be stored.
  return text;
}
export function deserializeState(text) {
  requireValue(typeof text==='string' && text.length<=LIMIT && new TextEncoder().encode(text).length<=LIMIT);
  return decode(JSON.parse(text));
}
