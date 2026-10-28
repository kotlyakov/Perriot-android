import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
import {dragShopAction} from './shop-actions.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
let state=createRun('LATEPERF',{runId:'late-perf',money:1000n,referenceRng:true,referenceShop:true});
// A deterministic overlevelled starting hand gets a real journal through four antes.
// No later phase/score/history edits: every transition is the production reducer.
for(const k of Object.keys(state.handLevels))state.handLevels[k]=5000;
state.jokers=[{id:'late-joker',entityId:'j_joker',originalKey:'j_joker',set:'Joker',edition:'base',sellCost:2n}];
const act=(type,fields={})=>{const r=dispatch(state,{type,expectedRevision:state.revision,...fields});assert.ifError(r.error);state=r.state;};
while(state.round.ante<5){if(state.phase==='blind_selection')act('START_BLIND');else if(state.phase==='playing'){for(let i=0;i<12;i++)act('SET_SORT',{mode:i%2?'rank':'suit'});act('DISCARD',{cardIds:state.hand.slice(0,2)});act('PLAY_HAND',{cardIds:state.hand.slice(0,5)});}else if(state.phase==='round_won')act('CASH_OUT');else if(state.phase==='shop')act('LEAVE_SHOP');else throw Error(state.phase);}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 const page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(state));await page.reload();await enterRun(page,{startBlind:false});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const saved=async()=>deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));
 const reports=[];
 async function press(selector){const before=(await saved()).revision;await page.locator(selector).evaluate(button=>{const save=localStorage.getItem('card-cascade.current');button.addEventListener('click',()=>{window.latePress={pending:button.classList.contains('action-pending'),sameSave:save===localStorage.getItem('card-cascade.current'),transform:getComputedStyle(button).transform};},{once:true});});await page.locator(selector).click();const immediate=await page.evaluate(()=>window.latePress);assert.ok(immediate.pending&&immediate.sameSave,selector+JSON.stringify(immediate));await page.waitForFunction(rev=>JSON.parse(localStorage.getItem('card-cascade.current')).state.revision>rev,before);await page.waitForFunction(()=>!document.querySelector('.action-pending'));reports.push({selector,...immediate});}
 await press('#skip_small');await page.locator('#select_big:enabled').waitFor();await press('#select_big');await page.locator('#hand .playing-card').first().waitFor();await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);
 await page.locator('#hand .playing-card').first().click();await press('#discard');await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);
 await page.locator('#hand .playing-card').first().click();await press('#play_hand');await page.locator('#cashout:enabled').waitFor();await press('#cashout');await page.locator('#shop_reroll:enabled').waitFor();
 const shop=await saved(),ticket=shop.shop.vouchers[0];if(ticket){await dragShopAction(page,ticket.id,'buy',true);await page.waitForFunction(id=>!document.querySelector(`[data-offer-id="${id}"]`),ticket.id);assert.ok((await saved()).apkShop.context.usedVoucherIds.includes(ticket.entityId));}
 const money=(await saved()).money;await dragShopAction(page,'late-joker','sell',true);await page.waitForFunction(()=>!document.querySelector('[data-offer-id="late-joker"]'));assert.equal((await saved()).money,money+2n);
 const pack=(await saved()).shop.boosters[0];await dragShopAction(page,pack.id,'buy',true);await page.locator('#pack_skip:enabled').waitFor();assert.equal(await page.locator('#hand .playing-card').count(),0);await press('#pack_skip');await page.locator('#shop_reroll:enabled').waitFor();assert.deepEqual(errors,[]);
 console.log(JSON.stringify({ante:5,historyActions:state.effectReplay.actions.length,cpuThrottle:4,presses:reports,shopVoucher:true,sale:true,packOpenSkip:true}));
}finally{await browser.close();}
