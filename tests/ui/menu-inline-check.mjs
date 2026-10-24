import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const built=spawnSync(process.execPath,['scripts/build-menu-review.mjs'],{stdio:'inherit'});
assert.equal(built.status,0);
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try {
 const page=await browser.newPage({viewport:{width:1024,height:650}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // The conversation is HTTPS; localhost gives its nested srcdoc the same secure crypto APIs.
 await page.goto(process.env.PREVIEW_URL);
 assert.equal(await page.evaluate(()=>isSecureContext&&typeof crypto.randomUUID==='function'),true);
 // Emulate the host's outer sandbox; application preview is a second nested frame.
 await page.setContent('<iframe sandbox="allow-scripts allow-same-origin allow-modals" style="width:100%;height:600px;border:0"></iframe>');
 const host=page.frames()[1];
 await host.setContent(await readFile('artifacts/menu-review-fragment.html','utf8'));
 const app=host.frameLocator('iframe');
 await app.locator('#options_settings').waitFor();
 await host.locator('[data-review="party"]').click();
 await app.locator('#menu_tab_hands').waitFor();
 await host.locator('[data-review="settings"]').click();
 await app.locator('#menu_tab_audio').click();
 await host.locator('[data-review="collection"]').click();
 assert.equal(await app.locator('.collection-card').count(),15);
 await app.locator('#collection_next').click();
 await host.locator('[data-review="party"]').click();
 await app.locator('#menu_tab_blinds').click();
 await host.locator('[data-review="profile"]').click();
 await app.locator('#profile_stats_tab').click();
 await host.locator('[data-review="main"]').click();
 await app.locator('#start_new').waitFor();
 await app.locator('#start_new').click();
 await app.locator('#setup_seed').fill('13031990');
 await app.locator('#setup_challenge_tab').click();
 const panel=app.locator('.start-setup');
 await panel.evaluate(async node=>{await Promise.all(node.getAnimations().map(a=>a.finished));});
 const bounds=await panel.evaluate(node=>{const b=node.getBoundingClientRect();return {top:b.top,bottom:b.bottom,height:innerHeight};});
 assert.ok(bounds.top>=0&&bounds.bottom<=bounds.height+1,JSON.stringify(bounds));
 await page.screenshot({path:'artifacts/windows-inline-preview.png'});
 assert.deepEqual(errors,[]);
 console.log('Inline compressed real application: nested sandbox startup/navigation PASS');
} finally {await browser.close();}
