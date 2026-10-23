import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE??process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try {
 await mkdir('artifacts',{recursive:true});
 for(const [width,height,touch] of [[1536,688,false],[915,412,true],[360,800,true]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:touch,reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.PREVIEW_URL);await page.locator('#start_settings').click();
  await page.locator('#audio_music').waitFor({timeout:3000});
  const before=await page.evaluate(()=>[localStorage.getItem('card-cascade.current'),localStorage.getItem('card-cascade.backup')]);
  await page.locator('#audio_music').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input'));});
  await page.locator('#audio_effects').evaluate(el=>{el.value='25';el.dispatchEvent(new Event('input'));});
  assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('card-cascade.current'),localStorage.getItem('card-cascade.backup')]),before);
  assert.equal(await page.locator('label[for=audio_effects] output').textContent(),'25%');
  if(width>=900){const last=await page.locator('#dialog-actions button').last().boundingBox();assert.ok(last.y+last.height<=height,'Settings actions fit on a landscape phone');}
  await page.screenshot({path:`artifacts/item11-settings-${width}.png`});
  await page.reload();await page.locator('#start_settings').click();
  assert.equal(await page.locator('#audio_music').inputValue(),'0');assert.equal(await page.locator('#audio_effects').inputValue(),'25');
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('full');};});
  await page.locator('#audio_effects').evaluate(el=>{el.value='80';el.dispatchEvent(new Event('input'));});
  assert.equal(await page.locator('#audio_effects').inputValue(),'25','Failed writes restore last persisted value');
  assert.match(await page.locator('#notice').textContent(),/настройки/);
  assert.deepEqual(errors,[]);await page.close();
 }
 const page=await browser.newPage();await page.goto(process.env.PREVIEW_URL);
 const energy=await page.evaluate(async()=>{
  const {createGameAudio}=await import('/src/ui/audio.js');
  const context=new OfflineAudioContext(1,48000,48000);
  // Offline contexts begin suspended: emulate an activated output while rendering
  // real oscillator/gain nodes into a real PCM buffer. Lifecycle is tested below.
  const output={state:'running',currentTime:0,destination:context.destination,createGain:()=>context.createGain(),createOscillator:()=>context.createOscillator()};
  const audio=createGameAudio({contextFactory:()=>output});
  audio.setVolumes({music:0,effects:1});audio.unlock();audio.play('buy');
  const pcm=(await context.startRendering()).getChannelData(0);audio.dispose();
  return {peak:Math.max(...pcm.map(Math.abs)),finite:pcm.every(Number.isFinite)};
 });
 assert.ok(energy.peak>.001&&energy.peak<1);assert.equal(energy.finite,true);
 await page.mouse.click(10,10); // Grant a real activation before testing live AudioContext.
 const lifecycle=await page.evaluate(async()=>{
  const {createGameAudio}=await import('/src/ui/audio.js');
  const context=new AudioContext(),audio=createGameAudio({contextFactory:()=>context});
  audio.setVolumes({music:0,effects:.5});audio.unlock();await Promise.race([context.resume(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Audio activation timed out')),3000))]);
  audio.setActive(false);await context.suspend();const paused=context.state;
  audio.setActive(true);await context.resume();const resumed=context.state;
  audio.dispose();await new Promise(resolve=>setTimeout(resolve,30));
  return {paused,resumed,closed:context.state};
 });
 assert.deepEqual(lifecycle,{paused:'suspended',resumed:'running',closed:'closed'});
 for(const mode of ['locked','muted','hidden']){
  const peak=await page.evaluate(async mode=>{
   const {createGameAudio}=await import('/src/ui/audio.js');
   const context=new OfflineAudioContext(1,24000,48000);
   const output={state:'running',currentTime:0,destination:context.destination,createGain:()=>context.createGain(),createOscillator:()=>context.createOscillator()};
   const audio=createGameAudio({contextFactory:()=>output});audio.setVolumes({music:0,effects:1});
   if(mode!=='locked')audio.unlock();
   if(mode==='muted')audio.setVolumes({music:0,effects:0});
   if(mode==='hidden')audio.setActive(false);
   audio.play('buy');const pcm=(await context.startRendering()).getChannelData(0);audio.dispose();return Math.max(...pcm.map(Math.abs));
  },mode);
  assert.equal(peak,0,mode+' must not produce audio');
 }
 await page.close();
}finally{await browser.close();}
console.log('Item11: offline audio rendering, settings persistence, failure rollback, desktop/touch PASS');
