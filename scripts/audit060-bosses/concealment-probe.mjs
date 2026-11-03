import {createRun,dispatch} from '../../src/core/run.js';
import {bossTarget} from '../../src/core/boss-effects.js';
import {initializeItem7Joker,item7CapacityDeltas} from '../../src/core/joker-item7-lifecycle.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {nextApkRandom} from '../../src/core/apk-rng.js';
import {serializeState} from '../../src/persistence/save.js';
const act=(s,type,extra={})=>dispatch(s,{type,expectedRevision:s.revision,...extra});
const out=[];
for(const id of ['bl_house','bl_mark','bl_wheel']){
 let s=createRun('CONCEAL060',{runId:'conceal060',money:4n,referenceRng:true,referenceShop:true});
 s.jokers=[initializeItem7Joker(s,{id:'juggler',entityId:'j_juggler',originalKey:'j_juggler',set:'Joker',edition:'base',sellCost:2n,creationOrdinal:1})];s.nextJokerCreationOrdinal=2;s.round.handSize+=item7CapacityDeltas(s.jokers).handSize;
 Object.assign(s.round,{ante:2,blindId:'boss'});Object.assign(s.apkBlinds,{ante:2,bossId:id});s.apkBlinds.bossesUsed[id]=1;s.apkBlinds.tagContext.ante=2;s.apkShop.context.ante=2;s.round.target=bossTarget(s);
 s=act(s,'START_BLIND').state;
 // Deterministic fixture: next draw is a canonical face card still in draw pile.
 if(id==='bl_mark'){const i=s.drawPile.findIndex(cid=>s.cards[cid].rank===11);[s.drawPile[i],s.drawPile[s.drawPile.length-1]]=[s.drawPile.at(-1),s.drawPile[i]];}
 s.consumables=[{id:'ankh',entityId:'c_ankh',originalKey:'c_ankh',set:'Spectral',edition:'base',cost:4n,sellCost:1n}];s.apkShop.context=currentApkShopContext(s);
 let beforeSave='ok';try{serializeState(s)}catch(e){beforeSave=e.message};
 const r=act(s,'USE_CONSUMABLE',{cardId:'ankh'});const drawn=r.events.filter(e=>e.type==='cards_drawn').flatMap(e=>e.cardIds);let save='ok';try{serializeState(r.state)}catch(e){save=e.message};
 out.push({boss:id,beforeSave,error:r.error,drawn:drawn.map(cid=>({id:cid,rank:r.state.cards[cid].rank,hidden:r.state.bossState.hiddenCardIds.includes(cid)})),handsPlayed:r.state.round.handsPlayed,discardsUsed:r.state.round.discardsUsed,wheelBefore:s.rng.apk.streams.wheel,wheelAfter:r.state.rng.apk.streams.wheel,save});
}
console.log(JSON.stringify(out,null,2));
