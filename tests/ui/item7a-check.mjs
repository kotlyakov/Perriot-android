import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {initializeItem7Joker} from '../../src/core/joker-item7-lifecycle.js';
import {currentApkShopContext} from '../../src/core/apk-shop-state.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
function fixture(){let s=createRun('ITEM7UI',{runId:'item7-ui',money:25n,referenceRng:true,referenceShop:true,reducedMotion:true});s.jokers=['j_hiker','j_green_joker','j_rocket'].map((entityId,i)=>initializeItem7Joker(s,{id:'owned'+i,entityId,creationOrdinal:i+1,originalKey:entityId,set:'Joker',edition:'base',cost:4n,sellCost:2n}));s.nextJokerCreationOrdinal=4;s.apkShop.context=currentApkShopContext(s);return dispatch(s,{type:'START_BLIND',expectedRevision:s.revision}).state;}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 for(const [width,height,touch]of [[1536,688,false],[915,412,true]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'});page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const initial=fixture(),id=initial.hand[0],expected=dispatch(initial,{type:'PLAY_HAND',expectedRevision:initial.revision,cardIds:[id]});assert.equal(expected.error,null);
  await page.goto(process.env.PREVIEW_URL);await page.evaluate(text=>localStorage.setItem('card-cascade.current',text),serializeState(initial));await page.reload();await enterRun(page,{startBlind:false});
  const card=page.locator(`#hand [data-card-id=${id}]`);if(touch)await card.tap();else await card.click();
  await page.locator('#play_hand').evaluate(button=>{button.click();button.click();});
  await page.waitForFunction(revision=>JSON.parse(localStorage.getItem('card-cascade.current')).state.revision>revision,initial.revision);
  const saved=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));assert.deepEqual(deserializeState(saved),expected.state);
  assert.equal(expected.state.cards[id].permaBonus,5);assert.equal(expected.state.jokers.find(j=>j.entityId==='j_green_joker').mult,1);
  await page.waitForFunction(()=>!document.getElementById('sort_rank').disabled);await page.screenshot({path:`artifacts/item7a-${width}.png`});
  await page.reload();await enterRun(page,{startBlind:false});assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),saved);assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Item7a Hiker/Green/Rocket score, BigInt save, double action and reload mouse/touch PASS');
}finally{await browser.close();}
