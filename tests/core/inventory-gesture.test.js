import test from 'node:test';
import assert from 'node:assert/strict';
import {renderShop} from '../../src/ui/shop-screen.js';
import {createRun} from '../../src/core/run.js';

// DOM fixture runs the actual inventory handlers; timers and physical layout are controlled.
class Element {
 constructor(doc,tag='div'){this.ownerDocument=doc;this.tagName=tag;this.children=[];this.dataset={};this.style={};this.className='';this.listeners={};this.isConnected=true;}
 get classList(){const el=this;return {contains:n=>el.className.split(' ').includes(n),add(...ns){el.className=[...new Set([...el.className.split(' '),...ns])].join(' ');},remove(...ns){el.className=el.className.split(' ').filter(n=>!ns.includes(n)).join(' ');},toggle(n,on){if(on)this.add(n);else this.remove(n);}};}
 setAttribute(k,v){this[k]=String(v);}
 removeAttribute(k){delete this[k];}
 append(...nodes){for(const n of nodes){n.parentElement=this;this.children.push(n);}}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(n=>n!==this);this.isConnected=false;}
 matches(s){return s.startsWith('.')?this.classList.contains(s.slice(1)):s.startsWith('#')?this.id===s.slice(1):s.startsWith('[data-kind=')?this.dataset.kind===s.slice(11,-1):this.tagName===s;}
 querySelectorAll(s){const selectors=s.split(',');return this.children.flatMap(n=>[...(selectors.some(s=>n.matches(s))?[n]:[]),...n.querySelectorAll(s)]);}
 querySelector(s){return this.querySelectorAll(s)[0]??null;}
 closest(s){return this.matches(s)?this:this.parentElement?.closest(s);}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 removeEventListener(type,fn){this.listeners[type]=(this.listeners[type]??[]).filter(f=>f!==fn);}
 emit(type,extra={}){const e={target:this,pointerId:1,button:0,clientX:750,clientY:80,preventDefault(){},...extra};this['on'+type]?.(e);for(const fn of [...(this.listeners[type]??[])])fn(e);}
 getBoundingClientRect(){if(this.id==='stage')return {left:0,top:0,right:1536,bottom:688,width:1536,height:688};const p=this.tagName==='button'?this.parentElement:this,left=parseFloat(p.style.left)||0,top=parseFloat(p.style.top)||0,width=parseFloat(p.style.width)||104,height=parseFloat(p.style.height)||143;return {left,top,width,height,right:left+width,bottom:top+height};}
 cloneNode(){const n=new Element(this.ownerDocument,this.tagName);Object.assign(n,{className:this.className,dataset:{...this.dataset},style:{...this.style}});n.append(...this.children.map(c=>c.cloneNode()));return n;}
 setPointerCapture(){}
}
function fixture(t){
 const doc={createElement:tag=>new Element(doc,tag),getElementById:id=>stage.id===id?stage:stage.querySelector('#'+id),querySelectorAll:s=>s.startsWith('#shop_owned ')?stage.querySelector('#shop_owned')?.querySelectorAll(s.slice(12))??[]:stage.querySelectorAll(s)};
 const stage=new Element(doc);stage.id='stage';stage.offsetWidth=1536;
 for(const id of ['joker_count','consumable_count']){const n=new Element(doc);n.id=id;stage.append(n);}
 const old={document:globalThis.document,matchMedia:globalThis.matchMedia};globalThis.document=doc;globalThis.matchMedia=()=>({matches:true});t.after(()=>Object.assign(globalThis,old));t.mock.timers.enable({apis:['setTimeout']});
 const state=createRun('inventory-gesture',{runId:'inventory-gesture',money:4n});state.phase='playing';state.jokers=[0,1].map(i=>({id:'owned_'+i,entityId:'j_joker',originalKey:'j_joker',set:'Joker',edition:'base',sellCost:2n}));
 const actions=[];renderShop(state,false,{onAction:(...a)=>actions.push(a)});return {card:stage.querySelector('.shop-card'),stage,actions};
}
for(const pointerType of ['mouse','touch']){
 test(`${pointerType}: immediate drag remains reorder without sale areas even after hold time`,t=>{
  const {card,stage,actions}=fixture(t);card.emit('pointerdown',{pointerType});card.emit('pointermove',{pointerType,clientX:900});t.mock.timers.tick(500);
  assert.equal(stage.querySelector('#shop_action_zones'),null);card.emit('pointerup',{pointerType,clientX:1000});assert.equal(actions[0]?.[0],'REORDER_JOKERS');
 });
 test(`${pointerType}: stationary hold reveals sale area, then drag sells once`,t=>{
  const {card,stage,actions}=fixture(t);card.emit('pointerdown',{pointerType});t.mock.timers.tick(349);assert.equal(stage.querySelector('#shop_action_zones'),null);t.mock.timers.tick(1);
  assert.ok(stage.querySelector('#shop_sell_zone'));card.emit('pointermove',{pointerType,clientX:1300,clientY:100});card.emit('pointerup',{pointerType,clientX:1300,clientY:100});assert.deepEqual(actions,[['SELL_OWNED_CARD',{area:'jokers',cardId:'owned_0'}]]);assert.equal(stage.querySelector('#shop_action_zones'),null);
 });
 test(`${pointerType}: cancellation clears a pending hold`,t=>{const {card,stage}=fixture(t);card.emit('pointerdown',{pointerType});card.emit('pointercancel',{pointerType});t.mock.timers.tick(500);assert.equal(stage.querySelector('#shop_action_zones'),null);});
}
