// Original synthesized print-shop sounds. No game RNG, samples or network I/O.
const defaults={music:.18,effects:.55};
export function normalizeAudioSettings(value){
 return Object.fromEntries(Object.entries(defaults).map(([key,fallback])=>[key,typeof value?.[key]==='number'&&Number.isFinite(value[key])?Math.max(0,Math.min(1,value[key])):fallback]));
}
export function createAudioSettings(io){
 let value;try{value=normalizeAudioSettings(JSON.parse(io.read()));}catch{value={...defaults};}
 return {get:()=>({...value}),set:next=>{const normalized=normalizeAudioSettings(next);io.write(JSON.stringify(normalized));value=normalized;return {...value};}};
}
const cues={
 select:[440],deal:[220,330],discard:[330,220],buy:[523,659,784],sell:[784,523],
 reroll:[294,392,494],pack:[392,494,587,784],use:[587,784],skip:[330,494],
 chips:[660],mult:[880],repeat:[784,988],money:[988],win:[523,659,784,1047],lose:[330,294,220],error:[147,139]
};
export const soundForAction=type=>({START_BLIND:'deal',PLAY_HAND:'deal',DISCARD:'discard',BUY_SHOP_CARD:'buy',BUY_AND_USE_SHOP_CARD:'use',BUY_VOUCHER:'buy',SELL_OWNED_CARD:'sell',SELL_JOKER:'sell',REROLL_SHOP:'reroll',REROLL_BOSS:'reroll',OPEN_BOOSTER:'pack',USE_CONSUMABLE:'use',USE_PACK_CARD:'use',SKIP_BLIND:'skip',CASH_OUT:'money'})[type];
export function createGameAudio({contextFactory=()=>new (globalThis.AudioContext??globalThis.webkitAudioContext)()}={}){
 let context,effects,music,timer,step=0,active=true,unlocked=false,scene='menu',volumes={...defaults};
 const voices=new Set();let lastCue=-Infinity;
 function tone(frequency,when,length,bus,level=.12,type='triangle'){
  if(voices.size>=48)return;
  const oscillator=context.createOscillator(),gain=context.createGain();
  oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,when);
  gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(level,when+.006);gain.gain.exponentialRampToValueAtTime(.0001,when+length);
  oscillator.connect(gain);gain.connect(bus);voices.add(oscillator);
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();voices.delete(oscillator);};
  oscillator.start(when);oscillator.stop(when+length+.01);
 }
 function stopVoices(){for(const voice of voices){try{voice.stop();voice.disconnect();}catch{}}voices.clear();}
 function stopMusic(){if(timer!==undefined)clearInterval(timer);timer=undefined;}
 function musicTick(){
  if(!active||!unlocked||!volumes.music||context?.state!=='running')return;
  // An original 16-step pentatonic phrase, with a softer bass at each bar.
  const phrase=[0,7,12,14,7,4,12,7,2,9,14,16,9,7,4,2],root=scene==='shop'?146.832:130.813;
  const when=context.currentTime+.03;
  tone(root*2**(phrase[step%16]/12),when,.31,music,.09,'sine');
  if(step%4===0)tone(root/2,when,.58,music,.10);
  step++;
 }
 function updateMusic(){stopMusic();if(active&&unlocked&&volumes.music&&context?.state==='running'){musicTick();timer=setInterval(musicTick,375);}}
 function gains(){if(context){effects.gain.setValueAtTime(active?volumes.effects:0,context.currentTime);music.gain.setValueAtTime(active?volumes.music:0,context.currentTime);}}
 function unlock(){
  if(!active)return;
  try{
   if(!context){context=contextFactory();effects=context.createGain();music=context.createGain();effects.connect(context.destination);music.connect(context.destination);gains();}
   unlocked=true;
   if(context.state==='suspended'&&context.resume){Promise.resolve(context.resume()).then(()=>{if(active)updateMusic();}).catch(()=>{});}
   else if(timer===undefined)updateMusic();
  }catch{/* Audio is optional; unsupported devices keep playing. */}
 }
 function play(name){
  if(!active||!unlocked||!context||context.state!=='running'||!volumes.effects||!cues[name])return;
  try{
   const when=context.currentTime;
   // Reduced-motion scoring can emit many events within one frame.
   if(['chips','mult','repeat','money'].includes(name)&&when-lastCue<.055)return;
   lastCue=when;
   cues[name].forEach((frequency,index)=>tone(frequency,when+index*.06,name==='lose'?.24:.15,effects));
  }catch{/* Output failure must never interrupt an already saved action. */}
 }
 return {
  unlock,play,
  setVolumes(value){volumes=normalizeAudioSettings(value);try{gains();if(!volumes.effects)stopVoices();updateMusic();}catch{}},
  setScene(value){scene=value;},
  setActive(value){active=!!value;try{gains();if(!active){stopMusic();stopVoices();Promise.resolve(context?.suspend?.()).then(()=>{if(active&&unlocked)unlock();}).catch(()=>{});}else if(unlocked)unlock();}catch{}},
  dispose(){active=false;stopMusic();stopVoices();try{context?.close?.()?.catch?.(()=>{});}catch{}}
 };
}
