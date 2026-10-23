import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{for(const [width,height,touch] of [[1536,688,false],[915,412,true],[568,320,true]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);await page.locator('#start_collection').click();
 const tap=async n=>touch?n.tap():n.click();
 for(const set of ['Joker','Tarot','Planet','Spectral','Back','Voucher','Blind']){
  await tap(page.locator('#collection_category_'+set));
  const cards=page.locator('.collection-card');
  for(const index of [0,await cards.count()-1]){
   const card=cards.nth(index);if(!touch){await card.hover();assert.equal(await page.locator('#collection_details').isVisible(),false,'Hover cannot reopen a dismissed explanation');}
   await tap(card);const t=await page.locator('#collection_details').boundingBox(),c=await card.boundingBox(),stage=await page.locator('#stage').boundingBox(),scale=stage.width/1536;
   assert.ok(t,'Tap opens tooltip');assert.equal(await page.locator('#collection_details button').count(),0);
   assert.ok(t.x>=stage.x-1&&t.y>=stage.y-1&&t.x+t.width<=stage.x+stage.width+1&&t.y+t.height<=stage.y+stage.height+1,'Tooltip stays in the game view');
   const gap=Math.max(c.x-t.x-t.width,t.x-c.x-c.width,c.y-t.y-t.height,t.y-c.y-c.height);assert.ok(gap>=-1&&gap<=24*scale+2,`${set}: tooltip adjacent, gap=${gap}`);
   await page.screenshot({path:`artifacts/tooltip-${set}-${index}-${width}.png`});
   if(touch)await page.touchscreen.tap(t.x+t.width/2,t.y+t.height/2);else await page.mouse.click(t.x+t.width/2,t.y+t.height/2);assert.equal(await page.locator('#collection_details').isVisible(),false,'Tap description dismisses it');
   await tap(card);await tap(card);assert.equal(await page.locator('#collection_details').isVisible(),false,'Same card toggles off');
   await tap(card);if(touch)await page.touchscreen.tap(width-4,height-4);else await page.mouse.click(width-4,height-4);assert.equal(await page.locator('#collection_details').isVisible(),false,'Empty-space tap dismisses');
  }
  await tap(page.locator('#dialog-actions button'));
 }
 assert.deepEqual(errors,[]);await context.close();console.log(`Collection tooltip adjacency/dismissal without close buttons ${width}: PASS`);
}}finally{await browser.close();}
