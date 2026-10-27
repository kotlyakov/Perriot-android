import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../../src/ui/layout.js',import.meta.url),'utf8')
 .replace(/^export const LAYOUT=/m,'const LAYOUT=')
 .replace(/^export function installLayout\(/m,'function installLayout(')
 +'\n globalThis.__qaInstallLayout=installLayout;';
test('resize storms coalesce, unchanged dimensions do not rewrite stage, and rotation updates geometry',()=>{
 const nodes=new Map(),callbacks={};let raf=[],writes=0,observer;
 const style=()=>({setProperty(){writes++;}});
 const stage={style:new Proxy({}, {set(target,key,value){writes++;target[key]=value;return true;}})};
 const root={clientWidth:915,clientHeight:412,style:style()};
 const doc={documentElement:root,getElementById(id){if(id==='stage')return stage;if(!nodes.has(id))nodes.set(id,{style:{}});return nodes.get(id);}};
 const scope={document:doc,ResizeObserver:class{constructor(cb){observer=cb;}observe(){}},window:{visualViewport:{addEventListener(_,cb){callbacks.visual=cb;}}},addEventListener(_,cb){callbacks.window=cb;},requestAnimationFrame(cb){raf.push(cb);},globalThis:null};
 scope.globalThis=scope;runInNewContext(source,scope);scope.__qaInstallLayout();
 const initial=writes;assert.ok(initial>0);
 callbacks.window();callbacks.visual();observer();assert.equal(raf.length,1,'Only one resize frame may be queued');
 raf.shift()();assert.equal(writes,initial,'Unchanged size must not rewrite layout');
 root.clientWidth=412;root.clientHeight=915;
 callbacks.window();callbacks.visual();assert.equal(raf.length,1);
 raf.shift()();assert.ok(writes>initial,'Rotation must update stage geometry');
 assert.equal(stage.style.transform,'scale('+Math.min(412/1536,915/688)+')');
 assert.equal(raf.length,0);
});
