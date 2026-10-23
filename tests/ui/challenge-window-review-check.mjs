import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{
 for(const [width,height,hasTouch] of [[1536,688,false],[915,412,true],[360,800,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.PREVIEW_URL??'http://127.0.0.1:4173');await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(async()=>{const {renderStartScreen}=await import('/src/ui/start-screen.js');const {createProfile}=await import('/src/core/profile.js');renderStartScreen({profile:{...createProfile(),deckWins:Object.fromEntries(['red','blue','yellow','green','black'].map(id=>[id,[1]]))},onNew:options=>globalThis.challengeSelection=options});});
  await page.locator('#start_new').click();await page.locator('#setup_challenge_tab').click();
  assert.equal(await page.locator('[data-challenge-id]').count(),10);assert.equal(await page.locator('#challenge_prev_page').isDisabled(),true);
  const ids=[];
  for(let listPage=0;listPage<2;listPage++){
   const entries=await page.locator('[data-challenge-id]').evaluateAll(nodes=>nodes.map(node=>node.dataset.challengeId));ids.push(...entries);
   for(const id of entries){
    await page.locator(`[data-challenge-id="${id}"]`).click();
    for(const section of ['conditions','rules','bans']){
     await page.locator('#challenge_tab_'+section).click();let count=0,visibleText=[];
     do{
      assert.ok(++count<30,'Details pagination terminates');
      const dimensions=await page.locator('#challenge_detail_content').evaluate(node=>({height:node.clientHeight,scroll:node.scrollHeight,text:node.textContent}));
      assert.ok(dimensions.height>0);assert.ok(dimensions.scroll<=dimensions.height+1,'No detail text is clipped or scrollable');visibleText.push(dimensions.text);assert.ok(dimensions.text.length>0);assert.doesNotMatch(dimensions.text,/undefined|NaN/);
      if(await page.locator('#challenge_detail_next').isDisabled())break;
      await page.locator('#challenge_detail_next').click();
     }while(true);
     const expectedNames=await page.evaluate(async({id,section})=>{const {CHALLENGES}=await import('/src/content/challenges.js');const {describeShopItem}=await import('/src/content/shop-display.js');const challenge=CHALLENGES.find(item=>item.id===id),centreIds=section==='conditions'?[...(challenge.startingJokers??[]).map(item=>item.id),...(challenge.startingConsumables??[]),...(challenge.startingVouchers??[])]:section==='bans'?challenge.bannedCentreIds??[]:[];return centreIds.map(entityId=>describeShopItem({entityId}).name);},{id,section});
     for(const name of expectedNames)assert.ok(visibleText.join(' ').includes(name),name+' remains reachable across detail pages');
    }
   }
   if(listPage===0)await page.locator('#challenge_next_page').click();
  }
  assert.equal(new Set(ids).size,20);assert.equal(await page.locator('#challenge_next_page').isDisabled(),true);
  await page.locator('[data-challenge-id="jokerless"]').click();assert.equal(await page.locator('#challenge_play').isDisabled(),true);
  await page.locator('#challenge_prev_page').click();await page.locator('[data-challenge-id="omelette"]').click();await page.locator('#challenge_play').click();assert.deepEqual(await page.evaluate(()=>globalThis.challengeSelection),{challengeId:'omelette',deckId:'red',stake:1});
  await page.locator('#challenge_back').click();assert.equal(await page.locator('#setup_deck_select').isVisible(),false);assert.equal(await page.locator('#setup_stake').isVisible(),false);await page.locator('#setup_deck_next').click();assert.equal(await page.locator('#setup_deck_select').inputValue(),'blue');await page.locator('#setup_deck_prev').click();assert.equal(await page.locator('#setup_stake_next').isDisabled(),false);await page.locator('#setup_stake_next').click();assert.equal(await page.locator('#setup_stake').inputValue(),'2');await page.locator('#setup_seed').fill('13031990');await page.locator('#setup_challenge_tab').click();await page.locator('#challenge_next_page').click();await page.locator('[data-challenge-id="jokerless"]').click();assert.equal(await page.locator('#challenge_play').isDisabled(),false);await page.locator('#challenge_play').click();assert.deepEqual(await page.evaluate(()=>globalThis.challengeSelection),{challengeId:'jokerless',deckId:'red',stake:1,seed:'13031990'});
  assert.deepEqual(errors,[]);await context.close();
 }
}finally{await browser.close();}
console.log('Challenge ten/page, all detail tabs/pages, gates and seed desktop/touch PASS');
