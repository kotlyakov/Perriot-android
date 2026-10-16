import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {createApkShopContext,rerollApkShop} from '../../src/core/apk-shop.js';
import {createApkRng} from '../../src/core/apk-rng.js';
import catalogue from '../../src/content/apk-shop-catalog.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const keys=['j_dusk','j_hack','j_sock_and_buskin','j_hanging_chad'];
// Normal catalogue generator and normal offer objects, with the explicit pool
// unlock context used by this preview. This does not claim career unlocking.
function offerFor(key,index){
 const context=createApkShopContext({mainSlots:1,boosterSlots:0,reducedMotion:true,rates:{Joker:1,Tarot:0,Planet:0,Base:0,Spectral:0},unlockedCentreIds:['j_sock_and_buskin','j_hanging_chad'],bannedCentreIds:catalogue.centres.filter(c=>c.set==='Joker'&&c.key!==key).map(c=>c.key)});
 for(let i=0;i<100;i++){const item=rerollApkShop(createApkRng('RETRIGGER'+i),context).main[0];if(item.entityId===key&&item.edition==='base')return {...item,id:'repeat_'+index};}throw Error('No normal offer for '+key);
}
const offers=keys.map(offerFor);
function shop(){let s=createRun('RETRIGGERUI',{runId:'retrigger-ui',money:100n,referenceRng:true,referenceShop:true,reducedMotion:true});s.phase='round_won';s.round.score=s.round.target;s=dispatch(s,{type:'CASH_OUT',expectedRevision:s.revision}).state;s.money=100n;s.shop.main=structuredClone(offers);s.apkShop.context.unlockedCentreIds=['j_sock_and_buskin','j_hanging_chad'];return s;}
function playing(owned,reduced){let s=createRun('RETRIGGERSCORE',{runId:'retrigger-score',money:100n,referenceRng:true,referenceShop:true,reducedMotion:reduced});s=dispatch(s,{type:'START_BLIND',expectedRevision:0}).state;s.jokers=structuredClone(owned);s.nextJokerCreationOrdinal=Math.max(...owned.map(j=>j.creationOrdinal))+1;s.round.score=s.round.target-55n;s.round.handsRemaining=1;s.hand=['card_hearts_11','card_clubs_2','card_spades_4','card_diamonds_6','card_hearts_8','card_clubs_10','card_spades_12','card_diamonds_14'];s.drawPile=Object.keys(s.cards).filter(id=>!s.hand.includes(id));return s;}
const saved=async page=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
async function install(page,s){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(s));await page.reload();await enterRun(page,{startBlind:false});}
async function idle(page){await page.waitForFunction(()=>!document.getElementById('sort_rank')?.disabled||!!document.getElementById('shop_reroll')&&!document.getElementById('shop_reroll').disabled||!!document.getElementById('post_round'));await page.waitForFunction(()=>!document.querySelector('.money-pop,.score-pop,.is-dragging'));}
async function drag(page,locator,x,y,touch){const b=await locator.boundingBox(),stage=await page.locator('#stage').boundingBox(),scale=stage.width/1536,from={x:b.x+b.width/2,y:b.y+b.height/2},to={x:stage.x+x*scale,y:stage.y+y*scale};if(touch){const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[to]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}else{await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();}}
async function observe(page){await page.evaluate(()=>{window.repeatPops=[];window.repeatCommit=null;new MutationObserver(records=>{for(const record of records)for(const n of record.addedNodes){if(n.nodeType!==1||!n.classList.contains('score-pop')||n.classList.contains('counter-pop'))continue;window.repeatPops.push({sourceId:n.dataset.sourceId,effectSourceId:n.dataset.effectSourceId,operation:n.dataset.operation,text:n.textContent});if(n.dataset.operation==='repeat'&&!window.repeatCommit)window.repeatCommit={saved:localStorage.getItem('card-cascade.current'),disabled:[...document.querySelectorAll('#play_hand,#discard,#sort_rank,#shop_owned button')].every(b=>b.disabled)};}}).observe(document.getElementById('stage'),{childList:true,subtree:true});});}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 for(const [width,height,touch] of [[1536,688,false],[915,412,true]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await install(page,shop());
  for(const offer of offers){const card=page.locator(`[data-kind=main][data-offer-id=${offer.id}] .shop-card`);await card.click();const tip=page.locator('#shop_tooltip');assert.doesNotMatch(await tip.innerText(),/предварительной версии/);assert.equal(await tip.locator('.tooltip-effect').count(),0);const bounds=await tip.boundingBox();assert.ok(bounds.x>=-1&&bounds.x+bounds.width<=width+1&&bounds.y>=-1&&bounds.y+bounds.height<=height+1);assert.ok(await card.locator('svg').count());await drag(page,card,850,90,touch);await page.locator(`[data-kind=owned][data-offer-id=${offer.id}]`).waitFor();await idle(page);}
  assert.equal(new Set(await page.locator('#shop_owned .shop-card').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')))).size,4);let s=await saved(page);assert.deepEqual(s.jokers.map(j=>j.entityId),keys);assert.equal(s.money,100n-offers.reduce((n,o)=>n+o.cost,0n));
  await drag(page,page.locator('#shop_owned [data-offer-id=repeat_0] .shop-card'),1040,95,touch);await idle(page);s=await saved(page);assert.equal(s.jokers.at(-1).id,'repeat_0');await page.reload();await enterRun(page,{startBlind:false});assert.deepEqual((await saved(page)).jokers.map(j=>j.id),s.jokers.map(j=>j.id));
  // Sale follows the same right-hand gesture for every newly admitted identity.
  const purchased=structuredClone(s.jokers);for(const joker of purchased){const before=await saved(page);await drag(page,page.locator(`#shop_owned [data-offer-id=${joker.id}] .shop-card`),1450,300,touch);await idle(page);assert.equal((await saved(page)).money,before.money+joker.sellCost);}
  for(const reduced of [true,false]){
   await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});const before=playing(purchased,reduced);await install(page,before);await observe(page);await page.locator('#hand [data-card-id=card_hearts_11]').click();await page.locator('#play_hand').click();
   if(!reduced){await page.waitForFunction(()=>window.repeatCommit!==null);const captured=await page.evaluate(()=>window.repeatCommit),committed=deserializeState(captured.saved);assert.equal(captured.disabled,true);assert.equal(committed.revision,before.revision+1);assert.equal(committed.round.handsRemaining,0);assert.equal(committed.lastScore.trace.filter(e=>e.type==='score_repeat').length,4);assert.equal(committed.lastScore.score,55n);assert.equal(committed.money,before.money);
    // Attempt programmatic controls and a drag while animation owns the UI.
    await page.evaluate(()=>{document.getElementById('play_hand').click();document.getElementById('discard').click();document.getElementById('sort_rank').click();});await drag(page,page.locator('#shop_owned [data-offer-id=repeat_0] .shop-card'),1450,300,touch);assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),captured.saved);
    await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),captured.saved);assert.equal((await saved(page)).money,committed.money);assert.equal(await page.locator('.score-repeat').count(),0);
    // Separate uninterrupted run verifies all markers and their following effects.
    await install(page,before);await observe(page);await page.locator('#hand [data-card-id=card_hearts_11]').click();await page.locator('#play_hand').click();
   }
   await page.waitForFunction(()=>!!document.querySelector('#post_round'));await page.waitForFunction(()=>!document.querySelector('.score-pop,.money-pop'));s=await saved(page);const pops=await page.evaluate(()=>window.repeatPops),markers=pops.filter(p=>p.operation==='repeat');assert.equal(markers.length,4);assert.deepEqual(markers.map(p=>p.effectSourceId),s.lastScore.trace.filter(e=>e.type==='score_repeat').map(e=>e.effectSourceId));for(let i=0;i<pops.length;i++)if(pops[i].operation==='repeat'){assert.equal(pops[i].text,'Ещё раз');assert.equal(pops[i+1].sourceId,'card_hearts_11');assert.equal(pops[i+1].operation,'add_chips');}assert.equal(s.lastScore.score,55n);assert.equal(s.revision,before.revision+1);await page.screenshot({path:`artifacts/scored-retrigger-${width}-${reduced?'reduced':'normal'}.png`});
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Four normal retrigger offers, source markers, mouse/touch sale/reorder, commit-before-animation and reload PASS');
}finally{await browser.close();}
