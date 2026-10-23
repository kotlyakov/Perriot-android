import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{
 await mkdir('artifacts',{recursive:true});
 for(const [width,height,touch] of [[1536,688,false],[915,412,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('card-cascade.current')));
  await page.goto(process.env.PREVIEW_URL);await page.locator('#start_new').click();
  assert.equal(await page.locator('#setup_deck_blue').isDisabled(),true);
  await page.locator('#setup_seed').fill('13031990');
  assert.equal(await page.locator('#setup_deck_select option:disabled').count(),0);
  assert.equal(await page.locator('#setup_stake option:disabled').count(),0);
  await page.locator('#setup_deck_select').selectOption('yellow');await page.locator('#setup_stake').selectOption('8');
  await page.locator('#setup_seed').fill('13031991');assert.equal(await page.locator('#setup_play').isDisabled(),true);assert.equal(await page.locator('#setup_challenge_tab').isDisabled(),true);
  await page.locator('#setup_seed').fill('13031990');assert.equal(await page.locator('#setup_play').isDisabled(),false);
  await page.locator('#setup_stake').selectOption('8');
  await page.screenshot({path:`artifacts/item12-seed-${width}.png`});
  await page.locator('#setup_play').click();await page.locator('#select_small').waitFor();
  let raw=await saved();assert.equal(raw.state.seed,'13031990');assert.deepEqual(raw.state.money,'100');assert.equal(raw.state.deckId,'yellow');assert.equal(raw.state.stake,8);
  assert.equal(raw.state.apkShop.context.lockedCentreIds.length,0);assert.ok(raw.state.apkShop.context.unlockedCentreIds.includes('j_blueprint'));
  assert.ok(!raw.account.profiles['1'].profile.unlocked.includes('b_yellow'));
  await page.reload();await page.locator('#start_new').waitFor();
  await page.locator('#start_collection').click();await page.locator('#collection_set').selectOption('Joker');
  assert.equal(await page.locator('#collection_tally').textContent(),'150/150');assert.equal(await page.locator('.collection-card[data-discovered=false]').count(),0);
  await page.locator('#dialog-actions button').last().click();
  await page.locator('#start_new').click();assert.equal(await page.locator('#setup_deck_yellow').isDisabled(),true);
  await page.locator('#setup_seed').fill('13031990');await page.locator('#setup_challenge_tab').click();
  assert.equal(await page.locator('.challenge-list button[data-unlocked=true]').count(),20);
  await page.locator('.challenge-list button').last().click();assert.equal(await page.locator('#challenge_play').isDisabled(),false);
  await page.screenshot({path:`artifacts/item12-challenges-${width}.png`});
  await page.locator('#challenge_back').click();assert.equal(await page.locator('#setup_seed').inputValue(),'13031990');
  await page.locator('#setup_challenge_tab').click();await page.locator('#challenge_play').click();await page.locator('#dialog-actions button').first().click();await page.locator('#select_small').waitFor();
  raw=await saved();assert.equal(raw.state.challengeId,'omelette');assert.equal(raw.state.seed,'13031990');assert.deepEqual(raw.state.money,'100');
  assert.equal(Object.values(raw.account.profiles['1'].profile.runs).at(-1).seeded,true);
  await page.locator('#select_small').click();await page.locator('#hand .playing-card').first().waitFor();
  const current=await saved();await page.reload();await page.locator('#start_new').click();await page.locator('#setup_continue_tab').click();
  assert.deepEqual((await saved()).state,current.state,'Continue preserves exact state');
  assert.deepEqual(errors,[]);await context.close();
 }
}finally{await browser.close();}
console.log('verification seed desktop/touch gates, money, collection, challenges, resume PASS');
