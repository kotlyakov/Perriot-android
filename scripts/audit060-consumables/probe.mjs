import assert from 'node:assert/strict';
import {createRun,dispatch} from '../../src/core/run.js';
import {createApkRng,createApkMathState,nextApkRandom} from '../../src/core/apk-rng.js';
import {createApkShopContext} from '../../src/core/apk-shop.js';
import {generateApkArcanaPack} from '../../src/core/arcana-pack-generation.js';
const owned=key=>({id:key,entityId:key,originalKey:key,set:'Tarot',edition:'base',cost:3n,sellCost:1n});
const use=(state,targets=[])=>dispatch(state,{type:'USE_CONSUMABLE',expectedRevision:state.revision,cardId:state.consumables[0].id,targetCardIds:targets});
const print=x=>console.log(JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v));
// Targeted Tarot capability is restricted to SELECTING_HAND / pack native states.
{
 let s=createRun('AUDITPHASE',{runId:'audit-phase',money:4n});s=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision}).state;s.round.target=1n;s.consumables=[owned('c_strength')];
 const played=dispatch(s,{type:'PLAY_HAND',expectedRevision:s.revision,cardIds:[s.hand[0]]});assert.equal(played.error,null);s=played.state;assert.equal(s.phase,'round_won');
 const id=s.hand[0],before=s.cards[id].rank,r=use(s,[id]);assert.equal(r.error,null);print({case:'targeted-tarot-after-victory',phase:s.phase,expected:'USE_UNAVAILABLE; rank unchanged',actual:{error:r.error,rankBefore:before,rankAfter:r.state.cards[id].rank}});
}
// Native copy_card copies the complete ability table, including perma_bonus.
for(const [leftBonus,rightBonus] of [[0,25],[30,0]]){
 let s=createRun('AUDITDEATH',{runId:'audit-death',money:4n});s=dispatch(s,{type:'START_BLIND',expectedRevision:s.revision}).state;s.consumables=[owned('c_death')];
 const [left,right]=s.hand;s.cards[left].permaBonus=leftBonus;s.cards[right].permaBonus=rightBonus;
 const r=use(s,[left,right]);assert.equal(r.error,null);assert.equal(r.state.cards[left].permaBonus,leftBonus);
 print({case:'death-permanent-bonus',leftBonus,rightBonus,expected:rightBonus,actual:r.state.cards[left].permaBonus});
}
// Wheel calls set_edition -> set_cost; the latter retains ability.extra_value.
for(let i=0;i<1000;i++){
 const s=createRun('WHEEL'+i,{runId:'audit-wheel',money:4n,referenceRng:true,referenceShop:true});
 if(nextApkRandom(s.rng.apk,'wheel_of_fortune').value>=.25)continue;
 s.consumables=[owned('c_wheel_of_fortune')];s.jokers=[{id:'egg',entityId:'j_egg',originalKey:'j_egg',set:'Joker',edition:'base',cost:4n,sellCost:22n,extraValue:20n,creationOrdinal:1}];s.nextJokerCreationOrdinal=2;
 const r=use(s);assert.equal(r.error,null);const j=r.state.jokers[0];assert.equal(j.sellCost,j.cost/2n);print({case:'wheel-extra-value',seed:'WHEEL'+i,edition:j.edition,extraValue:j.extraValue,expected:j.cost/2n+20n,actual:j.sellCost});break;
}
// A debuffed Showman is owned, but absent from native find_joker('Showman').
for(let i=0;i<1000;i++){
 const rng=createApkRng('ARCANA'+i,createApkMathState(17));
 const context=createApkShopContext({ownedCentreIds:['j_ring_master','c_hermit'],activeCentreIds:[],usedCentreIds:['c_hermit']});
 const cards=generateApkArcanaPack(rng,context,{boosterId:'p_arcana_normal_1'}).cards.map(c=>c.entityId);
 if(!cards.includes('c_hermit')&&new Set(cards).size===cards.length)continue;
 print({case:'debuffed-showman-arcana',seed:'ARCANA'+i,expected:'No owned Hermit or repeated pack identities',actual:cards});break;
}
