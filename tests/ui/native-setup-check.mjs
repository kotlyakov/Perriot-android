import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{
 for(const [width,height,touch] of [[1536,688,false],[915,412,true],[568,320,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await page.goto(process.env.PREVIEW_URL??'http://127.0.0.1:4173');await page.evaluate(()=>document.fonts.ready);
  const mount=async(save=false)=>page.evaluate(async save=>{const {renderStartScreen}=await import('/src/ui/start-screen.js'),{createProfile}=await import('/src/core/profile.js');const profile=createProfile();profile.deckWins=Object.fromEntries(['red','blue','yellow','green','black'].map(id=>[id,[1,0,0,0,0,0,0,0]]));globalThis.newOptions=null;globalThis.continued=0;renderStartScreen({profile,hasSave:save,savedState:save?{deckId:'blue',stake:4,roundNumber:7,round:{ante:3},money:42,bestHand:'98765',seed:'13031990'}:undefined,onNew:options=>globalThis.newOptions=options,onContinue:()=>globalThis.continued++});},save);
  const geometry=async()=>{const results=await page.locator('.start-setup, .start-setup button:not([hidden]), .start-setup input:not([hidden])').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().height&&getComputedStyle(n).visibility!=='hidden').map(n=>{const b=n.getBoundingClientRect();return {id:n.id||n.className,x:b.x,y:b.y,right:b.right,bottom:b.bottom};}));for(const b of results)assert.ok(b.x>=-1&&b.y>=-1&&b.right<=width+1&&b.bottom<=height+1,JSON.stringify(b));};
  await mount();await page.locator('#start_new').click();await geometry();assert.equal(await page.locator('#setup_seed').isVisible(),false);
  const order=await page.locator('.start-deck-choices').evaluate(n=>[...n.children].filter(n=>!n.hidden).map(n=>n.id||n.className));assert.deepEqual(order,['setup_deck_prev','start-deck-row','setup_deck_next']);assert.equal(await page.locator('.start-deck-wins .start-win-marker').count(),8);
  await page.locator('#setup_seed_toggle').check();await page.locator('#setup_seed').fill('13031990');await page.locator('#setup_stake_prev').click();assert.equal(await page.locator('#setup_stake').inputValue(),'8');
  const decks=await page.locator('#setup_deck_select option').count();
  for(let i=0;i<decks;i++){const size=await page.locator('.start-deck-info').evaluate(n=>({width:n.clientWidth,scroll:n.scrollWidth,height:n.clientHeight,scrollHeight:n.scrollHeight}));assert.ok(size.scroll<=size.width+1&&size.scrollHeight<=size.height+1,JSON.stringify(size));await page.locator('#setup_deck_next').click();}
  await page.locator('#setup_play').click();assert.deepEqual(await page.evaluate(()=>globalThis.newOptions),{deckId:'red',stake:8,seed:'13031990'});await geometry();
  if(width===1536)await page.screenshot({path:'artifacts/native-setup-new.png'});
  await page.locator('#setup_seed_toggle').uncheck();assert.equal(await page.locator('#setup_seed').inputValue(),'');assert.equal(await page.locator('#setup_stake').inputValue(),'1');
  await page.locator('#setup_challenge_tab').click();assert.equal(await page.locator('.challenge-progress').count(),2);assert.equal(await page.locator('[data-challenge-id]').count(),0);await page.locator('#challenge_new').click();await geometry();
  const ids=[];
  for(let listPage=0;listPage<2;listPage++){
   const entries=await page.locator('[data-challenge-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.challengeId));ids.push(...entries);
   for(const id of entries){await page.locator(`[data-challenge-id="${id}"]`).click();
    const inventory=await page.locator('.challenge-inventory>div').evaluateAll(nodes=>nodes.map(n=>({height:n.clientHeight,scroll:n.scrollHeight})));for(const box of inventory)assert.ok(box.scroll<=box.height+1,id+' inventory '+JSON.stringify(box));
    for(const section of ['rules','bans','deck']){await page.locator('#challenge_tab_'+section).click();let count=0;do{assert.ok(++count<30);const dimensions=await page.locator('#challenge_detail_content').evaluate(n=>({height:n.clientHeight,scroll:n.scrollHeight,text:n.textContent}));assert.ok(dimensions.height>0);assert.ok(dimensions.scroll<=dimensions.height+1,id+' '+section+' '+JSON.stringify(dimensions));assert.ok(dimensions.text);if(await page.locator('#challenge_detail_next').isDisabled())break;await page.locator('#challenge_detail_next').click();}while(true);}
   }if(listPage===0)await page.locator('#challenge_next_page').click();
  }
  assert.equal(new Set(ids).size,20);await page.locator('[data-challenge-id="jokerless"]').click();assert.equal(await page.locator('#challenge_play').isDisabled(),true);
  if(width===1536)await page.screenshot({path:'artifacts/native-setup-challenges.png'});
  await page.locator('#challenge_back').click();assert.equal(await page.locator('#challenge_new').isVisible(),true);await page.locator('#setup_new_tab').click();await page.locator('#setup_seed_toggle').check();await page.locator('#setup_seed').fill('13031990');await page.locator('#setup_challenge_tab').click();await page.locator('#challenge_new').click();await page.locator('#challenge_next_page').click();await page.locator('[data-challenge-id="jokerless"]').click();await page.locator('#challenge_play').click();assert.deepEqual(await page.evaluate(()=>globalThis.newOptions),{challengeId:'jokerless',deckId:'red',stake:1,seed:'13031990'});
  await mount(true);await page.locator('#start_new').click();assert.equal(await page.locator('.start-setup').getAttribute('data-mode'),'continue');assert.match(await page.locator('.start-continue-summary').textContent(),/98765/);assert.match(await page.locator('.start-continue-summary').textContent(),/\$42/);assert.equal(await page.evaluate(()=>globalThis.continued),0);assert.equal(await page.locator('#setup_stake').inputValue(),'4');await geometry();if(width===1536)await page.screenshot({path:'artifacts/native-setup-continue.png'});await page.locator('#setup_play').click();assert.equal(await page.evaluate(()=>globalThis.continued),1);await page.locator('#setup_back').click();assert.equal(await page.locator('.start-setup').count(),0);
  assert.deepEqual(errors,[]);await context.close();console.log(`Native setup, continuation, challenge flow and long text ${width}x${height}: PASS`);
 }
}finally{await browser.close();}
