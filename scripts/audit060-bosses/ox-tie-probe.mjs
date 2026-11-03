import {createRun,dispatch} from '../../src/core/run.js';
import {bossTarget} from '../../src/core/boss-effects.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
const act=(s,type,extra={})=>dispatch(s,{type,expectedRevision:s.revision,...extra});
const fixtureHand=['card_clubs_3','card_clubs_2','card_spades_2','card_hearts_4','card_hearts_6','card_hearts_8','card_hearts_10','card_diamonds_12'];
let output;
for(let i=0;i<1000;i++){
 let s=createRun('OXTIE'+i,{runId:'ox-tie',money:4n,referenceRng:true,referenceShop:true});
 // Setup only ante/boss and held cards; never set playedHands or mostPlayedHand.
 Object.assign(s.round,{ante:5,blindId:'boss'});Object.assign(s.apkBlinds,{ante:5,bossId:'bl_wall'});s.apkBlinds.bossesUsed.bl_wall=1;s.apkBlinds.tagContext.ante=5;s.apkShop.context.ante=5;s.round.target=bossTarget(s);
 let r=act(s,'START_BLIND');if(r.error)throw Error(JSON.stringify(r.error));s=r.state;
 s.hand=[...fixtureHand];s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));s.discardPile=[];
 const startCounts={...s.apkShop.context.playedHands};
 r=act(s,'PLAY_HAND',{cardIds:['card_clubs_3']});if(r.error)throw Error(JSON.stringify(r.error));s=r.state;const first={hand:s.lastScore.handId,counts:{...s.apkShop.context.playedHands}};
 // Shorten score needed to win, preserving two actual recognized plays.
 s.round.score=s.round.target-1n;
 r=act(s,'PLAY_HAND',{cardIds:['card_clubs_2','card_spades_2']});if(r.error)throw Error(JSON.stringify(r.error));s=r.state;const second={hand:s.lastScore.handId,counts:{...s.apkShop.context.playedHands},phase:s.phase};
 r=act(s,'CASH_OUT');if(r.error)throw Error(JSON.stringify(r.error));s=r.state;
 if(s.nextAnteBlinds.bossId!=='bl_ox')continue;
 const cashout={mostPlayedHand:s.mostPlayedHand,nextAnte:s.nextAnteBlinds.ante,nextBoss:s.nextAnteBlinds.bossId};
 r=act(s,'LEAVE_SHOP');if(r.error)throw Error(JSON.stringify(r.error));s=r.state;
 r=act(s,'SKIP_BLIND');if(r.error){output={seed:'OXTIE'+i,startCounts,first,second,cashout,smallSkip:r.error};break;}s=r.state;
 const bigSkip=act(s,'SKIP_BLIND');
 // Normal big round path also leads to the blocked boss selection.
 r=act(s,'START_BLIND');if(r.error)throw Error(JSON.stringify(r.error));s=r.state;s.round.score=s.round.target-1n;
 r=act(s,'PLAY_HAND',{cardIds:[s.hand[0]]});if(r.error)throw Error(JSON.stringify(r.error));s=r.state;r=act(s,'CASH_OUT');if(r.error)throw Error(JSON.stringify(r.error));s=r.state;
 const leaveBig=act(s,'LEAVE_SHOP');
 // Direct boss entry eligibility receives exactly the saved null snapshot.
 const bossFixture={...s,phase:'blind_selection',round:{...s.round,blindId:'boss',score:0n}};
 const startBoss=act(bossFixture,'START_BLIND');
 output={seed:'OXTIE'+i,startCounts,first,second,cashout,bigSkip:bigSkip.error,leaveBig:leaveBig.error,startBoss:startBoss.error};break;
}
if(!output)throw Error('No Ox seed found');console.log(JSON.stringify(output,null,2));
