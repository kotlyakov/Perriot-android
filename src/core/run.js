import {applySkipBlind} from './skip-blind.js';
import {canEnterFirstAnteBoss,chooseHookDiscards} from './boss-effects.js';
import {applyInventoryAction} from './inventory.js';
import {chooseNextAnteBlinds} from './blind-progression.js';
import {chooseApkBoss} from './apk-blinds.js';
import {createApkTagContext,chooseApkTag,chooseApkOrbitalHand} from './apk-tags.js';
import {sortHand,SORT_MODES} from './sort.js';
import {getCashout} from './cashout.js';
import { createRng, randomInt } from './rng.js';
import { scoreHand } from './score.js';
import { HANDS } from '../content/hands.js';
import {createApkRng} from './apk-rng.js';
import {shuffleApkDeck} from './apk-deck.js';
import {applyShopAction,createShop} from './shop.js';
import {createApkShopContext,chooseApkVoucher,generateApkShop} from './apk-shop.js';
import {APK_HAND_NAMES,currentApkShopContext} from './apk-shop-state.js';

export function createRun(seed, {runId,deckId='red',money,referenceRng=false,referenceShop=false,reducedMotion=false}={}) {
  if (typeof seed!=='string' || !seed || seed.length>1000) throw new TypeError('Invalid seed');
  if (typeof runId!=='string' || !runId || runId.length>120 || !['red','blue'].includes(deckId) || typeof money!=='bigint') throw new TypeError('Invalid run options');
  if(typeof referenceRng!=='boolean'||typeof referenceShop!=='boolean'||typeof reducedMotion!=='boolean'||referenceShop&&!referenceRng)throw new TypeError('Invalid reference shop options');
  const cards = {};
  for (const suit of ['clubs','diamonds','hearts','spades']) {
    for (let rank=2;rank<=14;rank++) {
      const id=`card_${suit}_${rank}`;cards[id]={id,rank,suit};
    }
  }
  const state={
    schemaVersion:1,runId,seed,revision:0,phase:'blind_selection',deckId,cards,
    hand:[],drawPile:Object.keys(cards),discardPile:[],jokers:[],
    handLevels:Object.fromEntries(Object.keys(HANDS).map(id=>[id,1])),
    discoveredHands:Object.keys(HANDS).slice(0,9),
    rng:{deck:createRng(`${seed}:deck`),effects:createRng(`${seed}:effects`)},money,
    round:{blindId:'small',ante:1,target:300n,score:0n,handsRemaining:deckId==='blue'?5:4,discardsRemaining:deckId==='red'?4:3,handSize:8},
    lastScore:null,sortMode:'rank',
  };
  if(referenceRng){
    let rng=createApkRng(seed);
    if(referenceShop){
      const boss=chooseApkBoss(rng);rng=boss.rng;
      const context=createApkShopContext({reducedMotion}),voucher=chooseApkVoucher(rng,context);rng=voucher.rng;
      const tagContext=createApkTagContext(),small=chooseApkTag(rng,tagContext),big=chooseApkTag(small.rng,tagContext);rng=big.rng;
      state.apkBlinds={version:1,ante:1,bossId:boss.bossId,bossesUsed:boss.bossesUsed,
        tags:{small:small.tagId,big:big.tagId},orbitalHands:{},tagContext,playedCardIds:[]};
      state.runStats={handsPlayed:0,unusedDiscards:0,skips:0};state.roundNumber=1;state.apkShop={version:1,voucherId:voucher.voucherId,firstShopBuffoon:false,context};
    }
    const shuffled=shuffleApkDeck(cards,rng,'shuffle');state.drawPile=shuffled.cardIds;state.rng.apk=shuffled.rng;
    // The initial blind screen fixes all three orbital hands after the deck shuffle.
    if(state.apkBlinds)for(const id of ['small','big','boss']){
      const selected=chooseApkOrbitalHand(state.rng.apk,state.apkBlinds.tagContext);
      state.apkBlinds.orbitalHands[id]=selected.hand;state.rng.apk=selected.rng;
    }
  }
  return state;
}

function drawToLimit(state, events) {
  const count=Math.min(Math.max(0,state.round.handSize-state.hand.length),state.drawPile.length);
  const ids=state.rng.apk?Array.from({length:count},()=>state.drawPile.pop()):state.drawPile.splice(0,count);
  state.hand.push(...ids);sortHand(state);
  if (ids.length) events.push({type:'cards_drawn',cardIds:[...ids]});
}

