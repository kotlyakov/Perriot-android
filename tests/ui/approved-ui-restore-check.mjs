import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright'));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{
 for(const [width,height,hasTouch,reducedMotion] of [[1536,688,false,'no-preference'],[915,412,true,'no-preference'],[568,320,true,'reduce']]){
  const context=await browser.newContext({viewport:{width,height},hasTouch,reducedMotion}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PREVIEW_URL);
  await page.locator('#start_new').waitFor();
  assert.deepEqual(await page.locator('#start_screen').evaluate(n=>n.getAnimations().map(a=>a.effect.getTiming().iterations)),[],'home has no incoming slide');
  const duration=await page.locator('.start-logo').evaluate(n=>getComputedStyle(n).animationDuration);assert.equal(duration,reducedMotion==='reduce'?'0s':'4.8s');
  await page.screenshot({path:`artifacts/approved-home-${width}.png`});
  await page.locator('#start_settings').click();await page.locator('#game_speed_1').waitFor();await page.waitForFunction(()=>document.querySelector('.menu-window-content').getAttribute('aria-busy')!=='true');
  assert.equal(await page.locator('#menu_tab_graphics').count(),0);assert.equal(await page.locator('.menu-window-tabs button').count(),2);
  await page.locator('#game_speed_4').click();assert.equal(await page.locator('#game_speed_4').getAttribute('aria-pressed'),'true');assert.equal(await page.evaluate(()=>localStorage.getItem('pierrot.game-speed')),'4');
  await page.locator('#dialog').evaluate(async d=>{await Promise.allSettled(d.getAnimations().map(a=>a.finished));});
  await page.screenshot({path:`artifacts/approved-settings-game-${width}.png`});
  await page.locator('#menu_tab_audio').click();await page.locator('#audio_music').waitFor();await page.waitForFunction(()=>document.querySelector('.menu-window-content').getAttribute('aria-busy')!=='true');assert.equal(await page.locator('.settings-row input').count(),2);
  await page.locator('#audio_music').evaluate(n=>{n.value='0';n.dispatchEvent(new Event('input'));});assert.equal(await page.locator('.settings-row output').first().textContent(),'0%');
  await page.screenshot({path:`artifacts/approved-settings-audio-${width}.png`});
  const outside=await page.locator('#dialog').evaluate(d=>{const b=d.getBoundingClientRect();return b.left<0||b.top<0||b.right>innerWidth+1||b.bottom>innerHeight+1;});assert.equal(outside,false);
  await page.locator('#dialog-actions button').click();await page.waitForFunction(()=>!document.querySelector('#dialog').open);assert.equal(await page.locator('#start_new').isVisible(),true);
  await page.reload();await page.locator('#start_settings').click();await page.locator('#game_speed_4').waitFor();assert.equal(await page.locator('#game_speed_4').getAttribute('aria-pressed'),'true');
  await page.waitForFunction(()=>document.querySelector('.menu-window-content').getAttribute('aria-busy')!=='true');await page.locator('#dialog-actions button').click();await page.waitForFunction(()=>!document.querySelector('#dialog').open);
  await page.locator('#start_new').click();await page.locator('#setup_play').waitFor();await page.locator('#setup_seed_toggle').check();await page.locator('#setup_seed').fill('13031990');await page.locator('#setup_play').click();await page.locator('#select_small').waitFor();await page.locator('#select_small').click();await page.locator('#hand .playing-card').first().waitFor();
  const before=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));await page.locator('#hand .playing-card').first().click();await page.locator('#play_hand').click();await page.waitForFunction(previous=>JSON.parse(localStorage.getItem('card-cascade.current')).state.revision>previous,JSON.parse(before).state.revision);await page.waitForFunction(()=>!document.querySelector('#sort_rank').disabled);assert.equal(await page.locator('#play_hand').isDisabled(),true,'play remains disabled until next selection');await page.locator('#hand .playing-card').first().click();assert.equal(await page.locator('#play_hand').isEnabled(),true);const after=await page.evaluate(()=>localStorage.getItem('card-cascade.current'));assert.notEqual(after,before);
  assert.deepEqual(errors,[]);await context.close();console.log(`Approved home/settings/speed/persist/play ${width}x${height} ${reducedMotion} PASS`);
 }
}finally{await browser.close();}
