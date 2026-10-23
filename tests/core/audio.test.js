import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAudioSettings,normalizeAudioSettings,createGameAudio,soundForAction} from '../../src/ui/audio.js';

test('audio settings clamp finite volumes and recover from corrupt storage',()=>{
 assert.deepEqual(normalizeAudioSettings({music:2,effects:-1}),{music:1,effects:0});
 assert.deepEqual(normalizeAudioSettings({music:NaN,effects:'0'}),{music:.18,effects:.55});
 const store=createAudioSettings({read:()=>'{invalid',write:()=>assert.fail('read must not write')});
 assert.deepEqual(store.get(),{music:.18,effects:.55});
});
test('audio output failure and absent Web Audio never interrupt gameplay',()=>{
 const audio=createGameAudio({contextFactory:()=>{throw Error('No device');}});
 for(const fn of [()=>audio.play('buy'),()=>audio.unlock(),()=>audio.setActive(false),()=>audio.setActive(true),()=>audio.setVolumes({music:0,effects:0}),()=>audio.dispose()])assert.doesNotThrow(fn);
});
test('sounds use accepted action names and ignore unrelated actions',()=>{
 assert.equal(soundForAction('BUY_SHOP_CARD'),'buy');assert.equal(soundForAction('SELL_OWNED_CARD'),'sell');assert.equal(soundForAction('OPEN_BOOSTER'),'pack');
 assert.equal(soundForAction('REORDER_HAND'),undefined);assert.equal(soundForAction('SET_SORT'),undefined);
});
test('rapid Android pause/resume cannot leave a pending suspension active',async()=>{
 // Web Audio suspend is asynchronous; the foreground event may arrive first.
 const context={state:'running',currentTime:0,destination:{},
  createGain:()=>({gain:{setValueAtTime(){}},connect(){}}),
  async suspend(){await Promise.resolve();this.state='suspended';},
  async resume(){this.state='running';}
 };
 const audio=createGameAudio({contextFactory:()=>context});audio.setVolumes({music:0,effects:0});audio.unlock();
 audio.setActive(false);audio.setActive(true);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(context.state,'running');audio.dispose();
});
test('blocked audio drops historical effects instead of filling the voice queue',async()=>{
 let voices=0;
 const context={state:'suspended',currentTime:0,destination:{},
  createGain:()=>({gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}),
  createOscillator:()=>{voices++;return {frequency:{setValueAtTime(){}},connect(){},start(){},stop(){},disconnect(){}};},
  resume:()=>Promise.reject(Error('autoplay blocked'))
 };
 const audio=createGameAudio({contextFactory:()=>context});audio.unlock();
 for(let i=0;i<20;i++)audio.play('buy');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(voices,0);audio.dispose();
});
test('audio preference writes are separate, transactional and survive reload',()=>{
 let saved='';const io={read:()=>saved,write:value=>{saved=value;}};
 const store=createAudioSettings(io);store.set({music:0,effects:.25});
 assert.deepEqual(createAudioSettings(io).get(),{music:0,effects:.25});
 const broken=createAudioSettings({read:()=>saved,write:()=>{throw Error('full');}});
 assert.throws(()=>broken.set({music:1,effects:1}),/full/);
 assert.deepEqual(broken.get(),{music:0,effects:.25});
 const copy=store.get();copy.music=1;assert.equal(store.get().music,0);
});
