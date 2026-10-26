import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
function fixture(many=false){const s=createRun('BONUSUI',{runId:'cashout-jokers-ui',money:4n,referenceRng:true,referenceShop:true,reducedMotion:true});s.phase='round_won';s.round.score=300n;s.round.handsRemaining=1;s.jokers=Array.from({length:many?5:1},(_,i)=>({id:'gold'+i,entityId:'j_golden',originalKey:'j_golden',set:'Joker',edition:many&&i===0?'negative':'base',cost:6n,sellCost:3n}));s.jokers.push({id:'cloud',entityId:'j_cloud_9',originalKey:'j_cloud_9',set:'Joker',edition:'base',cost:7n,sellCost:3n});return s;}
async function install(page,s){await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(s));await page.reload();await enterRun(page,{startBlind:false});await page.locator('#post_round').waitFor();}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 for(const [width,height,many] of [[1536,688,false],[915,412,true]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'});page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await install(page,fixture(many));
  assert.equal(await page.locator('.payout-joker').count(),many?4:2);if(many){await page.getByRole('button',{name:'Следующие строки награды'}).tap();assert.equal(await page.locator('.payout-joker').count(),2);}assert.equal(await page.locator('.payout-interest').count(),0);assert.equal(await page.locator('#money_value').innerText(),'$4');assert.equal(await page.locator('#cashout').innerText(),many?'Обналичить: $28':'Обналичить: $12');
  assert.match(await page.locator('.payout-joker[data-joker-id=cloud]').innerText(),/\$4/);const button=await page.locator('#cashout').boundingBox();assert.ok(button.x>=0&&button.y>=0&&button.x+button.width<=width+1&&button.y+button.height<=height+1);
  await page.screenshot({path:`artifacts/joker-cashout-${width}.png`});
  if(many){assert.ok(await page.locator('.payout-bonus-list').evaluate(el=>el.scrollHeight<=el.clientHeight));const row=await page.locator('.payout-joker[data-joker-id=cloud]').boundingBox();assert.ok(row.y+row.height<=height);await page.getByRole('button',{name:'Предыдущие строки награды'}).tap();assert.equal(await page.locator('.payout-joker').count(),4);await page.getByRole('button',{name:'Следующие строки награды'}).tap();const before=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('cashout bonus write failure');};});await page.locator('#cashout').tap();await page.locator('dialog[open]').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),before);assert.equal(await page.locator('#money_value').innerText(),'$4');}
  else{await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.locator('.payout-joker').count(),2);await page.locator('#cashout').evaluate(button=>{button.click();button.click();});await page.locator('#shop_screen').waitFor();const s=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));assert.equal(s.money,16n);assert.equal(s.revision,1);await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.locator('#money_value').innerText(),'$16');}
  await page.screenshot({path:`artifacts/joker-cashout-${width}-after-action.png`});assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Golden/Cloud payout pages without scroll, pre-payout interest, reload, double action and write failure PASS');
}finally{await browser.close();}