export function dispatch(state, action, shopOptions={}) {
  const reject=(code,message)=>({state,events:[],error:{code,message}});
  if (!action || typeof action.type!=='string' || !Number.isSafeInteger(action.expectedRevision)) return reject('INVALID_ACTION','Malformed action');
  if (action.expectedRevision!==state.revision) return reject('STALE_ACTION','State revision has changed');
  if (!Number.isSafeInteger(state.revision) || state.revision<0 || state.revision===Number.MAX_SAFE_INTEGER) return reject('INVALID_STATE','Invalid revision');
  if(['REORDER_JOKERS','REORDER_CONSUMABLES','SELL_OWNED_CARD'].includes(action.type))return applyInventoryAction(state,action);
  if(action.type==='SKIP_BLIND')return applySkipBlind(state,action);
  if(['BUY_SHOP_CARD','SELL_JOKER','REROLL_SHOP','LEAVE_SHOP'].includes(action.type))return applyShopAction(state,action,shopOptions);
  if(action.type==='CASH_OUT') {
    if(state.phase!=='round_won')return reject('INVALID_PHASE','Round has not been won');
    let quote;try{quote=getCashout(state);}catch{return reject('INVALID_STATE','Invalid cashout state');}
    const next=structuredClone(state);if(next.bossState){next.round.handSize=next.bossState.baseHandSize;delete next.bossState;next.apkBlinds.playedCardIds=[];}next.money+=quote.total;next.phase='shop';next.revision++;
    next.drawPile=Object.keys(next.cards);next.hand=[];next.discardPile=[];next.lastScore=null;
    if(next.apkShop){
      try{
        const context=currentApkShopContext(next);
        if(next.round.blindId==='boss'){
          const voucher=chooseApkVoucher(next.rng.apk,context);next.rng.apk=voucher.rng;next.apkShop.voucherId=voucher.voucherId;
        }
        const shuffled=shuffleApkDeck(Object.values(next.cards),next.rng.apk,'cashout'+context.ante);
        next.drawPile=shuffled.cardIds;next.rng.apk=shuffled.rng;
        if(next.round.blindId==='boss'){
          const selected=chooseNextAnteBlinds(next,next.rng.apk);
          next.nextAnteBlinds=selected.selection;next.rng.apk=selected.rng;
        }
        const generated=generateApkShop(next.rng.apk,context,{voucherId:next.apkShop.voucherId,
          firstShopBuffoon:next.apkShop.firstShopBuffoon,instancePrefix:'shop_'+next.revision});
        next.shop=createShop({offers:generated.offers});next.rng.apk=generated.rng;
        next.apkShop.firstShopBuffoon=generated.firstShopBuffoon;
        next.apkShop.context=currentApkShopContext(next);
      }catch{return reject('UNSUPPORTED_SHOP_STATE','Shop generation inputs are unsupported');}
    }
    return {state:next,events:[{type:'cash_out',...quote},{type:'shop_entered'}],error:null};
  }
  if (action.type==='START_BLIND') {
    if (state.phase!=='blind_selection') return reject('INVALID_PHASE','Not selecting a blind');
    if(state.round.blindId==='boss'&&!canEnterFirstAnteBoss(state))return reject('BOSS_UNAVAILABLE','Boss lifecycle is unavailable');
    const next=structuredClone(state);const events=[];
    if(next.round.blindId==='boss'){
      next.bossState={version:1,id:next.apkBlinds.bossId,playedBeforeBoss:[...next.apkBlinds.playedCardIds],baseHandSize:next.round.handSize};
      if(next.bossState.id==='bl_manacle')next.round.handSize--;
    }
    if(next.rng.apk){
      const shuffled=shuffleApkDeck(next.drawPile.map(id=>next.cards[id]),next.rng.apk,'nr'+next.round.ante);next.drawPile=shuffled.cardIds;next.rng.apk=shuffled.rng;
    }else for(let i=next.drawPile.length-1;i>0;i--) {
      const draw=randomInt(next.rng.deck,i+1);next.rng.deck=draw.rng;
      [next.drawPile[i],next.drawPile[draw.value]]=[next.drawPile[draw.value],next.drawPile[i]];
    }
    if(next.apkShop)next.roundNumber=(next.round.ante-1)*3+({small:1,big:2,boss:3}[next.round.blindId]);
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
  if(state.runStats && action.type==='PLAY_HAND' && (state.runStats.handsPlayed>=Number.MAX_SAFE_INTEGER || state.runStats.unusedDiscards>Number.MAX_SAFE_INTEGER-state.round.discardsRemaining))return reject('INVALID_STATE','Run counters exhausted');
  const next=structuredClone(state);const events=[];
  next.hand=next.hand.filter(id=>!selected.has(id));next.discardPile.push(...playedIds);
  if(score&&next.bossState?.id==='bl_hook'){
    let forced;try{forced=chooseHookDiscards(next.rng.apk,next.hand);}catch{return reject('UNSUPPORTED_BOSS_STATE','Invalid Hook card identities');}next.rng.apk=forced.rng;
    const discarded=next.hand.filter(id=>forced.cardIds.includes(id));
    next.hand=next.hand.filter(id=>!forced.cardIds.includes(id));next.discardPile.push(...discarded);
    if(discarded.length)events.push({type:'cards_forced_discarded',cardIds:discarded});
  }
  if (score) {
    if(next.apkBlinds?.playedCardIds)for(const id of playedIds)if(!next.apkBlinds.playedCardIds.includes(id))next.apkBlinds.playedCardIds.push(id);
    if(next.runStats)next.runStats.handsPlayed++;
    next.round.handsRemaining--;next.round.score+=score.score;next.lastScore=score;
    if (!next.discoveredHands.includes(score.handId)) next.discoveredHands.push(score.handId);
    if(next.apkShop){const name=APK_HAND_NAMES[score.handId];next.apkShop.context.playedHands[name]=(next.apkShop.context.playedHands[name]??0)+1;}
    events.push({type:'hand_played',cardIds:[...playedIds]},...structuredClone(score.trace));
    if (next.round.score>=next.round.target) { if(next.runStats)next.runStats.unusedDiscards+=next.round.discardsRemaining;next.phase='round_won';events.push({type:'round_won',score:next.round.score}); }
    else if (next.round.handsRemaining===0) { next.phase='game_over';events.push({type:'round_lost',score:next.round.score}); }
  } else {
    next.round.discardsRemaining--;events.push({type:'cards_discarded',cardIds:[...playedIds]});
  }
  if (next.phase==='playing') drawToLimit(next,events);
  next.revision++;
  return {state:next,events,error:null};
}


