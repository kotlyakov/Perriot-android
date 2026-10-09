import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {enterRun} from './enter-run.mjs';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState} from '../../src/persistence/save.js';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try {
 const page=await browser.newPage({viewport:{width:1536,height:688}});
 let s=createRun('RETURN03',{runId:'return-03',money:100n,referenceRng:true,referenceShop:true});
 s.phase='round_won';s.round.score=300n;s.round.handsRemaining=1;s=dispatch(s,{type:'CASH_OUT',expectedRevision:0}).state;
 s.shop.main=[{id:'return_card',entityId:'j_joker',originalKey:'j_joker',set:'Joker',edition:'base',cost:4n,sellCost:2n}];
 await page.goto(process.env.PREVIEW_URL);await page.evaluate(s=>localStorage.setItem('card-cascade.current',s),serializeState(s));await page.reload();await enterRun(page);
 await page.waitForTimeout(450);
 const originalSave=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));
 const peaks=[];
 for(const [dx,dy] of [[120,0],[350,0],[-120,0],[0,180],[250,180]]){
  const b=await page.locator('[data-offer-id=return_card] .shop-card').boundingBox(),from={x:b.x+b.width/2,y:b.y+b.height/2};
  await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(from.x+dx,from.y+dy,{steps:5});await page.mouse.up();
  const samples=await page.evaluate(()=>{
   const ghost=document.querySelector('.shop-choice.is-dragging'),motion=ghost.getAnimations()[0];motion.pause();
   const duration=motion.effect.getTiming().duration,positions=[];
   for(let i=0;i<=100;i++){motion.currentTime=duration*i/100;positions.push(getComputedStyle(ghost).translate.split(' ').map(parseFloat));}
   return positions;
  });
  const length=Math.hypot(dx,dy),projection=samples.map(([x,y=0])=>(x*dx+y*dy)/length);
  assert.ok(Math.min(...projection)<-length*.025,'Card must pass its home along the return trajectory');
  assert.ok(samples.every(([x,y=0])=>Math.abs(x*dy-y*dx)/length<.1),'Oscillation must stay along flight, not vertical jitter');
  const firstCross=projection.findIndex(v=>v<0),secondCross=projection.findIndex((v,i)=>i>firstCross&&v>0);
  assert.ok(secondCross>firstCross,'Card must swing back after overshoot');
  assert.ok(Math.max(...projection.slice(secondCross))<Math.abs(Math.min(...projection)),'Successive swings must decay');
  assert.ok(Math.hypot(...samples.at(-1))<.01,'Animation ends exactly at home');
  peaks.push(-Math.min(...projection));
  await page.evaluate(()=>document.querySelector('.shop-choice.is-dragging').getAnimations()[0].finish());
  await page.waitForFunction(()=>!document.querySelector('.shop-choice.is-dragging'));
  assert.equal(await page.locator('[data-offer-id=return_card]').evaluate(el=>getComputedStyle(el).opacity),'1');
  assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),originalSave);
 }
 assert.ok(peaks[1]>peaks[0]*2,'Longer return has greater inertia');
 // A new gesture cancels the previous return without a duplicate or hidden source.
 const b=await page.locator('[data-offer-id=return_card] .shop-card').boundingBox();
 await page.mouse.move(b.x+50,b.y+70);await page.mouse.down();await page.mouse.move(b.x+250,b.y+200);await page.mouse.up();
 await page.mouse.move(b.x+50,b.y+70);await page.mouse.down();
 assert.equal(await page.locator('.shop-choice.is-dragging').count(),0);await page.mouse.up();
 assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),originalSave);
 console.log('Z-03: five trajectories, distance-dependent inertia, decaying swings, exact home, unchanged save, new gesture PASS');
 await page.close();
} finally {await browser.close();}
