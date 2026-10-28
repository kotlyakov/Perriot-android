import test from 'node:test';
import assert from 'node:assert/strict';
import {installLayout,LAYOUT} from '../../src/ui/layout.js';

function globals(t,values){const old={};for(const key of Object.keys(values)){old[key]=globalThis[key];globalThis[key]=values[key];}t.after(()=>Object.assign(globalThis,old));}
test('duplicate viewport notifications do not rewrite layout; home changes still update it',t=>{
 const callbacks={},nodes=new Map(),writes=[];
 for(const id of [...Object.keys(LAYOUT),'stage'])nodes.set(id,{style:{},dataset:{}});
 const doc={documentElement:{clientWidth:915,clientHeight:412,style:{setProperty:(...v)=>writes.push(v)}},getElementById:id=>nodes.get(id)};
 globals(t,{document:doc,window:{visualViewport:{addEventListener:(type,fn)=>callbacks.visual=fn}},addEventListener:(type,fn)=>callbacks.window=fn,ResizeObserver:class{constructor(fn){callbacks.resize=fn;}observe(){}},MutationObserver:class{constructor(fn){callbacks.mutation=fn;}observe(){}}});
 installLayout();assert.equal(writes.length,2);callbacks.resize();callbacks.visual();callbacks.window();assert.equal(writes.length,2);
 nodes.set('start_screen',{});callbacks.mutation();assert.equal(writes.length,4);assert.equal(nodes.get('stage').dataset.layoutProfile,'home');
 doc.documentElement.clientHeight=400;callbacks.window();assert.equal(writes.length,6);
 nodes.delete('start_screen');callbacks.mutation();assert.equal(writes.length,8);
});
test('flame stops immediately at zero, pauses hidden, and replaces a detached canvas',async t=>{
 let id=0,draws=0;const frames=new Map(),events={},canvases=[];
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(obj,key)=>obj[key]??(()=>{if(key==='clearRect')draws++;})});
 const panel={prepend(canvas){canvas.isConnected=true;canvases.push(canvas);}};
 const doc={hidden:false,addEventListener:(type,fn)=>events[type]=fn,getElementById:id=>id==='calculation_panel'?panel:{getBoundingClientRect:()=>({left:id==='chips'?164:308,right:id==='chips'?275:419})},createElement:()=>({dataset:{},isConnected:false,ownerDocument:doc,getContext:()=>ctx,getBoundingClientRect:()=>({left:161,top:299,width:266,height:68})})};
 globals(t,{document:doc,requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),matchMedia:()=>({matches:false})});
 const {showFlame}=await import('../../src/ui/flame.js?lifecycle-test');
 const tick=()=>{const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(100);};
 showFlame(600n,300n);tick();assert.equal(draws,1);assert.equal(frames.size,1);
 showFlame(0n,300n);assert.equal(frames.size,0);assert.equal(canvases[0].hidden,true);
 showFlame(600n,300n);doc.hidden=true;events.visibilitychange();assert.equal(frames.size,0);
 doc.hidden=false;events.visibilitychange();assert.equal(frames.size,1);tick();assert.equal(draws,2);
 canvases[0].isConnected=false;tick();assert.equal(frames.size,0);
 showFlame(600n,300n);assert.equal(canvases.length,2);tick();assert.equal(draws,3);
 showFlame(0n,300n);
});
test('material pointer bursts read geometry once per frame and skip plain cards',async t=>{
 const {installCardMaterials}=await import('../../src/ui/card-materials.js');
 const frames=new Map(),listeners={},writes=[];let id=0,reads=0;
 const root={nodeType:9,querySelectorAll:()=>[],contains:()=>true,addEventListener:(type,fn)=>listeners[type]=fn,removeEventListener(){}};
 const card={classList:{contains:n=>n==='card-material'},closest(){return this;},matches:()=>false,isConnected:true,style:{setProperty:(...v)=>writes.push(v),removeProperty(){}},getBoundingClientRect(){reads++;return {left:0,top:0,width:100,height:200};}};
 globals(t,{MutationObserver:class{observe(){}disconnect(){}},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)});
 const stop=installCardMaterials(root),move=(target,x,y)=>listeners.pointermove({target,clientX:x,clientY:y});
 for(let i=0;i<100;i++)move(card,i,i*2);
 assert.equal(reads,0);assert.equal(frames.size,1);const tick=()=>{for(const fn of frames.values())fn();frames.clear();};tick();assert.equal(reads,1);assert.deepEqual(writes,[['--material-x','99%'],['--material-y','99%']]);
 move(card,50,100);listeners.pointerleave();tick();assert.equal(reads,1);
 const plain={...card,classList:{contains:()=>false}};move(plain,1,1);tick();assert.equal(reads,1);
 move(card,10,20);stop();assert.equal(frames.size,0);tick();assert.equal(reads,1);
});
