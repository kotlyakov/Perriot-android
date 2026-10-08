import {sortHand,SORT_MODES} from './sort.js';
import { createRng, randomInt } from './rng.js';
import { scoreHand } from './score.js';
import { HANDS } from '../content/hands.js';

export function createRun(seed, {runId,deckId='red',money}={}) {
  if (typeof seed!=='string' || !seed || seed.length>1000) throw new TypeError('Invalid seed');
  if (typeof runId!=='string' || !runId || runId.length>120 || !['red','blue'].includes(deckId) || typeof money!=='bigint') throw new TypeError('Invalid run options');
  const cards = {};
  for (const suit of ['clubs','diamonds','hearts','spades']) {
    for (let rank=2;rank<=14;rank++) {
      const id=`card_${suit}_${rank}`;cards[id]={id,rank,suit};
    }
  }
  return {
    schemaVersion:1,runId,seed,revision:0,phase:'blind_selection',deckId,cards,
    hand:[],drawPile:Object.keys(cards),discardPile:[],jokers:[],
    handLevels:Object.fromEntries(Object.keys(HANDS).map(id=>[id,1])),
    discoveredHands:Object.keys(HANDS).slice(0,9),
    rng:{deck:createRng(`${seed}:deck`),effects:createRng(`${seed}:effects`)},money,
    round:{blindId:'small',ante:1,target:300n,score:0n,handsRemaining:deckId==='blue'?5:4,discardsRemaining:deckId==='red'?4:3,handSize:8},
    lastScore:null,sortMode:'rank',
  };
}

function drawToLimit(state, events) {
  const count=Math.min(Math.max(0,state.round.handSize-state.hand.length),state.drawPile.length);
  const ids=state.drawPile.splice(0,count);
  state.hand.push(...ids);sortHand(state);
  if (ids.length) events.push({type:'cards_drawn',cardIds:[...ids]});
}

export function dispatch(state, action) {
  const reject=(code,message)=>({state,events:[],error:{code,message}});
  if (!action || typeof action.type!=='string' || !Number.isSafeInteger(action.expectedRevision)) return reject('INVALID_ACTION','Malformed action');
  if (action.expectedRevision!==state.revision) return reject('STALE_ACTION','State revision has changed');
  if (!Number.isSafeInteger(state.revision) || state.revision<0 || state.revision===Number.MAX_SAFE_INTEGER) return reject('INVALID_STATE','Invalid revision');
  if (action.type==='START_BLIND') {
    if (state.phase!=='blind_selection') return reject('INVALID_PHASE','Not selecting a blind');
    const next=structuredClone(state);const events=[];
    for(let i=next.drawPile.length-1;i>0;i--) {
      const draw=randomInt(next.rng.deck,i+1);next.rng.deck=draw.rng;
      [next.drawPile[i],next.drawPile[draw.value]]=[next.drawPile[draw.value],next.drawPile[i]];
    }
    next.phase='playing';next.revision++;
    events.push({type:'round_started',blindId:next.round.blindId,target:next.round.target});
    drawToLimit(next,events);
    return {state:next,events,error:null};
  }
  if (!['PLAY_HAND','DISCARD','REORDER_HAND','SET_SORT'].includes(action.type)) return reject('UNKNOWN_ACTION','Unsupported action');
  if (state.phase!=='playing') return reject('INVALID_PHASE','Round is not active');
  if(action.type==='SET_SORT'){
    if(!SORT_MODES.includes(action.mode))return reject('INVALID_SORT','Invalid sort');
    const next=structuredClone(state);next.sortMode=action.mode;sortHand(next);next.revision++;
    return {state:next,events:[{type:'hand_reordered',cardIds:[...next.hand]}],error:null};
  }
  const ids=action.cardIds;
  if (action.type==='REORDER_HAND') {
    if (!Array.isArray(ids) || ids.length!==state.hand.length || new Set(ids).size!==ids.length || ids.some(id=>!state.hand.includes(id))) return reject('INVALID_SELECTION','Expected an exact permutation of held cards');
    const next=structuredClone(state);next.hand=[...ids];next.revision++;
    return {state:next,events:[{type:'hand_reordered',cardIds:[...ids]}],error:null};
  }
  if (!Array.isArray(ids) || ids.length<1 || ids.length>5 || new Set(ids).size!==ids.length || ids.some(id=>typeof id!=='string' || !state.hand.includes(id))) return reject('INVALID_SELECTION','Select 1 to 5 distinct held cards');
  if (action.type==='PLAY_HAND' && state.round.handsRemaining<=0 || action.type==='DISCARD' && state.round.discardsRemaining<=0) return reject('NO_ACTIONS_LEFT','Counter exhausted');
  const selected=new Set(ids);
  const playedIds=state.hand.filter(id=>selected.has(id));
  let score=null;
  if (action.type==='PLAY_HAND') {
    try { score=scoreHand(state,playedIds.map(id=>state.cards[id])); }
    catch (error) { return reject('UNSUPPORTED_CONTENT',error.message); }
  }
  const next=structuredClone(state);const events=[];
  next.hand=next.hand.filter(id=>!selected.has(id));next.discardPile.push(...playedIds);
  if (score) {
    next.round.handsRemaining--;next.round.score+=score.score;next.lastScore=score;
    if (!next.discoveredHands.includes(score.handId)) next.discoveredHands.push(score.handId);
    events.push({type:'hand_played',cardIds:[...playedIds]},...structuredClone(score.trace));
    if (next.round.score>=next.round.target) { next.phase='round_won';events.push({type:'round_won',score:next.round.score}); }
    else if (next.round.handsRemaining===0) { next.phase='game_over';events.push({type:'round_lost',score:next.round.score}); }
  } else {
    next.round.discardsRemaining--;events.push({type:'cards_discarded',cardIds:[...playedIds]});
  }
  if (next.phase==='playing') drawToLimit(next,events);
  next.revision++;
  return {state:next,events,error:null};
}
