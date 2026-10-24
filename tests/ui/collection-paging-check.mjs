import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{for(const [width,height,touch,motion] of [[1536,688,false,'no-preference'],[915,412,true,'reduce'],[568,320,true,'reduce']]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch,reducedMotion:motion}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);await page.evaluate(()=>document.fonts.ready);
 // Bounds include content, not only the outer button; max-length names stay contained.
 for(const name of ['Игрок','Ш'.repeat(16)]){
  await page.locator('#start_profile').click();await page.locator('#profile_name').fill(name);await page.locator('#profile_name').press('Tab');await page.locator('#dialog-actions button').click();await page.locator('#start_screen').evaluate(n=>Promise.allSettled(n.getAnimations().map(a=>a.finished)));
  const geometry=await page.locator('#start_profile').evaluate(n=>{const b=n.getBoundingClientRect();return {button:b.toJSON(),children:[...n.children].map(c=>c.getBoundingClientRect().toJSON()),title:n.title,name:n.getAttribute('aria-label')};});assert.match(geometry.name,new RegExp(name));
  for(const c of geometry.children){assert.ok(c.x>=geometry.button.x&&c.y>=geometry.button.y&&c.right<=geometry.button.right+1&&c.bottom<=geometry.button.bottom+1,'Profile child is inside its button');}
  assert.ok(geometry.button.x>=0&&geometry.button.y>=0&&geometry.button.right<=width&&geometry.button.bottom<=height,JSON.stringify(geometry));
 }
 await page.screenshot({path:`artifacts/profile-home-bounds-${width}.png`});await page.locator('#start_collection').click();
 const cdp=await context.newCDPSession(page);
 async function swipe(direction,vertical=false,cancel=false){const box=await page.locator('.collection-grid').boundingBox(),card=await page.locator('.collection-card').first().boundingBox();const x=card.x+card.width/2,y=card.y+card.height/2,dx=vertical?4:Math.min(box.width*.55,200)*(direction==='left'?1:-1),dy=vertical?Math.min(box.height*.35,90):3;
  // direction right means finger moves left, next page.
  if(touch){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/6,y:y+dy*i/6,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});}
  else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:6});await page.mouse.up();}
 }
 async function finished(){await page.locator('.collection-grid').evaluate(n=>Promise.allSettled(n.getAnimations().map(a=>a.finished)));}
 for(const set of ['Joker','Back','Voucher','Tarot','Planet','Spectral','Enhanced','Seal','Edition','Booster','Tag','Blind']){
  await page.locator('#collection_category_'+set).click();const order=await page.locator('.collection-paging').evaluate(n=>[...n.children].filter(c=>!c.hidden).map(c=>c.id));assert.deepEqual(order,['collection_prev','collection_page','collection_next']);
  const text=()=>page.locator('#collection_page').textContent(),first=await text(),pages=Number(first.split('/')[1]);assert.equal(Number(first.split('/')[0]),1);
  if(pages>1){
   await page.locator('#collection_next').click();
   if(motion==='no-preference'){assert.ok(await page.locator('.collection-grid').evaluate(n=>n.getAnimations().length)>0,'Page turn animates');}
   await finished();assert.equal(Number((await text()).split('/')[0]),2);await page.locator('#collection_prev').click();await finished();assert.equal(await text(),first);
   await swipe('right');await finished();assert.equal(Number((await text()).split('/')[0]),2,'Finger left goes next');assert.equal(await page.locator('#collection_details').isVisible(),false,'Swipe does not click a card');
   await swipe('left');await finished();assert.equal(await text(),first,'Finger right goes previous');
   if(touch){await swipe('right',true);await finished();assert.equal(await text(),first,'Vertical gesture is not paging');await swipe('right',false,true);await finished();assert.equal(await text(),first,'Cancelled gesture is not paging');}
   await page.locator('#collection_prev').click();await finished();assert.equal(Number((await text()).split('/')[0]),pages,'Previous wraps');await page.locator('#collection_next').click();await finished();assert.equal(await text(),first);
  }else{assert.equal(await page.locator('#collection_prev').isDisabled(),true);assert.equal(await page.locator('#collection_next').isDisabled(),true);await swipe('right');await finished();assert.equal(await text(),first);}
  if(motion==='reduce')assert.equal(await page.locator('.collection-grid').evaluate(n=>n.getAnimations().length),0);
  if(set==='Joker')await page.screenshot({path:`artifacts/collection-paging-${width}.png`});await page.locator('#dialog-actions button').click();
 }
 assert.deepEqual(errors,[]);await context.close();console.log(`Collection buttons/swipes/animation/profile bounds ${width}: PASS`);
}}finally{await browser.close();}
