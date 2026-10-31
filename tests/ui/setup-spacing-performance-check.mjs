import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{
 for(const [width,height] of [[1536,688],[915,412],[568,320]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,reducedMotion:'reduce'}),page=await context.newPage();
  await page.goto(process.env.PREVIEW_URL);await page.evaluate(()=>document.fonts.ready);
  await page.locator('#start_new').click();
  const check=async()=>{
   const failures=await page.locator('.start-setup').evaluate(panel=>{
    const p=panel.getBoundingClientRect(),failures=[],visible=n=>n.getBoundingClientRect().width&&getComputedStyle(n).visibility!=='hidden';
    const rows=[...panel.children].filter(visible);
    for(const n of rows){const b=n.getBoundingClientRect();if(b.left<p.left-1||b.right>p.right+1||b.top<p.top-1||b.bottom>p.bottom+1)failures.push('outside panel: '+n.className);}
    for(let i=1;i<rows.length;i++)if(rows[i].getBoundingClientRect().top<rows[i-1].getBoundingClientRect().bottom-1)failures.push('rows overlap: '+rows[i].className);
    for(const n of panel.querySelectorAll('.start-deck-info,.start-stake-center,.start-deck-row,.start-stake-description,.start-seed-label'))if(visible(n)&&!n.hidden&&(n.scrollHeight>n.clientHeight+1||n.scrollWidth>n.clientWidth+1))failures.push('content overflow: '+n.className);
    for(const n of panel.querySelectorAll('.start-deck-info,.start-stake-center')){const b=n.getBoundingClientRect(),p=n.parentElement.getBoundingClientRect();if(b.top<p.top-1||b.bottom>p.bottom+1)failures.push('outside section: '+n.className+' '+JSON.stringify({top:b.top,bottom:b.bottom,parentTop:p.top,parentBottom:p.bottom,grid:getComputedStyle(n).gridTemplateRows,width:b.width}));}
    return failures;
   });assert.deepEqual(failures,[],`${width}x${height}`);
  };
  await check();await page.locator('#setup_seed_toggle').check();await page.locator('#setup_seed').fill('13031990');await check();
  for(let i=0;i<15;i++){await page.locator('#setup_deck_next').click();await check();}
  for(let i=0;i<8;i++){await page.locator('#setup_stake_next').click();await check();}
  await page.screenshot({path:`artifacts/setup-spacing-${width}.png`});
  await page.locator('#setup_play').click();await page.locator('#select_small').waitFor();assert.equal(await page.locator('#start_screen').count(),0);
  const blinds=await page.locator('#blind_selection .blind-choice-select,#blind_selection .blind-choice-name,#blind_selection .blind-choice-target').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return {left:b.left,top:b.top,right:b.right,bottom:b.bottom};}));
  for(const b of blinds)assert.ok(b.left>=-1&&b.top>=-1&&b.right<=width+1&&b.bottom<=height+1,JSON.stringify(b));
  await page.screenshot({path:`artifacts/setup-to-blinds-${width}.png`});
  await page.evaluate(async()=>{const {renderStartScreen}=await import('/src/ui/start-screen.js');renderStartScreen({hasSave:true,savedState:{deckId:'blue',stake:4,roundNumber:7,round:{ante:3},money:42,seed:'13031990'},onContinue(){}});});
  await page.locator('#start_new').click();await page.screenshot({path:`artifacts/setup-spacing-continue-${width}.png`});await check();
  await context.close();console.log(`Setup rows/content and new-run → blinds ${width}x${height}: PASS`);
 }
}finally{await browser.close();}
