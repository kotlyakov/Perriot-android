import test from 'node:test';import assert from 'node:assert/strict';
import {createSettingsView} from '../../src/ui/menu-windows.js';
import {slideWindow,cancelWindowMotion} from '../../src/ui/window-motion.js';
class Node{constructor(){this.children=[];this.dataset={};this.attrs={};this.isConnected=true;this.classList={add(){},remove(){},toggle(){}};}append(...nodes){this.children.push(...nodes)}replaceChildren(...nodes){this.children=nodes}setAttribute(k,v){this.attrs[k]=v}animate(frames,options){let resolve;const job={frames,options,finished:new Promise(r=>resolve=r),cancel(){},resolve:()=>resolve()};jobs.push(job);return job;}}
const jobs=[],all=n=>[n,...n.children.flatMap(all)];globalThis.document={createElement:()=>new Node()};globalThis.matchMedia=()=>({matches:false});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('paper transition exits old content before entering latest requested tab',async()=>{
 const view=createSettingsView(),body=view.children[1],tabs=view.children[0].children;
 assert.equal(jobs[0].options.duration,152);jobs.shift().resolve();await flush();
 tabs[1].onclick();assert.equal(body.inert,true);assert.equal(jobs[0].options.duration,116);assert.equal(all(body).some(n=>n.id==='audio_music'),false);
 tabs[0].onclick();tabs[1].onclick();jobs.shift().resolve();await flush();assert.equal(all(body).some(n=>n.id==='audio_music'),true);assert.equal(jobs[0].options.duration,152);jobs.shift().resolve();await flush();assert.equal(body.inert,false);assert.equal(body.attrs['aria-busy'],'false');assert.equal(tabs[1].attrs['aria-selected'],'true');
});
test('window motion compensates for stage scale and canceled close cannot remove replacement',async()=>{
 globalThis.innerHeight=412;let closed=0;const node=new Node();node.parentElement={offsetWidth:1536,getBoundingClientRect:()=>({width:768})};node.getBoundingClientRect=()=>({top:100});slideWindow(node,true,()=>closed++);const old=jobs.shift();assert.equal(old.options.duration,260);assert.equal(old.frames[1].translate,'0 688px');cancelWindowMotion(node);old.resolve();await flush();assert.equal(closed,0);
 globalThis.matchMedia=()=>({matches:true});slideWindow(node,true,()=>closed++);assert.equal(closed,1);
});
