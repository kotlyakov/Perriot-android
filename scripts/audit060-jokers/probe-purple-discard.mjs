import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
const act=(s,type,cardIds)=>{const r=dispatch(s,{type,cardIds,expectedRevision:s.revision});assert.equal(r.error,null);return r;};
function start(keys=[],hook=false){let s=createRun('AUDITPURPLE',{runId:'audit-purple',money:20n,referenceRng:true,referenceShop:true});if(hook){s.round.blindId='boss';s.round.target=600n;s.apkBlinds.bossId='bl_hook';s.apkBlinds.bossesUsed.bl_hook=1;}s.jokers=keys.map((entityId,i)=>({id:'j'+i,entityId,set:'Joker',originalKey:entityId,creationOrdinal:i+1,sellCost:2n}));s.nextJokerCreationOrdinal=keys.length+1;return act(s,'START_BLIND').state;}
for(const keys of [[],['j_trading'],['j_blueprint','j_trading']]){
 const s=start(keys),id=s.hand[0];s.cards[id].seal='purple';const r=act(s,'DISCARD',[id]);
 console.log('normal discard',keys,'expected Tarot 1, actual',r.state.consumables?.length??0,'destroyed',!r.state.cards[id]);
 assert.equal(r.state.consumables?.length??0,keys.length?0:1);
}
for(const keys of [[],['j_trading']]){
 const s=start(keys,true);for(const id of s.hand)s.cards[id].seal='purple';const r=act(s,'PLAY_HAND',[s.hand[0]]),forced=r.events.find(e=>e.type==='cards_forced_discarded');assert.equal(forced.cardIds.length,2);
 console.log('Hook discard',keys,'forced',forced.cardIds.length,'expected Tarot 2, actual',r.state.consumables?.length??0);assert.equal(r.state.consumables?.length??0,2);
}
{
 const s=start(['j_trading'],true);s.drawPile.push(...s.hand.slice(2));s.hand=s.hand.slice(0,2);for(const id of s.hand)s.cards[id].seal='purple';const id=s.hand[1],r=act(s,'PLAY_HAND',[s.hand[0]]);
 console.log('Hook singleton + Trading expected Tarot1, actual',r.state.consumables?.length??0,'destroyed',!r.state.cards[id]);assert.equal(r.state.consumables.length,1);assert.equal(!r.state.cards[id],true);
}
{
 let s=start(['j_trading']);s.round.discardsUsed=1;const id=s.hand[0];s.cards[id].seal='purple';const r=act(s,'DISCARD',[id]);console.log('second discard + Trading expected Tarot1, actual',r.state.consumables?.length??0);assert.equal(r.state.consumables.length,1);assert.ok(r.state.cards[id]);
}
