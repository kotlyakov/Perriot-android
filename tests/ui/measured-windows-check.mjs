import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
try{await mkdir('artifacts/measured-windows',{recursive:true});for(const [width,height] of [[1536,688],[915,412],[568,320]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);
 async function fit(selector){const result=await page.locator(selector).evaluate(root=>{const box=root.getBoundingClientRect(),issues=[];for(const n of [root,...root.querySelectorAll('button,input')]){const r=n.getBoundingClientRect();if(!r.width||!r.height||getComputedStyle(n).visibility==='hidden')continue;if(r.left<box.left-1||r.top<box.top-1||r.right>box.right+1||r.bottom>box.bottom+1)issues.push(n.id+' escapes window');}if(box.left<0||box.top<0||box.right>innerWidth+1||box.bottom>innerHeight+1)issues.push('escapes screen');return {issues,logicalWidth:root.offsetWidth,logicalHeight:root.offsetHeight};});assert.deepEqual(result.issues,[]);return result;}
 await page.locator('#start_new').click();let box=await fit('.start-setup');assert.equal(box.logicalWidth,608);assert.equal(box.logicalHeight,610);
 for(let i=0;i<15;i++){await page.locator('#setup_deck_next').click();const text=await page.locator('.start-deck-info p').evaluate(n=>({w:n.clientWidth,sw:n.scrollWidth,h:n.clientHeight,sh:n.scrollHeight}));assert.ok(text.sw<=text.w+1&&text.sh<=text.h+1,JSON.stringify(text));}
 await page.locator('#setup_seed_toggle').check();await fit('.start-setup');await page.screenshot({path:`artifacts/measured-windows/setup-${width}.png`});await page.locator('#setup_back').click();
 await page.locator('#start_collection').click();box=await fit('#dialog');assert.equal(box.logicalWidth,646);assert.ok(box.logicalHeight<=500);await page.screenshot({path:`artifacts/measured-windows/collection-${width}.png`});await page.locator('#dialog-actions button').click();
 await page.locator('#start_profile').click();box=await fit('#dialog');assert.equal(box.logicalWidth,642);await page.screenshot({path:`artifacts/measured-windows/profile-${width}.png`});assert.deepEqual(errors,[]);await page.close();console.log(`Measured setup, collection index and profile ${width}×${height} PASS`);
 }}finally{await browser.close();}
