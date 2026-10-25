import test from 'node:test';
import assert from 'node:assert/strict';
import {APK_BLINDS} from '../../src/content/apk-blinds.js';
import {STAKES} from '../../src/content/stakes.js';
const model=async()=>{const m=await import('../../src/ui/blind-hud.js').catch(()=>({}));assert.equal(typeof m.blindHudDetails,'function','approved blind HUD details exist');return m.blindHudDetails;};
test('boss condition and stake come from the current run without mutating it',async()=>{
 const hud=await model(),state={round:{blindId:'boss'},apkBlinds:{bossId:'bl_hook'},stake:4};
 const before=structuredClone(state),d=hud(state);assert.equal(d.name,'Крюк');assert.match(d.condition,/две.*карты/);assert.equal(d.stake.name,'Чёрная ставка');assert.equal(d.stake.color,STAKES[3].color);assert.deepEqual(state,before);
});
test('disabled boss condition never describes an effect as active',async()=>{
 const hud=await model();for(const flags of [{bossState:{disabled:true}},{round:{blindId:'boss',bossDisabled:true}}]){
  const s={round:{blindId:'boss'},apkBlinds:{bossId:'bl_hook'},...flags};assert.match(hud(s).condition,/отключён/);
 }
});
test('small and big blinds have no boss condition; all stakes have an accessible label',async()=>{
 const hud=await model();for(const blindId of ['small','big'])for(let stake=1;stake<=8;stake++){
  const d=hud({round:{blindId},stake});assert.equal(d.condition,'');assert.equal(d.stake.name,STAKES[stake-1].name);
 }
});
test('all bosses use their own truthful condition and fall back safely for missing metadata',async()=>{
 const hud=await model();for(const boss of APK_BLINDS.filter(b=>b.id!=='bl_small'&&b.id!=='bl_big')){
  assert.equal(hud({round:{blindId:'boss'},apkBlinds:{bossId:boss.id}}).condition,boss.description);
 }
 assert.equal(hud({round:{blindId:'boss'}}).name,'Босс');
});
