import test from 'node:test';
import assert from 'node:assert/strict';
import {renderField} from '../../src/ui/field.js';
import {createRun} from '../../src/core/run.js';

// DOM event fixture: no layout engine, scoring and field handlers are real.
class Element {
 get childNodes(){return this.children;}
 constructor(doc){this.ownerDocument=doc;this.dataset={};this.style={setProperty(){}};this.children=[];this.listeners={};this.className='';this.textContent='';this.firstChild={textContent:''};this.clientWidth=200;this.isConnected=true;}
 get classList(){const el=this;return {contains:n=>el.className.split(' ').includes(n),add(...ns){el.className=[...new Set([...el.className.split(' '),...ns])].join(' ');},remove(...ns){el.className=el.className.split(' ').filter(n=>!ns.includes(n)).join(' ');},toggle(n,on){on??=!this.contains(n);if(on)this.add(n);else this.remove(n);}};}
 setAttribute(k,v){this[k]=String(v);}
 removeAttribute(k){delete this[k];}
 append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}}
 prepend(node){node.parentElement=this;this.children.unshift(node);}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(n=>n!==this);this.isConnected=false;}
 contains(n){return n===this||this.children.some(c=>c.contains?.(n));}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 removeEventListener(type,fn){this.listeners[type]=(this.listeners[type]??[]).filter(f=>f!==fn);}
 emit(type,extra={}){const e={target:this,pointerId:1,button:0,clientX:10,clientY:10,preventDefault(){},...extra};if(type==='pointerdown')for(const fn of this.ownerDocument.listeners[type]??[])fn(e);for(const fn of [...(this.listeners[type]??[])])fn(e);}
 setPointerCapture(){}
 focus(){}
}
function fixture(t){
 const nodes=new Map(),doc={listeners:{},getElementById(id){if(!nodes.has(id))nodes.set(id,new Element(this));return nodes.get(id);},querySelector(s){return this.getElementById(s);},createElement(){return new Element(this);},addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}};
 doc.getElementById('stage').offsetWidth=1536;
 doc.getElementById('stage').getBoundingClientRect=()=>({width:1536});
 for(const id of ['chips_value','mult_value','target_value'])doc.getElementById(id).parentElement=new Element(doc);
 t.mock.timers.enable({apis:['setTimeout']});
 const old={document:globalThis.document,requestAnimationFrame:globalThis.requestAnimationFrame,matchMedia:globalThis.matchMedia};
 globalThis.document=doc;globalThis.requestAnimationFrame=()=>0;globalThis.matchMedia=()=>({matches:true});
 t.after(()=>Object.assign(globalThis,old));
 const state=createRun('hold',{runId:'hold-regression',money:4n});state.phase='playing';state.hand=Object.keys(state.cards).slice(0,8);state.drawPile=Object.keys(state.cards).slice(8);state.round.target=1000000n;
 const selected=[],reordered=[];
 renderField(state,new Set(),false,id=>selected.push(id),(...args)=>reordered.push(args));
 const card=doc.getElementById('hand').children[0],tips=()=>doc.getElementById('stage').children.filter(n=>n.classList.contains('card-tip'));
 return {card,selected,reordered,tips};
}
test('short pointer tap selects without creating a card tooltip',async t=>{
 const {card,selected,tips}=fixture(t);card.emit('pointerdown');t.mock.timers.tick(100);card.emit('pointerup');await Promise.resolve();
 assert.equal(selected.length,1);assert.equal(tips().length,0);t.mock.timers.tick(500);assert.equal(tips().length,0);
});
test('350ms hold describes without selecting; pointer release preserves description',t=>{
 const {card,selected,tips}=fixture(t);card.emit('pointerdown');t.mock.timers.tick(349);assert.equal(tips().length,0);t.mock.timers.tick(1);assert.equal(tips().length,1);card.emit('pointerup');assert.equal(selected.length,0);assert.equal(tips().length,1);
});
test('drag and pointer cancellation prevent delayed descriptions or selection',t=>{
 const {card,selected,reordered,tips}=fixture(t);card.emit('pointerdown');card.emit('pointermove',{clientX:30});t.mock.timers.tick(500);assert.equal(tips().length,0);card.emit('pointerup',{clientX:30});assert.equal(reordered.length,1);assert.equal(selected.length,0);
 card.emit('pointerdown');card.emit('pointercancel');t.mock.timers.tick(500);assert.equal(tips().length,0);assert.equal(selected.length,0);
});
test('keyboard activation retains selection and accessible description',t=>{
 const {card,selected,tips}=fixture(t);card.emit('keydown',{key:'Enter',repeat:false});assert.equal(selected.length,1);assert.equal(tips().length,1);
});
