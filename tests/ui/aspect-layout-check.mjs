import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {enterRun} from './enter-run.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 await mkdir('artifacts/aspect-layout',{recursive:true});
 for(const [width,height] of [[1536,688],[1536,864],[915,412],[568,320],[320,568]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);
  await page.waitForFunction(()=>document.getElementById('stage').dataset.layoutProfile==='home');
  const home=await page.locator('#stage').boundingBox();assert.ok(home.x>=-.1&&home.y>=-.1&&home.x+home.width<=width+.1&&home.y+home.height<=height+.1,'Approved home keeps full screenshot-fit profile');
  await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();
  await page.waitForFunction(()=>document.getElementById('stage').dataset.layoutProfile!=='home');
  const hud=await page.locator('#hud').boundingBox();if(width===1536&&height===864)assert.ok(hud.width>356&&hud.width<359,'16:9 grows HUD in native room units');
  async function inside(selector){
   const bad=await page.locator(selector).evaluateAll(nodes=>nodes.filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.height&&(r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5);}).map(n=>({id:n.id,cls:n.className,rect:n.getBoundingClientRect().toJSON()})));
   assert.deepEqual(bad,[],selector+' remains inside '+width+'×'+height);
  }
  await inside('#hand .playing-card,#play_hand,#discard,#sort_rank,#sort_suit,#run_info,#options,#deck,#deck_count');
  const first=page.locator('#hand .playing-card').first(),box=await first.boundingBox();
  await page.mouse.move(box.x+box.width*.15,box.y+box.height*.7);await page.mouse.down();await page.waitForTimeout(430);await page.mouse.up();
  await page.locator('.card-tip').waitFor({state:'visible'});await inside('.card-tip');
  await page.mouse.click(width-3,height-3);await page.screenshot({path:`artifacts/aspect-layout/field-${width}x${height}.png`});
  const firstId=await first.getAttribute('data-card-id'),lastBox=await page.locator('#hand .playing-card').last().boundingBox(),from=await first.boundingBox();
  await page.mouse.move(from.x+from.width*.15,from.y+from.height*.7);await page.mouse.down();
  await page.mouse.move(lastBox.x+lastBox.width*.15,from.y+from.height*.7,{steps:8});await page.mouse.up();
  await page.waitForFunction(id=>document.querySelector('#hand .playing-card:last-child')?.dataset.cardId===id,firstId);
  const saved=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));
  assert.equal(JSON.parse(saved).state.hand.at(-1),firstId,'Actual-target drag commits the end insertion');
  await page.reload();await enterRun(page);await page.locator('#hand .playing-card').first().waitFor();
  assert.equal(await page.locator('#hand .playing-card').last().getAttribute('data-card-id'),firstId,'Reordered hand survives reload');
  const fixtureSaved=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));
  // UI fixture stresses negative-slot inventories without modifying persisted state.
  await page.evaluate(async()=>{
   const {createRun,dispatch}=await import('/src/core/run.js'),{renderShop}=await import('/src/ui/shop-screen.js');
   let s=createRun('aspect-fixture',{runId:'aspect-fixture',money:100n,referenceRng:true,referenceShop:true});s.phase='round_won';s.round.score=s.round.target;s.round.handsRemaining=1;s=dispatch(s,{type:'CASH_OUT',expectedRevision:0}).state;
   s.jokers=Array.from({length:12},(_,i)=>({id:'aspect-j'+i,entityId:'j_joker',set:'Joker',edition:'negative',sellCost:1n}));
   s.consumables=Array.from({length:6},(_,i)=>({id:'aspect-c'+i,entityId:'c_fool',set:'Tarot',edition:'negative',sellCost:1n}));
   renderShop(s,false,{});
  });
  await inside('#shop_owned .shop-card,#shop_reroll,#shop_next_round,#shop_screen .shop-card');assert.ok(await page.evaluate(()=>localStorage.getItem('card-cascade.current'))===fixtureSaved,'UI fixture does not mutate persisted state');
  await page.screenshot({path:`artifacts/aspect-layout/expanded-${width}x${height}.png`});
  assert.deepEqual(errors,[]);await context.close();console.log(`Native room scale, approved home, hand controls, tooltip, expanded inventory ${width}×${height} PASS`);
 }
}finally{await browser.close();}
