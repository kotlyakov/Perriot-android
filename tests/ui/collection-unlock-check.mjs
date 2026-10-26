import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{for(const [width,height] of [[1536,688],[915,412],[568,320]])for(const motion of ['no-preference','reduce']){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,reducedMotion:motion}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);
 const targetPage=await page.evaluate(async()=>{const {collectionEntries,createProfile}=await import('/src/core/profile.js');return Math.floor(collectionEntries(createProfile()).filter(e=>e.set==='Joker').sort((a,b)=>a.order-b.order).findIndex(e=>e.id==='j_satellite')/15);});
 async function category(){await page.locator('#start_collection').click();await page.locator('#collection_category_Joker').click();await page.locator('#collection_page_select').evaluate((n,v)=>{n.value=String(v);n.dispatchEvent(new Event('change'));},targetPage);await page.locator('.collection-grid').evaluate(n=>Promise.allSettled(n.getAnimations().map(a=>a.finished)));}
 const card=page.locator('#collection_j_satellite');await category();
 assert.equal(await card.getAttribute('data-card-state'),'locked');assert.equal(await card.locator('.collection-chain-link').count(),28);assert.equal(await card.locator('.shop-art').count(),0);
 const saveBefore=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await card.click();assert.match(await page.locator('#collection_details').innerText(),/Ещё не открыто/);assert.match(await page.locator('#collection_details').innerText(),/400/);assert.ok(await card.getAttribute('aria-describedby'));
 await page.locator('#collection_details').click();assert.equal(await card.getAttribute('aria-describedby'),null);assert.equal(await card.locator('.collection-unlocking').count(),0);assert.equal(await page.evaluate(()=>localStorage.getItem('card-cascade.current')),saveBefore);
 await page.screenshot({path:`artifacts/collection-locked-${width}-${motion}.png`});
 // Apply a real persisted ordinary-run transition; no UI-side unlock flags are changed.
 await page.evaluate(async()=>{const {createProfileStore}=await import('/src/persistence/profile-store.js'),{createBackend}=await import('/src/persistence/backend.js'),{createRun}=await import('/src/core/run.js');const store=createProfileStore(createBackend({storage:localStorage}));store.load();store.reset(createRun('COLLECTION-REAL',{runId:'collection-real',money:400n,referenceRng:true,referenceShop:true}),{seeded:false});});
 await page.reload();await category();assert.equal(await card.getAttribute('data-card-state'),'unseen');assert.equal(await card.locator('.shop-art').count(),0,'Unlocking must not reveal undiscovered art');
 if(motion==='no-preference'){
  assert.ok(await card.evaluate(n=>n.classList.contains('collection-unlocking')),'A real new unlock plays on next collection visit');
  await card.evaluate(n=>{for(const a of n.getAnimations({subtree:true}))a.pause();for(const a of n.getAnimations({subtree:true}))a.currentTime=450;});
  const open=await card.locator('.collection-lock-shackle').evaluate(n=>getComputedStyle(n).transform);assert.notEqual(open,'none','Shackle opens intact');
  const bends=await card.locator('.collection-chain-link').evaluateAll(nodes=>new Set(nodes.map(n=>getComputedStyle(n).translate)).size);assert.ok(bends>2,'Links bend and fall with individual offsets');
  await page.screenshot({path:`artifacts/collection-unlock-opening-${width}.png`});
  // Cancel via page turn; the unseen celebration must survive reopening.
  await page.locator('#collection_next').click();await page.locator('.collection-grid').evaluate(n=>Promise.allSettled(n.getAnimations().map(a=>a.finished)));await page.locator('#collection_prev').click();await page.locator('.collection-grid').evaluate(n=>Promise.allSettled(n.getAnimations().map(a=>a.finished)));
  assert.ok(await card.evaluate(n=>n.classList.contains('collection-unlocking')));
  await card.evaluate(n=>Promise.allSettled(n.getAnimations({subtree:true}).map(a=>a.finished)));
 }else assert.equal(await card.locator('.collection-lock').count(),0,'Reduced motion shows the final state immediately');
 assert.equal(await card.locator('.collection-lock').count(),0);await page.screenshot({path:`artifacts/collection-unlocked-${width}-${motion}.png`});
 await page.locator('#dialog-actions button').click();await page.locator('#dialog-actions button').click();await category();assert.equal(await card.locator('.collection-lock').count(),0,'Completed celebrations never replay');
 assert.equal(await page.locator('.collection-card').count(),15);
 await page.evaluate(async()=>{const {createProfileStore}=await import('/src/persistence/profile-store.js'),{createBackend}=await import('/src/persistence/backend.js');const store=createProfileStore(createBackend({storage:localStorage})),state=store.load().state;state.revision++;state.jokers.push({id:'owned-satellite',entityId:'j_satellite'});store.save(state);});
 await page.reload();await category();assert.equal(await card.getAttribute('data-card-state'),'discovered');assert.equal(await card.locator('.shop-art').count(),1,'Only actual ownership reveals the artwork');assert.equal(await card.locator('.collection-lock').count(),0);
 await page.evaluate(async()=>{const {createProfileStore}=await import('/src/persistence/profile-store.js'),{createBackend}=await import('/src/persistence/backend.js'),{createRun}=await import('/src/core/run.js');const store=createProfileStore(createBackend({storage:localStorage}));store.load();store.reset(createRun('13031990',{runId:'collection-verification',money:4n,referenceRng:true,referenceShop:true}),{seeded:true});});
 await page.reload();await category();assert.ok(await page.locator('.collection-card[data-card-state=locked]').count()>0,'A verification run must not turn the real profile collection into fully unlocked artwork');assert.equal(await page.locator('.collection-card[data-card-state=locked] .shop-art').count(),0);
 const closed=page.locator('.collection-card[data-card-state=locked]').first(),other=page.locator('.collection-card[data-card-state=locked]').nth(1),border=await closed.evaluate(n=>getComputedStyle(n).borderColor);
 assert.equal(await closed.locator('.collection-chain-link').count(),28);await closed.click();assert.match(await page.locator('#collection_details').innerText(),/Ещё не открыто/);assert.notEqual(await closed.evaluate(n=>getComputedStyle(n).borderColor),border,'A selected locked card receives a coloured frame');
 await page.mouse.click(width-4,height-4);assert.equal(await closed.getAttribute('aria-describedby'),null);assert.equal(await closed.evaluate(n=>getComputedStyle(n).borderColor),border,'Empty-space dismissal clears the coloured frame');
 await closed.click();await other.click();assert.equal(await closed.getAttribute('aria-describedby'),null);assert.equal(await closed.evaluate(n=>getComputedStyle(n).borderColor),border);assert.ok(await other.getAttribute('aria-describedby'));
 const previous=await other.elementHandle();await page.locator('#collection_next').click();await page.locator('.collection-grid').evaluate(n=>Promise.allSettled(n.getAnimations().map(a=>a.finished)));assert.equal(await previous.getAttribute('aria-describedby'),null);assert.equal(await page.locator('.collection-card[aria-describedby]').count(),0);
 // Every category keeps the approved three-part pager even under an active verification run.
 await page.locator('#dialog-actions button').click();
 for(const set of ['Joker','Back','Voucher','Tarot','Planet','Spectral','Enhanced','Seal','Edition','Booster','Tag','Blind']){
  await page.locator('#collection_category_'+set).click();assert.deepEqual(await page.locator('.collection-paging').evaluate(n=>[...n.children].filter(c=>!c.hidden).map(c=>c.id)),['collection_prev','collection_page','collection_next']);
  await page.locator('#dialog-actions button').click();
 }

 assert.deepEqual(errors,[]);await context.close();console.log(`Collection real unlock, chains, cancellation and tooltip ${width}/${motion}: PASS`);
}}finally{await browser.close();}
