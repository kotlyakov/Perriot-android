import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createRun,dispatch} from '../../src/core/run.js';
import {serializeState,deserializeState} from '../../src/persistence/save.js';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
const act=(s,type)=>dispatch(s,{type,expectedRevision:s.revision}).state;
function shop(){
 const s=createRun('AAAAAAA1',{runId:'ante2-ui',money:4n,referenceRng:true,referenceShop:true});
 s.round.blindId='boss';s.round.target=600n;
 const won=act(s,'START_BLIND');won.phase='round_won';won.round.score=600n;return act(won,'CASH_OUT');
}
try{for(const [width,height] of [[1536,688],[915,412],[360,800]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);await enterRun(page);
 await page.evaluate(s=>localStorage.setItem('card-cascade.current',s),serializeState(shop()));await page.reload();await enterRun(page);
 assert.match(await page.locator('.shop-voucher-label').innerText(),/2 АНТЕ/);
 assert.equal(await page.locator('#shop_next_round').isEnabled(),true);
 await page.locator('#shop_next_round').click();await page.locator('#select_small').waitFor();
 assert.equal(await page.locator('#select_small_target').innerText(),'800');
 assert.equal(await page.locator('#select_big_target').innerText(),'1200');
 const saved=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));
 const s=deserializeState(saved);assert.equal(s.round.ante,2);assert.equal(s.apkBlinds.ante,2);
 await page.locator('#tag_small').click();await page.locator('#blind_tag_tooltip').waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),saved);
 await page.reload();await enterRun(page,{startBlind:false});
 assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),saved);
 if(width===1536)await page.screenshot({path:'artifacts/next-ante-selection.png'});
 await page.locator('#select_small').click();await page.locator('#hand .playing-card').first().waitFor();
 assert.equal(await page.locator('#round strong').innerText(),'4');assert.equal(await page.locator('#target_value').innerText(),'800');
 const playing=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));
 await page.reload();await enterRun(page);assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),playing);
 const won=deserializeState(playing);won.phase='round_won';won.round.score=800n;
 await page.evaluate(s=>localStorage.setItem('card-cascade.current',s),serializeState(won));await page.reload();await enterRun(page);
 await page.locator('#cashout').click();await page.locator('#shop_next_round').click();await page.locator('#select_big').waitFor();
 await page.locator('#select_big').click();await page.locator('#hand .playing-card').first().waitFor();
 assert.equal(await page.locator('#round strong').innerText(),'5');assert.equal(await page.locator('#target_value').innerText(),'1200');
 const big=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));big.phase='round_won';big.round.score=1200n;
 await page.evaluate(s=>localStorage.setItem('card-cascade.current',s),serializeState(big));await page.reload();await enterRun(page);
 await page.locator('#cashout').click();await page.locator('#shop_next_round').waitFor();assert.equal(await page.locator('#shop_next_round').isEnabled(),true);
 await page.locator('#shop_next_round').click();await page.locator('#select_boss').click();await page.locator('#hand .playing-card').first().waitFor();
 assert.equal(await page.locator('#round strong').innerText(),'6');
 const boss=deserializeState(await page.evaluate(()=>localStorage.getItem('card-cascade.current')));assert.equal(boss.round.blindId,'boss');assert.equal(boss.round.ante,2);
 assert.deepEqual(errors,[]);await page.close();console.log('ante two transition / targets / reload / rounds / playable boss '+width+'x'+height);
}}finally{await browser.close();}

